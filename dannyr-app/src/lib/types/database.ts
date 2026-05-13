// ============================================
// DannyR — TypeScript Types
// ============================================

// Enums
export type GarmentStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'ARCHIVED';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type ShippingStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED';
export type ShipmentGroupStatus = 'ACTIVE' | 'COMPLETED';

// Conversation steps
export type ConversationStep =
  | 'WELCOME'
  | 'CONSULTA_CODE'
  | 'AWAITING_NAME'
  | 'AWAITING_CODE'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_SHIPPING_FULLNAME'
  | 'AWAITING_SHIPPING_LASTNAME'
  | 'AWAITING_SHIPPING_CITY'
  | 'AWAITING_SHIPPING_DISTRICT'
  | 'AWAITING_SHIPPING_ADDRESS'
  | 'AWAITING_SHIPPING_REFERENCE'
  | 'COMPLETED';

// ============================================
// Table Types
// ============================================

export interface Garment {
  id: string;
  code: string;
  name: string | null;
  category: string | null;
  price: number;
  status: GarmentStatus;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  garment_id: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  expires_at: string | null;
  notes: string | null;
  paid_at: string | null;
  shipment_group_id: string | null;
  shipping_status: ShippingStatus | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingInfo {
  id: string;
  order_id: string;
  full_name: string;
  last_name: string;
  city: string;
  district: string;
  address: string;
  reference: string | null;
  created_at: string;
}

export interface ShipmentGroup {
  id: string;
  customer_phone: string;
  status: ShipmentGroupStatus;
  temp_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  customer_phone: string;
  current_step: ConversationStep;
  order_id: string | null;
  context: ConversationContext;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Extended / Joined Types
// ============================================

export interface OrderWithGarment extends Order {
  garment: Garment;
}

export interface OrderWithDetails extends Order {
  garment: Garment;
  shipping_info: ShippingInfo | null;
  shipment_group: ShipmentGroup | null;
}

export interface ShipmentOrder extends Order {
  garment: Garment;
  shipping_info: ShippingInfo | null;
  shipment_group: ShipmentGroup | null;
}

// ============================================
// Context Types
// ============================================

export interface ConversationContext {
  customer_name?: string;
  garment_code?: string;
  order_id?: string;
  shipping_full_name?: string;
  shipping_last_name?: string;
  shipping_city?: string;
  shipping_district?: string;
  shipping_address?: string;
  shipping_reference?: string;
}

// ============================================
// RPC Response Types
// ============================================

export interface ReserveGarmentResponse {
  success: boolean;
  error?: string;
  message?: string;
  order_id?: string;
  garment_id?: string;
  garment_code?: string;
  garment_name?: string;
  price?: number;
  expires_at?: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  error?: string;
  message?: string;
  order_id?: string;
  customer_phone?: string;
}

export interface ExpireReservationsResponse {
  success: boolean;
  expired_count?: number;
}

export interface CancelOrderResponse {
  success: boolean;
  error?: string;
  order_id?: string;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  error?: string;
  message?: string;
  garment_id?: string;
  code?: string;
  name?: string;
  price?: number;
}

// ============================================
// API Request Types
// ============================================

export interface CreateGarmentRequest {
  code: string;
  name?: string;
  category?: string;
  price: number;
}

export interface UpdateGarmentRequest {
  code?: string;
  name?: string;
  category?: string;
  price?: number;
}

export interface CreateShipmentGroupRequest {
  customer_phone: string;
  order_ids: string[];
}
