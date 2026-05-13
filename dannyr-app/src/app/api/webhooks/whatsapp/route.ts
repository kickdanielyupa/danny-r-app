import { NextRequest, NextResponse } from 'next/server';
import { handleConversation } from '@/lib/whatsapp/conversation-flow';
import { markAsRead } from '@/lib/whatsapp/client';

// GET - Webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Incoming messages
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Always respond 200 quickly to avoid retries
  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ status: 'ignored' }, { status: 200 });
  }

  // Process async — don't block the response
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (value?.messages?.[0]) {
    const message = value.messages[0];
    const from = message.from;

    // Extract message content
    let text: string | undefined;
    let buttonReplyId: string | undefined;

    if (message.type === 'text') {
      text = message.text?.body;
    } else if (message.type === 'interactive') {
      if (message.interactive?.type === 'button_reply') {
        buttonReplyId = message.interactive.button_reply?.id;
      } else if (message.interactive?.type === 'list_reply') {
        buttonReplyId = message.interactive.list_reply?.id;
      }
    }

    // Mark as read
    try { await markAsRead(message.id); } catch { /* best effort */ }

    // Handle the conversation
    try {
      await handleConversation({ from, text, buttonReplyId });
    } catch (err) {
      console.error('Conversation error:', err);
    }
  }

  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
