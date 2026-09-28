# Projects

Project CRUD. Five operations across two route files.

| | |
| --- | --- |
| Auth | session **or** Bearer on all five |
| Tag | Projects |

Ownership enforcement is **inconsistent** here: `GET` and `DELETE` check it,
`PATCH` does not. That is the most important thing on this page.

| Operation | Method + path | Owner check |
| --- | --- | --- |
| `listProjects` | `GET /api/projects` | self (scoped by query) |
| `createProject` | `POST /api/projects` | n/a |
| `getProject` | `GET /api/projects/{projectId}` | **`owner`** |
| `updateProject` | `PATCH /api/projects/{projectId}` | **`none`** — IDOR |
| `deleteProject` | `DELETE /api/projects/{projectId}` | **`owner`** |

---

## `GET /api/projects`

| | |
| --- | --- |
| Source | `app/api/projects/route.ts` |
| Operation ID | `listProjects` |
| Owner check | self |

Lists the caller's projects. The filter is always the authenticated user id, so
this cannot be used to read another user's projects regardless of query
parameters.

### Query parameters

| Name | Type | Notes |
| --- | --- | --- |
| `is_premium` | boolean | Optional filter on the premium flag |

### Responses

**`200`** — an array of project objects (schema `Project`). Placed objects are
not included.

**`401`** — `{ "message": "Unauthorized" }`. Schema: `ErrorMessage`.

**`500`** — `{ "message": "...", "error": "<raw>" }`. Schema:
`ErrorMessageAndError`.

---

## `POST /api/projects`

| | |
| --- | --- |
| Source | `app/api/projects/route.ts` |
| Operation ID | `createProject` |
| Owner check | n/a — the caller becomes the owner |

### Request body

`application/json`. The plot is described by four side lengths plus a
diagonal, and the server derives the boundary polygon and validates
consistency. See `CreateProjectRequest` for the full field list; the important
ones are the four sides (`fl`, `fr`, `bl`, `br`), the `fl_br` diagonal, and
`name`.

### Validation the server performs

| Rule | Failure message |
| --- | --- |
| `name` present | `Name is required` |
| All four sides are positive numbers | `All sides must be positive numbers` |
| The four sides can form a quadrilateral | `Invalid plot: these four sides cannot form a quadrilateral. Adjust the side lengths.` |
| The `fl–br` diagonal lies inside a permitted range | `Invalid diagonal: must be strictly between <min> and <max> (FL–BR diagonal).` |

### Responses

**`201`** — `{ "message": "Project created successfully", "project": { ... } }`.

**`400`** — `{ "message": "..." }` with one of the messages above. Schema:
`ErrorMessage`.

**`401`** — `{ "message": "Unauthorized" }`.

**`500`** — `{ "message": "Failed to create project", "error": "<raw>" }`.

### The R2 degradation

Presigned URLs for the project's media are generated in their own `try/catch`
around the insert. If R2 is unreachable, the project is still created and the
two URL fields come back as `null` with a `201`. A client that only checks the
status code will show a project with broken media and no error. See
[`../errors.md`](../errors.md).

---

## `GET /api/projects/{projectId}`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/route.ts` |
| Operation ID | `getProject` |
| Owner check | **`owner`** — correct |

### Path parameters

| Name | Type | Notes |
| --- | --- | --- |
| `projectId` | string | The project's id |

### Responses

**`200`** — the project, with `placed_objects` and the media URL fields
resolved. Schema: `Project`.

**`400`** — `{ "error": "Project ID is required" }` when the segment is empty.
Schema: `ErrorMessageField`.

**`401`** — `{ "error": "Unauthorized" }`. Note this route uses the **`error`**
key, unlike most of the API.

**`404`** — `{ "error": "Project not found" }`. Returned both when the id does
not exist **and** when it exists but belongs to someone else, which is the
correct way to avoid confirming existence.

**`500`** — `{ "error": "..." }`. Schema: `ErrorMessageField`.

---

## `PATCH /api/projects/{projectId}`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/route.ts` |
| Operation ID | `updateProject` |
| Owner check | **`none`** |

> **IDOR.** The handler runs `prisma.projects.update({ where: { id: projectId } })`
> with no `user_id` filter. Any authenticated user who knows or guesses a
> project id can modify that project. The `GET` and `DELETE` on this same route
> file both check ownership correctly, which makes the gap easy to miss.
> See [`../known-gaps.md`](../known-gaps.md).

### Request body

`application/json`. A partial update — only the fields present are written. The
handler rejects an empty body.

Accepted keys:

| Key | Effect |
| --- | --- |
| `boundary_normalized`, `north_direction` | Overwrite the stored plot geometry |
| `plot_width`, `plot_height` | |
| `plot_side_front`, `plot_side_back`, `plot_side_left`, `plot_side_right`, `plot_diagonal` | |
| **`assigned_astrologer_id`** | **Points the project at any astrologer profile id** |
| `status` | Also stamps `completed_at` when the value is `"completed"` |
| `metadata` | Free-form JSON |

Note the geometry keys: a `PATCH` can silently change the plot that every
existing analysis was computed against, with no re-analysis and no audit trail.
Combined with the missing owner check, one request can reshape another user's
plot *and* re-assign it.

`assigned_astrologer_id` is taken as a raw id with no lookup and no validation
that the target has the `astrologer` role. See
[`astrologer.md`](./astrologer.md).

### Responses

**`200`** — `{ "message": "Project updated successfully", "project": { ... } }`.

**`400`** — `{ "error": "No valid fields to update" }`. Schema:
`ErrorMessageField`.

**`401`** — `{ "error": "Unauthorized" }`.

**`404`** — `{ "error": "Project not found" }`. Unlike `GET` and `DELETE`,
there is no ownership check, so this `404` only covers a genuinely missing id.

**`500`** — `{ "error": "..." }`.

---

## `DELETE /api/projects/{projectId}`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/route.ts` |
| Operation ID | `deleteProject` |
| Owner check | **`owner`** — correct |

### Responses

**`200`** — `{ "message": "Project and all related data deleted successfully" }`.
Schema: `ErrorMessage`.

**`400`** — `{ "error": "Project ID is required" }`.

**`401`** — `{ "error": "Unauthorized" }`.

**`404`** — `{ "error": "Project not found or access denied" }`. The message
correctly conflates "missing" and "not yours".

**`500`** — `{ "error": "...", "details": "<raw>" }`. Schema: `ErrorAndDetails`.
The raw error message is returned to the client.

### Cascade behaviour

The delete removes the project and its related rows. It does **not** delete the
underlying R2 objects — floor-plan images, map plots, and videos are orphaned in
the bucket. The same applies to objects removed by the batch-delete route. See
[`../known-gaps.md`](../known-gaps.md).

## Error key convention on this page

`/api/projects/{projectId}` uses `error` for its `400`, `401`, `404`, and
`500`; `/api/projects` uses `message`. The split follows the file, not the
status code. Read both keys. See [`../errors.md`](../errors.md).
