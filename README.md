# Learn Linker

Learn Linker is a full coaching-institute management system built with Next.js, MUI, PostgreSQL, and NextAuth. It gives teachers and admins a single place to manage batches, attendance, assignments, tests, results, and timetables, while giving students a clean dashboard with only the information relevant to their enrolled classes.

This product is designed for coaching centers and academic institutes that need operational control without a heavy enterprise system. The app emphasizes speed, clarity, and role-based access so each user sees the features they need and nothing more.

## What the application does

Learn Linker helps a coaching institute run day-to-day academic operations from one workspace:

- Create and manage student groups called batches
- Track daily attendance for each batch
- Schedule tests and exams for a single class or for all students
- Publish marks and maintain marksheets for subjects and exams
- Post assignments with deadlines and let students submit work
- Build and publish class timetables
- Invite and onboard teachers
- Let students view their overall progress, marks, assignments, timetable, and upcoming exams
- Generate structured study notes and custom test papers with optional AI help

The app is organized around batches and roles, which makes it especially useful for institutes where each teacher manages one or more classes but students should never see unrelated internal data.

## Core users and roles

### Admin
The admin is the institute-level owner. Admin capabilities include:

- Creating and editing batches
- Assigning teachers to batches
- Inviting teacher accounts
- Publishing or rebuilding timetables
- Managing the institute-wide classroom setup

### Teacher
Teachers operate within their assigned batches. Teacher capabilities include:

- Taking attendance for a class
- Viewing student rosters in their batch
- Posting assignments
- Scheduling exams
- Publishing subject/test results
- Monitoring class performance and upcoming work

### Student
Students get a focused learner experience with:

- Their dashboard overview
- Attendance performance
- Marks and results
- Assigned work and due dates
- Scheduled tests
- Timetable and study notes
- Access only to their own enrolled batches

## Feature overview

### 1. Batch management
A batch represents a class or cohort. Admins can create a batch and attach teachers and students to it.

Key behavior:

- Students are grouped into batches
- Teachers work within the batches they are assigned to
- Attendance, test schedules, results, and marksheets remain batch-scoped
- Students only ever see the batches they belong to

### 2. Attendance tracking
Teachers can quickly mark attendance for a class and view recorded attendance history.

Features include:

- Selecting a batch and date
- Marking students present or absent
- Editing previous attendance entries
- Viewing class attendance summaries and student-level attendance trends
- Preventing entries from being duplicated for the same date

### 3. Results and marksheets
Teachers can publish marks for students, either as:

- A standalone subject result
- A result linked to a scheduled test

The app supports bulk entry for the entire class and keeps the data tied to the relevant batch and test context.

### 4. Assignments and submissions
Assignments are managed per subject or batch context and include due dates. Students can see their upcoming and current work in a simple list, while teachers can manage and review assignments from the same system.

Supported flows:

- Create assignment entries
- Set deadlines
- Attach assignment context to a batch or all students
- Students see due work on the dashboard and assignment page

### 5. Tests and exam scheduling
Teachers can schedule upcoming tests that show on student dashboards and calendars.

Features include:

- Scheduling tests for a single batch or for everyone
- Setting subject, date, and total marks
- Linking results to a scheduled test for cleaner marksheets
- Viewing scheduled tests in a manageable list

### 6. Timetable publishing
Admin users can build and publish a timetable for a batch or a shared institute-wide schedule.

This includes:

- Choosing subject, teacher, weekday, and time slot
- Defining multiple periods in a schedule
- Replacing the timetable for a selected batch
- Sharing the timetable to students in their daily view

### 7. Student dashboard and overview
Students get a compact dashboard summarizing everything relevant to their learning.

Included on their main overview:

- Attendance summary
- Upcoming tests
- Due assignments
- Batch information
- Overall task visibility

### 8. AI-powered notes and paper generation
The app includes optional AI-supported tools to help students and teachers generate educational content.

Available features include:

- Structured study notes from a subject and topic
- Test paper generation based on a subject and topic
- Export-like viewing and PDF-friendly output flows

These features rely on external AI services, and the environment variable `COHERE_API_KEY` is used when enabled.

### 9. Teacher invite flow
Teacher access is gated. New teacher accounts can be created only when valid invite codes are used.

There are two main patterns:

- Bootstrap admin invite: first teacher sign-up can become the admin using `TEACHER_INVITE_CODE`
- Admin-issued invite links for additional teachers

