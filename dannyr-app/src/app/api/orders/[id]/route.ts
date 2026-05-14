import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// PATCH /api/orders/[id] - Confirm payment or cancel order
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;
  const { action, notes } = await req.json();

  if (action === 'confirm_payment') {
    const { data, error } = await supabase.rpc('confirm_payment', { p_order_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Trigger WhatsApp message to continue conversation
    if (data?.success && data?.customer_phone) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/whatsapp/payment-confirmed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: id, customer_phone: data.customer_phone }),
        });
      } catch {
        // WhatsApp notification is best-effort, don't fail the payment confirmation
      }
    }

    return NextResponse.json(data);
  }

  if (action === 'cancel') {
    // Get garment info before cancelling
    const { data: orderInfo } = await supabase
      .from('orders')
      .select('garment_id, garment:garments(bale_id)')
      .eq('id', id)
      .single();

    const { data, error } = await supabase.rpc('cancel_order', { p_order_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If it was a fardo garment, delete the virtual garment and recover stock
    if (orderInfo?.garment_id && (orderInfo.garment as any)?.bale_id) {
      const baleId = (orderInfo.garment as any).bale_id;
      
      // Delete the virtual garment (instead of leaving it as AVAILABLE)
      await supabase.from('garments').delete().eq('id', orderInfo.garment_id);
      
      // Recover stock
      const { data: bale } = await supabase.from('bales').select('remaining_items').eq('id', baleId).single();
      if (bale) {
        await supabase.from('bales').update({ 
          remaining_items: bale.remaining_items + 1,
          status: 'ACTIVE'
        }).eq('id', baleId);
      }
    }

    return NextResponse.json(data);
  }

  if (notes !== undefined) {
    const { error } = await supabase.from('orders').update({ notes }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;

  // 1. Get garment info before deleting order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('garment_id, garment:garments(bale_id)')
    .eq('id', id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // 2. Delete the order
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', id);

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // 3. If it was a fardo garment, delete the garment AND recover stock
  if (order?.garment_id && (order.garment as any)?.bale_id) {
    const baleId = (order.garment as any).bale_id;
    
    // Delete garment
    await supabase.from('garments').delete().eq('id', order.garment_id);
    
    // Recover stock in bale
    const { data: bale } = await supabase.from('bales').select('remaining_items').eq('id', baleId).single();
    if (bale) {
      await supabase.from('bales').update({ 
        remaining_items: bale.remaining_items + 1,
        status: 'ACTIVE' // Reactivate if it was archived/completed
      }).eq('id', baleId);
    }
  }

  return NextResponse.json({ success: true });
}
