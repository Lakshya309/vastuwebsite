# Admin

The administrative surface: a dashboard, a single mutation dispatcher, and the
astrologer approval queue.

| | |
| --- | --- |
| Auth | session **or** Bearer, plus `role === "admin"` on every operation |
| Operations | 4 |

| Operation | Method + path |
| --- | --- |
| `adminDashboard` | `GET /api/admin` |
| `adminAction` | `POST /api/admin` |
| `listPendingApplications` | `GET /api/admin/applications` |
| `approveAstrologerApplication` | `POST /api/admin/applications/approve` |

All four check `profile.role === "admin"` explicitly after `validateAuth()`,
which is the right pattern — `validateAuth` itself performs no role check. There
is no caching of the role, so a demotion takes effect on the next request.

**No operation on this page writes an audit record.** The acting admin's id is
never stored alongside a mutation, so a role or credit change cannot be
attributed afterwards. See [`../known-gaps.md`](../known-gaps.md).

---

## `GET /api/admin`

| | |
| --- | --- |
| Source | `app/api/admin/route.ts` |
| Operation ID | `adminDashboard` |

### Responses

**`200`** — two collections:

| Field | Contents |
| --- | --- |
| `plans` | **every** `subscription_plans` row, ordered by `price_inr` ascending |
| `activeSubscriptions` | `user_subscriptions` with status `active` or `trialing`, including the joined `plans` object and the subscriber's `email`, newest first |

`plans` is **not** filtered on `is_active`, while the public
`GET /api/payments` is. So the admin view includes deactivated plans and the
pricing page does not — deliberate, and worth knowing before concluding a plan
is live.

`activeSubscriptions` includes no `expires_at` filter either, so it can list a
row that has lapsed but not been written back, matching the behaviour of
`GET /api/subscription`. There is no aggregate: no counts, no revenue, no MRR,
no user list. Everything is a raw table dump.

**`401`** — `{ "message": "Unauthorized: Invalid token" }`. Note this route's
fallback string differs from the other three admin routes, which use plain
`"Unauthorized"`.

**`403`** — `{ "message": "Forbidden: Only administrators can perform this action." }`.

**`500`** — `{ "message": "Failed to fetch admin data" }`. The raw error is only
logged, not returned.

---

## `POST /api/admin`

| | |
| --- | --- |
| Source | `app/api/admin/route.ts` |
| Operation ID | `adminAction` |

A single dispatcher. The `action` field selects the mutation.

### Request body

`application/json`, with the fields each action needs:

| `action` | Required | Effect |
| --- | --- | --- |
| `updateRole` | `userId`, `newRole` | Sets `profiles.role` |
| `adjustCredits` | `userId`, `amount` | `user_credits` increment, creating the row if absent |
| `updateAstrologerAccess` | `userId`, `validFrom`, `validTo` | Sets the astrologer access window |
| `createSubscriptionPlan` | `planData.name`, `planData.price_inr`, `planData.duration_days` | Inserts a plan; `plan_type` defaults to `"monthly"` |
| `updateSubscriptionPlan` | `planId` + any `planData.*` | Patches a plan |
| `deleteSubscriptionPlan` | `planId` | Deletes a plan |
| `grantSubscription` | `userId`, `planId` | Inserts an `active` subscription, `auto_renew: false` |
| `cancelUserSubscription` | `userId` | Cancels **all** `active`/`trialing` rows for that user |

Optional `planData` fields for `updateSubscriptionPlan`: `name`, `description`,
`price_inr`, `duration_days`, `plan_type`, `is_active`, `razorpay_plan_id`.

### Two response shapes

`updateRole`, `adjustCredits`, and `updateAstrologerAccess` fall through to a
shared envelope:

```json
{ "message": "Admin action 'updateRole' completed successfully.", "result": true }
```

The other five return their own object, and four of those return a **message
only** with no `result` field:

| Action | Response | Status |
| --- | --- | --- |
| `createSubscriptionPlan` | `{ "message": "Subscription plan created.", "plan": { ... } }` | `201` |
| `updateSubscriptionPlan` | `{ "message": "Subscription plan updated.", "plan": { ... } }` | `200` |
| `deleteSubscriptionPlan` | `{ "message": "Subscription plan deleted." }` | `200` |
| `grantSubscription` | `{ "message": "Subscription granted.", "subscription": { ... } }` | `201` |
| `cancelUserSubscription` | `{ "message": "User subscription cancelled." }` | `200` |

So a client cannot distinguish "cancelled one subscription" from "the user had
none" — both are `200 { message }`. And a missing `planId` target surfaces as
`500` with a raw Prisma `P2025` string, not a `404`.

### `adjustCredits` accepts negative amounts

`amount` is only checked for `undefined`, never for sign or type, and the write
is a raw `increment`:

```json
{ "action": "adjustCredits", "userId": "<victim>", "amount": -1000 }
```

Nothing clamps the result, and `checkPaymentAccess` only tests `credits > 0`, so
a negative balance behaves like zero everywhere except in the admin dashboard.
A non-numeric `amount` makes Prisma throw, producing a `500` with the raw error.

This is admin-gated, so it is a guardrail problem rather than a hole — but a
mistyped sign is silent and irreversible through this API.

### `updateRole` accepts any string

`newRole` is not checked against the `UserRole` set, so `"astrologer"`,
`"Admin"`, and `""` are all accepted. A typo locks the user out of every
role-gated route, and there is no way to correct it through the API without
issuing another `updateRole` with the right value. This route is also the only
way to grant or revoke `admin` at all.

