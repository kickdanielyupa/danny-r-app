// ============================================
// Color pool for active shipments
// Colors are temporary and reusable
// ============================================

export const SHIPMENT_COLORS = [
  { id: 'blue', hex: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' },
  { id: 'violet', hex: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)' },
  { id: 'pink', hex: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)' },
  { id: 'amber', hex: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
  { id: 'emerald', hex: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  { id: 'red', hex: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' },
  { id: 'cyan', hex: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' },
  { id: 'orange', hex: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.4)' },
  { id: 'lime', hex: '#84CC16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.4)' },
  { id: 'indigo', hex: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)' },
];

/**
 * Assign a color from the pool that isn't currently in use.
 * @param usedColors - Array of color IDs currently assigned to active shipments
 * @returns The next available color, or cycles back if all are used
 */
export function getNextAvailableColor(usedColors: string[]): typeof SHIPMENT_COLORS[number] {
  const available = SHIPMENT_COLORS.find(c => !usedColors.includes(c.id));
  if (available) return available;
  // If all colors are used, cycle from the beginning
  return SHIPMENT_COLORS[usedColors.length % SHIPMENT_COLORS.length];
}

/**
 * Get color object by ID
 */
export function getColorById(colorId: string): typeof SHIPMENT_COLORS[number] | undefined {
  return SHIPMENT_COLORS.find(c => c.id === colorId);
}
