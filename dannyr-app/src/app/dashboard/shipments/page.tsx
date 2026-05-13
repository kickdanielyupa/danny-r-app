'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShipmentOrder } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone, getShippingStatusLabel } from '@/lib/utils/format';
import { SHIPMENT_COLORS } from '@/lib/utils/colors';

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch('/api/shipments');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchShipments(); const i = setInterval(fetchShipments, 15000); return () => clearInterval(i); }, [fetchShipments]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Assign temp colors per customer phone
  const phoneColors = new Map<string, typeof SHIPMENT_COLORS[number]>();
  let colorIdx = 0;
  orders.forEach(o => {
    if (!phoneColors.has(o.customer_phone)) {
      phoneColors.set(o.customer_phone, SHIPMENT_COLORS[colorIdx % SHIPMENT_COLORS.length]);
      colorIdx++;
    }
  });

  // Check if a phone has multiple orders (for grouping)
  const phoneCounts = new Map<string, number>();
  orders.forEach(o => phoneCounts.set(o.customer_phone, (phoneCounts.get(o.customer_phone) || 0) + 1));

  const updateShippingStatus = async (orderId: string, status: string) => {
    const res = await fetch(`/api/shipments/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_status: status }),
    });
    const data = await res.json();
    if (data.success) { showToast(`Estado actualizado: ${getShippingStatusLabel(status)}`); fetchShipments(); }
    else showToast(data.error || 'Error', 'error');
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const createGroup = async () => {
    if (selected.size < 2) { showToast('Selecciona al menos 2 pedidos', 'error'); return; }
    const selectedOrders = orders.filter(o => selected.has(o.id));
    const phones = new Set(selectedOrders.map(o => o.customer_phone));
    if (phones.size > 1) { showToast('Solo puedes agrupar pedidos del mismo cliente', 'error'); return; }
    const res = await fetch('/api/shipments/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_phone: selectedOrders[0].customer_phone, order_ids: Array.from(selected) }),
    });
    if (res.ok) { showToast('Grupo de envío creado'); setSelected(new Set()); fetchShipments(); }
    else showToast('Error al crear grupo', 'error');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Envíos</h1>
          <p className="page-subtitle">{orders.length} envío{orders.length !== 1 ? 's' : ''} activo{orders.length !== 1 ? 's' : ''}</p>
        </div>
        {selected.size >= 2 && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={createGroup}>📦 Agrupar envío ({selected.size})</button>
            <button className="btn btn-ghost" onClick={() => setSelected(new Set())}>Cancelar</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No hay envíos activos</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Los envíos aparecerán cuando se confirme el pago de un pedido</p>
        </div>
      ) : (
        <div className="grid-cards">
          {orders.map(order => {
            const color = phoneColors.get(order.customer_phone)!;
            const hasMultiple = (phoneCounts.get(order.customer_phone) || 0) > 1;

            return (
              <div key={order.id} className="card" style={{
                borderLeft: `4px solid ${color.hex}`,
                background: selected.has(order.id) ? color.bg : undefined,
              }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {hasMultiple && (
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleSelect(order.id)}
                        style={{ width: 16, height: 16, accentColor: color.hex, cursor: 'pointer' }} />
                    )}
                    <span className={`badge badge-${order.shipping_status?.toLowerCase()}`}>
                      {getShippingStatusLabel(order.shipping_status || 'PENDING')}
                    </span>
                  </div>
                  {order.shipment_group && <span style={{ fontSize: 11, color: color.hex, fontWeight: 600 }}>📦 Agrupado</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Cliente</span>
                    <p style={{ fontWeight: 600 }}>{order.customer_name}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>WhatsApp</span>
                    <p>{formatPhone(order.customer_phone)}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Prenda</span>
                    <p style={{ fontWeight: 600, color: 'var(--accent)' }}>{order.garment?.code}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Precio</span>
                    <p style={{ fontWeight: 600 }}>{formatPrice(order.garment?.price || 0)}</p>
                  </div>
                </div>

                {order.shipping_info && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, padding: 8, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <p>📍 {order.shipping_info.full_name} {order.shipping_info.last_name}</p>
                    <p>{order.shipping_info.address}, {order.shipping_info.district}</p>
                    <p>{order.shipping_info.city}</p>
                    {order.shipping_info.reference && <p style={{ fontStyle: 'italic' }}>Ref: {order.shipping_info.reference}</p>}
                  </div>
                )}

                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{formatDate(order.created_at)}</p>

                <select className="select" value={order.shipping_status || 'PENDING'}
                  onChange={e => updateShippingStatus(order.id, e.target.value)}>
                  <option value="PENDING">📋 Pendiente</option>
                  <option value="SHIPPED">🚚 Enviado</option>
                  <option value="DELIVERED">✅ Entregado</option>
                </select>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
    </>
  );
}
