# Future task — implement a constraint dependency checker

> Use this file as the prompt for a future Claude session. It assumes the
> registry refactor described in `zmax_docs/constraints.md` is already in place.
> Read that file first.

## Context

Constraint parameters are stored as opaque JSONB on `timetable.tt_draft_con`.
Some of those fields are entity references (activity IDs, room IDs, subject
IDs, day/period IDs, etc.) but no FK exists from the JSON into those tables.
If a user deletes an activity, room, or subject, any constraints referencing
it become silently stale — the FET XML output will reference a `<Name>` that
doesn't exist, and either FET will error or skip the constraint entirely.

We need to detect and surface stale references so the user can fix them
before timetable generation runs.

## Decision: app-layer scan, no separate dependency table

We considered a `tt_draft_con_ref` table that mirrors every entity reference
out of the JSONB into rows with proper FKs. **Rejected for now** — write
amplification, polymorphic-FK awkwardness, and a reconciler-shaped second
source of truth aren't worth it at our scale (small constraint counts per
draft, only 6 implemented constraint types). Revisit if coverage grows past
~30 constraint types or constraint instances per draft hit five figures.

The plan below uses a registry-driven scan: the registry already knows the
shape of each constraint's parameters; we extend it to declare *which* fields
are entity references, and a single utility walks active constraints to find
orphans.

## Scope

Build:

1. **`references` descriptor on `ConstraintEntry`** — declarative metadata
   pointing at entity-bearing paths inside `parameters`.
2. **`extractRefs(entry, parameters)` utility** — walks the descriptor and
   returns `{ entity, ids[] }[]`.
3. **`findStaleConstraintRefs(timetableDraftId)` server function** — loads all
   active `tt_draft_con` rows for a draft, extracts refs via the registry,
   bulk-checks each entity table once, returns a map of stale references.
4. **Passive UI banner** on the constraints page listing affected constraints.
5. **Generation-time guard** — abort generation with a clear error if stale
   refs exist, listing each affected constraint and the missing IDs.

Defer (not in this pass):

- **Eager delete-blocking** — checking refs from inside every entity's delete
  path. More invasive, requires touching every CRUD endpoint that deletes an
  entity. Add later when we're confident in the descriptor coverage.
- **Auto-pruning** — silently removing dead IDs from `parameters` on detection.
  Surprising for users; better to show the warning and let them edit/delete.

## Implementation

### 1. Extend `ConstraintEntry`

`src/routes/admin/timetables/[timetableId]/draft/[timetableDraftId]/constraints/registry/types.ts`:

```ts
export type EntityKind =
  | 'activity'
  | 'teacher'
  | 'subject'
  | 'space'
  | 'building'
  | 'studentGroup'
  | 'day'        // timetable_draft_day.id
  | 'period';    // timetable_draft_period.id

export interface ParamReference {
  /**
   * Path expression into the params object.
   *  - 'Subject'                         single value
   *  - 'Preferred_Room[]'                array of scalars
   *  - 'Not_Available_Time[].Day'        nested field inside an array
   *  - 'Activity_Id[]'                   array of scalars
   */
  path: string;
  entity: EntityKind;
}

export interface ConstraintEntry {
  // …existing fields…
  references?: ReadonlyArray<ParamReference>;
}
```

### 2. Add `references` to each existing registry entry

| Entry                          | references                                                                                          |
|--------------------------------|------------------------------------------------------------------------------------------------------|
| `basicCompulsoryTime`          | `[]` (no entity refs)                                                                                |
| `basicCompulsorySpace`         | `[]`                                                                                                 |
| `teachersMaxGapsPerWeek`       | `[]` (applies to all teachers globally — no IDs in params)                                           |
| `minDaysBetweenActivities`     | `[{ path: 'Activity_Id[]', entity: 'activity' }]`                                                    |
| `subjectPreferredRooms`        | `[{ path: 'Subject', entity: 'subject' }, { path: 'Preferred_Room[]', entity: 'space' }]`            |
| `roomNotAvailableTimes`        | `[{ path: 'Room', entity: 'space' }, { path: 'Not_Available_Time[].Day', entity: 'day' }, { path: 'Not_Available_Time[].Period', entity: 'period' }]` |

### 3. `extractRefs` utility

Co-locate with the registry: `registry/extract-refs.ts`.

```ts
export function extractRefs(
  entry: ConstraintEntry,
  parameters: unknown,
): Array<{ entity: EntityKind; ids: Array<string | number> }> {
  if (!entry.references || !parameters || typeof parameters !== 'object') {
    return [];
  }
  const grouped = new Map<EntityKind, Array<string | number>>();

  for (const ref of entry.references) {
    const values = walkPath(parameters as Record<string, unknown>, ref.path);
    if (values.length === 0) continue;
    const bucket = grouped.get(ref.entity) ?? [];
    bucket.push(...values);
    grouped.set(ref.entity, bucket);
  }
  return [...grouped.entries()].map(([entity, ids]) => ({ entity, ids }));
}
```

`walkPath` parses the path syntax (split on `.`, treat `[]` as flatMap over an
array). Keep it ~30 lines, no dependency. Filter out empty strings, zero,
and nullish values.

### 4. `findStaleConstraintRefs` server function

Place under `src/lib/server/db/service/constraint-refs.ts` (new file).

