# CORS

All CORS behaviour lives in one place: `middleware.ts:11-53`. There is no
per-route CORS configuration, and no route sets its own headers.

## Where it applies

```ts
if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
```

So CORS headers are added to every route under `/api/**`, **except**
`/api/auth/**`. There is no other path in the app that gets CORS headers:
pages, Server Actions, and static assets are all untouched. In particular
there is no top-level `/health` route — the health probe is
`/api/health` — so it does get headers like everything else.

NextAuth's own paths are excluded because NextAuth installs its headers.

## The allowlist

`middleware.ts:15-20`

| Origin | Purpose |
| --- | --- |
| `https://manglamvastu.in` | Production |
| `http://localhost:3000` | Next.js dev server |
| `http://localhost:8080` | Secondary local app |
| `http://127.0.0.1:3000` | Next.js dev server, IPv4 form |

Matching is an exact `Array.includes` comparison — no wildcards, no suffix
matching, no `https://*.manglamvastu.in`.

Note that `http://localhost:3001`, `http://192.168.x.x:3000` (a phone on the
same Wi-Fi), and any preview-deployment hostname are **not** allowed. Local
device testing over the LAN will fail CORS.

## Headers sent

| Response header | Value |
| --- | --- |
| `Access-Control-Allow-Origin` | the request `Origin` if allowed, else `https://manglamvastu.in` |
| `Access-Control-Allow-Methods` | `GET, POST, PATCH, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |
| `Access-Control-Allow-Credentials` | `true` |

## Preflight

`middleware.ts:39-44` answers every `OPTIONS` request under `/api` (except
`/api/auth`) with a bare `200` and the header set above. The actual route
handler is never invoked, so a preflight succeeds even for a path that does not
exist.

## Three consequences worth knowing

### 1. `PUT` is missing from the allowed methods

`Access-Control-Allow-Methods` lists `GET, POST, PATCH, DELETE, OPTIONS` but
not `PUT`. The one affected route is:

```
PUT /api/projects/{projectId}/objects/{objectId}
```

A browser preflight for that request will be refused the method, so the
request never leaves the browser. Native clients are unaffected — CORS is not
enforced outside browsers — which is why this can sit unnoticed while the
object editor works fine in the mobile app.

The other object-mutation routes use `POST` or `PATCH` and are fine.

### 2. The disallowed-origin fallback is not a reflection bug, but it is confusing

When `Origin` is not in the allowlist the code sends
`Access-Control-Allow-Origin: https://manglamvastu.in` rather than omitting the
header. Combined with the unconditional
`Access-Control-Allow-Credentials: true`, a browser sees an origin that does
not match the requesting page and blocks the response. So this is not
exploitable, but the failure mode is opaque: the network tab shows a `200` with
headers, and the error surfaces in the console as a CORS violation rather than
a clear "origin not allowed".

### 3. `Access-Control-Allow-Headers` is minimal

Only `Content-Type` and `Authorization` are permitted. That is sufficient for
the current API — mobile clients send `Authorization`, browsers send
credentials — but any future custom header will fail preflight until it is
added here.

## Middleware matcher caveat

`middleware.ts:116` runs the middleware on every path except Next.js static
assets, `favicon.ico`, and a few media extensions. For `/api/**` paths the
CORS branch returns early, so the token checks further down the file
(`middleware.ts:63-98`) never execute for API routes. That is intentional —
route handlers do their own authentication — but it means the middleware's
`/projects` and `/admin` page guards protect **pages only**, never the API.
Route-level authorisation is the only thing standing behind the API, and
several routes have none. See [`known-gaps.md`](./known-gaps.md).
