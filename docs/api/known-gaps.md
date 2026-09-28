# Known Gaps

Every defect found while reading the route handlers, ordered by severity. This
file is the human-readable companion to the `x-known-issues` arrays in
[`openapi.yaml`](./openapi.yaml); the two are kept in sync.

**These are documented, not fixed.** No application source was modified to
produce this documentation.

## Summary

Counts are **distinct issue ids**, not per-operation entries.

| Severity | Count |
| --- | --- |
| Critical | 1 |
| High | 14 |
| Medium | 11 |
| Low | 9 |
| **Total** | **35** |

20 of 43 operations carry at least one `x-known-issues` entry: 37 entries over
those 36 ids, because `CORS-PUT-MISSING` is attached to both affected `PUT`
operations. Several additional cross-cutting problems affect routes that have
no per-operation entry; those are at the end of this file.

| Severity | Ids |
| --- | --- |
| Critical | `PUBLIC-ASSET-LEAK` |
| High | `IDOR-PATCH-PROJECT`, `IDOR-LIST-OBJECTS`, `IDOR-REPLACE-OBJECTS`, `IDOR-VIDEO-UPLOAD`, `IDOR-MAP-UPLOAD`, `IDOR-DEVTA`, `IDOR-UNLOCK-REPORT`, `UNAUTH-ANALYSIS-PROXY`, `UPLOAD-TYPE-UNVALIDATED`, `PUBLIC-ASSET-NO-PREFIX-ALLOWLIST`, `PUBLIC-ASSET-CONTENT-TYPE-REPLAY`, `UNRESTRICTED-VIDEO-TYPE`, `PAYMENT-PROMOTES-ASTROLOGER`, `NO-CREDIT-CONSUMPTION-WITH-CREDITS` |
| Medium | `NONATOMIC-REPLACE`, `EMPTY-ARRAY-WIPES-PLAN`, `BATCH-DELETE-NOT-SCOPED`, `CORS-PUT-MISSING`, `GET-WRITES-STATE`, `APPROVE-NO-ASSIGNMENT-CHECK`, `PLAN-CREDITS-NOT-DATA-DRIVEN`, `WEBHOOK-SUBSCRIPTION-EVENTS-DEAD`, `CANCEL-DRIFT`, `ADMIN-NEGATIVE-CREDITS`, `ADMIN-UNVALIDATED-ROLE`, `NO-REJECT-ACTION` |
| Low | `ANALYSIS-ROLE-GATE`, `IDOR-ANALYSIS-STATUS`, `CANCEL-IGNORES-TRIALING`, `CANCEL-BODY-FIELD-IGNORED`, `WEBHOOK-EVENTS-NOT-READ`, `EXPERT-CODE-NOT-CSPRNG`, `APPROVAL-UNNOTIFIED`, `ADMIN-NO-AUDIT-TRAIL`, `ADMIN-PLAN-FALSY-CHECK` |
> `NO-CREDIT-CONSUMPTION-WITH-CREDITS` sits on the same operation as
> `IDOR-UNLOCK-REPORT` and is a revenue bug rather than a security hole — see
> the entry.

---

## Critical

### `PUBLIC-ASSET-LEAK` — `GET /api/public-assets/{...key}`

**Summary:** Unauthenticated catch-all exposes every R2 object, including
private floor plans and videos.

`app/api/public-assets/[...key]/route.ts` joins the remaining path segments
back into an R2 key and streams the object with **no authentication and no
prefix allow-list**. Any key the R2 credentials can read is publicly fetchable,
including `map-plots/{userId}/...` and `videos/{userId}/...` — the exact
private media that the presigned-URL routes were built to protect. It also sets
`Cache-Control: public, max-age=31536000, immutable`, so a leaked response can
sit in shared caches.

The catch-all is the cheapest guess at what a key is: any person who can
enumerate or guess a project id can read another user's floor plan without an
account.

**Remediation:** restrict the route to a fixed public prefix such as `public/`,
or require a signed URL. Failing that, add authentication and an ownership
check against the `userId` segment in the key.

---

## High