### `updateSubscriptionPlan` mixes truthiness and `!== undefined`

`description` and `is_active` use `!== undefined`, so `false` and `""` are
applied correctly. `price_inr`, `duration_days`, and `plan_type` use plain
truthiness, so a legitimate `0` is **silently ignored**. The two styles sit in
the same branch, which is the kind of inconsistency that produces a "my edit
did nothing" bug report.

### Responses

**`400`** — per-action required-field messages, plus
`{ "message": "Invalid admin action." }` for an unrecognised `action`. All eight
actions are missing an `is_active` guard, so a `DELETE` on an unknown id reaches
Prisma and returns `500`.

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Forbidden: Only administrators can perform this action." }`.

**`404`** — `{ "message": "Plan not found." }`, from `grantSubscription` only. It
is the single admin action that validates its target before writing.

**`500`** — `{ "message": "Failed to perform admin action", "error": "<raw Prisma text>" }`.
This leaks schema and constraint detail — `P2003` on a plan still referenced by
subscriptions, `P2025` on a missing id, `Invalid Date` from
`updateAstrologerAccess` with an unparseable `validFrom`.

---

## `GET /api/admin/applications`

| | |
| --- | --- |
| Source | `app/api/admin/applications/route.ts` |
| Operation ID | `listPendingApplications` |

The astrologer approval queue.

### Responses

**`200`** — `{ "applications": [ ... ] }`, every `astrologer_applications` row
with status `PENDING`, newest first, each including the applicant's `email`.

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Forbidden" }`. The bare word, unlike the other three
admin routes.

**`500`** — `{ "message": "Failed to fetch applications", "error": "<raw>" }`.

### The queue has nothing to review

Each row is `{ user_id, status, created_at, profiles: { email } }`. There is no
bio, no credentials, no documents, no portfolio, no rate. An admin sees an
email address and is asked to grant staff privileges. The application form
itself takes no input at all — see
[`astrologer.md`](./astrologer.md).

There is also **no reject action anywhere in the API**, so an unwanted
applicant cannot be declined; the row stays `PENDING` forever and the applicant
is blocked from reapplying.

---

## `POST /api/admin/applications/approve`

| | |
| --- | --- |
| Source | `app/api/admin/applications/approve/route.ts` |
| Operation ID | `approveAstrologerApplication` |

### Request body

`application/json`: `{ "applicationId": "<uuid>" }`. Required.

### What it does, in one transaction

1. Sets the applicant's `role` to `"astrologer"`.
2. Generates a unique `expert_code` of the form `ASTRO-` plus six characters
   from `A-Z0-9`.
3. Sets `valid_from` to now and `valid_to` to now + **365 days**, hardcoded.
4. Marks the application `APPROVED` with `reviewed_at`.

A non-`PENDING` or unknown id returns `404`, so double approval is safe.

### The code is not cryptographic

`generateExpertCode` uses `Math.random()`, not a CSPRNG, for the six
characters. The value is checked for uniqueness with a read-then-write query
rather than a constraint violation, so two concurrent approvals can generate the
same code and the second write fails the `@unique` constraint and rolls the
whole transaction back. The search space is 36⁶ ≈ 2.2 × 10⁹, so this is a
robustness nit rather than a practical predictability problem — but these codes
are the only way to be assigned client work.

### What approval actually grants

`valid_from`/`valid_to` being set is what makes `checkPaymentAccess` grant
access through its astrologer branch, so the new astrologer can read paid
reports, run `devta` and `marma` on their own projects, and **approve any
analysis** via `PUT /api/analysis/{analysisId}/approve`.

After 365 days the `valid_to` window lapses and `checkPaymentAccess` stops
granting through that branch — but the **role persists**, so approval and
project-queue access keep working. `updateAstrologerAccess` is the only way to
move the window.

### Responses

**`200`** — `{ "message": "Application approved successfully", "expertCode": "ASTRO-XXXXXX" }`.

The applicant is **not** notified, and this response is the only place the code
appears. An admin must deliver it out of band. In practice the applicant can
later read their own code from `GET /api/astrologer/projects`, so this is a
notification gap rather than a lockout.

**`400`** — `{ "message": "Application ID required" }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`403`** — `{ "message": "Forbidden" }`. Note the role check happens **after**
the body is parsed and the id is validated, so a non-admin can distinguish "id
missing" from "id unknown" from "forbidden".

**`404`** — `{ "message": "Application not found or already processed" }`.
Conflates missing, already approved, and rejected, which is correct.

**`500`** — `{ "message": "Failed to approve application", "error": "<raw>" }`.

---

## The privilege model, in one place

Worth stating plainly, because it is spread across five files:

| Capability | Required |
| --- | --- |
| Read/write own project | any authenticated user |
| Read/write **any** project (`PATCH`) | any authenticated user — **bug** |
| Read/write any project's objects | any authenticated user — **bug** |
| Read any project's analysis | any authenticated user, via `devta` — **bug** |
| Run the engine with no auth | no auth at all — **bug** |
| Approve an analysis | `astrologer` or `dev` |
| See the astrologer queue | `astrologer` |
| Skip `report_paid` | `astrologer` or `dev` |
| Administer users and plans | `admin` |
| **Become** `astrologer` | **buy any subscription** — see [`payments.md`](./payments.md) |

That last row is the one to look at first. The `astrologer` role is granted by
a payment, so it is not a staff marker, and every row above it that depends on
`astrologer` is reachable by any paying customer.
