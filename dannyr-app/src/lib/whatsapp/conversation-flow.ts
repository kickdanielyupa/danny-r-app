import { createServerClient } from '@/lib/supabase/server';
import { sendTextMessage, sendButtonMessage } from './client';
import type { ConversationStep } from '@/lib/types/database';

interface IncomingMessage {
  from: string;
  text?: string;
  buttonReplyId?: string;
}

export async function handleConversation(msg: IncomingMessage) {
  const supabase = createServerClient();
  const phone = msg.from;

  // Find active conversation
  const { data: conv } = await supabase.from('conversations')
    .select('*').eq('customer_phone', phone).eq('is_active', true)
    .order('created_at', { ascending: false }).limit(1).single();

  const step = (conv?.current_step as ConversationStep) || 'WELCOME';
  const context = conv?.context || {};

  // Route by step
  switch (step) {
    case 'WELCOME':
      return handleWelcome(phone, msg, conv?.id);

    case 'CONSULTA_CODE':
      return handleConsultaCode(phone, msg, conv!.id);

    case 'AWAITING_NAME':
      return handleAwaitingName(phone, msg, conv!.id, context);

    case 'AWAITING_CODE':
      return handleAwaitingCode(phone, msg, conv!.id, context);

    case 'AWAITING_PAYMENT':
      return handleAwaitingPayment(phone);

    case 'AWAITING_SHIPPING_FULLNAME':
    case 'AWAITING_SHIPPING_LASTNAME':
    case 'AWAITING_SHIPPING_CITY':
    case 'AWAITING_SHIPPING_DISTRICT':
    case 'AWAITING_SHIPPING_ADDRESS':
    case 'AWAITING_SHIPPING_REFERENCE':
      return handleShippingStep(phone, msg, conv!.id, step, context);

    case 'COMPLETED':
      return sendButtonMessage(phone, '¡Hola! Tu pedido ya fue registrado. ¿Necesitas algo más?', [
        { id: 'btn_consulta', title: 'CONSULTA' },
        { id: 'btn_separar', title: 'NUEVA SEPARACIÓN' },
      ]);

    default:
      return handleWelcome(phone, msg);
  }
}

async function handleWelcome(phone: string, msg: IncomingMessage, convId?: string) {
  const supabase = createServerClient();

  if (msg.buttonReplyId === 'btn_consulta') {
    await upsertConversation(supabase, phone, 'WELCOME', {}, convId);
    return sendTextMessage(phone, '✨ ¡Claro que sí, linda! En un momentito te comunicaré con uno de nuestros asesores para que te ayude con todas tus dudas. 💖 Mantente atenta, ¡te queremos! 🌸');
  }

  if (msg.buttonReplyId === 'btn_separar' || msg.buttonReplyId === 'btn_nueva_separacion') {
    await upsertConversation(supabase, phone, 'AWAITING_NAME', {}, convId);
    return sendTextMessage(phone, '✨ ¡Súper! Me encanta esa prenda para ti. 💖 Para separarla, primero dime ¿cuál es tu nombre, hermosa? ✨');
  }

  // Default: show menu
  await upsertConversation(supabase, phone, 'WELCOME', {});
  return sendButtonMessage(phone, '¡Hola, hermosa! 👋 Bienvenida a DannyR Shop. ✨ ¿Cómo puedo ayudarte hoy con tus tesoros? 💖', [
    { id: 'btn_consulta', title: 'CONSULTA' },
    { id: 'btn_separar', title: 'TENGO SEPARACIÓN' },
  ]);
}

async function handleConsultaCode(phone: string, msg: IncomingMessage, convId: string) {
  // Ya no se usa por el cambio en handleWelcome, pero lo mantenemos por seguridad o lo redirigimos
  const supabase = createServerClient();
  await updateConversation(supabase, convId, 'WELCOME', {});
  return sendTextMessage(phone, '✨ ¡Claro, linda! Te pasaré con un asesor ahora mismo. 💖');
}

