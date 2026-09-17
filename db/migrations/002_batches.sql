-- Batches: a named group of students that a teacher actually teaches.
-- Everything that used to apply to "all students" can now be scoped to one.

CREATE TABLE IF NOT EXISTS public.batches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  subject     text,
  description text,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS batches_name_lower_key
  ON public.batches (lower(name));

CREATE TABLE IF NOT EXISTS public.batch_students (
  batch_id   uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS batch_students_student_idx
  ON public.batch_students (student_id);

-- Attendance and marks always belong to a specific batch. Assignments, tests,
-- and timetable rows may leave batch_id NULL, which means "everyone".
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE;
ALTER TABLE public.student_marks
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE;
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE;
ALTER TABLE public.upcoming_tests
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE;
ALTER TABLE public.schedule
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE;

-- Existing registers and marksheets predate batches, so move them into one
-- default batch containing every student already in the system.
DO $$
DECLARE
  default_batch_id uuid;
  needs_backfill boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.attendance WHERE batch_id IS NULL)
      OR EXISTS (SELECT 1 FROM public.student_marks WHERE batch_id IS NULL)
    INTO needs_backfill;

  IF NOT needs_backfill THEN
    RETURN;
  END IF;

  SELECT id INTO default_batch_id
    FROM public.batches WHERE lower(name) = 'general' LIMIT 1;

  IF default_batch_id IS NULL THEN
    INSERT INTO public.batches (name, description, created_by)
    VALUES (
      'General',
      'Students who were on the roll before batches existed.',
      (SELECT id FROM public.users WHERE role = 'teacher' ORDER BY "createdAt" LIMIT 1)
    )
    RETURNING id INTO default_batch_id;
  END IF;

  INSERT INTO public.batch_students (batch_id, student_id)
  SELECT default_batch_id, id FROM public.users WHERE role = 'student'
  ON CONFLICT DO NOTHING;

  UPDATE public.attendance SET batch_id = default_batch_id WHERE batch_id IS NULL;
  UPDATE public.student_marks SET batch_id = default_batch_id WHERE batch_id IS NULL;
END $$;

ALTER TABLE public.attendance ALTER COLUMN batch_id SET NOT NULL;
ALTER TABLE public.student_marks ALTER COLUMN batch_id SET NOT NULL;

-- The old uniqueness rules ignored batch_id: one attendance row per student per
-- day, one assignment per subject/date. Both are wrong once a student can sit
-- in two batches, so drop them and rebuild them batch-aware.
DO $$
DECLARE
  spec record;
  rel regclass;
  target_name text;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('public.attendance',     ARRAY['date', 'student_id']),
      ('public.assignments',    ARRAY['description', 'end_date', 'subject']),
      ('public.upcoming_tests', ARRAY['date', 'subject'])
    ) AS t(tbl, cols)
  LOOP
    rel := spec.tbl::regclass;

    SELECT c.conname INTO target_name
      FROM pg_constraint c
     WHERE c.conrelid = rel
       AND c.contype = 'u'
       AND (
             SELECT array_agg(a.attname::text ORDER BY a.attname)
               FROM unnest(c.conkey) AS k(attnum)
               JOIN pg_attribute a ON a.attrelid = rel AND a.attnum = k.attnum
           ) = spec.cols
     LIMIT 1;

    IF target_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', rel, target_name);
      target_name := NULL;
    END IF;

    SELECT ci.relname INTO target_name
      FROM pg_index i
      JOIN pg_class ci ON ci.oid = i.indexrelid
     WHERE i.indrelid = rel
       AND i.indisunique
       AND NOT i.indisprimary
       AND (
             SELECT array_agg(a.attname::text ORDER BY a.attname)
               FROM unnest(i.indkey) AS k(attnum)
               JOIN pg_attribute a ON a.attrelid = rel AND a.attnum = k.attnum
           ) = spec.cols
     LIMIT 1;

    IF target_name IS NOT NULL THEN
      EXECUTE format('DROP INDEX %I', target_name);
      target_name := NULL;
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_batch_student_date_key
  ON public.attendance (batch_id, student_id, date);

CREATE INDEX IF NOT EXISTS student_marks_batch_idx
  ON public.student_marks (batch_id);

-- COALESCE keeps the "everyone" rows (batch_id IS NULL) de-duplicated too,
-- which a plain multi-column unique index would not do.
CREATE UNIQUE INDEX IF NOT EXISTS assignments_batch_subject_due_key
  ON public.assignments (
    COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    subject,
    end_date,
    description
  );

CREATE UNIQUE INDEX IF NOT EXISTS upcoming_tests_batch_subject_date_key
  ON public.upcoming_tests (
    COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    subject,
    date
  );

CREATE INDEX IF NOT EXISTS schedule_batch_idx ON public.schedule (batch_id);
