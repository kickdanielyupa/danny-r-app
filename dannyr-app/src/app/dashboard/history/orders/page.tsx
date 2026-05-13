'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrderWithGarment } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone, getOrderStatusLabel } from '@/lib/utils/format';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderWithGarment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ history: 'true' });
      if (filter !== 'ALL') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Pedidos</h1>
          <p className="page-subtitle">{orders.length} registro{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['ALL', 'PAID', 'CANCELLED', 'EXPIRED'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'Todos' : getOrderStatusLabel(f)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input className="input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><p>No hay registros</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>WhatsApp</th>
                <th>Prenda</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                  <td>{formatPhone(o.customer_phone)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{o.garment?.code || '—'}</td>
                  <td>{formatPrice(o.garment?.price || 0)}</td>
                  <td><span className={`badge badge-${o.status.toLowerCase()}`}>{getOrderStatusLabel(o.status)}</span></td>
                  <td>{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
