# Subscription

Reading and cancelling the caller's subscription.

| | |
| --- | --- |
| Auth | session **or** Bearer on both |
| Operations | 2 |

Both routes use the **`error`** key for failures.

---

## `GET /api/subscription`

| | |
| --- | --- |
| Source | `app/api/subscription/route.ts` |
| Operation ID | `getSubscription` |

### Responses

**`200`** — `{ "subscription": { ...row, "plans": { ... }, "is_active": true } }`,
or `{ "subscription": null }` when there is nothing to show. A missing
subscription is a `200` with `null`, not a `404` — the right choice for a
client that polls this.

The row is the most recently created `user_subscriptions` entry whose status is
`active` or `trialing`, with the joined `plans` object.

### Trust `is_active`, not `status`

The query filters on `status ∈ {active, trialing}` and **does not** filter on
`expires_at`. A row that has lapsed but has not been written back to
`cancelled` is returned with `status: "active"` alongside a computed
`is_active: false`.

```
status: "active", is_active: false   →  expired, but the row was never updated
```

This matters because the enforcement points disagree. `checkPaymentAccess`, used
by `POST /api/upload`, `GET /api/analysis/devta`, `GET /api/analysis/marma` and
the report-unlock route, filters on `expires_at > now` and will therefore
**deny** a user that this route reports as subscribed. A client that renders
"Active plan" from `status` while the API refuses the action is the intended
symptom to guard against.

### Only one row is returned

`findFirst` with `orderBy: { created_at: "desc" }` means a user with an old
lapsed subscription and a new active one sees only the newest, and a user with
two overlapping active rows is not told about the second. There is no list
endpoint and no history endpoint.

### Responses, continued

**`401`** — `{ "error": "Unauthorized" }`.

**`500`** — `{ "error": "Failed to fetch subscription" }`. The raw error is only
logged.

---

## `POST /api/subscription/cancel`

| | |
| --- | --- |
| Source | `app/api/subscription/cancel/route.ts` |
| Operation ID | `cancelSubscription` |

### Request body

`application/json`:

| Field | Type | Notes |
| --- | --- | --- |
| `subscriptionId` | string | The local `user_subscriptions.id`. |
| `razorpaySubscriptionId` | string | **Accepted and ignored.** |

`razorpaySubscriptionId` is destructured and never referenced. The handler uses
`subscription.razorpay_subscription_id` read from the database instead, so
there is no client-supplied override — sending the field does nothing and implies
a capability that does not exist.

### The lookup is correctly scoped

```ts
where: { id: subscriptionId, user_id: userId, status: 'active' }
```

Ownership **is** enforced here, which is worth noting because most mutating
routes in this API do not do this. A caller cannot cancel another user's
subscription.

The `status: 'active'` equality is exact, though, so a **`trialing` subscription
returns `404` and cannot be cancelled at all** through this route. There is no
alternative path.

### The remote cancel is best-effort, and currently never runs

```ts
if (subscription.razorpay_subscription_id) {
  try { await cancelSubscription(...) }
  catch (e) { console.error(...) }      // swallowed
}
// local row is cancelled regardless
```

Two problems stacked:

1. `razorpay_subscription_id` is **never written by any code path** in the
   repository. `fulfillOrder` creates `user_subscriptions` rows without it, and
   `POST /api/subscription` does not set it. So the `if` is always false,
   `cancelSubscription` is never called, and the remote side is never notified.
2. Even once it *is* populated, a Razorpay failure is logged and then the local
   row is cancelled anyway. The customer is told "cancelled successfully" while
   any remote subscription keeps billing.

The webhook's `subscription.cancelled` handler, which would reconcile this, also
filters on `razorpay_subscription_id` and so matches nothing. See
[`payments.md`](./payments.md).

### Responses

**`200`** — `{ "message": "Subscription cancelled successfully" }`. Sent
unconditionally, including when the remote cancel failed or was skipped.

**`401`** — `{ "error": "Unauthorized" }`.

**`404`** — `{ "error": "Subscription not found" }`. Covers a missing id, another
user's id, a `trialing` row, and an already-`cancelled` row — all
indistinguishable, which is the correct way to avoid leaking existence.

**`500`** — `{ "error": "Failed to cancel subscription" }`.

### What is not changed

Cancelling does **not** touch `profiles.role`, so the `astrologer` role granted
at purchase time survives a cancellation. A cancelled subscriber keeps staff
privileges: approval rights, `report_paid` bypass on `full-report`, and
cross-project analysis access. See [`payments.md`](./payments.md) and
[`../known-gaps.md`](../known-gaps.md).

It also does not revoke `user_credits` or touch `analyses.report_paid`, so
previously unlocked reports stay unlocked.
