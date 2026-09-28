# Vastu Spatial Engine (Python microservice)

The internal FastAPI service that performs all geometry work. It lives in a
separate repository tree at `devta_microservice/` and is **not** part of the
public API surface — the only Next.js routes that call it are
`GET /api/health`, `GET /api/analysis/devta`, and `POST /api/analysis/objects`.

## Service facts

| | |
| --- | --- |
| App | `devta_microservice/main.py` |
| Title / version | `Vastu Spatial Engine` `5.2` |
| Framework | FastAPI (pydantic v2, shapely 2.x) |
| Default bind | `0.0.0.0:8000` (`main.py:950`) |
| Documented dev port | `8001` (`README.md`) |
| Default URL used by Next.js | `http://72.61.224.232:8001` (`app/api/health/route.ts:4`) |
| Auth | **None** |
| CORS | `allow_origins=["*"]`, all methods, all headers |
| Database | **None** — fully stateless |

Dependencies (`requirements.txt`): `fastapi>=0.115`, `uvicorn[standard]>=0.30`,
`pydantic>=2.9`, `shapely>=2.0.6`, `python-multipart>=0.0.10`.

The service README says to run it with `uvicorn main:app --reload --port 8001`
and then claims the server is at `http://127.0.0.1:8000`. It is not; the port
flag wins. The Next.js default of `72.61.224.232:8001` matches the README's
`8001`, not `main.py`'s `8000`.

## Endpoints

Three routes, all on the app root with no `/api` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness. Returns `{"status": "ok", "engine": "vastu-spatial-v5.2"}` |
| POST | `/analyze` | Mandala generation. Request → `AnalysisResponse` |
| POST | `/analyze_objects` | Full scoring. Request → `VastuAnalysisResult` |

FastAPI's generated interactive docs are also exposed at `/docs` and
`/openapi.json`.

### `GET /health`

```json
{ "status": "ok", "engine": "vastu-spatial-v5.2" }
```

This is what `GET /api/health` proxies and forwards verbatim. It is a
liveness probe only — it touches no database, no R2, and no rule table, so a
`200` from the Next.js health route does not mean the rest of the API works.

### `POST /analyze`

Generates the 45-devta mandala and the 8- and 16-direction zones. Does not
score anything.

Request (`AnalysisRequest`):

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `boundary_normalized` | `[{x, y}]` | required | Plot outline, normalized `[0,1]`, canvas orientation |
| `north_direction` | float | `0.0` | Clockwise canvas angle to True North |
| `grid_type` | `"81"` \| `"64"` | `"81"` | Paramasayika or Manduka grid |
| `aspect_ratio` | float | `1.3333` | Plot width / height |

Response (`AnalysisResponse`): `devtas45`, `zones16`, `zones8`,
`plot_centroid`.

### `POST /analyze_objects`

Everything `/analyze` does, plus per-object scoring and area breakdowns.

Request (`ObjectAnalysisRequest`) adds:

| Field | Type | Notes |
| --- | --- | --- |
| `placed_objects` | `[{id, object_type, boundary_normalized, centroid, rotation?}]` | The objects to score |

Response (`VastuAnalysisResult`): `analyzed_objects`, `total_score`,
`overall_percentage`, `overall_verdict`, `devta_areas_45`, `devta_areas_32`,
`zone_areas_16`, `zone_boundary_16`, `zones16`, `zones8`, `devtas45`.

Each entry in `analyzed_objects` reports `object_id`, `object_type`,
`devta_region`, `zone16_direction`, `score_impact`, `grade`, `verdict`
(`EXCELLENT` | `GOOD` | `BAD` | `CRITICAL`), and a human-readable `message`.

## Coordinate convention

This is the single most important thing to get right when calling the engine,
and it is easy to get wrong.

- The **canvas is Y-down**: `y` increases as you move *down* the screen.
- Shapely is **Y-up**: standard math convention.
- `to_polygon()` negates `y` and scales to a 1000×1000 working space;
  `to_points()` negates it back. Callers never see the 1000 scale — send and
  receive normalized `[0,1]` values.
- `north_direction` is a **clockwise canvas angle**. Internally the pipeline
  negates it (`effective_north = -north_direction`) and then *adds* it to every
  base Vastu angle, which produces the correct clockwise rotation once the
  `(90 - angle)` conversion is applied. Passing the sign the other way mirrors
  every zone.

