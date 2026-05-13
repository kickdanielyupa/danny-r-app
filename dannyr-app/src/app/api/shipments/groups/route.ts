import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/shipments/groups - Create shipment group
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { customer_phone, order_ids } = await req.json();

  if (!customer_phone || !order_ids?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  // Verify all orders belong to the same customer and are active shipments
  const { data: orders } = await supabase.from('orders')
    .select('id, customer_phone, shipping_status')
    .in('id', order_ids)
    .eq('status', 'PAID')
    .in('shipping_status', ['PENDING', 'SHIPPED']);

  if (!orders || orders.length !== order_ids.length) {
    return NextResponse.json({ error: 'Algunos pedidos no son válidos para agrupar' }, { status: 400 });
  }

  const phones = new Set(orders.map(o => o.customer_phone));
  if (phones.size > 1) {
    return NextResponse.json({ error: 'Solo puedes agrupar pedidos del mismo cliente' }, { status: 400 });
  }

  // Create the group
  const { data: group, error: groupError } = await supabase.from('shipment_groups')
    .insert({ customer_phone })
    .select()
    .single();

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

  // Link orders to group
  const { error: linkError } = await supabase.from('orders')
    .update({ shipment_group_id: group.id })
    .in('id', order_ids);

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  return NextResponse.json({ success: true, group }, { status: 201 });
}
