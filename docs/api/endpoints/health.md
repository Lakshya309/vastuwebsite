# Health

| | |
| --- | --- |
| Source | `app/api/health/route.ts` |
| Auth | none |
| Operation ID | `getHealth` |
| Tag | System |

## `GET /api/health`

Proxies the Python engine's health endpoint and returns its body.

There is no authentication and no caching. It is a liveness probe.

### Responses

**`200`** — the engine is reachable and reports itself healthy. The Python
body is forwarded **verbatim**, so the shape is whatever the engine returns:

```json
{ "status": "ok", "engine": "vastu-spatial-v5.2" }
```

Schema: `EngineHealth`.

**`503`** — the engine is unreachable, unhealthy, or the fetch itself threw.
Two distinct bodies, selected by `oneOf`:

| Situation | Body |
| --- | --- |
| Fetch succeeded but the engine returned non-2xx | `{ "status": "error", "message": "Health check failed: Python service is unreachable or unhealthy.", "serviceStatus": <upstream status> }` — schema `HealthUnreachable` |
| Fetch threw | `{ "status": "error", "message": "Health check failed: Could not connect to the Python service." }` — schema `HealthEngineDown` |

### Notes

- This is **liveness only**. It does not check the database, R2, or the Razorpay
  configuration, so a `200` does not mean the API is functional.
- The engine URL is `process.env.MICROSERVICE_URL`, defaulting to the hardcoded
  cleartext address `http://72.61.224.232:8001`.
- The route is under `/api`, so it receives the standard CORS headers. See
  [`../cors.md`](../cors.md).
- There is no timeout on the upstream `fetch`. If the engine accepts the
  connection and then stalls, this request hangs for as long as the platform
  default allows.
