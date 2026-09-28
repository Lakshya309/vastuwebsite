# Users

| | |
| --- | --- |
| Auth | session **or** Bearer |
| Tag | Users |
| Operations | 1 |

The only user route. Despite the `POST` and the path, it **reads** the
caller's role rather than changing it.

---

## `POST /api/users/role`

| | |
| --- | --- |
| Source | `app/api/users/role/route.ts` |
| Operation ID | `getUserRole` |
| Auth | `session-or-bearer` |
| Owner check | `self` |

### Why a POST

The route performs no mutation. It is a `POST` only because it was written that
way; there is no request body. Nothing prevents a future `GET` on the same path,
but today `POST` is the only method exported, so a `GET` returns `405`.

### Request body

None. The body is not read.

### Responses

**`200`** — the caller's role:

```json
{ "role": "user" }
```

Schema: an object with a single `role` property. The value is whatever string
is in `profiles.role`; it is not validated or normalised on read. Recognised
values are `user`, `astrologer`, `dev`, and `admin` — see the `UserRole` schema.

**`401`** — `{ "message": "Unauthorized" }`, or the message from
`validateAuth()`. Schema: `ErrorMessage`.

**`404`** — `{ "message": "Profile not found" }`. The token verified but no
`profiles` row exists for that id, which means the account was deleted while
the token was still live. Schema: `ErrorMessage`.

**`500`** — `{ "message": "Internal Server Error", "error": "<raw error>" }`.
Schema: `ErrorMessageAndError`.

### Notes

- The `user` returned here comes from the **token or session**, not from a body
  parameter, so this route cannot be used to read another user's role. The
  `x-owner-check` value is `self` because the scope is inherent rather than
  checked.
- The `500` includes the raw Prisma error message in `error`. Do not surface it
  to end users.
- Setting a role happens elsewhere, and two of the three paths are not
  admin-gated. See [`../authentication.md`](../authentication.md) and
  [`admin.md`](./admin.md).

## No other user routes exist

There is no route to read or write another user's profile, list users, or change
a password. The closest things are:

| Route | What it actually does |
| --- | --- |
| `GET /api/auth/user` | The caller's own profile, **cookie-only** |
| `POST /api/users/role` | The caller's own role, this page |
| `POST /api/admin` (`updateRole` action) | Changes any user's role — admin only, and unvalidated |
| `POST /api/auth/signup`, `POST /api/mobile/auth/*` | Create the caller's own account |

Password change and email change are not exposed over the API at all.
