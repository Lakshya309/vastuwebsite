# Uploads and media

Three routes move binary data to Cloudflare R2, plus one that reads it back.

| | |
| --- | --- |
| Auth | see per route — **one of these three is completely open** |
| Operations | 3 |

| Operation | Method + path | Auth | Owner check |
| --- | --- | --- | --- |
| `uploadFloorPlan` | `POST /api/upload` | session or Bearer + paid | **`none`** — IDOR |
| `uploadProjectVideo` | `POST /api/projects/{projectId}/video` | session or Bearer | **`none`** — IDOR |
| `getPublicAsset` | `GET /api/public-assets/{...key}` | **none** | **none** — by design |

**No route validates the uploaded file's type.** Both upload handlers store
`file.type` verbatim, and `getPublicAsset` replays that stored type as
`Content-Type`. An SVG or HTML file therefore executes script on
`manglamvastu.in`. See [`../known-gaps.md`](../known-gaps.md).

---

## `POST /api/upload`

| | |
| --- | --- |
| Source | `app/api/upload/route.ts` |
| Operation ID | `uploadFloorPlan` |
| Request type | `multipart/form-data` |

Uploads a floor-plan image and points the project at it.

### Request body

`multipart/form-data`:

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | Required. Max **5MB**. |
| `projectId` | string | Required. |

### Access gate

Beyond authentication, this route requires **paid access**, checked as:

```
role ∈ {admin, astrologer}   OR   an active/trialing subscription   OR   credits > 0
```

The `403` message references Basic (₹1,999 + GST) and Advanced (₹12,500 + GST)
plans. In the current source the rupee glyphs are **mojibake** (stored as
replacement characters), so the message renders as `Basic (?,1999+GST)`. That is
a source-encoding bug, not a client bug.

### Re-upload limit

`map_plots` rows for the project are counted; at 2 or more, further uploads are
refused with `403` unless the caller is an admin or astrologer. Because the
count is **not scoped to the user**, the limit also counts rows created by other
callers, and it is bypassable by supplying a different `projectId`.

### The IDOR

`projectId` is used in three writes with no ownership filter:

| Step | Write |
| --- | --- |
| 1 | R2 `PutObject` at `map-plots/${uid}/${projectId}/${Date.now()}_${file.name}` |
| 2 | `map_plots.updateMany({ where: { project_id: projectId } }, is_active: false)` |
| 3 | `map_plots.create({ project_id: projectId, ... })` |
| 4 | `projects.update({ where: { id: projectId } }, active_map_plot_id)` |

Any caller with paid access can attach a map plot to **any** project id and
deactivate the victim's existing map plots.

### Responses

**`200`** — `{ "message": "File uploaded and project updated successfully", "project": { ... } }`.

**`400`**, `message` key:

| Message | Cause |
| --- | --- |
| `No file uploaded` | `file` part missing |
| `File exceeds the 5MB limit. Please upload a smaller floor plan.` | Over the cap |
| `Project ID is required` | `projectId` part missing |

**`401`** — `{ "message": "Unauthorized: No token provided" }`. This is the one
route in the API that puts the reason in `message` rather than returning a bare
`Unauthorized`.

**`403`**, `message` key: the paid-access message, or
`Maximum upload limit reached. You can only re-upload once.`

**`500`**, `message` **and** `error` keys. Four separate failure points, each
returning the raw underlying error:

| `message` | Failure |
| --- | --- |
| `Failed to upload file to storage` | R2 put failed |
| `Failed to deactivate old map plots` | Step 2 |
| `Failed to save new map plot to database` | Step 3 |
| `Failed to update project with new active map plot` | Step 4 |
| `Failed to upload file` | The outer catch |

### Partial-failure states

The four steps are **not** wrapped in a transaction. A failure at step 2 or 3
leaves an orphaned object in R2. A failure at step 4 leaves a `map_plots` row
marked `is_active: true` that no project points at, while the project keeps
serving the old plot. The re-upload limit then counts that orphan against the
caller.

---

## `POST /api/projects/{projectId}/video`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/video/route.ts` |
| Operation ID | `uploadProjectVideo` |
| Request type | `multipart/form-data` |

Uploads a walkthrough video and sets `projects.video_path`.

### Request body

`multipart/form-data`:

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | Required. Max **100MB**. |

`projectId` comes from the path, not the body.

