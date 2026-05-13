import { NextRequest, NextResponse } from 'next/server';
import { continueAfterPayment } from '@/lib/whatsapp/conversation-flow';

// POST - Triggered when operator confirms payment in panel
export async function POST(req: NextRequest) {
  const { order_id, customer_phone } = await req.json();

  if (!order_id || !customer_phone) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    await continueAfterPayment(order_id, customer_phone);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment confirmed WA notification error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
