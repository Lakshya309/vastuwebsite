# Astrologer

The astrologer onboarding application and the assigned-project queue.

| | |
| --- | --- |
| Auth | session **or** Bearer on all three |
| Operations | 3 |

| Operation | Method + path | Access |
| --- | --- | --- |
| `applyAsAstrologer` | `POST /api/astrologer/apply` | any signed-in user |
| `getAstrologerApplicationStatus` | `GET /api/astrologer/application-status` | own application |
| `listAstrologerProjects` | `GET /api/astrologer/projects` | `role === "astrologer"` |

These routes use the **`message`** key for failures, not `error`.

> **The `astrologer` role is not trustworthy as a staff marker.** It is granted
> automatically to anyone who buys a subscription — see
> [`payments.md`](./payments.md). So `listAstrologerProjects` and
> `PUT /api/analysis/{analysisId}/approve` are reachable by any paying customer,
> not only by vetted astrologers.

---

## `POST /api/astrologer/apply`

| | |
| --- | --- |
| Source | `app/api/astrologer/apply/route.ts` |
| Operation ID | `applyAsAstrologer` |

Submits an onboarding application.

### Request body

**None.** The route reads no body. Everything comes from the token.

### It creates a profile if one is missing

Before anything else the handler does `profiles.findUnique({ where: { id } })`
and, if that returns nothing, **creates** the row with `role: "user"` and the
email from the token.

That is a self-healing insert in a route documented as "apply to be an
astrologer". It means this endpoint can create a `profiles` row for an id that
exists in the auth layer but not in the database — for example a Google sign-in
that was fulfilled before the profile table existed. The insert is not in a
transaction with the application insert, so a failure between them leaves a
profile with no application.

### Duplicate check

An existing row with status `PENDING` **or** `APPROVED` → `400`. A `REJECTED`
row does not block a new application, so a rejected applicant may reapply
without limit.

### Responses

**`201`** — `{ "message": "Application submitted successfully", "application": { ... } }`,
where `application` is the created row with `status: "PENDING"`.

**`400`** — `{ "message": "Application already exists or user is already approved." }`.
Note this is a `400`, not a `409`.

**`401`** — `{ "message": "Unauthorized" }`.

**`500`** — `{ "message": "Failed to submit application", "error": "<raw>" }`.

### What is not in the application

The `astrologer_applications` row carries only `user_id` and `status`. There is
no bio, no credentials, no documents, no rate, and no `expert_code`. So the
approval queue gives an admin nothing to review but a user id — see
[`admin.md`](./admin.md). The `expert_code` that actually unlocks assignment is
minted *after* approval, by the admin approve route.

---

## `GET /api/astrologer/application-status`

| | |
| --- | --- |
| Source | `app/api/astrologer/application-status/route.ts` |
| Operation ID | `getAstrologerApplicationStatus` |

### Responses

**`200`** — `{ "application": { ... } }` for the caller's most recent
application, **or** `{ "application": null }` if they have never applied. As with
`GET /api/subscription`, "none" is a `200` with `null` rather than a `404`, which
is the right shape for a status poll.

`findFirst` with `orderBy: { created_at: "desc" }` returns the newest row, so
after a rejection and a re-application only the latest is visible. There is no
way to see the full history.

**`401`** — `{ "message": "Unauthorized" }`.

**`500`** — `{ "message": "Failed to check status", "error": "<raw>" }`.

### The role is not reflected here

This route reports the application row's status, not the effective role. A user
whose role was set to `astrologer` by a subscription purchase still has a
`PENDING` or absent application, and a client that gates UI on this response
will show the wrong thing. Read `POST /api/users/role` for the role itself.

---

## `GET /api/astrologer/projects`

| | |
| --- | --- |
| Source | `app/api/astrologer/projects/route.ts` |
| Operation ID | `listAstrologerProjects` |

The astrologer's assigned work queue. **This route gets the scoping right**, in
contrast to most of the API.

### Access

`profile.role !== "astrologer"` → `403`. `admin` is **not** exempt, so an admin
without the astrologer role cannot read this queue.

### The query

```ts
where: {
  assigned_astrologer_id: user.id,
  deleted_at: null,
}
```

Scoped to the caller and to non-deleted projects, ordered by `created_at`
descending. Each row includes the owner's `email` and the `storage_path` of the
active map plot.

### Responses

**`200`** — `{ "projects": [ ... ], "astrologer": { role, expert_code, email } }`.

**`403`** — `{ "message": "Forbidden: Astrologer role required" }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`500`** — `{ "message": "Failed to fetch projects", "error": "<raw>" }`.

### Three things to be aware of

**`expert_code` is generated at approval.** The response includes the
astrologer's `expert_code`, and it is written by exactly one route:
`POST /api/admin/applications/approve`, which mints a unique `ASTRO-XXXXXX`
value into `profiles.expert_code`. Nothing else sets it, so an astrologer
approved out of band will have `null` here and cannot be assigned work.

**The owner email is disclosed to the astrologer.** That is presumably the point
of the queue, but it means any customer who bought a subscription and therefore
holds the `astrologer` role can enumerate the email addresses of the astrologers
assigned to them — and, if an admin assigns projects to a test account, of the
clients behind them.

### How a project actually gets assigned

There is no `assignAstrologer` admin action, and no dedicated assignment
endpoint. Assignment happens in two places, both outside `/api/astrologer`:

| Route | Mechanism |
| --- | --- |
| `POST /api/projects` | Body accepts `astrologer_code` **or** `expert_code`. The first non-empty one is looked up in `profiles.expert_code` and the match stored as `assigned_astrologer_id`. An unknown code is **silently ignored** — the project is still created, unassigned, with a `201`. |
| `PATCH /api/projects/{projectId}` | Body accepts a raw `assigned_astrologer_id` with no code lookup — and no ownership check. |

The second row matters: because `PATCH` on a project has no owner check, any
authenticated caller can point any project at any astrologer id, including their
own. See [`projects.md`](./projects.md) and
[`../known-gaps.md`](../known-gaps.md).

Nothing in this route verifies that an assigned project is paid, active, or
still entitled, so the queue can contain a deleted, refunded, or churning
client's project.
