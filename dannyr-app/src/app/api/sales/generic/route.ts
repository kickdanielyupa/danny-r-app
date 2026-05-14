import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { bale_id, price, customer_name, customer_phone, status: requestedStatus, description } = body;

  if (!bale_id || price === undefined || !customer_name || !customer_phone) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  // 1. Get Bale to generate code
  const { data: bale, error: baleError } = await supabase
    .from('bales')
    .select('*')
    .eq('id', bale_id)
    .single();

  if (baleError || !bale) {
    return NextResponse.json({ error: 'Fardo no encontrado' }, { status: 404 });
  }

  if (bale.remaining_items <= 0) {
    return NextResponse.json({ error: 'Este fardo ya no tiene prendas disponibles' }, { status: 400 });
  }

  const shortBaleId = bale.id.split('-')[0].toUpperCase();
  const nextItemNumber = bale.total_items - bale.remaining_items + 1;
  const garmentCode = `${shortBaleId}-V${nextItemNumber}`;

  // 2. Create Garment
  const { data: garment, error: garmentError } = await supabase
    .from('garments')
    .insert({
      code: garmentCode,
      name: description || `Prenda de ${bale.name}`,
      category: 'Fardo',
      price: price,
      status: requestedStatus === 'PENDING_PAYMENT' ? 'RESERVED' : 'SOLD',
      bale_id: bale.id,
      is_archived: false
    })
    .select()
    .single();

  if (garmentError) {
    return NextResponse.json({ error: 'Error al crear la prenda: ' + garmentError.message }, { status: 500 });
  }

  // 3. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      garment_id: garment.id,
      customer_name: customer_name,
      customer_phone: customer_phone,
      status: requestedStatus || 'PENDING_PAYMENT',
      paid_at: requestedStatus === 'PAID' ? new Date().toISOString() : null,
      expires_at: null,
      shipping_status: 'PENDING'
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: 'Error al crear el pedido: ' + orderError.message }, { status: 500 });
  }

  // 4. Update Bale
  const remaining = bale.remaining_items - 1;
  const newStatus = remaining === 0 ? 'ARCHIVED' : 'ACTIVE';
  
  const { error: updateBaleError } = await supabase
    .from('bales')
    .update({ 
      remaining_items: remaining,
      status: newStatus
    })
    .eq('id', bale.id);

  if (updateBaleError) {
    console.error('Error updating bale remaining items:', updateBaleError);
  }

  return NextResponse.json({ success: true, order, garment });
}
