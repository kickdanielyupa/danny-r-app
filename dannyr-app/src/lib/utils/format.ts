/**
 * Format price with currency symbol
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

/**
 * Format short date
 */
export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Calculate remaining time
 */
export function getTimeRemaining(expiresAt: string) {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  if (diff <= 0) return { minutes: 0, seconds: 0, expired: true, totalSeconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60, expired: false, totalSeconds };
}

/**
 * Format remaining time as MM:SS
 */
export function formatTimeRemaining(expiresAt: string): string {
  const { minutes, seconds, expired } = getTimeRemaining(expiresAt);
  if (expired) return 'Expirado';
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  if (phone.startsWith('51')) return `+51 ${phone.slice(2)}`;
  return `+${phone}`;
}

/**
 * Status labels in Spanish
 */
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING_PAYMENT: 'Pendiente de pago', PAID: 'Pagado', CANCELLED: 'Cancelado', EXPIRED: 'Expirado',
  };
  return labels[status] || status;
}

export function getShippingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente', SHIPPED: 'Enviado', DELIVERED: 'Entregado',
  };
  return labels[status] || status;
}

export function getGarmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE: 'Disponible', RESERVED: 'Reservada', SOLD: 'Vendida', ARCHIVED: 'Archivada',
  };
  return labels[status] || status;
}
