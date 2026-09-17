# Learn Linker

Coaching-institute workspace built with [Next.js](https://nextjs.org/) (pages
router), MUI, and Postgres. Teachers group students into **batches** and run
attendance, results, assignments, tests, and timetables against one batch at a
time. Students see only the batches they are enrolled in.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`.env.example` documents every variable. Two are required:

| Variable | Why |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `NEXTAUTH_SECRET` | Signs the session cookie. |

`TEACHER_INVITE_CODE` is required before any teacher account can be created —
see below.

## Database

Schema changes live in `db/migrations` as plain `.sql` files, applied in
filename order:

```bash
npm run db:migrate
```

Each file runs in a transaction and is recorded in `schema_migrations`, so the
command is safe to re-run and safe against a database that already has the
pre-migration tables. To add a change, drop a new `NNN_name.sql` file in the
directory.

## Accounts and roles

Students and teachers register through **separate pages and separate API
routes**, so a student cannot create a teacher account:

| Route | Creates | Gate |
| --- | --- | --- |
| `/register/student` → `POST /api/auth/register-student` | `student` | none |
| `/register/teacher` → `POST /api/auth/register-teacher` | `teacher` (or first `admin`) | invite code |

`/register` is just a chooser between the two. Each route hard-codes the role
it creates and ignores any `role` in the request body.

### Teacher invites

Teacher sign-up stays closed until someone holds a valid code. There are two
kinds:

1. **Bootstrap (once).** Set `TEACHER_INVITE_CODE` in `.env.local`, then sign up
   at `/register/teacher` with that code. The **first** person to do this
   becomes `admin`. Later uses of the same env code create ordinary teachers.
2. **Admin-issued.** Once you are admin, open **Invites** in the sidebar. Create
   a code, copy the link, or send it on WhatsApp. The teacher opens
   `/register/teacher?code=…` with the field already filled. You can revoke a
   code at any time; accounts already created keep working.

After the first admin exists you can remove `TEACHER_INVITE_CODE` from the
environment so only issued invites work.

If you already have a teacher account and need to promote it:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'you@institute.com';
```

Then sign out and back in so the session picks up the new role.

## Batches

A batch is a named group of students — the class a teacher actually teaches.

- Teachers manage batches and rosters at **/batches**.
- Attendance and marksheets always belong to a batch, and the API rejects a
  student who is not on that batch's roll.
- Assignments, tests, and timetables can target one batch or, by leaving the
  batch unset, every student.
- Students only ever read the batches they are enrolled in.

The batches migration moves any pre-existing attendance and marks into a
default batch named **General** containing every student already registered, so
nothing is lost on upgrade.

## Permissions

- `withAuth(Component, roles)` guards pages.
- `requireUser(req, res, roles)` guards API routes.
- Only the institute **admin** can create/edit batches, assign teachers, and
  publish the timetable. Teachers see and operate on the batches they are
  assigned to.
