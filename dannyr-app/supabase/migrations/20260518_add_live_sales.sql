-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create live_session_sales table
CREATE TABLE IF NOT EXISTS public.live_session_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  bale_id UUID NOT NULL REFERENCES public.bales(id),
  quantity_sold INTEGER NOT NULL CHECK (quantity_sold > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to deduct remaining items from bale on sale
CREATE OR REPLACE FUNCTION public.update_bale_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.bales
    SET remaining_items = remaining_items - NEW.quantity_sold
    WHERE id = NEW.bale_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.bales
    SET remaining_items = remaining_items + OLD.quantity_sold
    WHERE id = OLD.bale_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.bales
    SET remaining_items = remaining_items + OLD.quantity_sold - NEW.quantity_sold
    WHERE id = NEW.bale_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE OR REPLACE TRIGGER trg_update_bale_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.live_session_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_bale_stock_on_sale();
