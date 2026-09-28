# Floor Plan Objects

The placed objects that make up a floor plan: beds, kitchens, toilets, and so
on, each with a polygon on the plot.

| | |
| --- | --- |
| Auth | session **or** Bearer on all six |
| Tag | Floor Plan Objects |

Ownership enforcement varies sharply across these routes:

| Operation | Method + path | Owner check |
| --- | --- | --- |
| `listProjectObjects` | `GET /api/projects/{projectId}/objects` | **`none`** — IDOR |
| `replaceProjectObjects` | `POST /api/projects/{projectId}/objects` | **`none`** — IDOR, destructive |
| `updateProjectObject` | `PUT /api/projects/{projectId}/objects/{objectId}` | `owner` |
| `deleteProjectObject` | `DELETE /api/projects/{projectId}/objects/{objectId}` | `owner` |
| `batchProjectObjects` | `POST /api/projects/{projectId}/objects/batch` | `project-only` — partially wrong |

> **The two IDOR routes are the ones an editor actually uses.** A client that
> loads a plan with `GET` and saves it with `POST` never touches the two routes
> that check ownership. The routes that check ownership (`PUT`, `DELETE`) are
> the ones a bulk editor does not use. That is why this went unnoticed.

---

## `GET /api/projects/{projectId}/objects`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/objects/route.ts` |
| Operation ID | `listProjectObjects` |
| Owner check | **`none`** |

> **IDOR.** Returns the full placed-object set for any project id to any
> authenticated caller, which discloses the layout of someone else's home.

### Responses

**`200`** — an array of object records (schema `ProjectObject`), each carrying
its `object_type`, polygon geometry, and position.

**`400`** — `{ "error": "Project ID is required" }`. Schema: `ErrorMessageField`.

**`401`** — `{ "error": "Unauthorized" }`.

**`500`** — `{ "error": "...", "details": "<raw>" }`. Schema: `ErrorAndDetails`.

---

## `POST /api/projects/{projectId}/objects`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/objects/route.ts` |
| Operation ID | `replaceProjectObjects` |
| Owner check | **`none`** |

> **IDOR + non-atomic.** This route **replaces the entire object set**. With no
> ownership check, one authenticated request with a guessed project id
> destroys another user's floor plan. It is the most destructive access-control
> failure in the codebase.

### Request body

`application/json` with an `objects` array. The whole set is replaced, not
merged: existing rows are deleted, then the new ones are inserted.

### Responses

**`200`** — one of:

- `{ "message": "Objects saved successfully", "objects": [ ... ] }`
- `{ "message": "No objects to insert" }` — an empty array is a valid, successful
  clear of the plan.

**`400`** — `{ "error": "Project ID is required" }` or
`{ "error": "Invalid objects data" }`.

**`401`** — `{ "error": "Unauthorized" }`.

**`500`** — `{ "error": "Failed to save objects", "details": "<raw>" }`.

### Why it is not transactional

The `deleteMany` and the `createMany` are two separate statements with no
`prisma.$transaction` between them. `createMany` is one statement, so the insert
cannot fail part-way — but if it throws at all, every original object has already
been deleted, the project is left empty, and the original geometry is
unrecoverable. The client gets a `500` with the raw error in `details`, so unlike
the empty-array case below, the failure is at least visible.

This route never touches R2. It only rewrites `project_objects` rows, so the
uploaded media survives while the rows describing it are gone.

### An empty array silently clears the plan

`{"objects": []}` is accepted, and the `deleteMany` has already executed by the
time the length check runs. The response is
`200 {"message": "No objects to insert", "objects": []}` — a success status for a
complete deletion. There is no confirmation step, so a client that sends an
empty array by accident (empty canvas, or a floor-plan parse that returned
nothing) cannot distinguish "nothing to save" from "your plan was erased".

Because there is no ownership check either, this is also the cheapest way to
destroy another user's floor plan. See
[`../known-gaps.md`](../known-gaps.md) for `NONATOMIC-REPLACE`,
`EMPTY-ARRAY-WIPES-PLAN`, and `IDOR-REPLACE-OBJECTS`.

---

## `PUT /api/projects/{projectId}/objects/{objectId}`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/objects/[objectId]/route.ts` |
| Operation ID | `updateProjectObject` |
| Owner check | `owner` — correct |

Updates a single object.

### Path parameters

| Name | Type |
| --- | --- |
| `projectId` | string |
| `objectId` | string |

### Responses

**`200`** — `{ "message": "Project object updated successfully", "object": { ... } }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`404`** — `{ "message": "Object not found" }` or
`{ "message": "Project not found or you do not have permission to modify objects in it." }`.

**`500`** — `{ "message": "Failed to update project object", "error": "<raw>" }`.
Schema: `ErrorMessageAndError`.

### Note: unusable from a browser

`PUT` is **absent** from `Access-Control-Allow-Methods` in `middleware.ts:29`,
so the browser preflight fails and the request never leaves the browser. Native
clients are unaffected. This is the only `PUT` object route, which is
consistent with the editor using `POST` to save. See [`../cors.md`](../cors.md).

---

## `DELETE /api/projects/{projectId}/objects/{objectId}`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/objects/[objectId]/route.ts` |
| Operation ID | `deleteProjectObject` |
| Owner check | `owner` — correct |

### Responses

**`200`** — `{ "message": "Project object deleted successfully" }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`404`** — `{ "message": "Object not found" }` or
`{ "message": "Project not found or you do not have permission to delete objects in it." }`.

**`500`** — `{ "message": "Failed to delete project object", "error": "<raw>" }`.

The R2 object backing the deleted record, if any, is not removed.

---

## `POST /api/projects/{projectId}/objects/batch`

| | |
| --- | --- |
| Source | `app/api/projects/[projectId]/objects/batch/route.ts` |
| Operation ID | `batchProjectObjects` |
| Owner check | `project-only` |

Applies a set of create / update / delete operations in one call. This is the
route the editor uses when saving.

### Request body

`application/json` carrying a list of operations, each tagged with its intent,
plus the ids in `objectToDelete` for the deletions.

### The scoping bug

The delete step filters on the **caller's user id** and the list of ids, but
**not** on the project in the path. So an object id belonging to a *different*
project can be deleted by naming any project the caller owns:

```
POST /api/projects/{my-own-project}/objects/batch
{ "objectToDelete": ["<id from someone else's project>"] }
```

The ids are also not validated for existence, so the call reports success for
ids that were never there. See [`../known-gaps.md`](../known-gaps.md).

### Responses

**`200`** — `{ "message": "Configuration saved successfully", "objects": [ ... ] }`.

**`401`** — `{ "message": "Unauthorized" }`.

**`404`** — `{ "message": "Project not found or you do not have permission to create objects in it." }`.
This check **is** scoped to the project correctly, which is why the delete path
is the inconsistent one.

**`500`** — `{ "message": "...", "error": "<raw>" }`. Four distinct messages
are possible: `"Failed to delete objects."`, `"Failed to process batch
objects"`, `"Failed to save new objects."`, and `"Objects saved, but failed to
fetch updated list."`

That last one is worth calling out: the write succeeded and only the
re-read failed, so the response is a `500` for a state change that did happen.
A client that retries will re-apply the batch.

## Error key convention

`GET` and `POST` on `/objects` use **`error`**; the `[objectId]` routes and
`/batch` use **`message`**. The split follows the file. Read both keys. See
[`../errors.md`](../errors.md).
