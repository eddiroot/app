# Timetable constraints — how the system works

The constraint layer bridges the app's UI and FET's XML input. Each supported
FET constraint is defined once, in one folder, and every consumer (UI, server
validation, XML generation, DB seed) reads from that single source.

## Where things live

```
src/routes/admin/timetables/[timetableId]/draft/[timetableDraftId]/constraints/
├── +page.server.ts      # loads assigned + available constraints (imports from registry/server)
├── +page.svelte         # UI: 2×2 grid, add/edit modal (imports from registry)
├── +server.ts           # POST / PATCH / DELETE for draft constraints (imports from registry/server)
└── registry/
    ├── index.ts         # CLIENT ONLY: getFormComponent(fetName) — imports .svelte forms directly
    ├── server.ts        # SERVER ONLY: ALL_ENTRIES + helpers (getEntry, validateParams, hasEntry, …)
    ├── types.ts         # ConstraintEntry, ConstraintMeta, ConstraintFormData, FormDataKey
    ├── form-data.ts     # buildConstraintFormData(keys) — lazy autocomplete fetch
    └── <constraint>/
        ├── index.ts     # Zod schema + ConstraintMeta export (no Form import)
        └── form.svelte  # modal form (only imported by registry/index.ts)
```

Plus:

- `src/lib/server/db/seed/constraints.ts` — `syncConstraintsFromRegistry()` keeps
  the `timetable.con` DB table in sync with `ALL_ENTRIES` (from `registry/server`). Wired into
  `src/hooks.server.ts` so it runs once per boot.
- `src/lib/server/db/service/timetable.ts` — CRUD service functions
  (`getConstraintByFetName`, `createTimetableDraftConstraint`,
  `updateTimetableDraftConstraintActiveStatus`,
  `updateTimetableDraftConstraintParameters`, etc.).
- `src/routes/.../generate/utils.ts` — `buildConstraintsXML()` serialises
  active constraints into `<Time_Constraints_List>` / `<Space_Constraints_List>`
  generically, keyed on `fetName`.

## The `ConstraintMeta` and `ConstraintEntry` contracts

Constraints use two complementary types (see `registry/types.ts`):

**`ConstraintMeta`** — Server-safe metadata (no component reference):

```ts
type ConstraintMeta = {
  fetName: string;                  // FET XML tag, e.g. 'ConstraintTeachersMaxGapsPerWeek'
  friendlyName: string;
  description: string;
  type: constraintTypeEnum;         // 'time' | 'space'
  optional: boolean;                // if false, cannot be toggled/deleted
  repeatable: boolean;              // if true, can have many instances per draft

  paramsSchema: z.ZodSchema;        // validates the JSON stored on tt_draft_con.parameters
  requiresFormData: readonly FormDataKey[]; // autocomplete option sets this form needs
}
```

**`ConstraintEntry`** — Full definition (adds form component, client-only):

```ts
interface ConstraintEntry extends ConstraintMeta {
  formComponent: Component;         // Svelte form used in the add/edit modal
}
```

Why the split? Server-side code (`+server.ts`, seed, XML generation) only needs metadata and schemas. Client code (`+page.svelte`) needs the form component. Separating them prevents the server from transitively importing `.svelte` files, which causes Vite errors.

`FormDataKey` is one of: `subjects`, `teachers`, `students`, `timetableGroups`,
`buildings`, `spaces`, `timetableDays`, `timetablePeriods`, `timetableActivities`.
The page load only fetches the union of what's actually in play.

## Data flow

### Adding a constraint

1. User clicks "Add Constraint" on an available card.
2. Page reads `getFormComponent(fetName)` and renders it inside the modal.
3. On submit, the form passes a `Record<string, unknown>` of FET-shaped params
   (already Zod-checked client-side) up via `onSubmit`.
4. Page POSTs `{ fetName, parameters }` to
   `/admin/timetables/<id>/draft/<draftId>/constraints`.
5. `+server.ts` runs `validateParams(fetName, parameters)` from the registry,
   looks up `con.id` by `fetName`, and inserts a `tt_draft_con` row with the
   params stored as JSONB.

### Editing a constraint

1. User clicks the edit (✎) icon on an assigned constraint.
2. The same modal opens, but pre-filled with the existing `parameters` from
   `tt_draft_con`.
3. Submit sends PATCH `{ ttConstraintId, parameters }`.
4. `+server.ts` re-validates against the registry schema and updates the JSONB.

