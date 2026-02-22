# eddi

The all-in-one teaching, learning, and admin software suite for schools.

## Our Mission

- Save teachers time and give them the tools they need to teach effectively.
- Make school admin effortless and dramatically simplify everyday tasks.
- Give schools back control of their data and reduce the number of systems they need to run.

# Features

- **General**
  - [ ] Handling of multiple campuses
  - [ ] Dashboard
    - [ ] Show events as well as classes for the day
- **Admin**
  - [x] Admin dashboard
  - [ ] Class building/space shifts
  - [ ] Custom roles with selected permissions
- [x] **Attendance & Behaviours**
  - [x] Roll call / attendance
  - [x] Sick/not coming to school/absence with notifications
  - [x] Behavioural reporting (visible to parents) with incident levels
  - [x] Parents and teachers can view past attendance
  - [ ] Mark absence for select periods of the day rather than whole day
- [x] **Curriculum & Coursemap**
  - [x] Coursemap flow
- [x] **Discussions & Chat**
  - [x] One click to generate thread summaries with AI
  - [x] Class announcements / Q&As
  - [ ] Teacher to parent chats
  - [ ] Premade math symbols to insert in rich text editor
    - Option in RTE toolbar brings up a modal
    - Clicking on a formula in the modal inserts it into the editor
- [x] **Grades and Profiles**
  - [ ] Live, up-to-date profile page with student information visible to them and parents
- [x] **News**
  - [x] Create news for the school
  - [x] View news on a feed
  - [ ] Analytics on who in the school has seen/read it
- [x] **Tasks & Resources**
  - [x] Create tasks with drag and drop blocks
    - [x] Interactive components such as matching, highlighting
    - [x] Specialised math blocks e.g. math input and graphing
    - [ ] Unique x/y axis line colour on graph block
    - [ ] Table block optionally editable for students
  - [ ] Create tasks based on textbooks, slides, PDFs, images, etc
    - [x] Align lesson generation with learning areas and content
  - [x] Class tests / quizzes
  - [ ] See teacher's feedback
  - [ ] Presentation mode
  - [ ] Live and collaborative whiteboards
    - Undo/redo
    - Fix colour options/view + tooltip, colour options popout instead of in menu?
    - shape border width change issues
    - add shape roundness option
    - layering options?
    - text with websocket
  - text adding mechanics
  - [x] Rich text editor
  - [x] Order topics and tasks
  - [ ] eddi AI
    - [x] Option for teachers to disable the tutor
    - [ ] Analytics on chatbot usage with the lessons/subjects they were created in
    - [ ] A what to do button to generate study ideas
    - [ ] Help teachers with common functionality or action it for them
  - [x] Review students' work and/or submissions
- [x] **Timetables & Events**
  - [ ] Generate timetables
  - [x] View classes in calendar
  - [x] View events in calendar
  - [ ] Subject selection
    - [ ] Experience the subject async e.g. up week
  - [ ] Parent/teacher interviews
  - [ ] Exam timetabling
  - [ ] RSVPs / permission for children to go to events
  - [ ] Advanced timetabling
    - [ ] Timetable constraint handling (e.g. preferred lab space for science subject)
    - [ ] When transitioning from grouped by classes to grouped by preferences, we need to create groups for all of the students with the same preferences for efficiency and to ensure their classes are scheduled at the same time.
    - [ ] Checkbox to add a recess and lunchtime period post timetable generation in first and second gap respectively (or allow them to set specific time)
- [x] **Other**
  - [x] Google/Microsoft Auth
    - [ ] Consider using their auth sessions rather than managing our own
  - [x] Object storage for school logo, user avatars, resource assets
  - [x] Basic security research and compliance documentation
  - [ ] Security review e.g. prompt injection
  - [ ] Review breadcrumbs on all pages (e.g. attendance history)
  - [ ] Content security policy in `svelte.config.js`
  - [ ] Check uniqueness rules + indexes on tables
  - [ ] Home pages and feature pages
  - [ ] Shift away from static school id for OAuth (search TODO)
- [ ] **Endgame**
  - [ ] Export all data for a given school
  - [ ] Check-in check-out system for students entering school late or leaving school early
  - [ ] Student note writing with teacher access
  - [ ] Lesson / class plan marketplace
  - [ ] App-wide search
  - [ ] Whole school metrics
  - [ ] Fees / breakdowns
  - [ ] Keyboard shortcuts
  - [ ] Contractors signing in with working with childrens checks (eg school photographers)
  - [ ] Interactive map of locations in the school with directions
  - [ ] Per-school theming [with this](https://github.com/huntabyte/shadcn-svelte/discussions/1124)

# Pricing

While eddi isn't out yet, we do have some ideas on pricing and will welcome any suggestions from the public.

1. eddi has only one pricing tier. There will only ever be one pricing tier. Every customer of eddi's gets the same advanced functionality, forever.
2. The pricing is at a set rate so that the school can accurately estimate costs.
3. AI usage costs will not be bundled in with the pricing, and instead billed on top of the yearly amount.
4. You may utilise shared accounts if you wish, though we advise having one account per person to fully utilise eddi's capabilities.

Pricing will initially be set at $20 per user per year exclusive of AI usage. A user may be a student, teacher, or someone else in the school's staff.

# Contributing

We don't expect contributions from members outside of the core team. Though, if you feel passionate about eddi's cause and want to help out, we welcome issues and/or pull requests!

Please note we cannot provide any guarantees at this stage on whether we will read, action, or consider these.

# Developing

## Setup

```bash
docker compose -f docker-compose.dev.yml up -d
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Reset

```bash
docker compose -f docker-compose.dev.yml down --volumes
docker compose -f docker-compose.dev.yml up --detach
npm run db:push
npm run db:seed
npm run dev
```

## Git Tricks

If you need to clear all local branches except main:

```bash
git branch | grep -v "main" | xargs git branch -D
```

## UI

To add new [shadcn-svelte components](https://www.shadcn-svelte.com/docs/components), use this command:

```bash
npx shadcn-svelte@latest add component-name-here
```