async function handleAwaitingName(phone: string, msg: IncomingMessage, convId: string, context: Record<string, unknown>) {
  const supabase = createServerClient();
  const name = msg.text?.trim();
  if (!name) return sendTextMessage(phone, 'Ay, no pude leer bien tu nombre... 🥺 ¿Me lo repites, linda? ✨');

  await updateConversation(supabase, convId, 'AWAITING_CODE', { ...context, customer_name: name });
  return sendTextMessage(phone, `¡Qué lindo nombre, ${name}! 😊💖\n\nAhora dime, ¿cuál es el *código de la prenda* que quieres separar para que sea tuya? ✨\n\n(Ejemplo: ABC-001)`);
}

async function handleAwaitingCode(phone: string, msg: IncomingMessage, convId: string, context: Record<string, unknown>) {
  const supabase = createServerClient();
  const code = msg.text?.toUpperCase().trim();
  if (!code) return sendTextMessage(phone, 'Por favor, escríbeme el código de la prenda para buscarla... 🥺✨');

  // Attempt atomic reservation
  const { data } = await supabase.rpc('reserve_garment', {
    p_code: code,
    p_customer_name: context.customer_name as string,
    p_customer_phone: phone,
  });

  if (data?.success) {
    await updateConversation(supabase, convId, 'AWAITING_PAYMENT', {
      ...context, garment_code: code, order_id: data.order_id,
    }, data.order_id);
    return sendTextMessage(phone,
      `🎉 ¡Siii! La prenda *${code}* ya está reservada solo para ti, hermosa. 💖\n\n` +
      `💰 El precio es: S/ ${data.price}\n` +
      `⏱ Tienes *30 minutos* para realizar el pago antes de que alguien más la gane. 🏃‍♀️✨\n\n` +
      `📲 Por fis, envíanos el comprobante por aquí para que nuestro equipo lo confirme rapidito. ¡Te va a quedar divino! 🌸`
    );
  } else {
    await updateConversation(supabase, convId, 'WELCOME', {});
    await sendTextMessage(phone, `Ay, lo siento mucho, nena... 🥺 ${data?.message || 'Esa prenda ya voló.'} ✨`);
    return sendButtonMessage(phone, '¿Deseas intentar con otra o necesitas ayuda? 💖', [
      { id: 'btn_consulta', title: 'HABLAR CON ASESOR' },
      { id: 'btn_nueva_separacion', title: 'OTRA PRENDA' },
    ]);
  }
}

async function handleAwaitingPayment(phone: string) {
  return sendTextMessage(phone, '⏳ Estamos revisando tu pago con mucho cariño... 💖 Te avisaremos en cuanto esté listo para preparar tu paquete. ¡Gracias por tu paciencia, reina! ✨');
}

// Called by the panel when operator confirms payment
export async function continueAfterPayment(orderId: string, phone: string) {
  const supabase = createServerClient();

  // Update conversation to shipping flow
  const { data: conv } = await supabase.from('conversations')
    .select('id').eq('order_id', orderId).eq('is_active', true).single();

  if (conv) {
    await updateConversation(supabase, conv.id, 'AWAITING_SHIPPING_FULLNAME',
      { order_id: orderId }, orderId);
  }

  await sendTextMessage(phone,
    '✅ *¡Tu pago está confirmado, hermosa!* 🎉💖\n\n' +
    'Estoy súper emocionada por enviarte tu pedido. ✨ Ahora necesito que me digas tu *nombre completo* para el envío: 📝'
  );
}

