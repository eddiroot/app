# Welcome to Max's Guide on timetabling

Firsts things first i just wanted to create this document to ensure that all the findings I find out about timetabling with fet and the intricacies of the software do not go under the rug to accumulate dust.

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

# How is FET implemented in CODE?????

## What we have

Once the user has progressed through the entire form of the project we should have the following information:

- The Days which this timetable should be running
- The Times and Periods when this timetable should be running
  - Please note that if the school requires there to be different periods on different days (non-uniform periods throughout the week) then they will need to create 2 separate timetables and combine the results (this can be done but will need some work)
- All the different groups for all the different years
- All the activities (classes) that should be taught throughout the semester
- All the Constraints for the specific timetable

## Making the FET input file

After all this information is collected, we need to create the FET file (which has an xml like format)

All of this is done after the "Generate Timetable File for Processing" Button is pressed in `/Users/Max/Documents/personal/projects/eddi/src/routes/admin/timetables/[timetableId]/[timetableDraftId]/generate/+page.svelte`:

1. This submits the generateTimetable Formaction
2. Gather all the information described above:

```ts
const [
 timetableDays,
 timetablePeriods,
 studentGroups,
 activities,
 buildings,
 spaces,
 teachers,
 subjects,
 school,
 activeConstraints
] = await Promise.all([
 getTimetableDraftDaysByTimetableDraftId(draft.id),
 getTimetableDraftPeriodsByTimetableDraftId(draft.id),
 getAllStudentGroupsByTimetableDraftId(draft.id),
 getEnhancedTimetableDraftActivitiesByTimetableDraftId(draft.id),
 getBuildingsBySchoolId(user.schoolId),
 getSpacesBySchoolId(user.schoolId),
 getUsersBySchoolIdAndType(user.schoolId, userTypeEnum.teacher),
 getSubjectsBySchoolId(user.schoolId),
 getSchoolById(user.schoolId),
 getActiveTimetableDraftConstraintsByTimetableDraftId(draft.id)
]);
```

3. Then we pass it to the buildFETInput function:

```ts
const xmlContent = await buildFETInput({
 timetableDays,
 timetablePeriods,
 studentGroups,
 activities,
 buildings,
 spaces,
 teachers,
 subjects,
 school,
 activeConstraints
});
```

- This function is responsible for building the entire FET file and must be correct to ensure that the input file passed to the fet software is accurate and consistent with what the user wants
- A few important things to note:
  - All the names in the FET file are the id's of the specific object:
    - For example, we see

```xml
<Teacher>
    <Name>87189689-bf01-4754-aef6-41ad190dd841</Name>
    <Target_Number_of_Hours/>
    <Qualified_Subjects>
    <Qualified_Subject>1011</Qualified_Subject>
    </Qualified_Subjects>
</Teacher>
```

AND NOT

```xml
<Teacher>
    <Name>John Smith</Name>
    <Target_Number_of_Hours/>
    <Qualified_Subjects>
    <Qualified_Subject>Maths</Qualified_Subject>
    </Qualified_Subjects>
</Teacher>
```

## buildFETInput

1. Firstly map all the days into the db with their respective ids
2. Then do the same with the periods and subjects
3. Next, get all the teachers and add them to the Teachers list
   - Again, id's as the names
   - For this you also have to iterate over all the teachers specialisations and add those respective subjects to their "Qualified_Subjects" as seen above
4. Build the Students List with proper hierarchy (Year → Group → Subgroup)
   - The function `buildStudentsList` organizes students by year level
   - Each year level contains groups (identified as `G{groupId}`)
   - Each group contains subgroups for individual students (identified as `S{userId}`)
   - NOTE: Students MUST be in subgroups to be referenced in activities (as stated above)
   - The function uses a Map to track unique students across groups within a year level
   - Empty groups (with no students) are still included in the output
5. Build the Activities List with proper splitting
   - Activities are processed through `buildActivitiesList`
   - NOTE: If a class runs multiple times per week, FET requires SEPARATE activity entries for each instance
   - Example: A class that runs 3 times a week with 1 period each time needs 3 separate `<Activity>` entries
   - The function calculates splits using: `Math.ceil(totalPeriods / periodsPerInstance)`
   - All split activities share the same `Activity_Group_Id` to link them together. However, the link is carried over in the output through the `Comments` attribute of the activity.
   - Activities collect student identifiers from three sources:
     - Groups: `G{groupId}`
     - Year levels: `Y{yearLevel}`
     - Individual students: `S{userId}`
   - NOTE: Activities with no teachers OR no students are skipped with a warning (this is done before the fet processing and should never occur in future implementation through the proper use of schemas)