### `IDOR-PATCH-PROJECT` — `PATCH /api/projects/{projectId}`

**Summary:** Any authenticated user can modify any project by id.

The handler runs `prisma.projects.update({ where: { id: projectId } })` with
no `user_id` filter, so ownership is never verified. Note that
`GET` and `DELETE` on the same route **do** check ownership — the gap is only
in `PATCH`, which makes it easy to miss.

**Remediation:** add `user_id: <caller id>` to the `where` clause, or
`findFirst` on both `id` and `user_id` first and return `404` if absent.

### `IDOR-LIST-OBJECTS` — `GET /api/projects/{projectId}/objects`

**Summary:** No ownership check on read.

Returns every placed object on the project to any authenticated caller. This
leaks the full layout of someone else's floor plan.

### `IDOR-REPLACE-OBJECTS` — `POST /api/projects/{projectId}/objects`

**Summary:** No ownership check; any authenticated user can wipe another user's
floor plan.

This route replaces the entire object set for a project. Combined with the
missing ownership check, it is the most destructive IDOR in the codebase: one
authenticated request with a guessed project id destroys the target's work.
`PUT` and `DELETE` on the individual-object routes do check ownership, so again
the gap is isolated to this one handler.

### `IDOR-VIDEO-UPLOAD` — `POST /api/projects/{projectId}/video`

**Summary:** No ownership check; any authenticated user can overwrite any
project's `video_path`.

The new video object is written to the project row without confirming the
caller owns it. Existing video objects in R2 are not removed, so this leaves
orphaned media behind as well as hijacking the pointer.

### `IDOR-MAP-UPLOAD` — `POST /api/upload`

**Summary:** No ownership check on `projectId`; a paying user can attach a map
plot to somebody else's project.

Four writes use the caller's `projectId` with no ownership filter: the R2
`PutObject`, `map_plots.updateMany(is_active: false)`, `map_plots.create`, and
`projects.update(active_map_plot_id)`. So any caller with paid access can
attach a plot to another user's project **and** deactivate the victim's existing
plots. The 2-upload re-upload limit is also unscoped, so it counts other
callers' rows for the same `projectId`.

**Remediation:** check `projects.user_id === uid` before step 2, and scope the
`map_plots.count` to `user_id`.

### `UPLOAD-TYPE-UNVALIDATED` — `POST /api/upload`

**Summary:** `file.type` is stored verbatim as the object's `Content-Type`, with
no allow-list and no content sniffing, so an SVG or HTML "floor plan" is stored
and later served as `text/html`.

The handler checks only that a file is present and under 5MB. The client-supplied
`file.type` is passed straight to `PutObjectCommand`, and
`GET /api/public-assets/{...key}` replays it to the browser. Since that route is
unauthenticated and served from `manglamvastu.in`, the uploaded file executes as
script on the application's own origin — stored XSS, reachable by any account
with paid access, against any visitor who is sent the asset URL.

**Remediation:** sniff the content server-side, accept only raster image types,
and store a normalised `Content-Type` rather than the client's claim.

### `PUBLIC-ASSET-NO-PREFIX-ALLOWLIST` — `GET /api/public-assets/{...key}`

**Summary:** The catch-all key is not restricted to a known prefix, and there is
no signature or expiry check of any kind.

Distinct from `PUBLIC-ASSET-LEAK`: that entry is about authentication, this one
is about authorisation granularity. The route will serve **any** object the R2
credentials can read, so the bucket's own layout is the only access control. A
prefix allow-list would at least bound the damage to objects deliberately
published, and a signed URL with an expiry would make each fetch accountable.

**Remediation:** reject any key outside an explicit public prefix, or require a
signature (R2 presigned URL, or an HMAC over `key` + expiry).

### `PUBLIC-ASSET-CONTENT-TYPE-REPLAY` — `GET /api/public-assets/{...key}`

**Summary:** The stored `Content-Type` is replayed to the caller, and the
response is cached `immutable` for a year.

Two compounding problems on the response:

