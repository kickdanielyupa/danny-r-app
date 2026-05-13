-- ============================================
-- DannyR — Sistema Operativo de Live Selling
-- Schema inicial completo
-- ============================================

-- Enums
CREATE TYPE garment_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED');
CREATE TYPE order_status AS ENUM ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED');
CREATE TYPE shipping_status AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED');
CREATE TYPE shipment_group_status AS ENUM ('ACTIVE', 'COMPLETED');

-- ============================================
-- Tabla: garments (Prendas / Inventario)
-- ============================================
CREATE TABLE garments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  category TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  status garment_status NOT NULL DEFAULT 'AVAILABLE',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_garments_code ON garments(code);
CREATE INDEX idx_garments_status ON garments(status);
CREATE INDEX idx_garments_archived ON garments(is_archived);

-- ============================================
-- Tabla: shipment_groups (Grupos de envío)
-- ============================================
CREATE TABLE shipment_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  status shipment_group_status NOT NULL DEFAULT 'ACTIVE',
  temp_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipment_groups_phone ON shipment_groups(customer_phone);
CREATE INDEX idx_shipment_groups_status ON shipment_groups(status);

-- ============================================
-- Tabla: orders (Pedidos)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garment_id UUID NOT NULL REFERENCES garments(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  expires_at TIMESTAMPTZ,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  shipment_group_id UUID REFERENCES shipment_groups(id),
  shipping_status shipping_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_garment ON orders(garment_id);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_shipping ON orders(shipping_status);
CREATE INDEX idx_orders_expires ON orders(expires_at);

-- ============================================
-- Tabla: shipping_info (Datos de envío)
-- ============================================
CREATE TABLE shipping_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
  full_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipping_info_order ON shipping_info(order_id);

-- ============================================
-- Tabla: conversations (Estado de WhatsApp)
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'WELCOME',
  order_id UUID REFERENCES orders(id),
  context JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_phone ON conversations(customer_phone);
CREATE INDEX idx_conversations_active ON conversations(is_active);

-- ============================================
-- Trigger: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_garments_updated_at
  BEFORE UPDATE ON garments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_shipment_groups_updated_at
  BEFORE UPDATE ON shipment_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RPC: reserve_garment (Bloqueo transaccional)
-- ============================================
CREATE OR REPLACE FUNCTION reserve_garment(
  p_code TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT
)
RETURNS JSON AS $$
DECLARE
  v_garment RECORD;
  v_order_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Lock the garment row to prevent race conditions
  SELECT id, code, name, price, status
  INTO v_garment
  FROM garments
  WHERE code = UPPER(TRIM(p_code))
    AND is_archived = false
  FOR UPDATE;

  -- Garment not found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'GARMENT_NOT_FOUND',
      'message', 'No se encontró una prenda con ese código.'
    );
  END IF;

  -- Garment not available
  IF v_garment.status != 'AVAILABLE' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'GARMENT_NOT_AVAILABLE',
      'message', 'Esta prenda ya no está disponible.'
    );
  END IF;

  -- Set expiration to 30 minutes from now
  v_expires_at := now() + INTERVAL '30 minutes';

  -- Update garment status to RESERVED
  UPDATE garments
  SET status = 'RESERVED'
  WHERE id = v_garment.id;

  -- Create order
  INSERT INTO orders (garment_id, customer_name, customer_phone, status, expires_at)
  VALUES (v_garment.id, p_customer_name, p_customer_phone, 'PENDING_PAYMENT', v_expires_at)
  RETURNING id INTO v_order_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'garment_id', v_garment.id,
    'garment_code', v_garment.code,
    'garment_name', v_garment.name,
    'price', v_garment.price,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: confirm_payment (Confirmar pago)
