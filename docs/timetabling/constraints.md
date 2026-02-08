# Handling Timetable Constraints:

## Database Structure:

TIMETABLE(tt_id,.....)
CONSTRAINTS(con_id, con_name, con_type, con_params_json)
TIMETABLE_CONSTRAINTS(tt_id, con_id)

## Background:

Every constraint has a weight. A weight of 100% mean that this constraint must be respected. A lower value mean it should be respected, it's not necessary. It's pretty difficult to explain the exact function, but a simple illustration is the following: 50% weight means that on average FET retries two times to place an activity without a conflict. If FET isn't able to place the activity without a conflict after average 2 times it keeps the conflict and tries to place the next activity.

## List of available FET constraints:

- [x] Teacher not available constraint
- [x] Student not available constraint
- [x] All students + All teachers are not available constraint
- [x] Class preferred times constraint
- [x] Min-days between activities
- [ ] Max-days between activities
- [x] Hourly constraints:
  - [x] The min hours daily constraints are:
  - [x] Time constraints (teachers) → Min hours daily for a teacher
  - [x] Time constraints (teachers) → Min hours daily for all teachers
  - [x] Time constraints (students) → Min hours daily for a students set
  - [x] Time constraints (students) → Min hours daily for all students

  - [x] The max hours daily constraints are:
  - [x] Time constraints (teachers) → Max hours daily for a teacher
  - [x] Time constraints (teachers) → Max hours daily for all teachers
  - [x] Time constraints (students) → Max hours daily for a students set
  - [x] Time constraints (students) → Max hours daily for all students
  - [x] Time constraints (teachers) → Max hours daily with an activity tag for a teacher
  - [x] Time constraints (teachers) → Max hours daily with an activity tag for all teachers
  - [x] Time constraints (students) → Max hours daily with an activity tag for a students set
  - [x] Time constraints (students) → Max hours daily with an activity tag for all students
  - [x] The max hours continuously constraints are:
  - [x] Time constraints (teachers) → Max hours continuously for a teacher
  - [x] Time constraints (teachers) → Max hours continuously all teachers
  - [x] Time constraints (students) → Max hours continuously a students set
  - [x] Time constraints (students) → Max hours continuously for all students
  - [x] Time constraints (teachers) → Max hours continuously with an activity tag for a teacher
  - [x] Time constraints (teachers) → Max hours continuously with an activity tag all teachers
  - [x] Time constraints (students) → Max hours continuously with an activity tag a students set
  - [x] Time constraints (students) → Max hours continuously with an activity tag for all students

- [x] Gap constaints: (A gap is an unused timeslot (or several) between two activities.)
  - [x] The max gaps constraints are:
  - [x] Time constraints (teachers) → Max gaps per week for a teacher
  - [x] Time constraints (teachers) → Max gaps per week for all teachers
  - [x] Time constraints (teachers) → Max gaps per day for a teacher
  - [x] Time constraints (teachers) → Max gaps per day for all teachers
  - [x] Time constraints (students) → Max gaps per week for a students set
  - [x] Time constraints (students) → Max gaps per week for all students
  - [x] Time constraints (students) → Max gaps per day for a students set
  - [x] Time constraints (students) → Max gaps per day for all students
  - **The law of many countries rule that students of primary and secondary schools don't have a gap.
    Add constraint Max gaps per week for all students with value 0 and weight 100%.**
- [x] Student Starts early constraints:
  - [x] Time constraints (students) → A students set begins early
  - [x] Time constraints (students) → All students begin early
- [x] Activity ends day constraints:
  - [x] Time constraints (activities) → An activity ends students day
  - [x] Time constraints (activities) → A set of activities ends students day
- [x] Time constraints (activities) → Two activities are consecutive
- [x] Time constraints (activities) → Min gaps (hours) between a set of activities
- [x] The Working in an hourly interval max days per week constraints are:
  - [x] Time constraints (teachers) → A teacher works in an hourly interval max days per week
  - [x] Time constraints (teachers) → All teachers works in an hourly interval max days per week
  - [x] Time constraints (students) → A students set works in an hourly interval max days per week
  - [x] Time constraints (students) → All students works in an hourly interval max days per week
- [x] Preferred time constraints:
  - [x] Time constraints (activities) → An activity has a preferred starting time
  - [x] Time constraints (activities) → An activity has a set of preferred time slots
  - [x] Time constraints (activities) → A set of activities has a set of preferred time slots
  - [x] Time constraints (activities) → A set of subactivities has a set of preferred time slots
  - [x] Time constraints (activities) → An activity has a set of preferred starting times
  - [x] Time constraints (activities) → A set of activities has a set of preferred starting times
  - [x] Time constraints (activities) → A set of subactivities has a set of preferred starting times
- [x] Same starting time constraints:
  - [x] The same starting time constraints are:
  - [x] Time constraints (activities) → A set of activities has same starting time (day+hour)
  - [x] Time constraints (activities) → A set of activities has same starting day (any hour)
  - [x] Time constraints (activities) → A set of activities has same starting hour (any days)
- [x] Time constraints (activities) → A set of activities are not overlapping
- [x] Min resting hour constraints:
  - [x] Time constraints (teachers) → Min resting hours for a teacher
  - [ ] Time constraints (teachers) → Min resting hours for all teachers
  - [ ] Time constraints (students) → Min resting hours for a students set
  - [ ] Time constraints (students) → Min resting hours for all students
- [x] Home room constaints:
- [x] The home rooms constraints are:
  - [x] Space constraints (teachers) → A teacher has a home room
  - [x] Space constraints (teachers) → A teacher has a set of home rooms
  - [x] Space constraints (students) → A set of students has a home room
  - [x] Space constraints (students) → A set of students has a set of home rooms
- [x] Preferred room constraints:
  - [x] The same starting time constraints are:
  - [x] Space constraints (subject) → A subject has a preferred room
  - [x] Space constraints (subject) → A subject has a set of preferred rooms
  - [x] Space constraints (subject+activity) → A subject+activity tag have a preferred room
  - [x] Space constraints (subject+activity) → A subject+activity tag have a set of preferred rooms
  - [x] Space constraints (activity) → An activity has a preferred room
  - [x] Space constraints (activity) → An activity has a set of preferred rooms
- [x] Space constraints (activity) → A set of activities occupies max different rooms
- [x] Space constraints (activity) → A set of activities are in the same room if they are consecutive
- [x] Building constraints:
  - [x] The buildings constraints are:
  - [x] Space constraints (teachers) → Max building changes per day for a teacher
  - [x] Space constraints (teachers) → Max building changes per day for all teachers
  - [ ] Space constraints (teachers) → Max building changes per week for a teacher
  - [ ] Space constraints (teachers) → Max building changes per week for all teachers
  - [ ] Space constraints (teachers) → Min gaps between building changes for a teacher
  - [ ] Space constraints (teachers) → Min gaps between building changes for all teachers
  - [x] Space constraints (students) → Max building changes per day for a set of students
  - [ ] Space constraints (students) → Max building changes per day for all students
  - [ ] Space constraints (students) → Max building changes per week for a set of students
  - [ ] Space constraints (students) → Max building changes per week for all students
  - [x] Space constraints (students) → Min gaps between building changes for a set of students
  - [ ] Space constraints (students) → Min gaps between building changes for all student
