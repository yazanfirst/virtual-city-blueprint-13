
-- Add currency preference to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
