'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrderWithGarment } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone, getOrderStatusLabel } from '@/lib/utils/format';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderWithGarment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null; step: 1 | 2 }>({ isOpen: false, id: null, step: 1 });

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

  const handleDelete = async () => {
    if (confirmState.step === 1) {
      setConfirmState(prev => ({ ...prev, step: 2 }));
      return;
    }

    const res = await fetch(`/api/orders/${confirmState.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmState({ isOpen: false, id: null, step: 1 });
      fetchOrders();
    }
  };

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
                <th>Acción</th>
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
                  <td>
                    <button className="btn btn-icon btn-ghost" style={{ color: '#ef4444' }} onClick={() => setConfirmState({ isOpen: true, id: o.id, step: 1 })}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="Eliminar Pedido"
        message={confirmState.step === 1 
          ? "¿Estás seguro de que deseas eliminar este pedido del historial?" 
          : "ALERTA: Esta acción es permanente y también eliminará la prenda asociada si es de un fardo. ¿Confirmas la eliminación total?"
        }
        isDouble={true}
        step={confirmState.step}
        onConfirm={handleDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null, step: 1 })}
        confirmText="Sí, eliminar"
      />
    </>
  );
}
