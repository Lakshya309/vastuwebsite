# Analysis

The analysis lifecycle plus the three routes that call the Python engine.

| | |
| --- | --- |
| Auth | session **or** Bearer on 7 of 8 operations |
| Operations | 8 |

| Operation | Method + path | Auth | Owner check |
| --- | --- | --- | --- |
| `createAnalysis` | `POST /api/analysis` | yes | `owner`, except astrologer/admin |
| `getAnalysisStatus` | `GET /api/analysis/{analysisId}/status` | yes | **`none`** |
| `approveAnalysis` | `PUT /api/analysis/{analysisId}/approve` | yes, astrologer/dev | **`none`** |
| `unlockReport` | `POST /api/analysis/{analysisId}/deduct-credit-for-report` | yes | **`none`** |
| `getDevtaAnalysis` | `GET /api/analysis/devta` | yes | **`none`** |
| `getFullReport` | `GET /api/analysis/full-report` | yes | `owner`, admin exempt |
| `getMarmaAnalysis` | `GET /api/analysis/marma` | yes | `owner`, admin exempt |
| `analyzeObjectsUnauthenticated` | `POST /api/analysis/objects` | **no** | **none** |

Two of the three routes that read stored geometry (`devta`) do not check
ownership. See [`../known-gaps.md`](../known-gaps.md).

---

## `POST /api/analysis`

| | |
| --- | --- |
| Source | `app/api/analysis/route.ts` |
| Operation ID | `createAnalysis` |

Creates the `analyses` row. **This does not run the engine** — it records the
request and returns an id with `status: "pending"`. The Python service is
invoked later, by the read routes.

### Request body

| Field | Type | Notes |
| --- | --- | --- |
| `projectId` | string | Required |
| `analysisType` | string | Required. Not validated against an allow-list. |
| `boundary_normalized` | object | Required. Stored on the analysis row. |
| `north_direction` | number | Required. `undefined` is rejected; `null` is **not**. |
| `analysisDate` | string | Optional. Must match `YYYY-MM-DD`. |
| `analysisTime` | string | Optional. Must match `HH:MM`, defaults to `00:00:00`. |

### Role gate

```
role ∈ {admin, astrologer, user}  → allowed
anything else                     → 403 { message, needs_payment: true }
```

`dev` is therefore the one role that cannot create an analysis, and it is
refused with a **`needs_payment: true`** payment prompt, which has nothing to do
with the problem. The `blocking_message` starts as the literal
`"Analysis blocked."` and is only overwritten in the `else` branch, so a future
role added to the deny path without editing the string would return that.

### Ownership

`projectData.user_id !== uid` → `403` — **unless** the role is `admin`, or
`astrologer`. The astrologer exemption is written as
`profile.role === "astrologer" && allowed_to_analyze`, and `allowed_to_analyze`
is unconditionally `true` by that point, so astrologers may analyse any project
id. That is presumably intentional for a consultancy workflow, but nothing in
the code says so.

### Responses

**`201`** — `{ "message": "Analysis created successfully", "analysisId": "<uuid>" }`.

**`400`** — `message` key, all `400`s:

| Message |
| --- |
| `Project ID, analysis type, boundary, and north direction are required.` |
| `Invalid analysisDate format. Expected YYYY-MM-DD.` |
| `Invalid analysisTime format. Expected HH:MM.` |
| `Invalid analysisDate or analysisTime combination.` |
| `Analysis date and time cannot be in the future.` |
| `Error processing analysisDate or analysisTime.` |

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Unsupported user role. Analysis blocked.", "needs_payment": true }`
(role gate) or `{ "message": "Project not found or you do not have permission." }`
(ownership). Schema: `NeedsPayment` for the first, `ErrorMessage` for the second.

**`404`** — `{ "message": "Project not found." }`.

**`500`** — `{ "message": "Failed to create analysis", "error": "<raw>" }`, or
`{ "message": "Failed to fetch user profile." }`. Schema: `ErrorMessage` for the
latter, `ErrorMessageAndError` for the former.

### No credit check

Nothing is charged here. A user with zero credits can create analyses
indefinitely; payment is only considered at the read routes.

---

## `GET /api/analysis/{analysisId}/status`

| | |
| --- | --- |
| Source | `app/api/analysis/[analysisId]/status/route.ts` |
| Operation ID | `getAnalysisStatus` |

Polls an analysis.

**`200`** — `{ "status": "pending" \| "completed" \| "failed" \| "reviewed" }`,
falling back to `"completed"` when the column is null.

**`400`** — `{ "message": "Analysis ID is required" }`. Only reachable if the path
segment is empty, which Next.js will not normally produce.