1. Replaying an attacker-controlled `Content-Type` from the app's own origin is
   what turns `UPLOAD-TYPE-UNVALIDATED` into stored XSS. There is no
   `X-Content-Type-Options: nosniff` and no `Content-Disposition`.
2. `Cache-Control: public, max-age=31536000, immutable` means a browser or CDN
   that has fetched a key will never revalidate it. Replacing the object at the
   same key — which is exactly what a re-upload does, modulo the timestamp — does
   not invalidate anything already cached.

**Remediation:** send a fixed `Content-Type` from an allow-list, add `nosniff`,
serve from a separate origin, and drop `immutable` unless keys are truly
content-addressed.

### `UNRESTRICTED-VIDEO-TYPE` — `POST /api/projects/{projectId}/video`

**Summary:** No MIME allow-list and no content sniffing, so up to 100MB of
arbitrary bytes can be stored, under an attacker-chosen `Content-Type`.

`file.type` is stored as-is (falling back to `video/mp4` only when empty), and
`GET /api/public-assets/{...key}` replays it — so this is the same stored-XSS
chain as `UPLOAD-TYPE-UNVALIDATED`, reachable without any paid-access gate at
all. `file.name` is also interpolated unescaped into both the R2 key and the
ffmpeg temp path (`path.join(os.tmpdir(), 'input_' + Date.now() + '_' +
file.name)`), so a name containing `../` is normalised out of the temp
directory.

The 9MB compression target is not enforced: if `ffprobe` or `ffmpeg` fails, the
original is stored, up to the full 100MB.

**Remediation:** validate by content, store a normalised type, sanitise
`file.name`, and enforce the size cap after compression.

### `IDOR-DEVTA` — `GET /api/analysis/devta`

**Summary:** No ownership check, so any authenticated user can run — and mark
reviewed — another user's analysis.

This is a `GET` with a side effect: the handler flips a reviewed flag on the
analysis row. Any authenticated user can both read the geometry of another
user's plot and mark their analysis as handled.

### `IDOR-UNLOCK-REPORT` — `POST /api/analysis/{analysisId}/deduct-credit-for-report`

**Summary:** Any user can spend their own credit to unlock another user's
report.

The credit check reads the *caller's* balance, but nothing verifies the caller
owns the analysis. So an attacker pays one credit and marks another user's
report as paid. `GET /api/analysis/full-report` and `GET /api/analysis/marma`
**do** check ownership correctly, so the attacker cannot then read the report
they just unlocked — the practical damage is the state change on a foreign
record plus the attacker's own credit, not a data breach. It is still a broken
access-control check and should be fixed.

Two things sharpen this. `report_paid` is a column on the analysis, not per user,
so the flag is global to the project — one call unlocks the report for
everyone. And per `NO-CREDIT-CONSUMPTION-WITH-CREDITS` below, the "pay one
credit" premise does not currently hold: the credit is not spent at all.

**Remediation:** verify the caller owns the analysis before touching the credit
balance, the same way the two report-read routes do.

### `UNAUTH-ANALYSIS-PROXY` — `POST /api/analysis/objects`

**Summary:** No auth and no payment gate on the full analysis engine.

This route proxies straight to the Python engine with the caller's boundary and
object list. It requires neither a session nor a Bearer token, and it charges
nothing. It does not read or write the database, so the exposure is compute
rather than data — but it completely bypasses the credit model that
`POST /api/analysis/{analysisId}/deduct-credit-for-report` enforces. There is
no per-object rate limit either.

The path also collides with the `[analysisId]` dynamic segment: Next.js matches
the static `objects` segment first, so this handler always wins for
`POST /api/analysis/objects`.

**Remediation:** require auth, charge a credit, and rate-limit by caller.

### `PAYMENT-PROMOTES-ASTROLOGER` — `POST /api/payments/verify`

**Summary:** Any successful subscription purchase sets the buyer's role to
`astrologer` and approves pending applications.

On a successful verification of an astrologer-plan order, the handler writes
`role = "astrologer"` on the buyer's profile and flips any pending astrologer
application to approved. There is no admin step. Paying is equivalent to being
approved as a practitioner, which then grants access to
`GET /api/astrologer/projects` — a list of other users' projects.