Once an admin exists, invites can be managed from the app itself.

## Page areas in the app

The application is organized around these main screens:

- `/dashboard` — overview for students and teachers
- `/attendance` — attendance management for teachers
- `/results` — publish or view marks and marksheets
- `/assignments` — assignment management and student work
- `/tests` — scheduled exams and test planning
- `/timetable` — timetable viewing for students and teachers
- `/timetable/build` — timetable creation for admin
- `/batches` — batch creation and assignment management (admin)
- `/invites` — manage teacher invite codes (admin)
- `/notes` — generate study notes
- `/register/student` — student registration
- `/register/teacher` — teacher registration with invitation
- `/login` — sign-in

## Technology stack

- Next.js 14 with Pages Router
- React and MUI for the frontend
- PostgreSQL for the database
- NextAuth for authentication and session management
- Sequelize and direct Postgres queries in the app for database access
- Axios for API communication
- Framer Motion for motion and UI polish

## Project structure

```text
.
├── db/
│   └── migrations/
├── lib/
├── public/
├── scripts/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   └── models/
├── .env.example
├── package.json
├── README.md
└── next.config.js
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy the sample environment file and fill in the required values:

```bash
cp .env.example .env.local
```

### 3. Set up PostgreSQL

The app can use a local PostgreSQL instance, or a hosted provider such as Neon.

If no `DATABASE_URL` is set, the app falls back to:

```text
postgresql://localhost:5432/learnlinker
```

The default app behavior expects a reachable local Postgres instance for development.

### 4. Run migrations

```bash
npm run db:migrate
```

This applies the SQL files in the `db/migrations` folder in order and records migration history in the database.

### 5. Start the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Environment variables

The project expects these key values in `.env.local` or in your hosting environment.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the app |
| `DATABASE_URL_UNPOOLED` | Recommended | Direct DB connection for migrations and admin tasks |
| `NEXTAUTH_SECRET` | Yes | Signs the NextAuth session cookie |
| `NEXTAUTH_URL` | Usually yes in production | Public base URL for auth callbacks |
| `TEACHER_INVITE_CODE` | Yes until the first admin exists | Bootstraps teacher registration |
| `COHERE_API_KEY` | Optional | Enables AI notes and AI test paper generation |

### Production note
For Vercel deployments, keep `DATABASE_URL` pointed to your pooled Neon/Postgres connection string and ensure your environment variables are available at build time as well as runtime because migrations run during build.

## Database and migrations

Schema changes live in `db/migrations` as SQL files ordered by filename.

Example:

```bash
npm run db:migrate
```

This executes migration files in order and writes them to the migration tracking table so they can be safely re-run.

The migration system is designed to support iterative schema changes without losing earlier data.

## Permissions and access rules

Access is controlled by role checks built into the app:

- `withAuth(Component, roles)` protects pages
- Role checks define which users can access teacher/admin workflows
- Admins inherit teacher capabilities in several places
- Students only access the batches they are assigned to
- Batch data, results, attendance, assignment records, and timetable data are all scoped to the relevant class or institute context

## Typical workflow

### Setup
1. Create a teacher account using the teacher invite code
2. The first valid teacher becomes the admin
3. Log in and create batches
4. Invite more teachers to the institute

### Daily operations
1. Admin creates or updates batches and teacher assignments
2. Teachers mark attendance for each class
3. Assignments are posted to the relevant batch
4. Tests are scheduled and results are published
5. Students view upcoming work and marks in their dashboard
6. Admin publishes the timetable when needed

## Why this app is useful

Learn Linker is built to solve a common coaching-center problem: keeping academic operations organized without relying on scattered spreadsheets, WhatsApp threads, or disconnected student tools.

It combines the functionality that institutes actually need:

- class management
- attendance tracking
- marks and test schedules
- student visibility
- teacher control
- clear role separation

## License

This project is currently intended for internal/institute use and is not a general-purpose SaaS template by default. For production deployment, review the environment variables, security settings, and database access carefully before exposing the app publicly.

## Notes for future development

Areas that are easy to extend include:

- advanced reporting and analytics
- export to PDF/CSV
- notifications and reminders
- assignment uploads and file attachments
- student messaging
- improved AI features and content generation workflows

If you want to continue building this product, the current codebase already provides a strong base for a coaching management platform.