Boundary and object polygons must be supplied as closed rings in the same
orientation convention the canvas produces. An empty `boundary_normalized`
does not error: it returns `total_score: 0`, `overall_percentage: 100.0`,
`overall_verdict: "GOOD"` and no zones, which reads as a healthy empty result
rather than a failure.

## Mandala generation

`generate_45_devtas()` picks one of two strategies based on
`is_rectangular()`:

- **Grid** (`generate_grid_devtas`) for plots that are approximately
  rectangular and aligned near the cardinal directions. Detected when the
  polygon fills more than 85% of its own bounding box after rotation and
  simplifies to exactly 4 vertices. Uses a 9×9 (`81`) or 8×8 (`64`) lookup grid
  with the four corner 3×3 blocks split on the diagonal.
- **Angular** (`generate_angular_devtas`) for irregular or concave plots.
  Three concentric rings cut by 11.25°/18°/45° wedges, so each devta keeps a
  proportional share of area instead of snapping to a rectangular cell.

Zones come from `generate_zones()`, which runs internal assertions that each
zone's angular width and its two half-widths match the expected step. Those
assertions are Python `assert` statements, so they are removed under
`python -O` and become no-ops.

## Scoring

Score impact, grade, verdict, and remedy text all come from the `VASTU_RULES`
table in `vastu_rules.py`, keyed by `(object_type, direction)`.

- An object's zone is the **largest-area intersection** between its polygon
  and the 16 zone polygons.
- If no zone intersects, the engine falls back to the **centroid angle** from
  the plot's visual centre.
- `overall_percentage` is normalised against the min and max scores present in
  the rule table, then clamped to `[0, 100]`, with thresholds at 90 / 60 / 30
  mapping to `EXCELLENT` / `GOOD` / `BAD` / `CRITICAL`.
- With an empty `placed_objects`, the result is `100.0` / `GOOD`.

## Engine-side issues

These are in the Python service, not the Next.js API.

| Issue | Detail |
| --- | --- |
| No authentication | Any caller that can reach the port gets full engine access. Safety depends entirely on the service being network-private. |
| Wildcard CORS | `allow_origins=["*"]` with all methods and headers. If the service is ever exposed publicly, any web page can drive it from a user's browser. |
| Binds `0.0.0.0` | The default in `main.py` listens on every interface, not just loopback. |
| Hardcoded public fallback | `app/api/health/route.ts:4` falls back to `http://72.61.224.232:8001` — cleartext HTTP to a fixed public address — when `MICROSERVICE_URL` is unset. |
| `plot_centroid` silently dropped | `analyze_objects()` passes `plot_centroid=` to `VastuAnalysisResult` (`main.py:906`), but that model has no such field, so pydantic discards it. The `/analyze_objects` response never contains `plot_centroid`, while `/analyze` does. |
| No input size limit | `boundary_normalized` and `placed_objects` are unbounded lists. Combined with the unthrottled `POST /api/analysis/objects` proxy, a single request can force a large amount of shapely work. |
| Validation asserts are not validation | `generate_zones()` uses `assert` for its angular checks. Under `python -O` they are stripped, and they raise `AssertionError` rather than a `422`, so a caller sees a `500`. |
| Unauthenticated proxy | `POST /api/analysis/objects` in Next.js exposes all of the above to the public internet with no auth and no credit charge. |

## Calling the engine from Next.js

Two routes proxy to it:

| Next.js route | Engine call | Auth | Charges a credit |
| --- | --- | --- | --- |
| `GET /api/health` | `GET {MICROSERVICE_URL}/health` | none | no |
| `GET /api/analysis/devta` | `POST {MICROSERVICE_URL}/analyze` | session or Bearer | no |
| `POST /api/analysis/objects` | `POST {MICROSERVICE_URL}/analyze_objects` | **none** | no |

`GET /api/analysis/devta` reads the boundary and objects from the database,
sends them to the engine, and maps the result back. It is the intended
authenticated path. `POST /api/analysis/objects` is the unauthenticated
shortcut that bypasses the credit model entirely — see
[`known-gaps.md`](./known-gaps.md).
