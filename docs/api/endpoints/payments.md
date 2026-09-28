# Payments

Razorpay order creation, signature verification, and the server-to-server
webhook.

| | |
| --- | --- |
| Auth | see per route |
| Operations | 4 |

| Operation | Method + path | Auth |
| --- | --- | --- |
| `listPlans` | `GET /api/payments` | **none** |
| `createRazorpayOrder` | `POST /api/payments` | session or Bearer |
| `verifyPayment` | `POST /api/payments/verify` | session or Bearer |
| `razorpayWebhook` | `POST /api/payments/webhook` | HMAC signature header |

Every route on this page uses the **`error`** key for failures, not `message`.
Plan listing is open; everything else is authenticated or signed.

---

## `GET /api/payments`

| | |
| --- | --- |
| Source | `app/api/payments/route.ts` |
| Operation ID | `listPlans` |
| Auth | **none** |

The pricing page's data source. Unauthenticated, and it has to be — a visitor
has to be able to see prices before signing up.

### Responses

**`200`** — the same `subscription_plans` rows, split three ways:

| Field | Contents |
| --- | --- |
| `allPlans` | every `is_active: true` row, ordered by `price_inr` ascending |
| `creditPlans` | the subset where `plan_type ∈ {credit, free}` |
| `subscriptionPlans` | the subset where `plan_type === "subscription"` |

Because the split is by `plan_type` and the column's default is
`"monthly"`, a plan row created without an explicit `plan_type` lands in
**neither** list. It still appears in `allPlans`, so a pricing page reading only
`creditPlans`/`subscriptionPlans` will silently hide it.

**`500`** — `{ "error": "Failed to fetch plans" }`. No raw error, unlike most
routes here.

### Not listed here

The hardcoded `CREDIT_PACKAGES` constant (three packages, all granting 1 credit)
is **not** returned by this route. It is only reachable as a fallback in
`POST /api/payments`. A client that renders prices from this response will not
see them.

---

## `POST /api/payments`

| | |
| --- | --- |
| Source | `app/api/payments/route.ts` |
| Operation ID | `createRazorpayOrder` |

Creates a Razorpay order and records it in `razorpay_orders` as `pending`.

### Request body

`application/json`, one of:

| Field | Type | Notes |
| --- | --- | --- |
| `planId` | string | A plan **UUID** or a plan **name** (case-insensitive) |
| `packageId` | string | Legacy alias for a `CREDIT_PACKAGES` id |

`planId` wins if both are sent. The UUID shape is tested with a regex, so a
non-UUID value only ever matches by name.

### Resolution order

1. `subscription_plans` where `is_active: true` and (`id` matches, if the value
   looks like a UUID) **or** (`name` matches, case-insensitive).
2. `CREDIT_PACKAGES` in `lib/razorpay.ts` by exact `id` — always
   `order_type: "credits"`.
3. Otherwise `400`.

`plan_type ∈ {credit, free}` → `order_type: "credits"`. Everything else →
`order_type: "subscription"`.

### Amounts

| Source | Amount sent to Razorpay |
| --- | --- |
| DB plan | `price_inr === 1 ? 1 : round(price_inr * 1.18)` |
| `CREDIT_PACKAGES` | the package's own `priceWithGst` |

The `price_inr === 1` special case means the ₹1 test plan is not GST-adjusted.
The 18% multiplier is hardcoded rather than read from a tax setting.