-- ============================================
CREATE OR REPLACE FUNCTION confirm_payment(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Lock the order row
  SELECT o.id, o.garment_id, o.status, o.expires_at, o.customer_phone
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_NOT_FOUND',
      'message', 'Pedido no encontrado.'
    );
  END IF;

  IF v_order.status != 'PENDING_PAYMENT' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'El pedido no está pendiente de pago.'
    );
  END IF;

  -- Check if reservation expired
  IF v_order.expires_at < now() THEN
    -- Expire the order
    UPDATE orders SET status = 'EXPIRED' WHERE id = v_order.id;
    UPDATE garments SET status = 'AVAILABLE' WHERE id = v_order.garment_id;
    
    RETURN json_build_object(
      'success', false,
      'error', 'ORDER_EXPIRED',
      'message', 'La reserva ha expirado.'
    );
  END IF;

  -- Confirm payment
  UPDATE orders
  SET status = 'PAID',
      paid_at = now(),
      shipping_status = 'PENDING'
  WHERE id = v_order.id;

  -- Mark garment as SOLD
  UPDATE garments
  SET status = 'SOLD'
  WHERE id = v_order.garment_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order.id,
    'customer_phone', v_order.customer_phone
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: expire_reservations (Cron job)
-- ============================================
CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS JSON AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Update expired orders and release garments
  WITH expired_orders AS (
    UPDATE orders
    SET status = 'EXPIRED'
    WHERE status = 'PENDING_PAYMENT'
      AND expires_at < now()
    RETURNING garment_id, id
  )
  UPDATE garments
  SET status = 'AVAILABLE'
  WHERE id IN (SELECT garment_id FROM expired_orders);

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Deactivate related conversations
  UPDATE conversations
  SET is_active = false
  WHERE order_id IN (
    SELECT id FROM orders WHERE status = 'EXPIRED'
  ) AND is_active = true;

  RETURN json_build_object(
    'success', true,
    'expired_count', v_expired_count
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: cancel_order (Cancelar pedido)
-- ============================================
CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT o.id, o.garment_id, o.status
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  IF v_order.status != 'PENDING_PAYMENT' THEN
    RETURN json_build_object('success', false, 'error', 'INVALID_STATUS');
  END IF;

  UPDATE orders SET status = 'CANCELLED' WHERE id = v_order.id;
  UPDATE garments SET status = 'AVAILABLE' WHERE id = v_order.garment_id;

  -- Deactivate conversation
  UPDATE conversations
  SET is_active = false
  WHERE order_id = v_order.id AND is_active = true;

  RETURN json_build_object('success', true, 'order_id', v_order.id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: mark_delivered (Marcar como entregado)
-- ============================================
CREATE OR REPLACE FUNCTION mark_delivered(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT o.id, o.garment_id, o.shipping_status
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
  END IF;

  -- Update order shipping status
  UPDATE orders SET shipping_status = 'DELIVERED' WHERE id = v_order.id;

  -- Archive the garment
  UPDATE garments
  SET status = 'ARCHIVED', is_archived = true
  WHERE id = v_order.garment_id;

  RETURN json_build_object('success', true, 'order_id', v_order.id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: check_garment_availability
-- ============================================
CREATE OR REPLACE FUNCTION check_garment_availability(p_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_garment RECORD;
BEGIN
  SELECT id, code, name, price, status
  INTO v_garment
  FROM garments
  WHERE code = UPPER(TRIM(p_code))
    AND is_archived = false;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'available', false,
      'error', 'NOT_FOUND',
      'message', 'No se encontró una prenda con ese código.'
    );
  END IF;

  IF v_garment.status != 'AVAILABLE' THEN
    RETURN json_build_object(
      'available', false,
      'error', 'NOT_AVAILABLE',
      'message', 'Esta prenda ya no está disponible.'
    );
  END IF;

  RETURN json_build_object(
    'available', true,
    'garment_id', v_garment.id,
    'code', v_garment.code,
    'name', v_garment.name,
    'price', v_garment.price
  );
END;
$$ LANGUAGE plpgsql;