**Remediation:** leave the application pending and let an admin approve it, as
`POST /api/admin/applications/approve` already does.

---

## Medium

### `NONATOMIC-REPLACE` — `POST /api/projects/{projectId}/objects`

**Summary:** Delete-then-insert is not transactional, so a failed insert leaves
the project with no objects at all.

The handler runs `deleteMany` for the project and then a separate `createMany`
for the new set, with no transaction. `createMany` is a single statement, so the
insert cannot fail *part-way* — but that is no consolation: if it throws at all,
every original object has already been deleted, the project is left empty, and
the original geometry is unrecoverable. The client gets a `500` carrying the raw
error in `details`, so at least the failure is visible.

The destructive part is that this route never touches R2. It only rewrites
`project_objects` rows holding `boundary_normalized` and `centroid`, so the
uploaded media is untouched and the R2 keys keep pointing at blobs that no
longer correspond to any row.

**Remediation:** wrap the delete and inserts in `prisma.$transaction`.

### `EMPTY-ARRAY-WIPES-PLAN` — `POST /api/projects/{projectId}/objects`

**Summary:** Sending `{"objects": []}` silently deletes the whole floor plan and
returns `200`.

The `deleteMany` runs *before* the emptiness check. When `objects` is an empty
array the handler has already deleted every row for the project, then returns
`200 { "message": "No objects to insert", "objects": [] }` — a success response
for a total data loss, with no confirmation step and no way for the client to
distinguish it from a no-op.

This compounds `IDOR-REPLACE-OBJECTS`: an authenticated caller who does not own
the project can destroy it with a request body containing no data at all. It is
also reachable by accident, because an empty array is what a client sends when
its canvas is empty or its object extraction silently returned nothing — the
usual cause being the unvalidated floor-plan parsing described in
`UNRESTRICTED-VIDEO-TYPE` and `NONATOMIC-REPLACE`.

**Remediation:** reject an empty `objects` array with `400` before touching the
database, and require an explicit `confirm: true` (or a `DELETE` call) to clear a
plan.

### `BATCH-DELETE-NOT-SCOPED` — `POST /api/projects/{projectId}/objects/batch`

**Summary:** `objectToDelete` ids are not filtered by `project_id`, so ids from
other projects can be deleted.

The `where` clause filters on the id list and the authenticated user, but not
on the project being modified. A caller who knows an object id belonging to a
different project can delete it by passing that project id in the path.

### `CORS-PUT-MISSING` — `PUT /api/projects/{projectId}/objects/{objectId}` and `PUT /api/analysis/{analysisId}/approve`

**Summary:** `PUT` is absent from `Access-Control-Allow-Methods`, so browser
preflight fails.

`middleware.ts:29` lists `GET, POST, PATCH, DELETE, OPTIONS`. Both `PUT`
routes are unreachable from a browser; native clients are unaffected. See
[`cors.md`](./cors.md).

### `APPROVE-NO-ASSIGNMENT-CHECK` — `PUT /api/analysis/{analysisId}/approve`

**Summary:** Any astrologer or dev can approve any analysis; assignment is not checked.

The handler verifies the caller has the `astrologer` or `dev` role and then
approves the analysis by id. It does not check that the analysis was ever
assigned to that astrologer, so any practitioner can sign off on any client's
analysis. `CORS-PUT-MISSING` also applies, so this route currently only works
from native clients.

Two further notes: `admin` is **not** in the allowed set, which is the opposite
of every other route in the API; and a non-existent id returns `500` rather than
`404`, because the Prisma `P2025` error is caught by the generic handler and its
raw text is returned.

### `GET-WRITES-STATE` — `GET /api/analysis/devta`

**Summary:** A `GET` mutates the analysis row and swallows write failures.

After producing the grid, the handler issues
`prisma.analyses.update({ data: { status: "reviewed" } })` inside a `try` whose
catch only logs. So a read is not safe or idempotent, a `200` is not evidence
that the write happened, and — combined with `IDOR-DEVTA` on the same operation —
one authenticated caller can mark another user's analysis `reviewed`, which
removes it from any pending queue and is visible to its owner.

