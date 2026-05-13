import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/shipments - List active or historical shipments
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const history = searchParams.get('history');
  const search = searchParams.get('search');

  let query = supabase.from('orders')
    .select('*, garment:garments(*), shipping_info:shipping_info(*), shipment_group:shipment_groups(*)')
    .eq('status', 'PAID')
    .order('created_at', { ascending: false });

  if (history === 'true') {
    query = query.eq('shipping_status', 'DELIVERED');
  } else {
    query = query.in('shipping_status', ['PENDING', 'SHIPPED']);
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}
