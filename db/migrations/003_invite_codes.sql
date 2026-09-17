-- Teacher invite codes created from the admin workspace. The env bootstrap
-- code still exists so the first admin can sign up; after that, codes live here.

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL,
  note         text,
  max_uses     integer,
  use_count    integer NOT NULL DEFAULT 0,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  CONSTRAINT invite_codes_max_uses_chk
    CHECK (max_uses IS NULL OR max_uses >= 1),
  CONSTRAINT invite_codes_use_count_chk
    CHECK (use_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS invite_codes_code_key
  ON public.invite_codes (code);

CREATE INDEX IF NOT EXISTS invite_codes_active_idx
  ON public.invite_codes (created_at DESC)
  WHERE revoked_at IS NULL;