**Remediation:** move the status change to the approve route, or make it an
explicit `POST`, and return `500` if the write fails.

### `PLAN-CREDITS-NOT-DATA-DRIVEN` — `POST /api/payments`

**Summary:** A plan row cannot express how many credits it grants.

`subscription_plans` has no credits column, so for any database plan the amount
is the literal `1` — both in the Razorpay order notes
(`credits: isCreditPlan ? 1 : undefined`) and in
`razorpay_orders.credits_purchased`, which is what `fulfillOrder` increments.
Only the hard-coded `CREDIT_PACKAGES` fallback carries a real `credits` value,
and all three of those are `1` too.

The system therefore has no way to sell more than one credit. A 50-credit plan
added to the database would be created, charged at full price, and fulfilled
with one credit — silently, with a `200` and a correct-looking receipt.

**Remediation:** add a credits column to `subscription_plans` and read it, or
require multi-credit packs to be expressed in `CREDIT_PACKAGES`.

### `WEBHOOK-SUBSCRIPTION-EVENTS-DEAD` — `POST /api/payments/webhook`

**Summary:** `subscription.renewed` and `subscription.cancelled` both match zero rows.

Both handlers filter on `user_subscriptions.razorpay_subscription_id`, and
nothing in the repository ever writes that column: `fulfillOrder` creates
subscription rows without it, `POST /api/admin` `grantSubscription` does not set
it, and `POST /api/subscription` does not set it. Every locally created
subscription has `NULL` there.

The consequence is that after the initial `duration_days` elapses,
`checkPaymentAccess` stops granting access even though the customer is still
subscribed and being charged, and a remote cancellation is never observed
locally. The handlers are not wrong so much as unreachable — and they will
become live the moment real auto-renew is switched on, which is exactly when
they are needed.

Note also that Razorpay subscriptions are never created at all;
`POST /api/payments` calls `razorpay.orders.create`, not
`razorpay.subscriptions.create`, so `auto_renew: true` is written locally
against nothing on the gateway side.

**Remediation:** persist `razorpay_subscription_id` from the create response and
switch `auto_renew` based on an actual gateway subscription.

### `CANCEL-DRIFT` — `POST /api/subscription/cancel`

**Summary:** A failing Razorpay cancel is swallowed and the local row is
cancelled anyway, so renewal can continue charging.

The Razorpay call sits inside a `try` block whose catch only logs. If the
gateway rejects or times out, the local subscription is still set to cancelled
and `200` is returned. The user believes they cancelled; Razorpay may still
charge them on the next renewal date.

In practice the call is currently **never made**, because the guard reads
`subscription.razorpay_subscription_id` and that column is always `NULL` (see
`WEBHOOK-SUBSCRIPTION-EVENTS-DEAD`). So the drift is latent today rather than
active: the local row is cancelled and the gateway is never told at all. The
`try`/`catch` becomes the live bug as soon as the id is populated.

**Remediation:** return `502` and leave the local row untouched when the
gateway call fails, so the state machine cannot diverge.

### `NO-REJECT-ACTION` — `POST /api/admin/applications/approve`

**Summary:** There is no way to reject an astrologer application.

The only admin action on applications is approve. An application can therefore
only ever be `PENDING` or `APPROVED`, and `POST /api/astrologer/apply` blocks a
new application while **either** status is present. An unwanted applicant is
therefore stuck in the queue permanently unless someone edits the database
directly, and the applicant can never reapply.

**Remediation:** add a reject action that sets `REJECTED` with `reviewed_at`,
and keep `REJECTED` out of the duplicate-check blocklist so the applicant can try
again.

### `ADMIN-NEGATIVE-CREDITS` — `POST /api/admin`

**Summary:** `adjustCredits` accepts negative amounts and can push a balance
below zero.

`amount` is only checked for `undefined`, never for sign or type, and the write
is a raw `increment`, so a single call can drive a balance arbitrarily negative.
Nothing in the API clamps or reconciles a negative balance, and
`checkPaymentAccess` only tests `credits > 0`, so a negative balance behaves
like zero everywhere except the admin dashboard. A non-numeric `amount` makes
Prisma throw, producing a `500` with the raw error.

