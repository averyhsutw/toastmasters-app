# Toastmasters Club Management Website Plan

## Goal

Build a small but credible full-stack web app within 10 days that demonstrates end-to-end product thinking, back-end API design, front-end implementation, and deployment. The product should solve a real Toastmasters club workflow and be strong enough to support:

- the three English application answers
- a second-round interview discussion
- a short live demo

## Why Next.js Is A Good Fit

Next.js is a reasonable primary choice for this project because it lets you keep the entire demo in one codebase while still showing full-stack capability.

- Front end: React-based UI with App Router pages and components
- Back end: Route Handlers under `app/api` for REST-style APIs
- Data fetching: React Query for member task pages and secretary editing flows
- Deployment: Vercel is the lowest-friction path for a polished demo
- Interview value: easy to explain one framework, one repo, one deployment pipeline

For a 10-day project, this is better than splitting front end and back end into separate repos because that would increase setup, deployment, and debugging cost without improving the demo much.

## Recommended MVP Scope

The MVP should focus on one weekly meeting workflow.

### User Roles

- Member
- Secretary
- Toastmaster for the current meeting

### Core User Flows

1. Authentication
- Members log in with pre-created accounts.
- Seed one secretary account and several member accounts for demo purposes.

2. Meeting role table
- Secretary creates this week's meeting.
- Secretary edits the initial role assignment table.
- Table columns: role, assignee, confirmation status.
- Everyone can view the table.
- Only secretary and the current Toastmaster can change role entries or reassign members.
- Extra roles can be added, such as a second Prepared Speaker or Ah-Counter.

3. Personal task list
- Each member has a personal task page.
- Tasks are generated from the member's assigned role.
- Examples:
  - confirm attendance
  - provide meeting topic
  - provide word of the day
  - provide speech project name and speech title
- Members can save task answers.
- Task completion updates the current meeting data immediately.

4. Agenda generation
- The system derives agenda-relevant content from completed tasks.
- The agenda page shows at least:
  - meeting topic
  - word of the day
  - prepared speaker entries with project name and speech title
- This is important because it proves the product is more than a task tracker.

5. Agenda email sending
- Secretary can trigger sending the generated agenda to all members.
- Keep the first version simple: generate email content from the existing agenda view and send it on demand.
- Do not build a full reminder or notification system in the initial scope.

6. Reassignment flow
- If a member declines or cannot attend, secretary or Toastmaster reassigns the role.
- Reassignment regenerates the new member's tasks and updates the meeting table.

## Features To Defer

Do not build these in the first 10 days unless the MVP is already stable.

- SSO
- file upload for evaluation forms
- multi-club support
- advanced analytics
- recurring meeting templates
- drag-and-drop role arrangement
- automated reminder sequences
- rich email template editor

## Suggested Tech Stack

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- UI primitives: keep lightweight; add a component library only if it speeds up forms and tables
- Server state: TanStack Query
- Database: MongoDB Atlas
- ODM: Mongoose
- Auth: credentials-based auth with hashed passwords and role checks
- Deployment: Vercel

## Architecture Recommendation

Keep the architecture simple.

### Front End

- `app/login`
- `app/dashboard`
- `app/meetings`
- `app/meetings/current`
- `app/tasks`
- `app/agenda/current`

### Back End

