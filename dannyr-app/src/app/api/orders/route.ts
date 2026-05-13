import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/orders - List orders
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const history = searchParams.get('history');
  const search = searchParams.get('search');

  let query = supabase.from('orders').select('*, garment:garments(*)').order('created_at', { ascending: false });

  if (history === 'true') {
    // History: show PAID, CANCELLED, EXPIRED
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['PAID', 'CANCELLED', 'EXPIRED']);
    }
  } else if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ orders: data });
}
