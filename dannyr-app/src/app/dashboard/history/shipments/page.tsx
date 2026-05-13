'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShipmentOrder } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone } from '@/lib/utils/format';

export default function ShipmentHistoryPage() {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({ history: 'true' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/shipments?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Envíos</h1>
          <p className="page-subtitle">{orders.length} envío{orders.length !== 1 ? 's' : ''} entregado{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Buscar por cliente o código..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><p>No hay envíos entregados</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Prenda</th>
                <th>Precio</th>
                <th>Dirección</th>
                <th>Entregado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                  <td>{formatPhone(o.customer_phone)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{o.garment?.code || '—'}</td>
                  <td>{formatPrice(o.garment?.price || 0)}</td>
                  <td style={{ fontSize: 12 }}>
                    {o.shipping_info ? `${o.shipping_info.address}, ${o.shipping_info.district}, ${o.shipping_info.city}` : '—'}
                  </td>
                  <td>{formatDate(o.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
