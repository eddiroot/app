# Roadmap

## eddi

### Done

- [x] Create lessons with drag'n'drop blocks
- [x] Create lessons based on textbooks, slides, PDFs, images, etc
- [x] Discussions (subject level)
- [x] View your timetable
- [x] Live whiteboards
- [x] AI Tutor "eddi" (teaching focus, not giving answers)
- [x] Class announcements
- [x] Order topics and lessons within them
- [x] Proper rich text editor
- [x] Setup object storage
- [x] Admin dashboard
- [x] Add draggable interactive components such as matching
- [x] Move home above discussion in sidebar if only 1 class
- [x] Roll call / attendance
- [x] Sick/not coming to school/absence
- [x] Absence notifications
- [x] Behavioural reporting (visible to parents)
- [x] Auto generated summaries of discussions
- [x] Option for teachers to disable eddi AI on a task
- [x] Onboarding flow
- [x] Switch locations to buildings and rooms
- [x] Basic timetabling (Frontend/Backend)
- [x] Basic timetabling (Generation)
- [x] Basic timetabling (Processing)
  - [x] Learn how to use fet-cl to automate it [see arch package here](https://aur.archlinux.org/packages/fet-timetabling)
  - [x] Add a constraint to disable multiple activities of same subject on same day
- [x] Coursemap flow
- [x] Fix lesson generation with learning areas and content
- [x] Admin dashboard allocations page
- [x] Google/Microsoft Auth
- [x] Basic timetabling (Import)
  - [x] Generate page shows loading state while generating
  - [x] Result screen blocked until a timetable is generated
- [x] Teachers can see past attendance
- [x] Events appearing in everyone's timetables
- [x] RSVP for school events
- [x] Basic security research and compliance documentation
- [x] View students work on tasks
- [x] Create school news & news feed
- [x] Class tests / quizzes
- [x] Arithmetic/formula (handling maths in a friendly way)
- [x] Image / Video / Audio
- [x] Move away from ChromaDB to pgvector

### Doing

All

- [ ] Security review e.g. prompt injection
- [ ] Content security policy in `svelte.config.js`
- [ ] Check uniqueness rules on tables
- [ ] Home pages and feature pages
- [ ] Shift away from static school id for OAuth (search TODO)

Bella

- [ ] Refine task block UI/UX
- [ ] Fix task bug where state is saved for first block despite deletion (chat to Lachie for context)
- [ ] Rich text editing on discussions for new posts

Jack

- [ ] Refactoring Task Blocks to lang
- [ ] Improved lesson generation
- [ ] Improved lesson/assessment plan
- [ ] Chatbot
  - [ ] Hints
  - [ ] Generate example
- [ ] Post summaries (include nested comments but pass them in a structure to gemini)

Raph

- [ ] Whiteboard
  - undo/redo
  - Fix colour options/view + tooltip, colour options popout instead of in menu?
  - shape border width change issues
  - add shape roundness option
  - layering options?
  - text with websocket
  - text adding mechanics

### To Do

- [ ] Subject selection
- [ ] Handling of multiple campuses
- [ ] Advanced timetabling (30/08)
  - [ ] Timetable constraint handling (e.g. preferred lab space for science subject)
  - [ ] When transitioning from grouped by classes to grouped by preferences, we need to create groups for all of the students with the same preferences for efficiency and to ensure their classes are scheduled at the same time.
  - [ ] Checkbox to add a recess and lunchtime period post timetable generation in first and second gap respectively (or allow them to set specific time)
- [ ] Class space shifts (21/08)
  - [ ] Changing spaces and handling of this
- [ ] A what to do button to generate study ideas (04/08)
- [ ] Fleshed out behavioural reporting (see toddle) (new incident button on attendance page)
- [ ] Student reports live throughout semester (10/08)
  - [ ] Creating a profile page for the students
- [ ] Diagram (with movable input boxes) (pair with Lachie to sync on matching)
- [ ] Highlight (more than one word at once)
- [ ] Fill blank (partition box into multiple if multi word answer)
- [ ] On graph block, colour core x/y axis lines differently
- [ ] Editable table block for students (is editable checkbox) (add questions on top of the table that teacher can add)
- [ ] Parent/teacher interviews
- [ ] Teacher to parent comms (one way)
- [ ] Student note writing
- [ ] Complete LLM access to discussions + lessons
- [ ] Lesson plans / teacher notes based on generated lesson
- [ ] See teacher's feedback
- [ ] AI feedback / assisted marking
- [ ] Associate chatbot chats with the lesson/subject they were created in
- [ ] Permission for children to go to events
- [ ] See example lessons in subject selection
- [ ] eddi tutor extended to help teachers with common functionality (or action it for them through MCP servers)
- [ ] Fees / breakdowns
- [ ] Review breadcrumbs on all pages (e.g. attendance history)
- [ ] News posts have a percentage of the students in the school who've seen/read it
- [ ] Consider using Google/Microsoft/OAuth provider sessions rather than managing our own
- [ ] Interactive map of locations in the school with directions
- [ ] Exam timetabling
- [ ] Subtype for Assessments (SAC?)
- [ ] Export all data for a given school
- [ ] Premade math symbols to insert in rich text editor
  - Option in RTE toolbar brings up a modal
  - Clicking on a formula in the modal inserts it into the editor
- [ ] Check-in check-out software (compass does this)
- [ ] Workspaces (like VMs but for coding)
- [ ] App-wide search
- [ ] Club pages / discussions
- [ ] Whole school metrics
- [ ] Class chat
- [ ] Video meetings
- [ ] AI presentations
- [ ] Notifications for high interaction with discussion (eg 10 upvotes)
- [ ] Plagiarism detection
- [ ] Lesson / class plan marketplace
- [ ] Contractors signing in with working with childrens checks (eg school photographers)
- [ ] Keyboard shortcuts
- [ ] Parent forum / teacher forum
- [ ] Mark absence for select periods of the day rather than whole day
- [ ] Add per-school theming [with this](https://github.com/huntabyte/shadcn-svelte/discussions/1124)