**`401`** — `{ "message": "Unauthorized" }`.

**`404`** — `{ "message": "Analysis not found" }`. No ownership check, so this
is also the response for **someone else's** analysis — which is the correct
outcome for a status poll, but it is a missing check rather than a design.

**`500`** — `{ "message": "Internal server error" }`.

`status` is written by exactly two places: `POST /api/analysis` (`pending`) and
`PUT /api/analysis/{analysisId}/approve` (`reviewed`) — plus `GET
/api/analysis/devta`, which also sets `reviewed` as a side effect of a read.
Nothing in the API ever sets `failed` or `completed`, so those two values are
unreachable through the documented surface, and the `"completed"` fallback here
can only ever apply to a `null` column.

---

## `PUT /api/analysis/{analysisId}/approve`

| | |
| --- | --- |
| Source | `app/api/analysis/[analysisId]/approve/route.ts` |
| Operation ID | `approveAnalysis` |

Marks an analysis `reviewed`. Reviewer-facing.

### Access

`role ∈ {astrologer, dev}`. `admin` is **not** included, which is the opposite
of every other route in the API.

### The gaps

- **No ownership or assignment check.** Any astrologer or dev can approve any
  analysis id, including one that was never assigned to them.
- **A missing id returns `500`, not `404`.** The Prisma `P2025` error is caught
  by the generic handler and reported as
  `{ "message": "Failed to approve analysis", "error": "<raw Prisma text>" }`.
  The raw text includes the model and id.
- **Unusable from a browser.** `PUT` is missing from
  `Access-Control-Allow-Methods`, so the preflight fails. See
  [`../cors.md`](../cors.md).

### Responses

**`200`** — `{ "message": "Analysis approved successfully", "analysis": { ... } }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Forbidden: You do not have permission to perform this action." }`.

**`500`** — `{ "message": "Failed to approve analysis", "error": "<raw>" }`.

There is no `404` and no `400`.

---

## `POST /api/analysis/{analysisId}/deduct-credit-for-report`

| | |
| --- | --- |
| Source | `app/api/analysis/[analysisId]/deduct-credit-for-report/route.ts` |
| Operation ID | `unlockReport` |

Unlocks a paid report. **Read the two findings below before integrating this.**

### Credits are never actually spent

The handler starts with:

```ts
const paymentAccess = await checkPaymentAccess(uid);
if (profile.role === "admin" || paymentAccess.hasAccess) {
  // sets report_paid = true
  return 200 { message: "Report access granted.", no_credit_deduction: true };
}
```

`checkPaymentAccess()` returns `hasAccess: true` whenever
`user_credits.credits > 0`. So:

| Caller state | What happens |
| --- | --- |
| admin | Free, `no_credit_deduction: true` |
| active/trialing subscription | Free, `no_credit_deduction: true` |
| **credits > 0** | **Free, `no_credit_deduction: true`** |
| credits == 0, no subscription | `deductCredit(uid, 1)` runs, fails, returns `403` |

The `deductCredit` call is reachable **only** for a caller with exactly zero
credits, and that call cannot succeed. The consequence: a caller holding a
single credit unlocks any number of reports and never spends it, and the
`403` "Insufficient credits" is only ever shown to users who have no credits at
all. The credit balance functions as a boolean entitlement flag, not a balance.

The root cause is using an entitlement helper (`checkPaymentAccess`) as a
"skip payment" condition, plus having it treat a positive balance as full
access.

### Not transactional, with a manual refund

`deductCredit` and the `report_paid` write are separate statements. If the
second fails, the code refunds one credit with a hand-written `upsert` rather
than calling the existing `refundCredit` helper. If that refund *also* fails,
the loss is only written to the log at `[CRITICAL]` and the caller still gets a
`500` claiming the credit was restored. The response is:

```json
{ "message": "Failed to unlock report due to a database error. Your credit has been restored." }
```

That message is an assertion the server has not verified.

### No ownership check

`analysisId` is used with `where: { id: analysisId }` and never compared to the
caller. Any authenticated caller can set `report_paid = true` on any analysis,
including one for a project they do not own. `report_paid` is a column on the
analysis, not per user, so the flag is global to the project.

### Responses

**`200`** — three different bodies:

| Body | When |
| --- | --- |
| `{ "message": "Report access granted.", "no_credit_deduction": true }` | admin, subscription, or credits > 0 |
| `{ "message": "Report already paid for." }` | `report_paid` already true |
| `{ "message": "Credit deducted and report access granted." }` | the deduction path (unreachable in practice) |