6. Build the Rooms List
   - Maps spaces to FET room format using `buildRoomsList`
   - Each room includes its building reference
   - Default capacity is set to 30 if not specified
   - Rooms are identified by their space ID
7. Build Constraints (Time and Space)
   - Uses `buildConstraintsXML` to process both constraint types
   - Constraints are filtered by type ('time' or 'space')
   - Parameters are parsed from JSON strings if needed
   - Each constraint is added to the appropriate XML object using its FET name
   - **IMPORTANT**: Errors in parsing are caught and logged but don't fail the build
8. Build Preferred Rooms Constraints
   - Uses `buildPreferredRoomsConstraints` to handle activity location preferences
   - **CRITICAL**: Without this constraint, activities DO NOT get rooms assigned by default
   - For each activity with location preferences:
     - Find all split instances of that activity in the activities list
     - Create a `ConstraintActivityPreferredRooms` entry for each instance
     - Include all preferred room IDs for that activity
   - Weight percentage is set to 95% (soft constraint but highly preferred)
   - These constraints are added to the `Space_Constraints_List`
9. Build the final XML structure
   - Assembles all components into the FET XML format
   - Includes metadata: version (7.3.0), institution name, and credits
   - Uses `XMLBuilder` with specific options:
     - `ignoreAttributes: false` - preserves XML attributes
     - `format: true` - creates readable formatted XML
     - `suppressEmptyNode: true` - removes empty nodes
     - `attributeNamePrefix: '@_'` - prefixes attributes with @\_
   - Returns the complete XML string ready for FET processing

### Important Gotchas

1. **All names in FET are IDs, not human-readable names**
   - Teacher names are UUIDs, not "John Smith"
   - Subject names are numeric IDs, not "Mathematics"
   - This is critical for data integrity and lookup
2. **Activity splitting is automatic but specific**
   - The function calculates splits based on total periods vs periods per instance
   - All splits share the same `Activity_Group_Id` and `Comments` which is the important one
3. **Student hierarchy is strict**
   - Students in no subgroup = cannot be used in activities
   - The hierarchy must be Year → Group → Subgroup
   - Even individual students must be wrapped in this structure
4. **Room constraints are NOT automatic**
   - FET will not assign rooms unless explicitly constrained
   - The `ConstraintActivityPreferredRooms` must be generated separately
   - This applies to EVERY activity instance (including splits)
5. **Constraint parameters are stored as JSON**
   - Must be parsed from strings when building XML
   - Errors are caught and logged but don't break the build
   - Each constraint type has its own XML section

Once this xml file has been build, it then gets passed into the api/timetables/generate endpoint with:

- The timetable id
- The draft object itself
- the generated xml content

## API Endpoint generation (NOT FINISHED)

This post request does the following.

1. Firstly, the user must be authenticated as an admin in order to run it
2. Unpack the json package
3. Create a new DockerService
   - Creates a container called 'eddi-fet-1'

## FET output processing