Use Next.js Route Handlers.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/meetings`
- `GET /api/meetings/current`
- `POST /api/meetings`
- `PATCH /api/meetings/:id`
- `GET /api/meetings/:id/assignments`
- `POST /api/meetings/:id/assignments`
- `PATCH /api/meetings/:id/assignments/:assignmentId`
- `GET /api/tasks/me`
- `PATCH /api/tasks/:id`
- `GET /api/meetings/:id/agenda`
- `POST /api/meetings/:id/agenda/send`

### State Boundaries

- Use Server Components for static layout and initial page framing.
- Use React Query in client components where users interact with mutable server data.
- Use mutations for task updates, assignment edits, and meeting creation.

## Data Model

### `users`

- `_id`
- `name`
- `email`
- `passwordHash`
- `systemRole`: `member | secretary`
- `isActive`
- `createdAt`

### `meetings`

- `_id`
- `meetingDate`
- `status`: `draft | open | finalized`
- `topic`
- `toastmasterAssignmentId`
- `createdByUserId`
- `createdAt`

### `assignments`

- `_id`
- `meetingId`
- `roleName`
- `roleType`
- `assigneeUserId`
- `confirmationStatus`: `pending | confirmed | declined`
- `isAgendaRelevant`
- `sortOrder`

### `tasks`

- `_id`
- `meetingId`
- `assignmentId`
- `assigneeUserId`
- `taskType`
- `title`
- `status`: `pending | completed`
- `answerText`
- `answerPayload`
- `dependsOnTaskIds`
- `updatedAt`

## Role Templates

Use role templates to generate tasks automatically.

### Toastmaster

- confirm attendance
- provide meeting topic

### Language Evaluator

- confirm attendance
- provide word of the day

### Prepared Speaker

- confirm attendance
- provide project name
- provide speech title

### General Evaluator

- confirm attendance

### Individual Evaluator

- confirm attendance

### Table Topic Master

- confirm attendance

### Joke Master

- confirm attendance

### Timer

- confirm attendance

## Permission Rules

- Everyone can view the current meeting role table.
- Members can edit only their own tasks.
- Secretary can create meetings, assign roles, add roles, reassign roles, and send agenda emails.
- Current Toastmaster can reassign roles and maintain the role table after being assigned.
- The meeting role table does not directly edit topic, word of the day, or speech details. Those values must come from task completion.

## React Query Plan

Use React Query only where it adds clear value.

- `useCurrentMeetingQuery`
- `useMeetingAssignmentsQuery`
- `useMyTasksQuery`
- `useUpdateTaskMutation`
- `useUpdateAssignmentMutation`
- `useCreateAssignmentMutation`

Use optimistic updates only for small, obvious interactions such as confirmation toggles. For text-heavy task fields, prefer standard mutation followed by cache invalidation so the behavior is easier to reason about.

## MongoDB Notes

MongoDB is acceptable here because the domain is document-friendly and the project favors fast iteration. The main risk is data consistency during reassignment. Keep that under control by centralizing assignment changes in a single service layer that updates:

- assignment owner
- confirmation status
- related tasks
- derived agenda data if needed

## Vercel Deployment Plan

- Host the Next.js app on Vercel
- Use MongoDB Atlas as the database
- Set environment variables in Vercel
- Add an email provider key if agenda sending is implemented in the deployed demo
- Seed demo data after deployment
- Prepare one stable demo account for secretary and one for member

For email sending, prefer a low-friction transactional provider such as Resend. Keep the implementation to a single server-side action or API route that sends the already-generated agenda content.

## Interview Positioning

This project can answer the application requirements well if implemented cleanly.

### Q1: end-to-end system

You can explain:

- problem discovery from a real club process
- product scoping under time constraints
- system design with Next.js, MongoDB, API routes, and React Query
- authorization and task-driven workflow sync
- deployment on Vercel

### Q2: code quality

You can explain:

- typed API contracts
- component separation
- schema validation
- role-based permission checks
- incremental testing of key flows
- reviewable commit structure

### Q3: learning strategy

You can explain:

- choosing tools based on delivery speed and problem fit
- limiting novelty in time-boxed work
- using production-relevant tools only when they support the product goal

## 10-Day Execution Plan

### Day 1

- finalize MVP scope
- define pages, API surface, and data model
- scaffold Next.js project
- connect MongoDB

### Day 2

- implement login auth for pre-created accounts
- create seed data flow
- add role-based guards

### Day 3

- build current meeting page
- implement meeting creation and assignment table read path

### Day 4

- implement secretary editing for assignments
- support add role and reassign role

### Day 5

- generate tasks from assignments
- build personal task list UI

### Day 6

- implement task submission and sync back to meeting data
- show confirmation status in the role table

### Day 7

- build agenda page from task-derived content
- tighten permissions and edge cases

### Day 8

- add meeting history list
- implement agenda email sending
- seed realistic demo data

### Day 9

- refine UX
- add loading, empty, and error states
- verify production-like flows locally

### Day 10

- deploy to Vercel
- verify production environment
- prepare demo script, screenshots, and interview explanation

## Confirmed Decisions

- Account creation: pre-created accounts for MVP
- Meeting scope: current meeting plus simple history list
- Agenda output: on-screen agenda plus manual email sending
- Secretary model: one secretary account for MVP
- Prepared Speaker fields: project name plus speech title

## Delivery Risk To Watch

The highest-risk item for a 10-day schedule is agenda email sending. Keep it manual and simple:

- one button triggered by secretary
- one plain but readable template
- one send-to-all-members action
- no scheduling, no retries, no delivery analytics in the first version

## Recommended Implementation Order

Build in this order and do not skip ahead.

1. Auth and role checks
2. Current meeting read view
3. Secretary assignment editing
4. Member task list
5. Task-to-table synchronization
6. Agenda page
7. Deployment and polish