### Compression

| Threshold | Behaviour |
| --- | --- |
| ≤ 10MB | Stored as uploaded |
| > 10MB | `ffprobe` reads the duration, then `ffmpeg` re-encodes to H.264/AAC targeting **9MB**, with video bitrate floored at 200 kbps |

Audio is budgeted at 128 kbps and subtracted from the total. If `ffprobe` or
`ffmpeg` fails, the code **silently falls back to storing the original**, so the
9MB target is not guaranteed and a 100MB file can still land in the bucket. The
`finally` block unlinks both temp files.

### The IDOR

`prisma.projects.update({ where: { id: projectId }, data: { video_path } })` has
no `user_id` filter, so any authenticated caller can replace any project's
video. Unlike `POST /api/upload`, there is **no** paid-access gate and **no**
per-project upload limit.

### Responses

**`200`** — `{ "message": "Video uploaded and project updated successfully", "project": { ... } }`.

**`400`** — `No file uploaded`, or
`File exceeds the 100MB limit. Please upload a smaller video.`

**`401`** — `{ "message": "Unauthorized" }`.

**`500`**, `message` + raw `error`: `Failed to upload video to storage`,
`Failed to update project with new video path`, or `Failed to upload video`.

### `file.name` is used unescaped

The client-supplied filename goes straight into both the R2 key
(`videos/${uid}/${projectId}/${Date.now()}_${file.name}`) and the temp path
(`path.join(os.tmpdir(), 'input_' + Date.now() + '_' + file.name)`). A name
containing `../` is normalised by `path.join`, so the ffmpeg read/write can be
nudged outside the temp directory. Combined with the open asset route below,
this is worth sanitising.

---

## `GET /api/public-assets/{...key}`

| | |
| --- | --- |
| Source | `app/api/public-assets/[...key]/route.ts` |
| Operation ID | `getPublicAsset` |
| Auth | **none** |

A catch-all proxy that streams any object from the R2 bucket.

### Path parameters

`{...key}` is the **entire remaining path**, joined with `/`. There is no prefix
allowlist, so this serves anything in the bucket:

| Prefix it will happily serve | What it is |
| --- | --- |
| `map-plots/...` | Floor plans |
| `videos/...` | Walkthrough videos |
| anything else in the bucket | Whatever else is there |

There is no per-user scoping and no signature check.

### Responses

**`200`** — the raw object stream, with the stored `Content-Type` and
`Content-Length`, plus `Cache-Control: public, max-age=31536000, immutable`.

The immutable one-year cache is the aggravating factor here: once a URL is
fetched, browsers and CDNs are told never to revalidate it, so replacing an
object at the same key does not invalidate anything already cached.

**`400`** — `Key required`, as `text/plain`.

**`404`** — `File not found`, as `text/plain`. This is also the catch-all
handler's response for **any** R2 error, including a permissions or
outage error, so `404` does not mean the key is absent.

### Why this is the critical finding

Nothing in the codebase generates signed URLs for R2. This route exists instead
of presigning, and it is open. Consequences:

- Floor plans and videos of **every tenant** are reachable by key, with no
  authentication. A key is
  `map-plots/${uid}/${projectId}/${Date.now()}_${file.name}` — the original
  filename is attacker-influenced at upload time and the timestamp is narrow,
  so keys are enumerable once a project id and a filename are known or guessed.
- This is what makes the two IDORs above meaningfully worse: a caller who
  attaches a plot to someone else's project also learns the resulting key
  pattern, and the resulting object is publicly fetchable.
- `Content-Type` is replayed from upload, so an uploaded `.svg` or `.html` is
  served as `text/html` from the app's own origin — stored XSS.

### Practical mitigations, in order

1. Serve assets from a separate origin (e.g. `assets.manglamvastu.in`) with a
   `Content-Disposition: attachment` or a strict `Content-Security-Policy`, so
   same-origin script execution is impossible.
2. Restrict this route to an allowlist of prefixes, and require a signature
   (Cloudflare R2 presigned URL, or an HMAC over `key` + expiry) validated
   server-side.
3. Validate uploads against an allowlist of image types by **content sniffing**,
   not by the client's `file.type`, and store a normalised `Content-Type`.
4. Add `X-Content-Type-Options: nosniff` at minimum.

None of these are implemented today. See [`../known-gaps.md`](../known-gaps.md).
