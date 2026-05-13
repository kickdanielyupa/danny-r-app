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
    const { data, error } = await supabase.rpc('cancel_order', { p_order_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (notes !== undefined) {
    const { error } = await supabase.from('orders').update({ notes }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}
