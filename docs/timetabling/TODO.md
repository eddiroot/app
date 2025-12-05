# TODO list for implementing the timetabling for a given school

## roadmap

- [ ] combine the buildings and spaces page into 1
- [ ] Link all the student/spaces/subjects/teachers to corresponding pages that handle them
- [ ] ensure that all rooms, teachers and students that are in the timetable actually exist in the database and havent been deleted
  - [ ] NOTE: FET will give an error message on return so this can be used and passed back to the user whilst the timetable is being generated
- [ ] Create seeding data for a timetable and the timetables constraints
  - [ ] maybe add more students, subjects and activities for the school
  - [ ] maybe find a fake dataset that has all of the classrooms, their capacities, then the number of students for each year and their respective subjects etc
- [ ] Add ALL of the constraints to the seed data
- [ ] Create forms for all of the constraints
- [ ] Create an information page for the constraints
- [ ] fix the mandatory attribute on all the constraints, not right atm
- [ ] Understand how the api call works with the command line and dockerization
  - [ ] handle the retrieval of the output for the results page
  - [ ] clean up what currently isnt being used.
  - [ ] I want a full day of updating the code to be clean and efficient
- [ ] Create the documentation page for the timetabling process and understandings of how fet works.
- [ ] make other genres of activities to be created
- [ ] should probably showcase all fet responses (constraints broken etc)

## UI Uplifts

- [ ] showcase when timetable cannot be created due to unique constraint

## BUGS

- [ ] deleting one constraint of the same type deletes them all
- [ ] Updating activities does something weird to the teachers
  - [ ] only teachers that teach that subject should be allowed to be assigned to that subject
- [ ] Error message shown as part of the timetable generation is the same for all attempted generations:
  - [ ] linked to the timetable draft rather than the timetable queue row
- [ ]

UPLIFT:

- [ ] change the number of weeks per cycle to be apart of the timetable level.
- [ ] Each draft should be responsible for days in that cycle
- [ ] should showcase what days a timetable is published/drafted
