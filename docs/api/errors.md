# Errors

Error responses in this API are **not uniform**. Five different envelope shapes
are in use, and which one you get depends on the route, not on the status
code. There is no RFC 7807 problem document, no error `code` field, and no
request id to quote in a bug report.

## The five shapes

| # | Shape | Schema | Example |
| --- | --- | --- | --- |
| 1 | `{ message }` | `ErrorMessage` / `MessageOnly` | `{"message": "Project not found"}` |
| 2 | `{ error }` | `ErrorMessageField` | `{"error": "Internal server error"}` |
| 3 | `{ message, error }` | `ErrorMessageAndError` | `{"message": "...", "error": "..."}` |
| 4 | `{ error, details }` | `ErrorAndDetails` | `{"error": "...", "details": "..."}` |
| 5 | `{ message, needs_payment }` | `NeedsPayment` | `{"message": "...", "needs_payment": true}` |

`ErrorMessage` and `MessageOnly` are structurally identical — both require
`message` and nothing else. They are separate schema names only because they
are referenced from different places.

## How to read a failure

Check both fields. Treat whichever is present as the human-readable failure:

```ts
const body = await res.json().catch(() => ({}));
const text = body.message ?? body.error ?? `HTTP ${res.status}`;
```

The only machine-readable signals in the whole API are:

- `needs_payment: true` — appears only on
  `POST /api/analysis` and
  `POST /api/analysis/{analysisId}/deduct-credit-for-report`. This is the one
  case where the status code alone is not enough.
- NextAuth's `error` codes `MissingCSRF` and `CredentialsSignin` on
  `POST /api/auth/{...nextauth}`.

Everything else must be inferred from the status code plus free text.

## Reusable responses

Defined in `components.responses` and used by many operations.

### `UnauthorizedMessage` — 401

> No usable credential. The body is `{"message": "Unauthorized"}` or, on
> `POST /api/upload`, `"Unauthorized: No token provided"`.

Produced by `validateAuth()` failing, and by handlers that check the auth
header manually.

### `ServerErrorMessage` — 500

> Unexpected failure. Body is `{"error": "Internal server error"}`. Callers
> cannot correlate it with anything server-side.

## Status codes in use

Counts are operations that can return the status, out of 43.

| Status | Meaning here | Operations | Notes |
| --- | --- | --- | --- |
| 200 | Success | 38 | Also returned for soft failures in a few places — see below |
| 201 | Created | 6 | `POST /api/auth/signup`, `POST /api/mobile/auth/signup`, `POST /api/analysis`, `POST /api/projects`, `POST /api/astrologer/apply`, and `POST /api/admin` `createSubscriptionPlan` / `grantSubscription` |
| 302 | Redirect | 2 | NextAuth flows only |
| 400 | Bad request | 25 | Missing or malformed input, unparseable JSON |
| 401 | No usable credential | 34 | See `UnauthorizedMessage` |
| 403 | Authenticated but refused | 12 | Wrong role, missing ownership, or the report paywall |
| 404 | Not found | 18 | Also returned when a record exists but the caller may not see it |
| 422 | Engine validation | 1 | `POST /api/analysis/objects` only, relayed from FastAPI |
| 500 | Unexpected failure | 39 | See `ServerErrorMessage` |
| 503 | Engine unreachable | 1 | `GET /api/health` only, when the Python service is down or unhealthy |

No route returns `402`. Payment failures surface as `400` or `500` depending on
where in the Razorpay call they occurred. The report paywall on
`POST /api/analysis/{analysisId}/deduct-credit-for-report` is a `403` carrying
`needs_payment: true` rather than a `402`.

`POST /api/analysis/objects` has no `400`, no `401`, and no `403` — it is
unauthenticated. It is also the only route that can return a `422`, because it
relays the engine's status code instead of normalising it.

The two `POST /api/admin` `201`s are the `createSubscriptionPlan` and
`grantSubscription` actions; the other six admin actions return `200`.

## Places where `200` does not mean success

Three handlers deliberately return `200` alongside degraded data. A client that
only checks the status code will silently accept a partial result.

| Route | Behaviour |
| --- | --- |
| `POST /api/projects` | R2 presigning is wrapped in its own `try/catch`. A storage outage degrades the two URL fields to `null` and still returns `200`. |
| `POST /api/projects/{projectId}/objects` | The batch replace is not transactional. Rows deleted before a mid-loop failure stay deleted, and the response still reports success. |
| `GET /api/analysis/devta` | Returns whatever the engine produced, including a near-empty result set when the plot boundary fails to parse. |

## Raw internal error leakage

Several handlers put the caught exception straight into the response body:

- NextAuth's credentials `authorize` throws the raw database error message,
  which surfaces on `/api/auth/error`.
- `GET /api/analysis/devta` can return a `details` string built from the
  Python engine's exception.
- `POST /api/analysis/objects` returns
  `"Internal Server Error during object analysis"` in `error` — a fixed
  string, so this one is safe.

Do not treat error strings as safe to display verbatim to end users; check
[`known-gaps.md`](./known-gaps.md) for the full list.

## Retrying

There is no `Retry-After` header anywhere, and no idempotency key support on
the write routes. Two retries are unsafe:

- `POST /api/analysis/{analysisId}/deduct-credit-for-report` — each call
  debits a credit.
- `POST /api/analysis` — each call starts a new analysis and debits a credit.
- `POST /api/projects/{projectId}/objects` — each call replaces the whole set.

`POST /api/payments/webhook` is the exception: Razorpay retries on its own
schedule and the handler is written to be re-entrant.