(`active` toggling and deletion use the same PATCH / DELETE endpoints with
different payloads.)

### Generating FET XML

`buildConstraintsXML()` in `generate/utils.ts`:

- Queries active `tt_draft_con` rows (joined to `con` for metadata).
- Buckets entries by `fetName` into a `Record<string, unknown[]>`.
- Emits singletons as a single object and multiples as an array — which
  `fast-xml-builder` renders as repeated sibling elements. This is how
  repeatable constraints (e.g. multiple `ConstraintRoomNotAvailableTimes`) reach
  FET correctly.
- Auto-synthesised `ConstraintActivityPreferredRooms` (derived from each
  activity's location preferences) is appended to the same bucket, so it
  co-exists with any user-added entries of the same FET name.

### DB seed on boot

`syncConstraintsFromRegistry()` reads `ALL_ENTRIES`, diffs against
`timetable.con`, inserts what's missing, updates drifted rows, and marks rows
not in the registry as `isArchived = true` (not deleted, because old
`tt_draft_con` rows may still FK-reference them).

`fetName` has no unique index yet, so the sync does a manual select → update /
insert rather than `ON CONFLICT`.

## How IDs end up in the XML

FET identifies entities by `Name`. In this codebase:

| Entity     | FET `Name` value                                  |
|------------|---------------------------------------------------|
| Teacher    | `teachers.id` (integer)                           |
| Subject    | `subjects.id`                                     |
| Room       | `spaces.id`                                       |
| Building   | `buildings.id`                                    |
| Activity   | FET auto-assigned `Id` (see `buildActivitiesList`) |
| Student    | Prefixed: `Y{yearLevelId}`, `G{groupId}`, `S{studentId}` |

Constraint form fields that reference entities store the DB `id` directly. No
translation step is needed during XML generation — IDs are FET `Name` values
by convention.

## Adding a new constraint

1. Create `registry/<kebab-name>/index.ts` — **no Form import** (server-safe):

   ```ts
   import { z } from 'zod';
   import { constraintTypeEnum } from '$lib/enums';
   import type { ConstraintMeta } from '../types';

   export const mySchema = z.object({
     Weight_Percentage: z.number().min(1).max(100),
     // … FET-shaped fields
     Active: z.boolean().default(true),
     Comments: z.string().nullable().optional(),
   });

   export const myConstraint: ConstraintMeta = {
     fetName: 'ConstraintFooBar',
     friendlyName: 'Foo Bar',
     description: '…',
     type: constraintTypeEnum.time,
     optional: true,
     repeatable: true,
     paramsSchema: mySchema,
     requiresFormData: ['teachers'],
   };
   ```

2. Create `registry/<kebab-name>/form.svelte`. Use an existing one as a
   template — all forms conform to `ConstraintFormComponentProps`
   (`onSubmit`, `onCancel`, `initialValues`, `formData`, `submitLabel`). Use
   `untrack()` when seeding `$state` from `initialValues` so the edit flow
   pre-fills correctly.

3. Update both registry entry points:
   - Add an import + entry to `registry/server.ts`'s `ALL_ENTRIES` array.
   - Add an import + entry to `registry/index.ts`'s `FORM_COMPONENTS` map.

4. Restart the dev server — `syncConstraintsFromRegistry()` will insert the new
   `con` row automatically.

That's it. No need to touch `+page.server.ts`, `+page.svelte`, `+server.ts`,
or the XML builder.

## Gotchas

- **Server/client registry split.** `registry/server.ts` is server-only and must
  never import `.svelte` files. `registry/index.ts` is client-only and imports
  all form components. Both maintain `ALL_ENTRIES`-like arrays and must be kept
  in sync when adding/removing/renaming constraints.
- **Params schema mirrors FET XML shape.** The Zod schemas encode FET field
  names (`Weight_Percentage`, `Not_Available_Time[]`, etc.). If FET changes its
  XML, the schema must change with it.
- **Redundant counts.** FET quirks like `Number_of_Preferred_Rooms` duplicate
  `Preferred_Room.length`; we keep them for output-shape stability.
- **FET version declaration.** The XML declares `fet version="7.3.0"` in
  `generate/utils.ts`, while the Dockerfile installs a different version
  (currently 7.8.5). Keep these aligned when bumping.
- **Archived `con` rows stay in the DB.** If a registry entry is removed, the
  row is archived — not deleted — so historic draft FKs don't break. Hide
  archived rows in any admin UI that lists them raw.
