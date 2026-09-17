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

If `DATABASE_URL` is missing, the app uses local Postgres at
`localhost:5432/learnlinker`. If `NEXTAUTH_URL` is missing, it uses the Vercel
deployment URL when hosted, otherwise `http://localhost:3000`.

`TEACHER_INVITE_CODE` is required before any teacher account can be created —
see below.

## Hosting on Vercel + Neon

The Next.js app (pages **and** `/api` routes) deploys as one Vercel project.
Neon is only the Postgres database.

### 1. Neon — create the tables

1. In the [Neon console](https://console.neon.tech), open your project.
2. Copy two connection strings from **Dashboard → Connection details**:
   - **Pooled** (host contains `-pooler`) — this is `DATABASE_URL` for the app.
   - **Direct** (no `-pooler`) — this is `DATABASE_URL_UNPOOLED` for migrations.
3. Both URIs should include `?sslmode=require`.
4. From this repo, put the Neon URI in `.env.local` as `DATABASE_URL` (and
   optionally `DATABASE_URL_UNPOOLED`), then apply the same schema as local:

```bash
npm run db:migrate
```

That runs `db/migrations/001` through `004` in order and records them in
`schema_migrations`. Re-running is safe.

You can confirm in Neon **SQL Editor**:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
SELECT name, applied_at FROM schema_migrations ORDER BY applied_at;
```

You should see `users`, `batches`, `batch_students`, `batch_teachers`,
`attendance`, `student_marks`, `assignments`, `assignment_submissions`,
`upcoming_tests`, `schedule`, `invite_codes`, and `schema_migrations`.

Vercel also runs `npm run db:migrate` during deploy (`vercel-build`), so a
brand-new Neon database gets the tables automatically on the first deploy.

### 2. Vercel — environment variables

In the Vercel project: **Settings → Environment Variables**. Add these for
**Production** (and Preview if you use it). Check that they are available at
**Build** time as well as Runtime, because migrations run during the build.

| Name | Value | Required |
| --- | --- | --- |
| `DATABASE_URL` | Neon **pooled** URI, e.g. `postgresql://…@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` | yes |
| `DATABASE_URL_UNPOOLED` | Neon **direct** URI (no `-pooler`) | recommended |
| `NEXTAUTH_SECRET` | Same secret as `.env.local`. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | yes |
| `NEXTAUTH_URL` | Your live site, e.g. `https://your-app.vercel.app` (no trailing slash) | yes on production |
| `TEACHER_INVITE_CODE` | Bootstrap code for the first admin at `/register/teacher` | yes until an admin exists |
| `COHERE_API_KEY` | Only if you use AI notes / test paper | no |

Do **not** set `DATABASE_URL` to `localhost` on Vercel. Leave it unset only on
your machine — that is when the localhost fallback applies.

After saving variables, **Redeploy** so the build picks them up.

### 3. First login on production

Open `https://your-app.vercel.app/register/teacher`, use `TEACHER_INVITE_CODE`,
and create the admin. Then add teachers from **Invites**.

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
