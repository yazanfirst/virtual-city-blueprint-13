
-- Add currency to shops table so it's accessible when viewing shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