From the FET software, there are numerous output files that will be produced in the docker container that are then retirieved and stored in object storage. This would be under /schoolId/timetableId/timetableDraftId/output/*

The file that we are particularly interested in has the suffix "_timetable.csv". This file contains information about all the timetable activity allocations for a cycle.

This file contains the following headers:

- Activity Id
  - Irrelevant to us (auto generated by fet)
- Day
  - the id of the day object
- Hour
  - the id of the period object
- Student Sets
  - either year, group, subgroup or a combination of one or more
- Subject
  - the id of the subject offering
- Teachers
  - id of one or more teachers
- Activity Tags
  - Null (never set)
- Room
  - the id of the space
- Comments
  - The id of the class that its associated to

All of the parsing of this file is done through the parseTimetableCSVAndPopulateClasses function in the scripts/process file. This turns all of the data into the following database objects:

- fetSubjectOfferingClass
  - Refers to a subjectOfferingClass once published
- fetSubjectClassAllocation
  - Refers to a subjectOfferingClassAllocation once published
- fetSubjectOfferingClassUser
  - Refers to a userSubjectOfferingClass once published

(not happy with naming inconsistencies here btw - would want to omit subject and just have offering in my opinion)

## Object Storage structure

### Docker Container File Storage

The Docker container (named `eddi-fet-1`) uses a dedicated working directory structure for processing timetables:

```text
/app/timetables/{queueId}/
├── input/
│   └── {fileName}.fet       # Input FET XML file
└── output/
    ├── {prefix}_timetable.csv
    ├── {prefix}_conflicts.txt
    ├── {prefix}_statistics.txt
    ├── various HTML files
    ├── various XML files
    └── other FET output files
```

**Key Points:**

- Each queue entry gets its own isolated working directory identified by the queue ID
- The input directory contains the FET XML file that was streamed from the application
- The output directory is where FET generates all its results
- After processing completes (success or failure), the entire working directory `/app/timetables/{queueId}/` is cleaned up and removed
- Files are streamed directly to the container using `docker exec -i` with stdin, avoiding local filesystem writes

### Object Storage (MinIO) Structure

The application uses MinIO object storage with the bucket name `schools`. All FET-related files follow this hierarchy:

```text
schools/
└── {schoolId}/
    └── {timetableId}/
        └── {timetableDraftId}/
            ├── input/
            │   └── {fileName}.fet           # Original input file
            └── output/
                ├── *_timetable.csv          # Main timetable allocation data (CRITICAL)
                ├── *_conflicts.txt          # Constraint conflicts report
                ├── *_statistics.txt         # Processing statistics
                ├── *.html                   # HTML reports
                ├── *.xml                    # Various XML outputs
                └── ...                      # All other FET output files
```

**Storage Path Pattern:**

```text
schools/{schoolId}/{timetableId}/{timetableDraftId}/{input|output}/{fileName}
```

**Key Points:**

- The structure uses IDs at every level for data integrity
- Both input and output files are preserved in object storage
- The `*_timetable.csv` file (with suffix) is the critical output used for database population
- All FET output files are uploaded to object storage, regardless of their utility
- Content types are determined by file extension:
  - `.html` / `.htm` → `text/html`
  - `.xml` / `.fet` → `application/xml`
  - `.csv` → `text/csv`
  - `.txt` → `text/plain`
  - Other → `application/octet-stream`

### File Processing Flow

1. **Upload Phase:**
   - Input FET file is uploaded to object storage at: `schools/{schoolId}/{timetableId}/{timetableDraftId}/input/{fileName}`
   - Queue entry is created with status `queued`

2. **Processing Phase:**
   - File is retrieved from object storage as a Buffer
   - Working directory created in Docker: `/app/timetables/{queueId}/`
   - File streamed directly to Docker container at: `/app/timetables/{queueId}/input/{fileName}`
   - FET command executed with input and output directories specified
   - Queue status updated to `inProgress`

3. **Output Phase:**
   - All output files listed from: `/app/timetables/{queueId}/output/`
   - Each file is read from the Docker container
   - Each file is uploaded to object storage at: `schools/{schoolId}/{timetableId}/{timetableDraftId}/output/{fileName}`
   - The `*_timetable.csv` file is identified and parsed for database updates
   - Queue status updated to `completed` or `failed`

4. **Cleanup Phase:**
   - Docker working directory `/app/timetables/{queueId}/` is removed
   - Object storage files remain permanently (no cleanup)
   - Container workspace can be manually cleaned with: `docker exec eddi-fet-1 rm -rf /app/timetables/*`

### Important Notes

- **No Local Filesystem Usage:** Files are never written to the application server's filesystem; they go directly from memory → Docker or memory → MinIO
- **Isolated Processing:** Each timetable draft maintains complete isolation in object storage
- **Draft Versioning:** Multiple drafts under the same timetable are distinguished by `timetableDraftId`
- **Idempotency:** The same input file can be reprocessed multiple times as each queue entry gets a unique working directory
- **Error Persistence:** When FET processing fails, the error message is stored in the draft record, but the input file remains in object storage for debugging
- **File Retrieval:** The `getFileFromStorage` function handles the path structure: `{schoolId}/{timetableId}/{timetableDraftId}/{input|output}/{fileName}`

## Timetable queue (NOT FINISHED)