const SHIPPING_STEPS: { step: ConversationStep; field: string; nextStep: ConversationStep; prompt: string }[] = [
  { step: 'AWAITING_SHIPPING_FULLNAME', field: 'shipping_full_name', nextStep: 'AWAITING_SHIPPING_LASTNAME', prompt: '✨ ¡Perfecto! Ahora dime tus *apellidos*, por favor: 📝' },
  { step: 'AWAITING_SHIPPING_LASTNAME', field: 'shipping_last_name', nextStep: 'AWAITING_SHIPPING_CITY', prompt: '🏙 ¿En qué *Ciudad o Departamento* vives, nena? ✨' },
  { step: 'AWAITING_SHIPPING_CITY', field: 'shipping_city', nextStep: 'AWAITING_SHIPPING_DISTRICT', prompt: '📍 ¿Y cuál es tu *Distrito o Comuna*? 💖' },
  { step: 'AWAITING_SHIPPING_DISTRICT', field: 'shipping_district', nextStep: 'AWAITING_SHIPPING_ADDRESS', prompt: '🏠 ¡Casi terminamos! Pásame tu *Dirección exacta* para que el repartidor llegue rapidito: ✨' },
  { step: 'AWAITING_SHIPPING_ADDRESS', field: 'shipping_address', nextStep: 'AWAITING_SHIPPING_REFERENCE', prompt: '📌 Por último, ¿alguna *Referencia* para encontrar tu casita? (Si no tienes, escribe "ninguna") ✨' },
];

async function handleShippingStep(phone: string, msg: IncomingMessage, convId: string, currentStep: ConversationStep, context: Record<string, unknown>) {
  const supabase = createServerClient();
  const text = msg.text?.trim();
  if (!text) return sendTextMessage(phone, 'No pude entenderte, hermosa... 🥺 ¿Me lo repites por favor? ✨');

  // Handle reference (last shipping step)
  if (currentStep === 'AWAITING_SHIPPING_REFERENCE') {
    const ref = text.toLowerCase() === 'ninguna' ? null : text;
    const updatedCtx: Record<string, unknown> = { ...context, shipping_reference: ref };

    // Save shipping info to database
    const orderId = context.order_id as string;
    await supabase.from('shipping_info').insert({
      order_id: orderId,
      full_name: (updatedCtx['shipping_full_name'] as string) || '',
      last_name: (updatedCtx['shipping_last_name'] as string) || '',
      city: (updatedCtx['shipping_city'] as string) || '',
      district: (updatedCtx['shipping_district'] as string) || '',
      address: (updatedCtx['shipping_address'] as string) || '',
      reference: ref,
    });

    await updateConversation(supabase, convId, 'COMPLETED', updatedCtx);
    return sendTextMessage(phone,
      '🎉 *¡Listo, reina!* Tus datos han sido guardados con éxito. 💖\n\n' +
      '📦 Tu paquete está en camino a ser preparado con mucho amor. ✨ Te avisaremos cuando salga a reparto.\n\n' +
      '¡Muchísimas gracias por confiar en DannyR! 💜🌸'
    );
  }

  // Find current step config
  const stepConfig = SHIPPING_STEPS.find(s => s.step === currentStep);
  if (!stepConfig) return;

  const updatedCtx = { ...context, [stepConfig.field]: text };
  await updateConversation(supabase, convId, stepConfig.nextStep, updatedCtx);
  return sendTextMessage(phone, stepConfig.prompt);
}

// Helper functions
async function upsertConversation(supabase: ReturnType<typeof createServerClient>, phone: string, step: ConversationStep, context: Record<string, unknown>, existingId?: string) {
  if (existingId) {
    return updateConversation(supabase, existingId, step, context);
  }
  // Deactivate old conversations
  await supabase.from('conversations').update({ is_active: false }).eq('customer_phone', phone).eq('is_active', true);
  // Create new
  await supabase.from('conversations').insert({ customer_phone: phone, current_step: step, context, is_active: true });
}

async function updateConversation(supabase: ReturnType<typeof createServerClient>, id: string, step: ConversationStep, context: Record<string, unknown>, orderId?: string) {
  const update: Record<string, unknown> = { current_step: step, context };
  if (orderId) update.order_id = orderId;
  await supabase.from('conversations').update(update).eq('id', id);
}
