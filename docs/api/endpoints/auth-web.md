# Authentication — web

Browser sign-in. Three routes, all built on NextAuth v4 except the standalone
signup.

| | |
| --- | --- |
| Auth | none (these are the sign-in routes) |
| Tag | Authentication |

For the shared auth helper and the Bearer-token alternative, see
[`../authentication.md`](../authentication.md).

---

## `GET,POST /api/auth/{...nextauth}`

| | |
| --- | --- |
| Source | `app/api/auth/[...nextauth]/route.ts` |
| Operation IDs | `nextAuthGet`, `nextAuthPost` |

The file is two lines:

```ts
export { handler as GET, handler as POST }
```

so both operations are whatever `NextAuth(authOptions)` installs. The concrete
sub-paths worth calling:

| Sub-path | Method | Purpose |
| --- | --- | --- |
| `/api/auth/providers` | GET | Provider ids and callback URLs — schema `NextAuthProviders` |
| `/api/auth/session` | GET | Current session — schema `NextAuthSession` |
| `/api/auth/csrf` | GET | CSRF token for client-side POSTs — schema `NextAuthCsrf` |
| `/api/auth/error` | GET | Last sign-in error |
| `/api/auth/callback/credentials` | POST | Password sign-in |
| `/api/auth/callback/google` | POST | Completes the OAuth handshake |
| `/api/auth/signin` | POST | Redirects to provider selection |
| `/api/auth/signout` | POST | Clears the session cookie |

### `GET` responses

**`200`** — shape depends on the sub-path. `oneOf`
`NextAuthSession | NextAuthProviders | NextAuthCsrf | object`. A signed-out
`/api/auth/session` returns `200` with `user: null`, **not** a `401`.

**`302`** — redirect to a NextAuth action page or to the OAuth provider.

### `POST` request body

`application/x-www-form-urlencoded`, as NextAuth v4 expects. All fields
optional at the schema level; which are required depends on the sub-path.

| Field | Type | Notes |
| --- | --- | --- |
| `csrfToken` | string | From `/api/auth/csrf`. **Required for every mutating action.** |
| `email` | string (email) | Credentials sign-in |
| `password` | string | Credentials sign-in |
| `callbackUrl` | string (uri) | Where to land afterwards. Defaults to the configured `/login` page. |
| `json` | string | Set to `true` to get the session as JSON instead of a redirect |
| `redirect` | string | NextAuth internal |

`application/json` is also accepted with the same four logical fields, but
NextAuth's form parser expects the encoded form; prefer it.

### `POST` responses

**`200`** — session established, or the sign-out acknowledgement, as JSON.
`oneOf` `NextAuthSession | object`.

**`302`** — redirect to `callbackUrl`, to `/login`, or to the Google consent
screen. On success the `Set-Cookie` header carries the session token.

**`401`** — CSRF token missing or invalid, or the credentials were rejected.

```json
{ "error": "MissingCSRF" }
```

Other values include `CredentialsSignin`. Schema: `ErrorMessageField`.

### How sign-in actually works

The credentials `authorize` callback in `lib/auth-options.ts`:

1. Looks the profile up by **lowercased** email.
2. Compares the supplied password against the row's hash.
3. If the row exists but has **no** `password` hash — a Google-only account —
   fails with an explicit "sign in with Google" message rather than a generic
   invalid-credentials error.
4. On a database query failure, throws the **raw** error message, which
   NextAuth surfaces on `/api/auth/error`. That is an information leak; see
   [`../known-gaps.md`](../known-gaps.md).

Google sign-in starts at `POST /api/auth/signin/google` and returns to
`/api/auth/callback/google`.

### Notes

- Session strategy is `jwt`. Cookie: `next-auth.session-token`, HTTP-only,
  `SameSite=Lax`.
- These paths are **excluded from the custom CORS block** in `middleware.ts:11`
  because NextAuth installs its own headers. A cross-origin browser client
  cannot use the cookie flow.
- The resulting session cookie is accepted by `validateAuth()` on the rest of
  the API. See [`../authentication.md`](../authentication.md).

---

## `POST /api/auth/signup`

| | |
| --- | --- |
| Source | `app/api/auth/signup/route.ts` |
| Operation ID | `webSignup` |
| Auth | none |

Email and password registration for browser clients.

### Request body

`application/json`. Two fields, both required:

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Stored lowercased. **Not format-validated** by the server — only checked for presence. |
| `password` | string | Minimum 6 characters. Hashed server-side with the project's `hashPassword` helper. |

### Responses

| Status | Body | Schema |
| --- | --- | --- |
| `201` | `{ "message": "Registration successful", "userId": "<uuid>" }` | `message` + `userId` |
| `400` | `{ "error": "..." }` — see below | `ErrorMessageField` |
| `500` | `{ "error": "Internal server error" }` | `ServerErrorMessage` |

The `400` cases:

| Message | Cause |
| --- | --- |
| `Email and password are required` | A field was missing |
| `Password must be at least 6 characters long` | Too short |
| `User already exists with this email address` | Email taken |
| `This email is already linked to a Google account. Please sign in with Google.` | Email taken, and the existing row has no password hash |

Note this route uses the **`error`** key, unlike most of the API which uses
`message`.

### What it creates

1. A `profiles` row with `id: randomUUID()`, lowercased email, hashed password,
   and `role: "user"`.
2. A matching `user_credits` row at `0`, via `upsert`.

### Notes

- This route does **not** create a NextAuth session. After a `201` the client
  must still sign in through `/api/auth/callback/credentials`. The `201` body
  deliberately returns only a `userId`, not the profile.
- The Google-account case is a helpful distinction, but it is also an account
  oracle: an attacker can enumerate which emails exist and which provider they
  registered with.
- The mobile equivalents are under `/api/mobile/auth` and return a Bearer JWT
  directly, so they do not need the second step. See
  [`auth-mobile.md`](./auth-mobile.md).

---

## `GET /api/auth/user`

| | |
| --- | --- |
| Source | `app/api/auth/user/route.ts` |
| Operation ID | `webGetCurrentUser` |
| Auth | **session only** |
| Owner check | self |

Returns the caller's own profile.

### Why this one is different

Every other protected route calls `validateAuth()`, which accepts either a
Bearer token or a session cookie. This route calls `getServerSession` directly,
so it is **cookie-only**. A mobile client holding a valid Bearer token gets
`401` here. Use `/api/mobile/auth/login` to re-mint a token, or decode the
existing one.

### Responses

| Status | Body | Schema |
| --- | --- | --- |
| `200` | The caller's profile | profile object |
| `401` | `{ "message": "Unauthorized" }` | `ErrorMessage` |
| `500` | `{ "error": "..." }` | `ErrorMessageField` |

### Notes

- The response is scoped to the caller, so there is no id parameter and no
  possibility of reading another profile through this route.
- The profile object here is the widest representation of a user in the API —
  it includes role, credit balance, and premium status. Do not log it
  unredacted.
