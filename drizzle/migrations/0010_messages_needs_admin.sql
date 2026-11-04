ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS needs_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_auto boolean NOT NULL DEFAULT false;