**`400`** — `{ "message": "Analysis ID is required." }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Analysis has failed and cannot be viewed." }`, or
`{ "message": "Insufficient credits to view report. Please purchase more credits or subscribe.", "needs_payment": true }`
(schema `NeedsPayment`).

**`404`** — `{ "message": "Analysis not found." }`.

**`500`** — `{ "message": "Failed to unlock report due to a database error. Your credit has been restored." }`
or `{ "message": "Internal Server Error" }`.

---

## `GET /api/analysis/devta`

| | |
| --- | --- |
| Source | `app/api/analysis/devta/route.ts` |
| Operation ID | `getDevtaAnalysis` |

Runs the raw Vastu grid analysis for an existing analysis id.

> **IDOR.** The `analysisId` is used to look up the analysis, and the result is
> returned to whoever asked. There is no comparison against the analysis's
> project owner. Any authenticated caller with a project id can obtain the
> full grid result for it. The route also reads `boundary_normalized` and
> `north_direction` from the **analysis** row, so the disclosure is the stored
> geometry itself.

### Query parameters

| Name | Required | Default | Notes |
| --- | --- | --- | --- |
| `analysisId` | yes | — | Missing → `400` |
| `gridType` | no | `"81"` | Passed straight through to the engine; not validated |

### Pipeline

1. Profile lookup → `500` if absent.
2. Analysis lookup → `404` if absent.
3. `boundary_normalized` / `north_direction` presence check → `400`.
4. `GET ${MICROSERVICE_URL}/health` → `500` on non-2xx **or** on a thrown fetch error.
5. `POST ${MICROSERVICE_URL}/analyze` with `{ boundary_normalized, north_direction, grid_type }`.
6. Premium filtering against `report_paid` on the project, or `checkPaymentAccess`.
7. **Writes `status: "reviewed"` on the analysis**, ignoring any write failure.

Two things to note. `MICROSERVICE_URL` is read with **no fallback default** here,
unlike every other engine call, so an unset variable makes step 4 fail against
`undefined/health` and the caller gets `500 Python Service Unreachable`. And the
`north_direction` guard is `=== null`, so an `undefined` column passes the check
and is dropped from the JSON body sent to the engine.

### A GET that writes

Step 7 is the surprise. After building the response the handler updates the
analysis to `reviewed`, and if that update throws, the error is caught and
**only logged** — the caller still gets `200` with the grid. So:

- A `GET` is not safe or idempotent, and the row is modified by a read.
- Because ownership is not checked, an unauthenticated-to-the-project caller
  can mark someone else's analysis `reviewed`, which removes it from any
  pending queue and is visible to the owner.
- A `200` is not evidence that the status changed.

### Premium filtering

For a non-premium caller the response is the engine payload with
`devtas45` replaced by an empty array. It is a **field-level** lock, not a
`403`: a caller sees that the key exists and that it is empty, and the comment
in the source (`// Optionally lock other things here`) makes clear the list is
not exhaustive. See [`../known-gaps.md`](../known-gaps.md).

### Responses

