# Authentication — mobile

Bearer-token sign-in for native clients. All three routes issue a JWT that the
rest of the API accepts as `Authorization: Bearer <jwt>`.

| | |
| --- | --- |
| Auth | none (these are the sign-in routes) |
| Tag | Authentication |

For the shared auth helper, token properties, and the browser equivalent, see
[`../authentication.md`](../authentication.md).

**Prefer these over the NextAuth form flow for non-browser clients.** A native
app cannot rely on storing a `Set-Cookie`, and these routes return the same
identity in a token instead.

## Shared success shape

`POST /api/mobile/auth/signup` and `POST /api/mobile/auth/google` return `201`;
`POST /api/mobile/auth/login` returns `200`. All three return the same body —
schema `MobileAuthResponse`:

| Field | Type | Notes |
| --- | --- | --- |
| `message` | string | e.g. `"Registration successful"`, `"Login successful"`, `"Google Login successful"` |
| `token` | string | The JWT. Send as `Authorization: Bearer <token>`. |
| `user` | object | `id`, `email`, `role` |

All three failure responses use the **`error`** key, not `message`:

| Status | Body | Schema |
| --- | --- | --- |
| `400` | `{ "error": "..." }` | `ErrorMessageField` |
| `401` | `{ "error": "..." }` | `ErrorMessageField` |
| `500` | `{ "error": "Internal server error" }` | `ErrorMessageField` |

---

## `POST /api/mobile/auth/signup`

| | |
| --- | --- |
| Source | `app/api/mobile/auth/signup/route.ts` |
| Operation ID | `mobileSignup` |

### Request body

`application/json`:

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Validated for format here, unlike `POST /api/auth/signup` |
| `password` | string | Minimum 6 characters |

### Responses

**`201`** — `MobileAuthResponse`.

**`400`**:

| `error` | Cause |
| --- | --- |
| `Valid email and a 6+ char password are required` | Missing or malformed |
| `User already exists` | Email taken |

**`500`** — `{ "error": "Internal server error" }`.

### Notes

- Creates the `profiles` row with `role: "user"` and a `user_credits` row at
  `0`, then signs the new user in immediately.
- Unlike the web signup route, this one **does** return a usable token, so the
  client does not need a second round trip.
- There is no rate limit, so this is usable for mass account creation.

---

## `POST /api/mobile/auth/login`

| | |
| --- | --- |
| Source | `app/api/mobile/auth/login/route.ts` |
| Operation ID | `mobileLogin` |

Exchanges email and password for a JWT. This is the route a native client
should call on every fresh launch, since there is no refresh token.

### Request body

`application/json`: `email`, `password`. Both required.

### Responses

**`200`** — `MobileAuthResponse`.

**`400`** — `{ "error": "Email and password are required" }`.

**`401`**:

| `error` | Cause |
| --- | --- |
| `Invalid email or password` | No such user, or the hash did not match |
| `This email was registered with Google. Please use Google Sign-In.` | The row has no password hash |

**`500`** — `{ "error": "Internal server error" }`.

### Notes

- The email is matched case-insensitively via lowercasing, consistent with
  `POST /api/auth/signup` and the NextAuth `authorize` callback.
- The Google-account `401` is a useful message and also an enumeration oracle.
- Unthrottled. See [`../known-gaps.md`](../known-gaps.md).

---

## `POST /api/mobile/auth/google`

| | |
| --- | --- |
| Source | `app/api/mobile/auth/google/route.ts` |
| Operation ID | `mobileGoogleLogin` |

Exchanges a Google ID token for a Manglam JWT, creating the profile on first
sign-in.

### Request body

`application/json`:

| Field | Type | Notes |
| --- | --- | --- |
| `idToken` | string | The Google ID token from the native SDK. **Required.** |

### Responses

**`200`** — `MobileAuthResponse`.

**`400`**:

| `error` | Cause |
| --- | --- |
| `Missing idToken` | The field was absent or empty |
| `Email not provided by Google` | The verified token carried no email |

**`401`** — `{ "error": "Invalid Google token" }`, when Google's tokeninfo
endpoint rejects the token or the call to it fails.

**`500`** — `{ "error": "Internal server error" }`.

### Notes

- Verification goes through Google's `tokeninfo` endpoint rather than
  verifying the JWT signature locally, so every call is a network round trip
  to Google.
- Because the email comes from the verified token, this route cannot be used to
  take over an existing password account — but see the note below.
- On a successful sign-in for an email that already has a password account,
  the account is **linked** rather than rejected. That is the intended
  behaviour here, and it is why the mobile `login` route refuses Google
  accounts with a specific message.
- Unthrottled, and it calls out to Google on every request.

## Token properties

Issued by `lib/mobile-auth.ts`:

| Property | Value |
| --- | --- |
| Signing secret | `NEXTAUTH_SECRET` — the same secret as the session cookie |
| Expiry | 30 days |
| Refresh | **None** |
| Revocation | **None** |
| Accepted as | `Authorization: Bearer <jwt>` |

There is no logout endpoint. A signed-out client must simply discard the token
locally; the token remains valid on the server until it expires. Rotating
`NEXTAUTH_SECRET` is the only way to invalidate one, and that also signs out
every browser session.

## Where these tokens work

Everything that calls `validateAuth()` — which is most of the API — accepts
these tokens. The single exception is `GET /api/auth/user`, which is
cookie-only. See [`../authentication.md`](../authentication.md).