```ts
export interface StaleRef {
  ttConstraintId: number;
  fetName: string;
  friendlyName: string;
  entity: EntityKind;
  missingIds: Array<string | number>;
}

export async function findStaleConstraintRefs(
  timetableDraftId: number,
): Promise<StaleRef[]>;
```

Algorithm:

1. Load `tt_draft_con` joined to `con` for the draft (use existing
   `getAllConstraintsByTimetableDraftId`).
2. For each row, look up the registry entry by `fetName` (skip if not in
   registry — already filtered defensively elsewhere).
3. Call `extractRefs(entry, row.tt_draft_con.parameters)`.
4. **Bulk-check per entity kind, not per constraint:**
   - Aggregate all referenced IDs across all constraints into a
     `Map<EntityKind, Set<id>>`.
   - For each kind with a non-empty set, run **one** `SELECT id FROM <table>
     WHERE id IN (...)`. The existing schema column names per `EntityKind`:
     - `activity` → `timetable_activity` (whatever the real table is — confirm
       in `schema/timetable.ts`)
     - `teacher` / `student` → `users` filtered by `userType`
     - `subject` → `subject`
     - `space` → `space`
     - `building` → `building`
     - `studentGroup` → `tt_draft_student_group` (confirm)
     - `day` → `tt_draft_day`
     - `period` → `tt_draft_period`
   - Build `Set<id>` of existing IDs per kind.
5. Walk the per-constraint refs again; any ID not in the existing set is
   stale → emit a `StaleRef` row.
6. Group output by `ttConstraintId` if the consumer wants — keep the flat
   shape and let the UI group; gives more flexibility.

Total cost: 1 query for active constraints + ≤ 8 entity existence queries per
call.

### 5. UI banner on the constraints page

`+page.server.ts`: after building the assigned/available lists, call
`findStaleConstraintRefs(timetableDraftId)` and pass the result down as
`staleRefs`.

`+page.svelte`: render a banner above the 2×2 grid when `staleRefs.length > 0`.
Group by `ttConstraintId`; for each affected constraint, show:

- Friendly name + a chip per missing entity ("Activity #42", "Room #7").
- An "Edit" button that opens the existing edit modal so the user can fix it.
- A "Remove" button (only for `optional: true` constraints).

Keep it as a `<div role="alert">` — no new design system dependency.

### 6. Generation-time guard

`generate/+page.server.ts` action `generateTimetable`:

- Before calling `buildFETInput()`, run `findStaleConstraintRefs(timetableDraftId)`.
- If non-empty, return a SvelteKit `fail(400, { staleRefs })` with the list.
- Surface in `generate/+page.svelte` as a blocking error, formatted same as
  the constraints-page banner. No XML is uploaded; no FET run is enqueued.

Keep this guard separate from the existing happy-path validation — don't
collapse it into `buildFETInput()` because that function should remain a pure
mapper.

## File checklist

Create:

- `src/routes/admin/timetables/[timetableId]/draft/[timetableDraftId]/constraints/registry/extract-refs.ts`
- `src/lib/server/db/service/constraint-refs.ts` (re-export from `service/index.ts`)

Modify:

- `registry/types.ts` — add `EntityKind`, `ParamReference`, extend `ConstraintEntry`
- All 6 `registry/<constraint>/index.ts` — add `references`
- `registry/index.ts` — re-export `extractRefs`
- `constraints/+page.server.ts` — add `staleRefs` to load output
- `constraints/+page.svelte` — render banner
- `generate/+page.server.ts` — guard
- `generate/+page.svelte` — display blocking error

## Verification

1. `bun run check` — clean.
2. Add a `roomNotAvailableTimes` constraint referencing a real room. Confirm
   no banner.
3. Delete the room (via the spaces admin UI). Reload constraints page —
   banner appears naming the missing room.
4. Click "Edit" on the affected constraint, swap in a different room, save.
   Banner clears.
5. Re-stale the constraint, then try to generate a timetable. Confirm
   generation aborts with the stale-ref error and no `.fet` upload happens.
6. Manually orphan a constraint by `UPDATE tt_draft_con SET parameters = ...
   WHERE id = ...` referencing a fake ID; confirm both UI and generation
   surface it.

## Notes for the implementer

- **Don't auto-prune.** If the descriptor says `Preferred_Room[]` and one of
  three IDs is stale, do **not** silently remove it from the array. Show the
  warning; let the user decide. The constraint may be invalid under its Zod
  schema with the bad ID removed (e.g. `Number_of_Preferred_Rooms` would
  drift), and we don't want silent corrections.
- **Skip constraints not in the registry.** `+page.server.ts` already filters
  these out; `findStaleConstraintRefs` should too. Don't crash on unknown
  `fetName`.
- **Performance.** Don't run the checker inside the page-load hot path
  unconditionally if it ever gets slow. With 6 constraints and ≤ 8 entity
  queries it's fine; if instances explode, gate behind a query param or move
  to a separate `+server.ts` endpoint and call it from the client.
- **Don't introduce a `references` field in the DB.** The descriptor lives in
  code (registry). The DB stays a pure store of `parameters` JSONB.
- **The dependency table option was rejected** but kept in the back pocket.
  If a future requirement demands DB-enforced integrity (e.g. blocking
  entity deletes via Postgres triggers), revisit `zmax_docs/constraints.md`
  and the chat thread that produced this prompt.
