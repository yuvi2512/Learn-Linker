-- Teachers belong to batches. Attendance becomes a real boolean with a student
-- FK. Marks can be upserted and tied to a test. Assignments get submissions.
-- Timetable rows store the weekday instead of a weekly count.

CREATE TABLE IF NOT EXISTS public.batch_teachers (
  batch_id   uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS batch_teachers_teacher_idx
  ON public.batch_teachers (teacher_id);

-- Existing institutes treated every teacher as faculty on every batch.
INSERT INTO public.batch_teachers (batch_id, teacher_id)
SELECT b.id, u.id
  FROM public.batches b
  CROSS JOIN public.users u
 WHERE u.role = 'teacher'
ON CONFLICT DO NOTHING;

-- --- Attendance: boolean presence, live student name via FK, drop the twin columns.
-- Older databases stored student_id as text; users.id is uuid. Cast before
-- comparing, then convert the column so the FK can be added.

DELETE FROM public.attendance a
 WHERE NOT EXISTS (
         SELECT 1 FROM public.users u WHERE u.id::text = a.student_id::text
       );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'attendance'
       AND column_name = 'student_id'
       AND data_type IN ('text', 'character varying')
  ) THEN
    DELETE FROM public.attendance
     WHERE student_id IS NULL
        OR student_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ALTER TABLE public.attendance
      ALTER COLUMN student_id TYPE uuid USING student_id::uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'attendance'
       AND column_name = 'present'
       AND data_type IN ('text', 'character varying')
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS present_new boolean;
    UPDATE public.attendance
       SET present_new = (lower(coalesce(present, '')) IN ('true', 't', '1', 'yes'));
    ALTER TABLE public.attendance DROP COLUMN present;
    ALTER TABLE public.attendance RENAME COLUMN present_new TO present;
  END IF;
END $$;

ALTER TABLE public.attendance ALTER COLUMN present SET DEFAULT false;
UPDATE public.attendance SET present = false WHERE present IS NULL;
ALTER TABLE public.attendance ALTER COLUMN present SET NOT NULL;

ALTER TABLE public.attendance DROP COLUMN IF EXISTS absent;
ALTER TABLE public.attendance DROP COLUMN IF EXISTS student_name;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_fk'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_student_fk
      FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS attendance_batch_date_idx
  ON public.attendance (batch_id, date DESC);

-- --- Marks: one score per student/subject (or per test), names live via FK.

DELETE FROM public.student_marks m
 WHERE NOT EXISTS (
         SELECT 1 FROM public.users u WHERE u.id::text = m.student_id::text
       );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'student_marks'
       AND column_name = 'student_id'
       AND data_type IN ('text', 'character varying')
  ) THEN
    DELETE FROM public.student_marks
     WHERE student_id IS NULL
        OR student_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
    ALTER TABLE public.student_marks
      ALTER COLUMN student_id TYPE uuid USING student_id::uuid;
  END IF;
END $$;

DELETE FROM public.student_marks a
 USING public.student_marks b
 WHERE a.batch_id = b.batch_id
   AND a.student_id = b.student_id
   AND lower(a.subject_name) = lower(b.subject_name)
   AND a.id < b.id;

ALTER TABLE public.student_marks DROP COLUMN IF EXISTS student_name;

ALTER TABLE public.student_marks
  ADD COLUMN IF NOT EXISTS test_id uuid REFERENCES public.upcoming_tests(id) ON DELETE CASCADE;

ALTER TABLE public.student_marks
  ADD COLUMN IF NOT EXISTS max_marks numeric NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_marks_student_fk'
  ) THEN
    ALTER TABLE public.student_marks
      ADD CONSTRAINT student_marks_student_fk
      FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS student_marks_batch_student_subject_key
  ON public.student_marks (batch_id, student_id, subject_name)
  WHERE test_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS student_marks_batch_student_test_key
  ON public.student_marks (batch_id, student_id, test_id)
  WHERE test_id IS NOT NULL;

ALTER TABLE public.upcoming_tests
  ADD COLUMN IF NOT EXISTS max_marks numeric NOT NULL DEFAULT 100;

-- --- Assignment submissions.

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS resource_url text;

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id            serial PRIMARY KEY,
  assignment_id integer NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note          text,
  resource_url  text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS assignment_submissions_student_idx
  ON public.assignment_submissions (student_id);

-- --- Timetable: one row per day + slot, with a real teacher FK.

ALTER TABLE public.schedule
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.schedule
  ADD COLUMN IF NOT EXISTS day_of_week smallint;

UPDATE public.schedule s
   SET teacher_id = u.id
  FROM public.users u
 WHERE s.teacher_id IS NULL
   AND lower(u.name) = lower(s.teachername)
   AND u.role IN ('teacher', 'admin');

INSERT INTO public.schedule (
  batch_id, subject, teachername, classesperweek, timeslot, teacher_id, day_of_week
)
SELECT s.batch_id,
       s.subject,
       s.teachername,
       s.classesperweek,
       s.timeslot,
       s.teacher_id,
       gs
  FROM public.schedule s
  CROSS JOIN LATERAL generate_series(
    1,
    GREATEST(1, LEAST(COALESCE(s.classesperweek, 1), 6))
  ) AS gs
 WHERE s.day_of_week IS NULL;

DELETE FROM public.schedule WHERE day_of_week IS NULL;

ALTER TABLE public.schedule ALTER COLUMN day_of_week SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedule_day_chk'
  ) THEN
    ALTER TABLE public.schedule
      ADD CONSTRAINT schedule_day_chk
      CHECK (day_of_week BETWEEN 1 AND 6);
  END IF;
END $$;

ALTER TABLE public.schedule DROP COLUMN IF EXISTS teachername;
ALTER TABLE public.schedule DROP COLUMN IF EXISTS classesperweek;

CREATE INDEX IF NOT EXISTS schedule_batch_day_idx
  ON public.schedule (batch_id, day_of_week, timeslot);
