# Authentication

Two independent mechanisms coexist, and almost every route accepts both.

## `validateAuth()` — the shared helper

`lib/auth.ts:176`

```ts
// 1. Bearer header first
const authHeader = request.headers.get("authorization");
if (authHeader?.startsWith("Bearer ")) {
  // verify with NEXTAUTH_SECRET; on failure fall through to the cookie
}
// 2. NextAuth session cookie
const session = await getServerSession(authOptions);
```

The ordering matters, and it is not documented anywhere in the app:

- The `Authorization: Bearer` header is checked **first**.
- If the header is absent, malformed, or the JWT does not verify, the helper
  **silently falls back** to the session cookie. There is no `401` for a bad
  Bearer token when a valid cookie happens to be present.
- A caller therefore never needs to know which mechanism the endpoint uses.

Consequence: a client that sends a stale Bearer token from a browser session
will not be rejected. It will be treated as the cookie's user.

## Mechanism 1: NextAuth session cookie (browsers)

Configured in `lib/auth-options.ts`.

- NextAuth v4, session strategy `jwt`.
- Two providers: **Google** (OAuth 2.0) and **Credentials** (email + password).
- The credential `authorize` callback looks the profile up by lowercased email.
  If the row exists but has no `password` hash — a Google-only account — it
  fails with an explicit "sign in with Google" message.
- The cookie is `next-auth.session-token` (HTTP-only, `SameSite=Lax`).

### Concrete NextAuth paths

All served by the catch-all route `app/api/auth/[...nextauth]/route.ts`, which
contains only `export { handler as GET, handler as POST }`.

| Path | Method | Purpose |
| --- | --- | --- |
| `/api/auth/providers` | GET | Provider ids and callback URLs |
| `/api/auth/session` | GET | Current session; `user: null` when signed out |
| `/api/auth/csrf` | GET | CSRF token for client-side POSTs |
| `/api/auth/error` | GET | Last sign-in error |
| `/api/auth/callback/credentials` | POST | Password sign-in |
| `/api/auth/callback/google` | POST | Completes the OAuth handshake |
| `/api/auth/signin` | POST | Redirects to provider selection |
| `/api/auth/signout` | POST | Clears the session cookie |

Fetch `/api/auth/csrf` before any mutating call. The credentials callback
rejects a missing or mismatched token with `401` and `error` of
`MissingCSRF` or `CredentialsSignin`.

## Mechanism 2: Mobile Bearer JWT (native clients)

Issued by three routes, all under `/api/mobile/auth`.

| Route | Purpose |
| --- | --- |
| `POST /api/mobile/auth/signup` | Create a profile with email + password, return a JWT |
| `POST /api/mobile/auth/login` | Exchange email + password for a JWT |
| `POST /api/mobile/auth/google` | Exchange a Google id token for a JWT |

Send it as `Authorization: Bearer <jwt>`.

Properties, from `lib/mobile-auth.ts`:

- Signed with `NEXTAUTH_SECRET` — the **same secret** as the NextAuth session
  cookie.
- **30-day** expiry.
- **No refresh endpoint and no revocation list.** A leaked token is valid for a
  full month and cannot be invalidated short of rotating the secret, which
  would also sign out every browser session.

Prefer these routes over the NextAuth form flow for non-browser clients: a
native app cannot rely on storing a `Set-Cookie` reliably.

## The one cookie-only route

`GET /api/auth/user` calls `getServerSession` directly rather than
`validateAuth()`. A mobile client with a Bearer token gets `401` here. The
mobile equivalent is to decode the token or call `/api/mobile/auth/login`
again.

## Unauthenticated routes

| Route | Why it is open |
| --- | --- |
| `GET /api/health` | Liveness probe |
| `GET,POST /api/auth/{...nextauth}` | NextAuth manages its own per-sub-path auth |
| `POST /api/auth/signup` | Registration |
| `POST /api/mobile/auth/signup` | Registration |
| `POST /api/mobile/auth/login` | Credential exchange |
| `POST /api/mobile/auth/google` | Token exchange |
| `GET /api/payments` | Public plan catalogue |
| `POST /api/payments/webhook` | Razorpay signature, not user auth |
| `GET /api/public-assets/{...key}` | **Should not be open.** See known gaps |
| `POST /api/analysis/objects` | **Should not be open.** See known gaps |

The last two are listed as unauthenticated because that is what the code does,
not because it is correct.

## Roles

The `profiles.role` column is a plain string. Recognised values in practice:

| Role | Effective powers |
| --- | --- |
| `user` | Default. Owns projects, buys credits |
| `astrologer` | Sees `/api/astrologer/projects`; bypasses the report paywall |
| `admin` | Everything under `/api/admin`; bypasses the report paywall |

A user's role is set in three places, two of which are not admin-gated:

1. `POST /api/users/role` — self-service, writes the caller's own row.
2. `POST /api/payments/verify` — a **successful astrologer-plan payment
   promotes the buyer to `astrologer`** and auto-approves any pending
   application.
3. `POST /api/admin` — the `update_role` action.

Consequence: paying for the astrologer plan is sufficient to gain the astrologer
role. There is no approval step on that path.

## Credits

Credits live on the profile and are decremented in two places:

- `POST /api/analysis` — one credit to start an analysis.
- `POST /api/analysis/{analysisId}/deduct-credit-for-report` — one credit to
  unlock the report.

Both deductions are atomic — `deductCredit` uses a conditional `updateMany` with
a `credits >= amount` guard, so concurrent requests cannot spend the same credit
twice or drive the balance negative through this path. The weakness is
authorization, not arithmetic: `checkPaymentAccess` returns `hasAccess: true`
for anyone holding at least one credit, so the deduction is skipped entirely and
the credit is never spent. The admin `adjustCredits` action takes an unvalidated
signed `amount` and *can* drive a balance negative.

## Security notes

| Issue | Detail |
| --- | --- |
| Hardcoded fallback secret | `lib/auth.ts` falls back to a literal development secret when `NEXTAUTH_SECRET` is unset. In that configuration anyone can mint a valid token. |
| No refresh or revocation | 30-day mobile tokens, no logout path. |
| Silent fallback | An invalid Bearer token does not fail if a session cookie is present. |
| No rate limiting | Signup, login, Google exchange, and `POST /api/analysis/objects` are unthrottled. |
| No CSRF concern on mobile routes | The Bearer header is not sent ambiently, so the CSRF exposure that the cookie mechanism has does not apply. The cookie mechanism relies on NextAuth's own `csrfToken` check plus `SameSite=Lax`. |

See [`known-gaps.md`](./known-gaps.md) for severity and remediation notes.
