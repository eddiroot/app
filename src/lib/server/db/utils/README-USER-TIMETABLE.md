# User Timetable Statistics

This utility module provides functions for generating individual user timetable views from FET (Free Education Timetabling) schema data.

## Overview

While `student-statistics.ts` and `teacher-statistics.ts` provide **aggregate statistics** across all users, this module focuses on **individual user timetables** - showing exactly when and where each user has classes throughout the timetable cycle.

## Key Features

- ✅ **Complete Day Coverage**: Shows ALL days in the cycle, including days with no classes
- ✅ **Chronological Sessions**: Classes sorted by time within each day
- ✅ **Rich Metadata**: Includes subject names, class names, room assignments, and time details
- ✅ **Free Period Analysis**: Identifies gaps in schedules and free days
- ✅ **Batch Processing**: Generate timetables for multiple users simultaneously

## Types

### `ClassSession`

Represents a single class in the timetable:

```typescript
{
	id: number; // Allocation ID
	subjectName: string; // e.g., "Mathematics"
	subjectOfferingId: number;
	className: string; // e.g., "Math Methods 3/4"
	spaceName: string | null; // e.g., "Room 204"
	startTime: string; // "09:00:00"
	endTime: string; // "10:30:00"
	durationMinutes: number; // 90
	dayId: number; // Database day ID
	dayNumber: number; // 0-4 (Monday-Friday)
	startPeriodId: number;
	endPeriodId: number;
}
```

### `DaySchedule`

Represents all sessions for a single day:

```typescript
{
  dayNumber: number;             // 0-4
  dayName: string;               // "Monday", "Tuesday", etc.
  sessions: ClassSession[];      // All classes on this day
  totalHours: number;            // Total contact hours
}
```

### `UserTimetable`

Complete timetable for a user:

```typescript
{
  userId: string;
  userName: string;              // "John Smith"
  userType: string;              // "student" or "teacher"
  cycleWeekRepeats: number;      // 1, 2, 3, etc.
  days: DaySchedule[];           // All days in cycle
  totalHoursPerCycle: number;
  averageHoursPerDay: number;
}
```

## Main Functions

### `generateUserTimetable(userId, timetableDraftId)`

Generate a complete timetable for a specific user.

**Parameters:**

- `userId` - User UUID
- `timetableDraftId` - Timetable draft ID

**Returns:** `Promise<UserTimetable>`

**Example:**

```typescript
const timetable = await generateUserTimetable('user-uuid-here', 42);

console.log(`${timetable.userName} has ${timetable.totalHoursPerCycle}h per cycle`);

// Show Monday's schedule
const monday = timetable.days[0];
for (const session of monday.sessions) {
	console.log(`${session.startTime} - ${session.subjectName} @ ${session.spaceName}`);
}
```

**Behavior:**

- Returns empty timetable with all configured days if user has no classes
- Sorts sessions chronologically within each day
- Includes ALL days from the timetable draft, even if no classes scheduled

### `generateMultipleUserTimetables(userIds, timetableDraftId)`

Generate timetables for multiple users in parallel.

**Parameters:**

- `userIds` - Array of user UUIDs
- `timetableDraftId` - Timetable draft ID

**Returns:** `Promise<UserTimetable[]>`

**Example:**

```typescript
const timetables = await generateMultipleUserTimetables(['user-1', 'user-2', 'user-3'], 42);

// Compare workloads
timetables.forEach((tt) => {
	console.log(`${tt.userName}: ${tt.totalHoursPerCycle}h`);
});
```

## Helper Functions

### `getFreePeriodsSummary(userTimetable)`

Analyze free time in a user's schedule.

**Returns:**

```typescript
{
	totalFreeDays: number; // Days with no classes
	daysWithFreePeriods: number; // Days with gaps between classes
	longestFreeBlock: {
		dayName: string;
		hours: number;
	}
}
```

**Example:**

```typescript
const summary = getFreePeriodsSummary(timetable);
console.log(`${summary.totalFreeDays} completely free days`);
console.log(
	`Longest break: ${summary.longestFreeBlock.hours}h on ${summary.longestFreeBlock.dayName}`
);
```

### `formatUserTimetableForDisplay(userTimetable)`

Generate a human-readable text representation of the timetable.

**Returns:** `string` (formatted with ASCII art borders)

**Example output:**

```
================================================================================
TIMETABLE FOR: John Smith (student)
Cycle: 2 week(s)
Total Hours/Cycle: 23.50h
Average Hours/Day: 4.70h
================================================================================

MONDAY - 5.00h
--------------------------------------------------------------------------------
  09:00:00 - 10:30:00 | Mathematics (Math Methods 3/4) @ Room 204
  11:00:00 - 12:30:00 | English (English 3/4) @ Room 105
  13:30:00 - 15:00:00 | Physics (Physics 3/4) @ Lab 2

TUESDAY - 0.00h
--------------------------------------------------------------------------------
  No classes scheduled

...

SUMMARY
--------------------------------------------------------------------------------
Free Days: 2
Days with Free Periods: 3
Longest Free Block: 24.00h on Tuesday
================================================================================
```

