# Timetable Statistics Utilities

This directory contains utility functions for calculating and analyzing statistics from FET (Free Timetabling Software) subject offering classes in the timetable system.

## Overview

The timetable schema is designed so that:
- Each **FET class** (`fetSubjectOfferingClass`) has multiple **users** (teachers and students) enrolled via `fetSubjectOfferingClassUser`
- Each **FET class** has multiple **allocations** (`fetSubjectClassAllocation`) spread across the timetable cycle
- Each **allocation** references a specific day, start period, and end period

These utilities help deconstruct this schema to calculate meaningful statistics about student and teacher workloads.

## Files

### `student-statistics.ts`
Functions for calculating student workload statistics.

**Key Functions:**
- `generateStudentStatistics(timetableDraftId)` - Main function that generates statistics for all students
- `getStudentEnrollmentsWithAllocations(timetableDraftId)` - Fetches raw data about student enrollments
- `calculateStudentStatistic(userId, enrollments)` - Calculates statistics for a single student

**Types:**
- `StudentStatistic` - Complete statistics for a student including hours per cycle, daily hours, etc.
- `StudentEnrollment` - Raw enrollment data with allocations
- `ClassAllocation` - Single class time slot with timing information

### `teacher-statistics.ts`
Functions for calculating teacher workload statistics (mirrors student statistics).

**Key Functions:**
- `generateTeacherStatistics(timetableDraftId)` - Main function that generates statistics for all teachers
- `getTeacherAssignmentsWithAllocations(timetableDraftId)` - Fetches raw data about teacher assignments
- `calculateTeacherStatistic(userId, assignments)` - Calculates statistics for a single teacher

**Types:**
- `TeacherStatistic` - Complete statistics for a teacher
- `TeacherAssignment` - Raw assignment data with allocations

### `timetable-statistics.ts`
Comprehensive analytics combining both student and teacher data.

**Key Functions:**
- `generateTimetableStatistics(timetableDraftId)` - Generates complete timetable statistics
- `identifyWorkloadIssues(students, maxHours, minHours)` - Identifies students with workload problems
- `identifyTeacherWorkloadIssues(teachers, maxHours, minHours)` - Identifies teachers with workload problems
- `generateStatisticsReport(stats)` - Creates a text report of statistics

**Types:**
- `TimetableStatistics` - Combined student, teacher, and summary statistics
- `TimetableSummary` - High-level overview of the entire timetable
- `WorkloadDistribution` - Statistical distribution metrics (min, max, mean, median, std dev)
- `DayUtilization` - Per-day utilization metrics

## Usage Examples

### Basic Student Statistics

```typescript
import { generateStudentStatistics } from '$lib/server/db/utils/student-statistics';

// Get all student statistics for a timetable draft
const students = await generateStudentStatistics(timetableDraftId);

// Access individual student data
students.forEach(student => {
  console.log(`${student.userName}:`);
  console.log(`  Classes: ${student.numberOfEnrolledClasses}`);
  console.log(`  Total Hours/Cycle: ${student.totalHoursPerCycle.toFixed(2)}h`);
  console.log(`  Average Hours/Day: ${student.averageHoursPerDay.toFixed(2)}h`);
  console.log(`  Max Hours/Day: ${student.maxHoursPerDay.toFixed(2)}h`);
  console.log(`  Free Days: ${student.numberOfFreeDays}`);
  
  // Daily breakdown
  for (const [day, hours] of student.dailyHours.entries()) {
    console.log(`    Day ${day}: ${hours.toFixed(2)}h`);
  }
});
```

### Comprehensive Timetable Analysis

```typescript
import { generateTimetableStatistics, generateStatisticsReport } from '$lib/server/db/utils/timetable-statistics';

// Get complete timetable statistics
const stats = await generateTimetableStatistics(timetableDraftId);

// Access summary data
console.log(`Total Students: ${stats.summary.totalStudents}`);
console.log(`Total Teachers: ${stats.summary.totalTeachers}`);
console.log(`Average Student Hours: ${stats.summary.averageStudentHoursPerCycle.toFixed(2)}h`);
console.log(`Average Teacher Hours: ${stats.summary.averageTeacherHoursPerCycle.toFixed(2)}h`);

// Check workload distribution
console.log('Student Workload Distribution:');
console.log(`  Min: ${stats.summary.studentWorkloadDistribution.min.toFixed(2)}h`);
console.log(`  Max: ${stats.summary.studentWorkloadDistribution.max.toFixed(2)}h`);
console.log(`  Mean: ${stats.summary.studentWorkloadDistribution.mean.toFixed(2)}h`);
console.log(`  Median: ${stats.summary.studentWorkloadDistribution.median.toFixed(2)}h`);
console.log(`  Std Dev: ${stats.summary.studentWorkloadDistribution.standardDeviation.toFixed(2)}h`);

// Generate a full report
const report = generateStatisticsReport(stats);
console.log(report);
```

