-- Add font option for shop signage
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS signage_font text DEFAULT 'classic';

-- Add more facade templates
ALTER TYPE public.facade_template ADD VALUE IF NOT EXISTS 'luxury_gold';
ALTER TYPE public.facade_template ADD VALUE IF NOT EXISTS 'urban_industrial';
ALTER TYPE public.facade_template ADD VALUE IF NOT EXISTS 'retro_vintage';
ALTER TYPE public.facade_template ADD VALUE IF NOT EXISTS 'nature_organic';