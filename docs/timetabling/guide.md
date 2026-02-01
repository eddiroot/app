# Max's Guide on Timetabling

# Users

In the software, teachers must have qualified subjects to enable them to teach certain activities

The main hierachy of users in the timetable is as follows:

- Year Levels
  - Groups: Any form of grouped students (usually subjects or even classes)
    - Subgroups: The individual students

Note that in the fet file you will have the following structure:

```xml
<Year>
    <Group>
        <Subgroup>
        </Subgroup>
    </Group>
</Year>
```

If the student is not in any subgroup then it cannot be referenced inside the file at all.

This means that all students need to be apart of at least one subgroup to then be referenced in any activity. Therefore, I have made a mandatory group for the year level that references all the students in the year level. This is done for all year levels to ensure that all Students can be referenced individually.

## Timetable

At the highest level there is a Timetable. This is simply responsible for:

- The school Year its being taught in
- The school Semester its being taught in
  (Basically just the date for when the timetable will run over)
- FUTURE: Should hold the number of weeks per cycle. (currently implemented at the timetable draft level)

## Timetable Drafts

- Each timetable can have numerous drafts
- Drafts have the following attirbutes that make them unique from each other
  - CURRENT: Number of weeks for a cycle repeat (This should be changed to the Timetable level)
  - Days
  - Periods
  - Groups
  - Activites
  - Constraints

## Activities

In fet you should think of activities as individual classes. By individual, I mean INDIVIDUAL. To eloborate, if you have 3b Maths that is taught for 1 period by Mr Smith and runs 3 times a week. Then you must specify 3 DIFFERENT ACTIVITES.

Activites are responsible for the following:

- The teacher who teaches the activity
  - There can be more than 1
- The subject that is being taught
- The student set that belongs to this activity
  - This can be any 3 of the substructures (can be numerous of each):
    - Years
    - Groups
    - Subgroups
- The Duration
  - the number of periods that it takes up at a time
- Total Duration
  - this is the total number of hours that this activity should be taught in a cycle
  - For the example class above (there would then be a duration of 1 and a total duration of 3)
  - NOTE the following syntax of what this should look like in the final FET file

```xml
<Activity>
      <Teacher>d40e88e2-0b5f-4f52-a210-07227ca2d1d9</Teacher>
      <Subject>1009</Subject>
      <Students>Y9</Students>
      <Duration>2</Duration>
      <Total_Duration>4</Total_Duration>
      <Activity_Group_Id>1001</Activity_Group_Id>
      <Active>true</Active>
      <Comments>1001</Comments>
      <Id>4</Id>
    </Activity>
    <Activity>
      <Teacher>d40e88e2-0b5f-4f52-a210-07227ca2d1d9</Teacher>
      <Subject>1009</Subject>
      <Students>Y9</Students>
      <Duration>2</Duration>
      <Total_Duration>4</Total_Duration>
      <Activity_Group_Id>1001</Activity_Group_Id>
      <Active>true</Active>
      <Comments>1001</Comments>
      <Id>5</Id>
    </Activity>
```

NOTE: The comments here reference the id of the class, this is also done as part of the activity group Id. The reason we add it to the comments as well is because the csv that is parsed for the statistics and database objects does not showcase the activity group id. See below on fet output retrieval.

## Constraints

Firstly I just wanted to note off the back of the activities train of thought that in order to have a location assigned to an activity there must be a constraint for the activities preferred room:

```xml
<ConstraintActivityPreferredRooms>
    <Weight_Percentage>95</Weight_Percentage>
    <Activity_Id>3</Activity_Id>
    <Number_of_Preferred_Rooms>2</Number_of_Preferred_Rooms>
    <Preferred_Room>1003</Preferred_Room>
    <Preferred_Room>1002</Preferred_Room>
    <Active>true</Active>
    <Comments>Preferred rooms for activity 1015</Comments>
</ConstraintActivityPreferredRooms>
```

If they do not have this - THEY DO NOT GET ALLOCATED BY DEFAULT
