# TODO:

Constraints to Implement:

- [x] ConstraintBasicCompulsoryTime
- [x] ConstraintBasicCompulsorySpace
- [x] ConstraintRoomNotAvailableTimes
- [x] ConstraintMinDaysBetweenActivities
- [x] ConstraintSubjectPreferredRooms
- [x] ConstraintTeachersMaxGaps
- [ ] ConstraintStudentsEarlyMaxBeginningsAtSecondHour
- [ ] ConstraintStudentsMaxGapsPerWeek

## Helper prompt:

For the following constraints, i want you to create forms by following the following steps:

1. Identify the fields required for each constraint based on its FETName and parameters. (consider unique_constraints.txt)
2. Determine the appropriate input types for each field (e.g., text, number, date, select, checkbox).
3. Utilize the Autocomplete component for fields that require selection from a predefined list of options.
4. Create a Svelte component for each constraint form, ensuring it includes:
   - Properly labeled input fields.
   - Validation rules for each input field.
   - A submit button that triggers a function to handle form submission.
5. Ensure the forms are user-friendly and accessible, with clear instructions and error messages where necessary. Consider the
   existing design system and UI components for consistency.
6. Add a case statement in constraint-form-mapping.ts
