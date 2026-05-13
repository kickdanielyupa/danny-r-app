import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/reserve - Atomic garment reservation via RPC
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { code, customer_name, customer_phone } = await req.json();

  if (!code || !customer_name || !customer_phone) {
    return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('reserve_garment', {
    p_code: code,
    p_customer_name: customer_name,
    p_customer_phone: customer_phone,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
