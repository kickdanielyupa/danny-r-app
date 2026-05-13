// WhatsApp Cloud API Client
const GRAPH_API = 'https://graph.facebook.com/v21.0';

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function getUrl() {
  return `${GRAPH_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

export async function sendTextMessage(to: string, text: string) {
  const res = await fetch(getUrl(), {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
  return res.json();
}

export async function sendButtonMessage(to: string, bodyText: string, buttons: { id: string; title: string }[]) {
  const res = await fetch(getUrl(), {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button', body: { text: bodyText },
        action: { buttons: buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
      },
    }),
  });
  return res.json();
}

export async function markAsRead(messageId: string) {
  await fetch(getUrl(), {
    method: 'POST', headers: getHeaders(),
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
  });
}