### `getDayName(dayNumber)`

Convert day number to name.

**Parameters:**

- `dayNumber` - 0 (Monday) through 4 (Friday)

**Returns:** `"Monday"` | `"Tuesday"` | ... | `"Day N"` (for unexpected values)

## Usage in SvelteKit Routes

### +page.server.ts

```typescript
import { generateUserTimetable } from '$lib/server/db/utils/user-timetable-statistics';

export const load = async ({ params, locals }) => {
	const userId = params.userId || locals.user.id;
	const timetableDraftId = parseInt(params.draftId);

	const userTimetable = await generateUserTimetable(userId, timetableDraftId);

	return {
		userTimetable
	};
};
```

### +page.svelte

```svelte
<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const { userTimetable } = data;
</script>

<h1>{userTimetable.userName}'s Timetable</h1>

{#each userTimetable.days as day}
	<div class="day-card">
		<h2>{day.dayName} ({day.totalHours.toFixed(1)}h)</h2>

		{#if day.sessions.length === 0}
			<p>No classes scheduled</p>
		{:else}
			{#each day.sessions as session}
				<div class="session">
					<span class="time">{session.startTime} - {session.endTime}</span>
					<span class="subject">{session.subjectName}</span>
					{#if session.spaceName}
						<span class="room">@ {session.spaceName}</span>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
{/each}
```

## Data Flow

```
1. Get user details (name, type)
   ↓
2. Get timetable configuration (cycle length, days)
   ↓
3. Find user's FET classes (from fetSubjectOfferingClassUser)
   ↓
4. Get class allocations (day/period assignments)
   ↓
5. Enrich with subject names, class names, room names
   ↓
6. Group by day and sort chronologically
   ↓
7. Fill in empty days for complete cycle view
   ↓
8. Calculate statistics (total hours, averages)
```

## Database Queries

### Main Tables Used

- `fetSubjectOfferingClassUser` - Links users to FET classes
- `fetSubjectOfferingClass` - FET class definitions
- `fetSubjectClassAllocation` - Day/period assignments
- `timetableDay` - Day configurations
- `timetablePeriod` - Time period definitions
- `subjectOffering` - Subject details
- `subject` - Subject names
- `subjectOfferingClass` - Class names
- `schoolSpace` - Room names

### Performance Considerations

- Uses parallel queries where possible (`Promise.all`)
- Batches related data fetching (all periods, all spaces)
- Returns early for users with no classes
- Efficient array filtering and mapping

## Edge Cases Handled

1. **User with no classes**: Returns timetable with all days but empty sessions
2. **Missing room assignments**: `spaceName` is `null`, UI should handle gracefully
3. **Missing class names**: Falls back to empty string
4. **Unknown subjects**: Uses "Unknown" as subject name
5. **Days without classes**: Explicitly included with 0 hours
6. **User not found**: Throws error with descriptive message

## Common Patterns

### Display only days with classes

```typescript
const busyDays = userTimetable.days.filter((day) => day.sessions.length > 0);
```

### Group by week (for multi-week cycles)

```typescript
const weeksInCycle = userTimetable.cycleWeekRepeats;
const daysPerWeek = 5;

for (let week = 0; week < weeksInCycle; week++) {
	const weekDays = userTimetable.days.slice(week * daysPerWeek, (week + 1) * daysPerWeek);
	// Display week's schedule
}
```

### Find busiest day

```typescript
const busiestDay = userTimetable.days.reduce((max, day) =>
	day.totalHours > max.totalHours ? day : max
);
```

### Check for schedule conflicts (overlapping times)

```typescript
function hasConflicts(day: DaySchedule): boolean {
	const sorted = [...day.sessions].sort((a, b) => a.startTime.localeCompare(b.startTime));

	for (let i = 0; i < sorted.length - 1; i++) {
		if (sorted[i].endTime > sorted[i + 1].startTime) {
			return true; // Overlap detected
		}
	}
	return false;
}
```

## Comparison with Other Statistics

| Feature     | user-timetable-statistics | student/teacher-statistics |
| ----------- | ------------------------- | -------------------------- |
| Scope       | Single user               | All users                  |
| Granularity | Individual sessions       | Aggregate counts           |
| Time detail | Start/end times           | Total hours only           |
| Empty days  | Explicitly shown          | Not applicable             |
| Use case    | Personal view             | System overview            |
| Performance | Fast for 1 user           | Slower (all users)         |

## Future Enhancements

Potential additions:

- Export to iCal format
- Conflict detection and reporting
- Travel time calculation between rooms
- Color coding by subject or room
- Comparison between multiple users
- Optimization suggestions (e.g., reducing gaps)