**Units are mixed in the response.** `amount` is always **paise** (Razorpay
Checkout's unit), while `plan.priceWithGst` / `package.priceInr` are
**rupees**. Check which field you are reading.

### The credit quantity is not data-driven

`subscription_plans` has **no credits column**. For any plan row the amount
granted is the literal `1`:

```ts
credits: isCreditPlan ? 1 : undefined
credits_purchased: isCreditPlan ? 1 : null
```

Only the `CREDIT_PACKAGES` fallback carries a real `credits` value, and all
three of those are `1` as well. So the system currently has no way to sell more
than one credit: adding a 50-credit plan to the database would be created,
charged at full price, and fulfil with **one** credit. If multi-credit packs are
a roadmap item, the schema needs a credits column first.

### Order reuse

A `pending` order for the same user, plan, order type and amount created within
the last **10 minutes** is returned instead of creating a new one. This is what
makes "go back to checkout" resume the same `orderId` rather than accumulating
abandoned orders. It is scoped per user, so it cannot be used to probe another
user's orders.

### Responses

**`200`** — one of two shapes depending on which source matched:

```json
// database plan
{ "orderId": "order_xxx", "amount": 117900, "currency": "INR",
  "plan": { "id": "...", "name": "Basic Plan", "price_inr": 999, "priceWithGst": 1179, "...": "..." } }

// hard-coded package
{ "orderId": "order_xxx", "amount": 117900, "currency": "INR",
  "package": { "id": "basic_plan", "credits": 1, "priceInr": 999, "priceWithGst": 1179, "...": "..." } }
```

Note `plan` vs `package` — different key names for the same concept, and the
package shape is the hardcoded constant including marketing fields
(`popular`, `relocationsLimit`, `mapUploadAllowed`).

**`400`** — `{ "error": "Invalid request: planId or packageId required" }` or
`{ "error": "Invalid plan or package ID" }`.

**`401`** — `{ "error": "Unauthorized" }`.

**`500`** — `{ "error": "Failed to create order" }`. This also covers an unset
`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`, so a misconfigured server looks the
same to the client as a Razorpay outage. If the Razorpay call succeeded but the
`razorpay_orders` insert failed, the order exists at Razorpay with no local
record and no fulfilment path.

---

## `POST /api/payments/verify`

| | |
| --- | --- |
| Source | `app/api/payments/verify/route.ts` |
| Operation ID | `verifyPayment` |

Client-side post-checkout confirmation. Verifies the HMAC signature, then
delegates to `fulfillOrder` in `lib/paymentFulfillment.ts`.

### Request body

`application/json`:

| Field | Type | Notes |
| --- | --- | --- |
| `razorpay_order_id` | string | Required |
| `razorpay_payment_id` | string | Required |
| `razorpay_signature` | string | Required |

### The order of checks

1. Signature — `400` if invalid.
2. Order exists — `404`.
3. **`order.user_id === caller`** — `403`. Good: a signature is not enough to
   claim somebody else's order.
4. `fulfillOrder`.

### Fulfilment

`fulfillOrder` runs in a single `prisma.$transaction`:

| Step | Action |
| --- | --- |
| 1 | Load the order. If `status === "completed"`, return `alreadyCompleted: true` and stop. |
| 2 | `razorpay_payments` upsert by `razorpay_payment_id`, recorded as `captured`. |
| 3 | Dispatch on `order_type` (below). |
| 4 | Set the order to `completed`. |

| `order_type` | Effect |
| --- | --- |
| `credits` | `user_credits.upsert` — `credits: { increment: credits_purchased }` |
| `subscription` | Create `user_subscriptions` with `expires_at = now + plan.duration_days`, `status: "active"`, `auto_renew: true` — **then** the role change below |

### Two things in the subscription branch

> **A purchase makes the buyer an astrologer.** Unless the current role is
> `admin`, the same transaction sets `role: "astrologer"`, and also flips every
> `PENDING` row in `astrologer_applications` to `APPROVED` with a `reviewed_at`.
>
> `astrologer` is a privilege tier, not a plan label. It grants
> `PUT /api/analysis/{analysisId}/approve` (the staff review action), it skips
> the `report_paid` check on `GET /api/analysis/full-report`, it bypasses project
> ownership in `POST /api/analysis`, and it bypasses the `devta`/`marma`
> ownership checks. So a paying customer is escalated to staff privileges by
> completing a checkout. If that is intended, the role needs to be split into an
> entitlement and a staff flag; if not, it is a privilege-escalation bug.
> See [`../known-gaps.md`](../known-gaps.md).

`auto_renew: true` is set locally, but the Razorpay subscription is never
created — the code calls `razorpay.orders.create`, not
`razorpay.subscriptions.create`. There is no `razorpay_subscription_id` anywhere
in the codebase, which is why the renewal and cancellation webhooks cannot
match. See [`subscription.md`](./subscription.md).

### Idempotency

Calling twice is safe: the second call hits `status === "completed"` and returns
`alreadyCompleted: true` with a `200`. There is no separate replay cache, and no
`razorpay_events` involvement on this path.

### Responses

**`200`** — `{ "message": "Payment verified successfully" | "Payment already verified", "status": "completed", "orderType": "credits" | "subscription" }`.

**`400`** — `{ "error": "Missing payment details" }` or
`{ "error": "Invalid signature" }`.

**`401`** — `{ "error": "Unauthorized" }`.

**`403`** — `{ "error": "Order does not belong to user" }`.

**`404`** — `{ "error": "Order not found" }`. Returned both by this route's own
lookup and by `fulfillOrder`.

**`500`** — `{ "error": "Failed to verify payment" }`, or
`{ "error": "Fulfillment failed" }` with the status code chosen by
`fulfillOrder`. Also covers an unset `RAZORPAY_KEY_SECRET`.

### Prefer the webhook

This route is client-triggered, so it depends on the buyer's browser surviving
checkout. The webhook is the reliable path. A client that only calls this route
will lose a payment if the tab closes. See
[`../known-gaps.md`](../known-gaps.md).

---

## `POST /api/payments/webhook`

| | |
| --- | --- |
| Source | `app/api/payments/webhook/route.ts` |
| Operation ID | `razorpayWebhook` |
| Auth | `x-razorpay-signature` HMAC |

Server-to-server receiver. No session, no Bearer.

### Signature verification

```
x-razorpay-signature === HMAC_SHA256(rawBodyText, RAZORPAY_WEBHOOK_SECRET)
```

Computed over `await request.text()` — the **raw** bytes. Any middleware that
re-serialises the JSON breaks verification, so this route must keep reading the
raw text. This is correct as written.

### Handled events

| Event | Effect |
| --- | --- |
| `payment.captured` | `fulfillOrder` on `payload.payment.entity.order_id` |
| `order.paid` | `fulfillOrder` on `payload.order.entity.id` |
| `subscription.cancelled` | `updateMany` on `razorpay_subscription_id` → `cancelled`, `cancelled_at`, `auto_renew: false` |
| `subscription.renewed` | extend `expires_at` by `plan.duration_days`, set `status: "active"` |

Any other `event` value is recorded, marked `processed: true`, and ignored. The
route still returns `200 {"received": true}` — deliberately, so Razorpay does not
retry an event you do not handle.

### The two subscription events are dead code

Both filter on `user_subscriptions.razorpay_subscription_id`. Nothing in the
codebase ever writes that column — `fulfillOrder` creates subscription rows
without it, and neither does `POST /api/subscription`. Every locally created
subscription has `NULL` there, so `updateMany` matches **zero rows**:

- `subscription.renewed` never extends local expiry. After the initial
  `duration_days` elapses, `checkPaymentAccess` stops granting access even
  though the customer is still subscribed and being charged.
- `subscription.cancelled` never marks the local row cancelled.

Razorpay subscriptions are never created in the first place, so in a pure
one-off-plan deployment these events would not fire anyway. They will matter the
moment real auto-renew is switched on. See
[`../known-gaps.md`](../known-gaps.md).

### No replay guard

Every event is inserted into `razorpay_events` with `processed: false` and then
updated to `true` — but **nothing ever reads that table**. It is an audit log,
not an idempotency key. A replayed `payment.captured` is nonetheless harmless,
because `fulfillOrder` short-circuits on `order.status === "completed"`.

If the process crashes between the `razorpay_events` insert and the final
`processed: true` update, the event is left as `processed: false` with no retry
path — nothing scans for unprocessed rows.

### Responses

**`200`** — `{ "received": true }`. Schema: an object with a single `received`
boolean.

**`400`** — `{ "error": "Missing signature" }` or
`{ "error": "Invalid signature" }`.

**`500`** — `{ "error": "Webhook processing failed" }`. Note this is also what a
`fulfillOrder` failure inside the handler produces, because `fulfillOrder`'s
result is not checked on this path — the webhook returns `200` even if
fulfilment failed. Razorpay will not retry, and the order stays `pending`.

---

## Payment flow, end to end

```
POST /api/payments          → orderId, amount (paise), plan
   (client opens Razorpay Checkout)
POST /api/payments/webhook  → payment.captured → fulfillOrder  [reliable]
POST /api/payments/verify   → signature check → fulfillOrder    [client, best-effort]
```

Both fulfilment paths share `fulfillOrder`, so the side effects are identical
and the order-status guard makes the pair idempotent. The client-side path adds
an ownership check the webhook cannot make, which is its only advantage.