**`200`** — the engine's grid payload. Non-premium callers receive the same
payload with `devtas45` emptied rather than a `403`; see
[Premium filtering](#premium-filtering).

**`400`** — `analysisId is required`, or
`Missing required analysis parameters (boundary or north direction).`

**`401`** — `{ "message": "Unauthorized" }`.

**`404`** — `{ "message": "Analysis not found." }`.

**`500`** — mixes both keys across four distinct messages:

| Body | Cause |
| --- | --- |
| `{ "message": "Failed to fetch user profile." }` | no profile row |
| `{ "error": "Python Service Unreachable" }` | health check threw |
| `{ "error": "Python Service Unreachable or error during analysis" }` | `/analyze` non-2xx |
| `{ "error": "Internal Server Error" }` | outer catch |

This is the clearest example in the API of a single status code with two
incompatible body shapes. The spec models it as a `oneOf`.

---

## `GET /api/analysis/full-report`

| | |
| --- | --- |
| Source | `app/api/analysis/full-report/route.ts` |
| Operation ID | `getFullReport` |

Note the path: this is **`/api/analysis/full-report`**, a sibling of `devta` and
`marma`, **not** nested under `/api/analysis/{analysisId}/`. The
`analysisId` is a query parameter.

### Query parameters

| Name | Required | Notes |
| --- | --- | --- |
| `analysisId` | yes | Missing → `400` |

### Ownership and payment

Ownership is checked against the **project** and returns `404` — good. The
payment check is not:

```ts
if (userRole === "user" && !analysisData.report_paid) → 403
```

The condition is scoped to `role === "user"`, so `astrologer` and `dev` read any
report without paying, and `admin` skips the ownership check. That is a
defensible policy, but it is implicit in a `user` string comparison rather than
expressed as an entitlement rule.

### Where the geometry comes from

| Field | Source | Fallback |
| --- | --- | --- |
| `boundary_normalized` | the **analysis** row | the project row |
| `north_direction` | the **analysis** row | the project row, then `0` |
| placed objects | the **project** row only | none |

Because objects always come from the project while the boundary may come from
the analysis, re-running an old analysis after editing the plot mixes a stale
boundary with the current object set, and the engine reports on geometry the
client never drew. The response also echoes `north_direction` and
`boundary_normalized` back to the caller alongside the engine output, which is
what makes the mismatch visible — if a client checks it.

### Responses

**`200`** — the engine's `/analyze_objects` payload, spread together with
`north_direction` and `boundary_normalized`.

**`400`** — `analysisId is required`, or
`Missing required project parameters for full report analysis.`

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Report has not been paid for or accessed by this user." }`.
Schema: `ErrorMessage`. This is a hard `403`, not a `402`.

**`404`** — `Analysis not found.`, or
`Project data not found or you do not have permission.` Both use the same status
so a project id cannot be probed.

**`500`** — `{ "error": "Python Full Report Analysis Service Error", "details": <engine body or text> }`
(schema `ErrorAndDetails` — `details` is a string when the engine's error is not
JSON, otherwise it is the parsed object), or `{ "error": "Internal Server Error" }`,
or `{ "message": "Failed to fetch user profile." }`.

---

## `GET /api/analysis/marma`

| | |
| --- | --- |
| Source | `app/api/analysis/marma/route.ts` |
| Operation ID | `getMarmaAnalysis` |

Marma points for an analysis. Unlike its siblings, this one **does not call the
Python service** — it runs `getMarmaPoints()` in-process from `lib/marmaAnalysis`.
There is no network hop and no engine outage to handle.

### Query parameters

| Name | Required |
| --- | --- |
| `analysisId` | yes |

### Checks

- Ownership against the project, admin-exempt, `404` on failure. **Correct.**
- `boundary_normalized` presence → `400`. Read from the **project** row, not the
  analysis, which is the opposite of `devta` for the same id.
- Premium: `report_paid` on the project, or `checkPaymentAccess` — which again
  means a single credit is enough.

### Responses

**`200`** — the marma point set.

**`400`** — `analysisId is required`, or `Missing required boundary for marma analysis.`

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Premium credit required for Marma analysis." }`.
Schema: `ErrorMessage`.

**`404`** — `Analysis not found.`, or
`Project data not found or you do not have permission.`

**`500`** — `{ "error": "Internal server error" }` (**`error` key**), or
`{ "message": "Failed to fetch user profile." }` (**`message` key**). The 500
alone uses both shapes.

---

## `POST /api/analysis/objects`

| | |
| --- | --- |
| Source | `app/api/analysis/objects/route.ts` |
| Operation ID | `analyzeObjectsUnauthenticated` |
| Auth | **none** |

> **Unauthenticated proxy to the engine.** This route does not call
> `validateAuth()`. It reads an arbitrary JSON body, forwards it verbatim to
> `POST ${MICROSERVICE_URL}/analyze_objects`, and returns the engine's response.
> There is no rate limit, no body size cap, and no credit check. The engine is
> the expensive, CPU-bound part of the system, so this is both a cost exposure
> and a way to run analysis for objects the caller has no right to analyse.

### Request body

`application/json`, forwarded to the engine unchanged. The shape is the
engine's `PlacedObjectAnalysisRequest` — `boundary_normalized`,
`north_direction`, and `placed_objects`. Nothing is validated here; FastAPI
validates it downstream.

### Responses

**`200`** — the engine's response, passed through untouched.

**`500`** — `{ "error": "Internal Server Error during object analysis" }` when
the fetch throws.

Any **non-2xx from the engine is relayed with the same status code**, not
normalised to `502`:

| Engine status | Body |
| --- | --- |
| `422` (FastAPI validation) | `{ "error": "<detail from the engine>" }` |
| anything else non-2xx | `{ "error": "<detail or fallback string>" }` |

So this route is the one place a `422` can reach a client, and its body is the
engine's FastAPI `detail` under an `error` key — a shape nothing else in the
Next.js API produces. `full-report` takes the same approach but collapses
everything to `500`.

### Note

This is a pass-through, not a wrapper. Any change to the engine's contract is
immediately a breaking change for API clients, with no version negotiation. See
[`../microservice.md`](../microservice.md).
