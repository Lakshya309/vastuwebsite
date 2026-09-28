# API Reference

Reference documentation for the Manglam Vastu HTTP API.

**Scope:** 35 Next.js route files in `app/api/**/route.ts`, exposing 43 HTTP
operations, plus the internal Python *Vastu Spatial Engine* microservice that
`/api/analysis/objects` proxies to.

This documentation describes the API **as it is currently implemented**. It was
produced by reading the route handlers directly. It is a record of current
behaviour, not a target design. Where the implementation has a security or
correctness problem, the operation says so rather than describing it as if it
were safe.

## Files

| File | Contents |
| --- | --- |
| [`openapi.yaml`](./openapi.yaml) | OpenAPI 3.1 specification, 35 paths / 43 operations / 46 schemas |
| [`authentication.md`](./authentication.md) | NextAuth sessions, mobile Bearer JWTs, roles, credits |
| [`cors.md`](./cors.md) | Origin allowlist, preflight handling, the missing `PUT` |
| [`errors.md`](./errors.md) | The five different error envelope shapes and how to read them |
| [`known-gaps.md`](./known-gaps.md) | Every documented defect, ordered by severity |
| [`microservice.md`](./microservice.md) | Internal Python engine: endpoints, coordinates, CORS posture |

## Endpoint pages

| Page | Routes |
| --- | --- |
| [`endpoints/health.md`](./endpoints/health.md) | `GET /api/health` |
| [`endpoints/auth-web.md`](./endpoints/auth-web.md) | `GET,POST /api/auth/{...nextauth}`, `POST /api/auth/signup`, `GET /api/auth/user` |
| [`endpoints/auth-mobile.md`](./endpoints/auth-mobile.md) | `POST /api/mobile/auth/signup`, `/login`, `/google` |
| [`endpoints/users.md`](./endpoints/users.md) | `POST /api/users/role` |
| [`endpoints/projects.md`](./endpoints/projects.md) | `GET,POST /api/projects`, `GET,PATCH,DELETE /api/projects/{projectId}` |
| [`endpoints/project-objects.md`](./endpoints/project-objects.md) | Placed-object CRUD and batch delete under `/api/projects/{projectId}/objects` |
| [`endpoints/uploads.md`](./endpoints/uploads.md) | `POST /api/upload`, `POST /api/projects/{projectId}/video`, `GET /api/public-assets/{...key}` |
| [`endpoints/analysis.md`](./endpoints/analysis.md) | `POST /api/analysis`, `POST /api/analysis/objects`, `GET /api/analysis/devta`, report reads, approve, credit deduction |
| [`endpoints/payments.md`](./endpoints/payments.md) | `GET,POST /api/payments`, `POST /api/payments/verify`, `POST /api/payments/webhook` |
| [`endpoints/subscription.md`](./endpoints/subscription.md) | `GET /api/subscription`, `POST /api/subscription/cancel` |
| [`endpoints/astrologer.md`](./endpoints/astrologer.md) | `POST /api/astrologer/apply`, `GET /api/astrologer/application-status`, `GET /api/astrologer/projects` |
| [`endpoints/admin.md`](./endpoints/admin.md) | `GET,POST /api/admin`, `GET /api/admin/applications`, `POST /api/admin/applications/approve` |

## Servers

| Server | URL |
| --- | --- |
| Production | `https://manglamvastu.in` |
| Local development | `http://localhost:3000` |

## Reading the OpenAPI document

Three vendor extensions carry most of the signal:

- **`x-auth`** — how the caller is authenticated. One of `none`,
  `session-or-bearer` (NextAuth cookie **or** mobile JWT), `bearer`, `session`,
  or `webhook-signature`.
- **`x-owner-check`** — whether the handler actually verifies that the caller
  owns the resource it is touching. `none` means any authenticated user can act
  on any project id.
- **`x-known-issues`** — concrete defects on that operation, in prose.

The document-level default is `security: []`, so every operation states its own
auth explicitly. Do not infer "this endpoint is public" from the absence of a
`security` block on a shared schema.

## The single most important thing to know

Almost every protected route calls `validateAuth()` (`lib/auth.ts:176`). That
helper checks the `Authorization: Bearer <jwt>` header **first**; if the header
is missing or the JWT fails to verify, it silently falls back to the NextAuth
session cookie. A browser with a `next-auth.session-token` cookie and a mobile
app holding a Bearer token can therefore call the same endpoint, and no
endpoint needs to know which.

The one exception is `GET /api/auth/user`, which calls `getServerSession`
directly and so requires the cookie.

See [`authentication.md`](./authentication.md) for the full picture.

## Quick reference: every operation