This is admin-gated, so it is a guardrail problem rather than a hole — but a
mistyped sign is silent and irreversible through this API.

### `ADMIN-UNVALIDATED-ROLE` — `POST /api/admin`

**Summary:** `updateRole` writes `newRole` with no validation.

Any string is written to `profiles.role`. A typo such as `"adminstrator"`
silently strips the user's access with no error, and the role column has no enum
constraint to catch it. This route is also the only way to grant or revoke
`admin` at all, so a mistake here has to be corrected with a second
`updateRole` from an account that is still an admin.

**Remediation:** validate `newRole` against the `UserRole` set before writing.

---

## Low

### `ANALYSIS-ROLE-GATE` — `POST /api/analysis`

**Summary:** The role allow-list is hard-coded, and `astrologer`/`admin` skip the project-ownership check.

Two separate things live in this handler. The gate is
`role === "admin" || "astrologer" || "user"`, so the `dev` role is refused with
`403 { message, needs_payment: true }` — a payment prompt for a role that has
nothing to do with payment. The `blocking_message` initialiser is the literal
`"Analysis blocked."`, overwritten only in the `else` branch, so a role added to
the deny path later would return that.

Separately, the ownership check is skipped when the role is `admin` or
`astrologer`, via `profile.role === "astrologer" && allowed_to_analyze` — and
`allowed_to_analyze` is unconditionally `true` by that point, so the second
clause is always satisfied. Astrologers may therefore analyse any project id.
That is presumably intended for a consultancy workflow, and is recorded here so
it is a documented decision rather than an oversight.

### `IDOR-ANALYSIS-STATUS` — `GET /api/analysis/{analysisId}/status`

**Summary:** The status of any analysis id is readable by any authenticated
user.

Leaks the existence and state machine position of another user's analysis. The
payload is small and contains no report content, hence low rather than high.

### `NO-CREDIT-CONSUMPTION-WITH-CREDITS` — `POST /api/analysis/{analysisId}/deduct-credit-for-report`

**Summary:** Credits are never spent. A caller with a balance of 1 or more unlocks reports for free, and the deduction is unreachable.

This is a revenue bug rather than a robustness nit.

```ts
const paymentAccess = await checkPaymentAccess(uid);
if (profile.role === "admin" || paymentAccess.hasAccess) {
  await prisma.analyses.update({ data: { report_paid: true } });
  return 200 { message: "Report access granted.", no_credit_deduction: true };
}
// only now:
const deducted = await deductCredit(uid, 1);
```

`checkPaymentAccess()` returns `hasAccess: true` whenever
`user_credits.credits > 0` — it is an **entitlement** check that treats a
positive balance as full access. The handler then reuses it as a
"skip payment" condition. The consequences:

| Caller state | Result |
| --- | --- |
| `credits > 0` | Free, `no_credit_deduction: true` |
| active subscription | Free |
| `credits === 0`, no subscription | `deductCredit` runs, fails (`credits >= 1` required), returns `403` |

So `deductCredit` is reachable **only** by a caller with exactly zero credits,
and that call cannot succeed. A holder of one credit unlocks unlimited reports
and never spends it, and the insufficient-credits `403` is only ever shown to
users who have no credits at all. The credit balance functions as a boolean
entitlement flag, not a balance.

**Remediation:** separate "may view paid content" from "must pay for this
item". Have `checkPaymentAccess` stop returning `hasAccess` on a positive credit
balance, and let this route's own deduction be the only thing that consumes a
credit.

### `CANCEL-IGNORES-TRIALING` — `POST /api/subscription/cancel`

**Summary:** A `trialing` subscription cannot be cancelled.

The lookup is `where: { id, user_id, status: 'active' }` with exact equality, so
a trialing row returns `404 Subscription not found`. There is no other route
that cancels a subscription — the webhook handler matches on
`razorpay_subscription_id`, which is always `NULL`. A trialing customer has no
way to cancel.

