### Subject Has Preferred Room

- **Type**: Space constraints (subject)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Links subjects to specialized facilities
- **Use Case**: Specialized equipment requirements
- **Detailed Examples**:
  - **Science Subjects**:
    - **Chemistry** → Chemistry Lab (fume hoods, gas connections, emergency shower)
    - **Physics** → Physics Lab (specialized equipment, electrical outlets, demonstration# FET Timetabling Constraints - Complete Guide

This document provides a comprehensive overview of all constraints available in FET (Free Educational Timetabling) software, their use cases, examples, and whether they are mandatory or repeatable.

## Basic Constraints (Mandatory)

### Basic Compulsory Time Constraints

- **Type**: Time constraints (misc)
- **Weight**: Must be 100%
- **Mandatory**: YES
- **Repeatable**: NO
- **Purpose**: Ensures that a teacher never instructs two or more activities at the same time, and students have maximum one activity per period
- **Use Case**: Essential foundation constraint that must always be included
- **Detailed Examples**:
  - **Scenario**: Mr. Johnson teaches both 9A Mathematics and 10B Physics
  - **Without constraint**: System might schedule both classes at Monday 2nd period
  - **With constraint**: System ensures Mr. Johnson can only teach one class per time slot
  - **Student perspective**: Student Sarah in class 9A cannot have both Mathematics and English scheduled simultaneously
  - **Result**: Clean, conflict-free basic timetable structure

### Basic Compulsory Space Constraints

- **Type**: Space constraints (misc)
- **Weight**: Must be 100%
- **Mandatory**: YES
- **Repeatable**: NO
- **Purpose**: Ensures that a room never has two or more activities scheduled simultaneously
- **Use Case**: Essential foundation constraint for room allocation
- **Detailed Examples**:
  - **Scenario**: Science Lab 1 is needed for both Chemistry (Class 11A) and Physics (Class 10B)
  - **Without constraint**: Both classes might be scheduled in Science Lab 1 at Tuesday 3rd period
  - **With constraint**: System ensures only one class uses Science Lab 1 per time slot
  - **Physical impossibility prevented**: Two classes cannot physically occupy the same space
  - **Equipment sharing**: Prevents conflicts over specialized lab equipment
  - **Safety considerations**: Ensures proper supervision ratios in specialized rooms

## Availability Constraints

### A Teacher is Not Available

- **Type**: Time constraints (teachers)
- **Weight**: Must be 100%
- **Mandatory**: When applicable
- **Repeatable**: YES (for different teachers/time periods)
- **Purpose**: Blocks specific time periods when teachers cannot teach
- **Use Case**: Teacher has meetings, training, or personal commitments
- **Detailed Examples**:
  - **Department Meeting**: Ms. Rodriguez (Math dept head) unavailable Mondays 1st period for weekly department meetings
  - **Parent Conferences**: Mr. Thompson unavailable Thursdays 7th-8th periods during parent conference weeks
  - **Medical Appointment**: Mrs. Chen unavailable Fridays 2nd period for ongoing physical therapy
  - **External Training**: Art teacher unavailable all day Wednesday for professional development workshop
  - **Part-time Schedule**: Ms. Davis (0.6 FTE) unavailable Mondays and Fridays entirely
  - **Personal Commitment**: Coach Williams unavailable Thursdays 6th period to attend child's school play
- **Implementation Tips**:
  - Add these constraints early in the setup process
  - Regular commitments should be permanent constraints
  - Temporary unavailability can be added for specific terms/weeks
- **Note**: Not available periods are not counted as gaps in gap calculations

### A Students Set is Not Available

- **Type**: Time constraints (students)
- **Weight**: Must be 100%
- **Mandatory**: When applicable
- **Repeatable**: YES (for different student groups/time periods)
- **Purpose**: Blocks specific time periods when student groups cannot attend classes
- **Use Case**: School assemblies, field trips, special events
- **Detailed Examples**:
  - **Weekly Assembly**: All Year 7 students unavailable Tuesdays 1st period for year group assembly
  - **Work Experience**: Year 10 students unavailable Friday afternoons (periods 6-8) for workplace placements
  - **Sports Teams**: School basketball team (mixed year groups) unavailable Wednesdays 3rd period for district competitions
  - **Music Program**: School choir members unavailable Thursday lunchtimes for rehearsals before concerts
  - **External Examinations**: Year 12 students unavailable specific weeks during final examination periods
  - **Field Trip**: Class 8B unavailable all day Tuesday for museum visit
  - **Medical Checkups**: Year 9 students unavailable Mondays 2nd period during annual health screening week
  - **Career Guidance**: Senior students unavailable select Fridays 7th period for university counselor visits
- **Complex Scenarios**:
  - **Overlapping Groups**: If some Year 10 students are also in advanced mathematics, ensure the advanced math class accommodates the work experience unavailability
  - **Rotating Schedules**: Different student groups unavailable on alternating weeks
  - **Partial Group Unavailability**: When only some students from a class are unavailable, may need to split activities

### A Room is Not Available

- **Type**: Space constraints (rooms)
- **Weight**: Must be 100%
- **Mandatory**: When applicable
- **Repeatable**: YES (for different rooms/time periods)
- **Purpose**: Blocks specific time periods when rooms cannot be used
- **Use Case**: Room maintenance, special events, shared facilities
- **Example**: Gymnasium unavailable Tuesday mornings for external basketball league

### Break (All Teachers + All Students Not Available)

- **Type**: Time constraints (misc)
- **Weight**: Must be 100%
- **Mandatory**: When applicable
- **Repeatable**: YES (for different time periods)
- **Purpose**: Easy way to declare that all teachers and students are unavailable
- **Use Case**: Lunch breaks, assembly periods, whole-school events
- **Example**: Daily lunch break from 12:30-13:20

## Activity Distribution Constraints

### Min Days Between a Set of Activities

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: Automatically added for split activities
- **Repeatable**: YES
- **Purpose**: Ensures activities are spread across multiple days
- **Use Case**: Prevents clustering all lessons of a subject on consecutive days
- **Detailed Examples**:
  - **Mathematics Course**: 4 periods per week split as 1+1+1+1 with min 1 day between
    - ✅ **Good**: Mon(Math), Wed(Math), Thu(Math), Fri(Math)
    - ❌ **Bad**: Mon(Math), Tue(Math), Wed(Math), Thu(Math)
    - **Weight 95%**: Occasionally allows consecutive days if absolutely necessary
    - **Weight 100%**: Strictly enforces distribution
  - **Science Lab Sessions**: 3-hour course split as 2+1 with min 1 day between
    - ✅ **Good**: Tue(2h Lab), Thu(1h Theory)
    - ❌ **Bad**: Tue(2h Lab), Wed(1h Theory)
  - **Language Learning**: 5 periods split as 2+2+1 with min 1 day between
    - ✅ **Good**: Mon(2h), Wed(2h), Fri(1h) - spread across 3 days
    - ⚠️ **Acceptable with consecutive flag**: Tue(2h), Wed(1h), Fri(2h)
    - ❌ **Bad**: All periods Monday-Wednesday consecutively

- **Advanced Configurations**:
  - **Min 2 days**: For intensive subjects requiring processing time
    - **Music Theory**: 3 periods with min 2 days → Mon, Wed, Fri
  - **Consecutive Flag ON**: When activities on same day must be consecutive
    - **Double Science**: 2+2+1 → If Tue has 2 periods, they must be back-to-back
  - **Consecutive Flag OFF**: Activities on same day can be separated
    - **Mathematics**: Mon 1st period, Mon 6th period (separated by other subjects)

- **Weight Impact Examples**:
  - **100% weight**: System will reject impossible combinations
  - **95% weight**: ~5% chance of allowing violations when necessary
  - **90% weight**: More flexible, allows violations in ~10% of retries
  - **0% weight**: No enforcement, activities can cluster

- **Subject-Specific Applications**:
  - **Physical Education**: Spread to avoid muscle fatigue
  - **Languages**: Distributed for better retention
  - **Mathematics**: Regular practice reinforcement
  - **Arts**: Time for creative processing between sessions

### Max Days Between a Set of Activities

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: Rarely needed
- **Repeatable**: YES
- **Purpose**: Limits the maximum spread of activities
- **Use Case**: Ensures course completion within reasonable timeframe
- **Example**: 6-period course must be completed within 4 days maximum

## Daily Hour Constraints

### Min Hours Daily for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES (for different teachers)
- **Purpose**: Ensures teachers have minimum teaching hours per day
- **Use Case**: Contract requirements or workload balancing
- **Example**: Full-time teachers must teach minimum 4 hours daily
- **Warning**: Can create substitution problems if teachers are absent

### Max Hours Daily for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO (but recommended for balance)
- **Repeatable**: YES (for different teachers)
- **Purpose**: Prevents teacher overload on single days
- **Use Case**: Workload balancing, teacher wellbeing
- **Detailed Examples**:
  - **Full-time Secondary Teacher**: Max 6 hours daily
    - **Monday**: Periods 1,2,4,5,7,8 (6 hours, 1 gap at period 3)
    - ✅ **Acceptable**: Even distribution with one break
    - ❌ **Rejected**: 7+ hours would exceed limit
  - **Elementary Teacher**: Max 5 hours daily (age-appropriate intensity)
    - **Typical Day**: Periods 1,2,3,5,6 (4 hours direct teaching + 1 hour planning)
    - **Consideration**: Includes non-contact supervision time
  - **Part-time Specialist**: Max 4 hours daily
    - **Music Teacher**: Periods 2,3,6,7 across multiple schools
    - **Prevents**: Cramming all lessons into fewer days
  - **Department Head**: Max 5 hours teaching (allowing admin time)
    - **Friday Schedule**: 3 teaching periods + 2 admin blocks
    - **Flexibility**: Lower teaching load for management duties

- **Balancing Strategies**:
  - **Even Distribution**: 6 hours × 5 days vs. 8 hours × 3 days + lighter days
  - **Subject Intensity**: Limit demanding subjects (advanced math) to 4 hours daily
  - **Preparation Time**: Account for lesson planning between classes
- **Common Configurations by Role**:
  - **New Teachers**: 5 hours (reduced for adjustment)
  - **Senior Teachers**: 6 hours (standard full-time)
  - **Coaches**: 4 hours (physical demands)
  - **Lab Coordinators**: 5 hours (setup/cleanup time needed)
- **Interaction with Other Constraints**:
  - Works with **Max Gaps** to create efficient schedules
  - Coordinates with **Max Days per Week** for work-life balance
  - Considers **Min Days Between Activities** for split courses

### Min Hours Daily for a Students Set

- **Type**: Time constraints (students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES (for different student groups)
- **Purpose**: Ensures students have minimum daily instruction
- **Use Case**: Curriculum requirements
- **Example**: Senior students must have minimum 5 periods daily

### Max Hours Daily for a Students Set

- **Type**: Time constraints (students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO (but recommended)
- **Repeatable**: YES (for different student groups)
- **Purpose**: Prevents student overload
- **Use Case**: Age-appropriate scheduling, attention span considerations
- **Example**: Primary students maximum 5 hours daily

### Max Hours Daily with an Activity Tag (Teachers/Students)

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Limits specific types of activities per day
- **Use Case**: Preventing too much of intensive subjects (labs, sports)
- **Example**: Maximum 2 hours of laboratory work per day

## Weekly Constraints

### Max Days Per Week for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO (but often desired)
- **Repeatable**: YES (for different teachers)
- **Purpose**: Allows teachers to have free days
- **Use Case**: Part-time teachers, work-life balance
- **Detailed Examples**:
  - **Part-time Art Teacher (0.6 FTE)**: Max 3 days per week
    - ✅ **Schedule**: Monday(6h), Wednesday(5h), Friday(4h) = 15h total
    - ✅ **Benefits**: Tuesdays/Thursdays free for other employment or personal time
    - ❌ **Avoided**: Spreading 15 hours across 5 days with many gaps
  - **Specialist Music Teacher**: Max 4 days per week
    - **Monday**: Periods 2,3,4,6 (School Choir + Classes)
    - **Tuesday**: Periods 1,3,5,7 (Individual lessons)
    - **Thursday**: Periods 2,4,5 (Orchestra + Theory)
    - **Friday**: Periods 1,6,7 (Concert prep + Assessment)
    - **Wednesday**: FREE DAY for external performances/teaching
  - **Mathematics Department Head**: Max 4 days teaching
    - **Teaching Days**: Mon, Tue, Thu, Fri (5-6 periods each)
    - **Admin Day**: Wednesday (full day for scheduling, meetings, observations)
    - **Total Load**: 20-24 teaching periods + administrative duties
  - **Senior Teacher Near Retirement**: Max 3 days per week
    - **Phased Retirement**: Maintaining experience while reducing workload
    - **Mentoring Focus**: Available 3 intensive days for new teacher support
  - **Shared Position Between Schools**: Max 3 days per school
    - **School A**: Monday, Wednesday, Friday
    - **School B**: Tuesday, Thursday
    - **Coordination**: Ensures no double-booking between institutions

- **Implementation Considerations**:
  - **Check Activity Constraints**: Ensure min days between activities doesn't conflict
    - **Problem**: Teacher has 4 split activities with min 1 day + max 3 days per week
    - **Solution**: Reduce min days or increase max days
  - **Substitution Impact**: Fewer working days = less coverage availability
    - **Risk**: Teacher unavailable 2 days/week → harder to cover absences
    - **Mitigation**: Ensure adequate substitute teacher pool
  - **Department Coordination**:
    - **Mathematics Team**: If dept head works 4 days, ensure other math teachers cover all 5 days
    - **Specialist Subjects**: Art teacher's 3-day schedule must align with student needs across all year groups

- **Progressive Implementation**:
  1. **Start with teachers with lowest weekly hours**
  2. **Test timetable solvability after each addition**
  3. **Remove constraint if timetable becomes unsolvable**
  4. **Try next teacher in order of preference**

### Min Days Per Week for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: Rarely needed
- **Repeatable**: YES
- **Purpose**: Forces teachers to work minimum days
- **Use Case**: Usually better achieved through other constraints
- **Example**: Supervisor must be present minimum 4 days per week

## Gap Constraints

### Max Gaps Per Week for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO (but recommended for optimization)
- **Repeatable**: YES (for different teachers)
- **Purpose**: Minimizes free periods during work days
- **Use Case**: Efficiency, teacher satisfaction
- **Detailed Examples**:
  - **Experienced Teacher**: Max 2 gaps per week
    - **Monday**: P1(Math 9A), P2(Math 9B), P3(GAP), P4(Math 10A), P5(Algebra 11)
    - **Tuesday**: P1(Math 9A), P2(Free), P3(Math 10B), P4(Math 9C), P5(Calculus 12)
    - **Total**: 2 gaps total across the week
    - ✅ **Benefit**: Concentrated teaching, minimal waiting time
  - **Department Head**: Max 4 gaps per week (allows admin flexibility)
    - **Monday**: P1(Teaching), P2(GAP-Admin), P3(Teaching), P4(GAP-Meeting), P5(Teaching)
    - **Tuesday**: P1(Teaching), P2(Teaching), P3(GAP-Planning), P4(Teaching), P5(Free)
    - **Use of Gaps**: Administrative duties, teacher observations, planning
  - **New Teacher**: Max 5 gaps per week (extra planning time)
    - **Rationale**: Additional preparation time for lesson planning
    - **Mentoring**: Gaps aligned with mentor teacher's free periods
    - **Professional Development**: Time for classroom observation of experienced teachers
  - **Laboratory Coordinator**: Max 3 gaps per week
    - **Special Consideration**: Gaps needed for equipment setup/cleanup
    - **Monday**: P1(Chemistry 11), P2(GAP-Lab Prep), P3(Chemistry 12), P4(GAP-Cleanup), P5(Free)
    - **Efficiency**: Gaps strategically placed around lab sessions

- **Implementation Strategy**:
  - **Phase 1**: Start with max 8 gaps per week for all teachers
  - **Phase 2**: Test timetable generation successfully
  - **Phase 3**: Reduce to 6 gaps per week, regenerate
  - **Phase 4**: Continue reducing until timetable becomes unsolvable
  - **Phase 5**: Return to last successful value
- **Differentiated Approach**:
  - **Full-time Teachers with Free Days**: Max 1-2 gaps per week
    - **Logic**: If working only 4 days, minimize gaps on working days
  - **Full-time Teachers (5 days)**: Max 3-4 gaps per week
    - **Balance**: Some flexibility while maintaining efficiency
  - **Part-time Teachers**: Max 2 gaps per week
    - **Rationale**: Limited hours should be concentrated
- **Subject-Specific Considerations**:
  - **PE Teachers**: Max 2 gaps (equipment setup/takedown needs)
  - **Science Teachers**: Max 3 gaps (lab preparation time)
  - **Art Teachers**: Max 3 gaps (materials preparation, cleanup)
  - **Music Teachers**: Max 4 gaps (instrument setup, individual lesson scheduling)
- **Realistic Scenarios**:
  - **Ms. Johnson (Full-time Math)**:
    - **25 periods teaching + max 3 gaps = 28 periods commitment**
    - **5 days × 6 periods = 30 total periods available**
    - **Result**: 2 completely free periods for duties/preparation
  - **Mr. Kim (Science Department Head)**:
    - **20 periods teaching + max 4 gaps + admin duties**
    - **Gaps used for**: Equipment checks, safety inspections, department meetings
    - **Strategic scheduling**: Gaps before/after lab sessions
- **Warning Signs**:
  - **Substitution Problems**: Too few gaps → difficulty covering absent teachers
  - **Teacher Burnout**: Zero gaps → no break time during intensive teaching days
  - **Inefficient Building Use**: Excessive gaps → teachers idle while classrooms occupied

### Max Gaps Per Day for a Teacher

- **Type**: Time constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Prevents scattered schedules within a day
- **Use Case**: Teacher efficiency, reduced waiting time
- **Example**: Maximum 1 gap per day for department heads

### Max Gaps Per Week/Day for Students

- **Type**: Time constraints (students)
- **Weight**: Variable (0-100%)
- **Mandatory**: Often YES for younger students
- **Repeatable**: YES
- **Purpose**: Maintains structured learning environment
- **Use Case**: Supervision requirements, learning continuity
- **Example**: Elementary students have zero gaps allowed

## Continuous Hour Constraints

### Max Hours Continuously for Teachers/Students

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO (but recommended)
- **Repeatable**: YES
- **Purpose**: Prevents fatigue from too many consecutive hours
- **Use Case**: Health and safety, attention span management
- **Example**: Maximum 3 consecutive hours of teaching
- **Note**: Indirectly affects minimum gaps per day

### Max Hours Continuously with Activity Tag

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Limits consecutive hours of specific activity types
- **Use Case**: Preventing fatigue from intensive subjects
- **Example**: Maximum 2 consecutive hours of laboratory work

## Span Constraints

### Max Span Per Day for Teachers/Students

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Limits the spread between first and last activity of the day
- **Use Case**: Reducing total time at school
- **Example**: Teacher's day spans maximum 8 hours (8 AM to 4 PM)
- **Note**: Span = last hour - first hour, regardless of gaps

## Early Start Constraints

### Students Begin Early

- **Type**: Time constraints (students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Forces student day to start in first period
- **Use Case**: Supervision requirements, structured schedules
- **Example**: All elementary classes start at first period

## Activity End Constraints

### An Activity Ends Students Day

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Ensures specific activities are scheduled at end of day
- **Use Case**: Activities not attended by all students, fortnightly activities
- **Example**: Optional music lesson scheduled at end of day

## Activity Relationship Constraints

### Two Activities Are Consecutive

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: When required
- **Repeatable**: YES
- **Purpose**: Forces activities to be scheduled back-to-back
- **Use Case**: Theory-practice combinations, double periods
- **Detailed Examples**:
  - **Chemistry Theory + Lab**:
    - **Theory (1h)** → **Lab (2h)** same day, consecutive periods
    - ✅ **Good**: Tuesday P3(Theory) → P4-5(Lab)
    - ❌ **Bad**: Tuesday P2(Theory), P5-6(Lab) with P3-4 gap
    - **Rationale**: Students apply theoretical concepts immediately in practical session
  - **Mathematics Double Period**:
    - **Advanced Calculus**: 2 consecutive periods for complex problem-solving
    - ✅ **Schedule**: Friday P1-2(Calculus) - no interruptions
    - **Alternative**: Could increase duration to 2 instead of using consecutive constraint
  - **Language Immersion**:
    - **French Conversation + Grammar**: Consecutive for linguistic flow
    - **Morning**: P2(Grammar) → P3(Conversation)
    - **Benefit**: Vocabulary from grammar immediately practiced in conversation
  - **Arts Integration**:
    - **Art History + Studio Practice**:
    - **Monday**: P4(Art History) → P5(Studio) → P6(Studio continuation)
    - **Flow**: Historical context → practical application → project completion
  - **Physical Education Extended**:
    - **Team Sports**: Warm-up + Game + Cool-down requires consecutive periods
    - **Wednesday**: P6(Skills) → P7(Game play)
    - **Safety**: No time gap between physical preparation and activity

- **Advanced Scenarios**:
  - **Three-Way Consecutive**: Biology → Chemistry → Physics (Science integration day)
    - **Constraint Setup**: Multiple consecutive constraints linking all three
    - **Tuesday**: P3(Bio) → P4(Chem) → P5(Physics)
    - **Theme**: Environmental science across disciplines
  - **Cross-Curricular Projects**:
    - **History + English**: Joint project on historical literature
    - **Thursday**: P2(History context) → P3(English analysis)
    - **Collaboration**: Two teachers, same student group, consecutive periods
  - **Assessment Sessions**:
    - **Written Exam + Oral Assessment**:
    - **Friday**: P5(Written test) → P6(Individual oral evaluations)
    - **Continuity**: No break between assessment components

- **Technical Considerations**:
  - **Same Teacher/Students**: Consider increasing duration instead of consecutive constraint
    - **More Efficient**: Single 2-hour activity vs. two 1-hour consecutive activities
    - **Simpler Timetabling**: Fewer constraints = easier to solve
  - **Room Requirements**:
    - **Same Room**: Activities often need same specialized space
    - **Different Rooms**: Lab → Classroom → Field (consider travel time)
  - **Break Periods**: Break between consecutive activities is allowed and automatic
    - **Example**: P3(Theory) → BREAK → P5(Lab) still considered "consecutive"

- **Implementation Tips**:
  - **High Weight (95-100%)**: When pedagogically essential
  - **Medium Weight (80-90%)**: When preferred but not critical
  - **Multiple Options**: Create several possible consecutive pairs if flexible
  - **Room Compatibility**: Ensure both activities can use available spaces consecutively

### Two/Three Activities Are Grouped

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: When required
- **Repeatable**: YES
- **Purpose**: Groups activities on same day without enforcing order
- **Use Case**: Related subjects, room efficiency
- **Example**: All science subjects grouped on same day

### Two Activities Are Ordered

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: Rarely needed
- **Repeatable**: YES
- **Purpose**: Enforces sequence where first activity comes before second
- **Use Case**: Prerequisites, logical progression
- **Example**: Theory lesson before practical application
- **Warning**: Very restrictive - often impractical due to absences/changes

### Min Gaps Between a Set of Activities

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: Rarely needed
- **Repeatable**: YES
- **Purpose**: Ensures minimum time between related activities
- **Use Case**: Digestion time, preparation needs
- **Example**: Minimum 2 hours between sports and academic subjects

## Time Slot Preferences

### An Activity Has Preferred Starting Time

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Guides activity placement to optimal time slots
- **Use Case**: Subject-specific timing preferences
- **Example**: Physical education preferred in morning periods

### An Activity Has Set of Preferred Time Slots

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Provides multiple acceptable time options
- **Use Case**: Flexible scheduling with constraints
- **Example**: Science labs preferred in periods 3, 4, or 5

### Set of Activities Has Set of Preferred Times

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Bulk time preferences for multiple activities
- **Use Case**: Department scheduling, activity type preferences
- **Example**: All mathematics classes preferred in morning slots

## Simultaneous Scheduling

### Set of Activities Same Starting Time (Day+Hour)

- **Type**: Time constraints (activities)
- **Weight**: Must be 100%
- **Mandatory**: When required
- **Repeatable**: YES
- **Purpose**: Forces activities to start at exactly same time
- **Use Case**: Parallel courses, option blocks
- **Detailed Examples**:
  - **Language Options Block**: All Year 9 students choose one language
    - **Tuesday P4**:
      - French (Class 9F) - Room 201 - Ms. Dubois
      - German (Class 9G) - Room 202 - Mr. Schmidt
      - Spanish (Class 9S) - Room 203 - Señora Lopez
    - **Result**: All Year 9 students have language class simultaneously
    - **Benefit**: No student misses other subjects due to language choice
  - **Elective Subjects Block** (High School):
    - **Thursday P6-7**: Senior elective block
      - Advanced Mathematics - Mr. Johnson - Room 101
      - Creative Writing - Ms. Parker - Room 205
      - Computer Programming - Mr. Chen - Computer Lab
      - Psychology - Dr. Williams - Room 301
      - Workshop Technology - Mr. Brown - Workshop
    - **Student Choice**: Each student enrolled in exactly one elective
    - **Timetable Impact**: Parallel scheduling prevents conflicts
  - **Religious Education/Ethics**:
    - **Monday P1**: Year 8 beliefs and values block
      - Christian Studies - Chaplain - Room 104
      - Islamic Studies - Imam Abdullah - Room 105
      - Jewish Studies - Rabbi Sarah - Room 106
      - Ethics/Philosophy - Mr. Thompson - Room 107
    - **Inclusion**: Accommodates diverse religious backgrounds
    - **Legal Compliance**: Meets requirements for religious education options
  - **Science Course Divisions**:
    - **Year 10 Science Options** - Friday P3-4:
      - Biology Focus - Ms. Green - Science Lab 1
      - Chemistry Focus - Dr. Blue - Science Lab 2
      - Physics Focus - Mr. Newton - Science Lab 3
      - General Science - Ms. White - Room 201
    - **Pathway Preparation**: Students choose focus area for senior years
  - **Vocational Training Block**:
    - **Year 11-12 Mixed Block** - Wednesday P5-8:
      - Hospitality Certificate - Chef Martin - Kitchen
      - Automotive Mechanics - Mr. Davis - Workshop
      - Business Studies - Ms. Corporate - Room 301
      - Health & Community Services - Nurse Jane - Health Center
    - **Mixed Year Levels**: Year 11 and 12 students in same options
    - **External Providers**: Some courses taught by industry professionals

- **Complex Implementation Examples**:
  - **Three-Tier Language Program**:
    - **Beginner Level**: Tuesday P2 (French 1, German 1, Spanish 1)
    - **Intermediate Level**: Tuesday P3 (French 2, German 2, Spanish 2)
    - **Advanced Level**: Tuesday P4 (French 3, German 3, Spanish 3)
    - **Student Progression**: Students move through levels over years
  - **Special Education Integration**:
    - **Mainstream + Support Options** - Monday P5:
      - Regular Mathematics - Room 101
      - Mathematics with Support - Room 102 (smaller class, aide present)
      - Individual Mathematics - Resource Room (1-on-1 support)
    - **Inclusion Focus**: Different support levels, same time slot
  - **Cross-Campus Coordination**:
    - **Shared Specialist Teachers** between schools:
    - **Both Schools Thursday P6**:
      - School A: Advanced Music - Visiting specialist
      - School B: Advanced Music - Same specialist via video link
    - **Resource Sharing**: Maximizes specialist teacher utilization

- **Technical Setup Requirements**:
  - **Room Allocation**: Must have enough suitable rooms available
  - **Teacher Allocation**: Each parallel activity needs qualified teacher
  - **Student Numbers**: Balance class sizes across options
  - **Equipment**: Ensure specialized equipment available for all streams
- **Benefits**:
  - **Student Equity**: All students get same time allocation regardless of choice
  - **Timetable Simplicity**: Other subjects unaffected by option choices
  - **Teacher Coordination**: Parallel teachers can collaborate on curriculum
  - **Assessment Alignment**: Common assessment times across options

- **Challenges**:
  - **Resource Intensive**: Requires multiple teachers and rooms simultaneously
  - **Enrollment Balancing**: May need minimum/maximum numbers per option
  - **Substitute Coverage**: If one teacher absent, affects multiple student pathways

### Set of Activities Same Starting Day

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: When required
- **Repeatable**: YES
- **Purpose**: Groups activities on same day, any hours
- **Use Case**: Course groupings, teacher efficiency
- **Example**: All biology activities on same day

### Set of Activities Same Starting Hour

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: When required
- **Repeatable**: YES
- **Purpose**: Schedules activities at same hour across different days
- **Use Case**: Parallel scheduling patterns
- **Example**: All first period homeroom classes

## Advanced Constraints

### Set of Activities Not Overlapping

- **Type**: Time constraints (activities)
- **Weight**: Variable (0-100%)
- **Mandatory**: Rarely needed
- **Repeatable**: YES
- **Purpose**: Prevents activities from overlapping in time
- **Use Case**: Special cases beyond basic constraints
- **Example**: Related activities that must be separate
- **Note**: Usually handled automatically by basic constraints

### Working in Hourly Interval Max Days Per Week

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Limits work during specific time periods
- **Use Case**: Evening classes, early morning restrictions
- **Example**: Teacher works evening hours maximum 2 days per week

### Min Resting Hours

- **Type**: Time constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Ensures minimum rest between consecutive working days
- **Use Case**: Schools with extended hours (early morning to late evening)
- **Example**: Minimum 8 hours rest between last evening and first morning class

## Space Constraints

### Teacher Has Home Room

- **Type**: Space constraints (teachers)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Assigns default classroom to teachers
- **Use Case**: Primary teachers with dedicated classrooms
- **Example**: Grade 3 teacher has classroom 101 as home room
- **Note**: Don't use with student home rooms simultaneously

### Students Set Has Home Room

- **Type**: Space constraints (students)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Assigns default classroom to student groups
- **Use Case**: Traditional classroom-based systems
- **Example**: Class 5A has room 201 as home base
- **Note**: Only needed if groups share rooms

### Subject Has Preferred Room

- **Type**: Space constraints (subject)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Links subjects to specialized facilities
- **Use Case**: Specialized equipment requirements
- **Example**: Chemistry classes prefer laboratory rooms

### Activity Has Preferred Room

- **Type**: Space constraints (activity)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Assigns specific room to individual activities
- **Use Case**: Special requirements, equipment needs
- **Example**: Orchestra practice requires music room with piano

### Set of Activities Occupies Max Different Rooms

- **Type**: Space constraints (activity)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Limits room changes for related activities
- **Use Case**: Teacher convenience, equipment continuity
- **Example**: One teacher's activities use maximum 2 different rooms
- **Warning**: Use only with easy timetables

### Activities Same Room if Consecutive

- **Type**: Space constraints (activity)
- **Weight**: Variable (0-100%)
- **Mandatory**: NO
- **Repeatable**: YES
- **Purpose**: Keeps consecutive activities in same room
- **Use Case**: Avoiding room changes between periods
- **Example**: Double periods remain in same classroom
- **Warning**: Use only with easy timetables

## Building Constraints

### Max Building Changes Per Day/Week

- **Type**: Space constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Limits movement between different buildings
- **Use Case**: Multi-campus schools, travel time considerations
- **Example**: Teachers maximum 1 building change per day

### Min Gaps Between Building Changes

- **Type**: Space constraints (teachers/students)
- **Weight**: Variable (0-100%)
- **Mandatory**: When applicable
- **Repeatable**: YES
- **Purpose**: Allows sufficient time for building changes
- **Use Case**: Large campuses, distant buildings
- **Example**: Minimum 1 period gap when changing buildings
- **Note**: Can also be used for floor changes by setting floors as "buildings"

## Weight Guidelines

- **100%**: Constraint MUST be satisfied
- **95-99%**: Highly preferred, rare violations acceptable
- **90-95%**: Strongly preferred
- **50-90%**: Moderately preferred
- **Below 50%**: Weakly preferred

## Best Practices

1. **Start Simple**: Add basic constraints first, then optimize
2. **Save Frequently**: Save with new filenames after adding constraints
3. **Test Solvability**: Check if timetable remains solvable after each addition
4. **Use High Weights Initially**: Start with high values and decrease if necessary
5. **Consider Substitution**: Be careful with too many restrictive teacher constraints
6. **Check Statistics**: Review generated statistics to verify constraint effects

## Common Constraint Combinations

### Elementary School Setup

- Basic compulsory constraints (100%)
- Students begin early (100%)
- Max gaps = 0 for students (100%)
- Home rooms for classes (95%)
- Max 5 hours daily for students (100%)

### High School Setup

- Basic compulsory constraints (100%)
- Max gaps per week for teachers (95%)
- Subject preferred rooms (100%)
- Max days per week for part-time teachers (100%)
- Activity same starting time for option blocks (100%)

### University Setup

- Basic compulsory constraints (100%)
- Activities same starting time for parallel sections (100%)
- Preferred rooms for specialized courses (100%)
- Min gaps between building changes (100%)
- Max building changes per day (95%)

This comprehensive guide covers all constraint types available in FET. The choice of constraints depends on your specific institutional requirements, student age groups, and facility constraints.