| Method | Path | Auth | Owner check | Issues | `operationId` |
| --- | --- | --- | --- | --- | --- |
| GET | /api/health | **none** | not-applicable |  | getHealth |
| GET | /api/auth/{...nextauth} | **none** | not-applicable |  | nextAuthGet |
| POST | /api/auth/{...nextauth} | **none** | not-applicable |  | nextAuthPost |
| POST | /api/auth/signup | **none** | not-applicable |  | webSignup |
| GET | /api/auth/user | session | self |  | webGetCurrentUser |
| POST | /api/mobile/auth/signup | **none** | not-applicable |  | mobileSignup |
| POST | /api/mobile/auth/login | **none** | not-applicable |  | mobileLogin |
| POST | /api/mobile/auth/google | **none** | not-applicable |  | mobileGoogleLogin |
| POST | /api/users/role | session-or-bearer | self |  | getUserRole |
| GET | /api/projects | session-or-bearer | self |  | listProjects |
| POST | /api/projects | session-or-bearer | self |  | createProject |
| GET | /api/projects/{projectId} | session-or-bearer | owner |  | getProject |
| PATCH | /api/projects/{projectId} | session-or-bearer | **none** | 1 | updateProject |
| DELETE | /api/projects/{projectId} | session-or-bearer | owner |  | deleteProject |
| GET | /api/projects/{projectId}/objects | session-or-bearer | **none** | 1 | listProjectObjects |
| POST | /api/projects/{projectId}/objects | session-or-bearer | **none** | 3 | replaceProjectObjects |
| PUT | /api/projects/{projectId}/objects/{objectId} | session-or-bearer | owner | 1 | updateProjectObject |
| DELETE | /api/projects/{projectId}/objects/{objectId} | session-or-bearer | owner |  | deleteProjectObject |
| POST | /api/projects/{projectId}/objects/batch | session-or-bearer | project-only | 1 | batchProjectObjects |
| POST | /api/projects/{projectId}/video | session-or-bearer | **none** | 2 | uploadProjectVideo |
| GET | /api/public-assets/{...key} | **none** | **none** | 3 | getPublicAsset |
| POST | /api/upload | session-or-bearer | **none** | 2 | uploadFloorPlan |
| POST | /api/analysis | session-or-bearer | owner-for-users-only | 1 | createAnalysis |
| POST | /api/analysis/objects | **none** | not-applicable | 1 | analyzeObjectsUnauthenticated |
| GET | /api/analysis/devta | session-or-bearer | **none** | 2 | getDevtaAnalysis |
| GET | /api/analysis/full-report | session-or-bearer | owner-or-admin |  | getFullReport |
| GET | /api/analysis/marma | session-or-bearer | owner-or-admin |  | getMarmaAnalysis |
| GET | /api/analysis/{analysisId}/status | session-or-bearer | **none** | 1 | getAnalysisStatus |
| PUT | /api/analysis/{analysisId}/approve | session-or-bearer | **none** | 2 | approveAnalysis |
| POST | /api/analysis/{analysisId}/deduct-credit-for-report | session-or-bearer | **none** | 2 | unlockReport |
| GET | /api/payments | **none** | not-applicable |  | listPlans |
| POST | /api/payments | session-or-bearer | self | 1 | createRazorpayOrder |
| POST | /api/payments/verify | session-or-bearer | self | 1 | verifyPayment |
| POST | /api/payments/webhook | webhook-signature | not-applicable | 2 | razorpayWebhook |
| GET | /api/subscription | session-or-bearer | self |  | getSubscription |
| POST | /api/subscription/cancel | session-or-bearer | self | 3 | cancelSubscription |
| POST | /api/astrologer/apply | session-or-bearer | self |  | applyAsAstrologer |
| GET | /api/astrologer/application-status | session-or-bearer | self |  | getAstrologerApplicationStatus |
| GET | /api/astrologer/projects | session-or-bearer | astrologer-role |  | listAstrologerProjects |
| GET | /api/admin | session-or-bearer | admin-role |  | adminDashboard |
| POST | /api/admin | session-or-bearer | admin-role | 4 | adminAction |
| GET | /api/admin/applications | session-or-bearer | admin-role |  | listPendingApplications |
| POST | /api/admin/applications/approve | session-or-bearer | admin-only | 3 | approveAstrologerApplication |

The "Issues" column counts entries in that operation's `x-known-issues` array.
20 of 43 operations carry at least one. See [`known-gaps.md`](./known-gaps.md).

## Not documented here

- Pages and Server Actions under `app/**` that are not `app/api/**/route.ts`.
- The two routes the frontend calls but which do not exist:
  `POST /api/astrologer/activate-key` and `POST /api/admin/generate-key`. See
  [`known-gaps.md`](./known-gaps.md).