### `CANCEL-BODY-FIELD-IGNORED` — `POST /api/subscription/cancel`

**Summary:** `razorpaySubscriptionId` is accepted in the body and never used.

The field is destructured and never referenced; the handler reads
`subscription.razorpay_subscription_id` from the database instead. So there is
no client-supplied override, and a client that sends the field gets a `200`
without any indication it was ignored — which implies a capability that does not
exist and invites a client to believe the remote subscription was identified.

### `WEBHOOK-EVENTS-NOT-READ` — `POST /api/payments/webhook`

**Summary:** `razorpay_events` is an audit log, not an idempotency guard.

Every event is inserted with `processed: false` and then updated to `true`, but
nothing ever queries the table — not for replay suppression, not for a
retry sweep. A replayed `payment.captured` is nonetheless harmless because
`fulfillOrder` short-circuits on `order.status === "completed"`, so the order
row is the real idempotency key and the event table is decorative.

The practical gap is recovery: if the process dies between the insert and the
final `processed: true`, the event is left as `processed: false` with nothing
scanning for it. The webhook also does not check `fulfillOrder`'s return value,
so it returns `200 { received: true }` even when fulfilment failed — Razorpay
will not retry, and the order stays `pending` with no alert.

### `EXPERT-CODE-NOT-CSPRNG` — `POST /api/admin/applications/approve`

**Summary:** `generateExpertCode` uses `Math.random()`, and uniqueness is a read-then-write check.

Six characters are drawn from a 36-character alphabet with `Math.random()` rather
than a CSPRNG. The search space is 36⁶ ≈ 2.2 × 10⁹, so predictability is a
theoretical concern rather than a practical one, but these codes are the only way
to be assigned client work and are handed to users out of band.

The uniqueness loop is also not atomic: it reads, then later writes inside a
separate transaction, so two concurrent approvals can generate the same code and
the second write fails the `@unique` constraint, rolling back the whole
approval.

**Remediation:** use `crypto.randomInt` and let the `@unique` constraint be the
only uniqueness check, retrying on `P2002`.

### `APPROVAL-UNNOTIFIED` — `POST /api/admin/applications/approve`

**Summary:** The applicant is not notified, and the expert code is returned only in the admin's response.

Approval sets the role and mints the code, but nothing emails or notifies the
applicant, and the `ASTRO-` code appears in exactly one place: the admin's HTTP
response. The admin must deliver it out of band. In practice the applicant can
later read their own code from `GET /api/astrologer/projects`, so this is a
notification gap rather than a lockout.

### `ADMIN-NO-AUDIT-TRAIL` — `POST /api/admin`

**Summary:** No admin action records who did what.

None of the eight dispatcher actions store the acting admin's id alongside the
mutation, and `razorpay_events` — the only append-only table in the schema — is
not used here either. A role change, a credit adjustment, or a plan deletion
cannot be attributed after the fact, and there is no way to answer "who granted
this subscription" or "who demoted this user".

**Remediation:** add an `admin_audit_log` table and write one row per action
inside the same transaction as the mutation.

### `ADMIN-PLAN-FALSY-CHECK` — `POST /api/admin`

**Summary:** `updateSubscriptionPlan` mixes truthiness and `!== undefined`, so a legitimate `0` is silently ignored.

Within the same branch, `description` and `is_active` are guarded with
`!== undefined` — so `false` and `""` are applied correctly — while
`price_inr`, `duration_days`, and `plan_type` use plain truthiness. A
`price_inr: 0` edit is therefore accepted with a `200` and no change, and the
response echoes the plan so it looks like it worked. This is the shape of a "my
edit did nothing" bug report.

**Remediation:** use `!== undefined` for every optional field.

---

## Cross-cutting issues

These affect no single operation, so they have no `x-known-issues` entry.

### Hardcoded fallback JWT secret

`lib/auth.ts` and `lib/mobile-auth.ts` fall back to a literal development
secret when `NEXTAUTH_SECRET` is unset. In that configuration the secret is
public knowledge from the repository, so anyone can mint a valid session token
or mobile JWT for any user id. This should be a hard startup failure, not a
fallback.

