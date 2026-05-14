-- Create bales table
CREATE TABLE IF NOT EXISTS public.bales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  total_items INTEGER NOT NULL,
  remaining_items INTEGER NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  average_cost DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add bale_id to garments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='garments' AND column_name='bale_id'
  ) THEN
    ALTER TABLE public.garments ADD COLUMN bale_id UUID REFERENCES public.bales(id);
  END IF;
END
$$;
