-- Add texture columns to shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS texture_template text DEFAULT NULL;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS texture_url text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.shops.texture_template IS 'Preset texture: wood, marble, brick, metal, concrete, fabric, leather, or null for solid color';
COMMENT ON COLUMN public.shops.texture_url IS 'Custom uploaded texture image URL';