### No rate limiting anywhere

Nothing in `app/api/**` throttles requests. The routes that matter most:

| Route | Consequence |
| --- | --- |
| `POST /api/mobile/auth/login` | Credential stuffing |
| `POST /api/mobile/auth/signup`, `POST /api/auth/signup` | Account enumeration and mass registration |
| `POST /api/analysis/objects` | Unauthenticated compute abuse against the Python engine |
| `POST /api/upload`, `POST /api/projects/{projectId}/video` | R2 storage cost exhaustion |
| `POST /api/public-assets/{...key}` | Bulk object enumeration |

### No refresh or revocation for mobile tokens

Mobile JWTs last 30 days, there is no refresh endpoint, and there is no
revocation list. A leaked token stays valid for a month and cannot be
invalidated without rotating `NEXTAUTH_SECRET`, which signs out every browser
session at the same time.

### Credit ledger has no non-negative constraint

Credit mutation itself is **not** racy. Every write path uses an atomic Prisma
operation rather than a read-modify-write: `deductCredit` uses `updateMany` with
a `credits: { gte: amount }` guard, the admin `adjustCredits` and the unlock
refund use `upsert` with `increment`, and the signup paths use `create` inside a
transaction. Two concurrent deductions cannot spend the same credit twice, and a
failed report unlock is refunded with an `increment`.

What is missing is a database-level floor. `user_credits.credits` is a plain
`Int` with no `CHECK (credits >= 0)`, so nothing stops the admin `adjustCredits`
action from applying a negative `amount` and leaving a permanent negative
balance — see `ADMIN-NEGATIVE-CREDITS`. The real problem with credits is
authorization, not arithmetic: `NO-CREDIT-CONSUMPTION-WITH-CREDITS` means the
balance is never consulted before granting access, so the ledger is decorative
for the only path that is supposed to spend from it.

### Raw internal error text reaches clients

Several handlers place the caught exception directly in the response body —
notably the NextAuth credentials `authorize` callback, which throws the raw
database error and surfaces it on `/api/auth/error`. Database and driver text
can disclose schema and infrastructure detail.

### Two routes the frontend calls do not exist

Client code references both of these. There is no matching `route.ts`, so
both return the Next.js `404` page, not JSON:

| Called route | Referenced by |
| --- | --- |
| `POST /api/astrologer/activate-key` | Astrologer onboarding UI |
| `POST /api/admin/generate-key` | Admin key-management UI |

They are deliberately **not** in [`openapi.yaml`](./openapi.yaml), because
documenting a route that does not exist would misrepresent the API. If they are
meant to exist, the handlers need to be written; if they were removed, the
frontend calls need to be removed.

### `GET /api/health` is a liveness probe only

It proxies the Python engine and returns its body. It does not check the
database or R2, so a `200` does not mean the API is functional. It also falls
back to a hardcoded public address, `http://72.61.224.232:8001`, when
`MICROSERVICE_URL` is unset. See [`microservice.md`](./microservice.md).

### The Python engine has no authentication and wildcard CORS

`devta_microservice/main.py` sets `allow_origins=["*"]` and performs no
authentication. The engine is only safe because it is expected to be
network-private. Anything that can reach the port can use it. See
[`microservice.md`](./microservice.md).

### `.env.example` does not describe the real environment

It lists 4 variables, all Razorpay. The 15 variables the API actually reads are
absent, so a fresh clone cannot be configured from it:

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSERVICE_URL
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ACCOUNT_ID
R2_BUCKET_NAME
SUPABASE_URL                    (as NEXT_PUBLIC_SUPABASE_URL)
SUPABASE_ANON_KEY               (as NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_SERVICE_KEY
RAZORPAY_KEY_ID_TEST
RAZORPAY_KEY_SECRET_TEST
NEXT_PUBLIC_RAZORPAY_KEY_ID_TEST
```

The `_TEST` Razorpay pair and the Supabase keys are the more consequential
omissions: the test-mode payment path and all Supabase access are invisible to
anyone setting up from the example file.
