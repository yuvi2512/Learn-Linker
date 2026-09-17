-- Baseline schema. The tables below were created ad-hoc before migrations
-- existed, so every statement is written to be safe on an existing database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
    CREATE TYPE enum_users_role AS ENUM ('student', 'teacher', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL,
  email      varchar(255) NOT NULL UNIQUE,
  password   varchar(255) NOT NULL,
  role       enum_users_role NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);

CREATE TABLE IF NOT EXISTS public.attendance (
  id           serial PRIMARY KEY,
  student_id   uuid NOT NULL,
  student_name text,
  present      text,
  absent       text,
  date         date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_marks (
  id             serial PRIMARY KEY,
  student_id     uuid NOT NULL,
  student_name   text,
  subject_name   text NOT NULL,
  marks_obtained numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id          serial PRIMARY KEY,
  subject     text NOT NULL,
  end_date    date NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.upcoming_tests (
  id      serial PRIMARY KEY,
  subject text NOT NULL,
  date    date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedule (
  id             serial PRIMARY KEY,
  subject        text NOT NULL,
  teachername    text NOT NULL,
  classesperweek integer NOT NULL,
  timeslot       text NOT NULL
);
