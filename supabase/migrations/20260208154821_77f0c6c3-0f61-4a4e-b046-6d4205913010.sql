
-- Add merchant-defined coupon code and code type columns
ALTER TABLE public.merchant_offers
  ADD COLUMN coupon_code text,
  ADD COLUMN code_type text NOT NULL DEFAULT 'shared';

-- Add a comment for documentation
COMMENT ON COLUMN public.merchant_offers.coupon_code IS 'The merchant real website coupon code (e.g. SUMMER20)';
COMMENT ON COLUMN public.merchant_offers.code_type IS 'Code distribution model: shared (MVP), pool (future CSV upload), api (future external integration)';