### Identifying Workload Issues

```typescript
import { generateTimetableStatistics, identifyWorkloadIssues, identifyTeacherWorkloadIssues } from '$lib/server/db/utils/timetable-statistics';

const stats = await generateTimetableStatistics(timetableDraftId);

// Find students with workload issues
const studentIssues = identifyWorkloadIssues(
  stats.students,
  7, // max hours per day
  3  // min hours per day
);

console.log('Students with issues:');
console.log(`  Overloaded (>7h/day): ${studentIssues.overloaded.length}`);
console.log(`  Underutilized (<3h/day): ${studentIssues.underutilized.length}`);
console.log(`  Unbalanced schedule: ${studentIssues.unbalanced.length}`);

// Find teachers with workload issues
const teacherIssues = identifyTeacherWorkloadIssues(
  stats.teachers,
  8, // max hours per day
  2  // min hours per day
);

console.log('Teachers with issues:');
console.log(`  Overloaded (>8h/day): ${teacherIssues.overloaded.length}`);
console.log(`  Underutilized (<2h/day): ${teacherIssues.underutilized.length}`);
console.log(`  Unbalanced schedule: ${teacherIssues.unbalanced.length}`);
```

### Day-by-Day Analysis

```typescript
import { generateTimetableStatistics } from '$lib/server/db/utils/timetable-statistics';
import { getDayName } from '$lib/server/db/utils/student-statistics';

const stats = await generateTimetableStatistics(timetableDraftId);

// Analyze each day's utilization
for (const [dayNumber, dayUtil] of stats.summary.dayUtilization.entries()) {
  console.log(`\n${getDayName(dayNumber)}:`);
  console.log(`  Students Scheduled: ${dayUtil.studentsScheduled}`);
  console.log(`  Average Student Hours: ${dayUtil.averageStudentHours.toFixed(2)}h`);
  console.log(`  Teachers Scheduled: ${dayUtil.teachersScheduled}`);
  console.log(`  Average Teacher Hours: ${dayUtil.averageTeacherHours.toFixed(2)}h`);
}
```

### Using in SvelteKit Server Routes

```typescript
// +page.server.ts
import { generateStudentStatistics } from '$lib/server/db/utils/student-statistics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const timetableDraftId = parseInt(params.timetableDraftId);
  
  const students = await generateStudentStatistics(timetableDraftId);
  
  return {
    students
  };
};
```

## Calculated Fields

### For Students/Teachers

Each statistic object includes:

- **userId**: Unique identifier
- **userName**: Full name (firstName + lastName)
- **userType**: Type of user (student/teacher)
- **numberOfEnrolledClasses** (students) / **numberOfAssignedClasses** (teachers): Count of classes
- **totalHoursPerCycle**: Total teaching/learning hours in the timetable cycle
- **averageHoursPerDay**: Average hours on days with classes
- **maxHoursPerDay**: Maximum hours on any single day
- **minHoursPerDay**: Minimum hours on any single day
- **numberOfFreeDays**: Days in the cycle with no classes
- **dailyHours**: Map of day number to hours for that day

### Summary Statistics

- **Workload Distribution**: Min, max, mean, median, and standard deviation of hours
- **Day Utilization**: Per-day breakdown of scheduled students/teachers and average hours
- **Overall Metrics**: Total counts and averages across the entire timetable

## Performance Considerations

These functions execute multiple database queries:
1. Fetch all FET classes for the timetable draft
2. Fetch all user enrollments/assignments
3. Fetch all allocations for these classes
4. Fetch period details for timing calculations

For large timetables (>1000 students or >100 teachers), consider:
- Caching results
- Running calculations in background jobs
- Implementing pagination for result sets
- Using database views for common queries

## Testing

To test these utilities:

```typescript
// Test with a small timetable draft
const testDraftId = 1000;
const students = await generateStudentStatistics(testDraftId);
console.log(`Found ${students.length} students`);

// Verify calculations
const sampleStudent = students[0];
const manualTotal = Array.from(sampleStudent.dailyHours.values())
  .reduce((sum, h) => sum + h, 0);
console.assert(
  Math.abs(sampleStudent.totalHoursPerCycle - manualTotal) < 0.01,
  'Total hours calculation mismatch'
);
```

## Future Enhancements

Potential additions:
- Gap analysis (free periods between classes)
- Room utilization statistics
- Subject-specific workload analysis
- Clash detection
- Export to CSV/Excel formats
- Visualization data formats (charts/graphs)
- Comparison between different timetable drafts
