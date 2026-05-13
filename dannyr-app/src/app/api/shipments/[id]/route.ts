import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// PATCH /api/shipments/[id] - Update shipping status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;
  const { shipping_status } = await req.json();

  if (!['PENDING', 'SHIPPED', 'DELIVERED'].includes(shipping_status)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
  }

  if (shipping_status === 'DELIVERED') {
    // Use RPC for atomic delivery + archive
    const { data, error } = await supabase.rpc('mark_delivered', { p_order_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { error } = await supabase.from('orders')
    .update({ shipping_status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
