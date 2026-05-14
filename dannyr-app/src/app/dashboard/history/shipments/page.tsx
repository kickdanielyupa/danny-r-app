'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ShipmentOrder } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone } from '@/lib/utils/format';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function ShipmentHistoryPage() {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null; step: 1 | 2 }>({ isOpen: false, id: null, step: 1 });

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

  const handleDelete = async () => {
    if (confirmState.step === 1) {
      setConfirmState(prev => ({ ...prev, step: 2 }));
      return;
    }

    const res = await fetch(`/api/orders/${confirmState.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmState({ isOpen: false, id: null, step: 1 });
      fetchHistory();
    }
  };

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
                  <td style={{ fontSize: 12 }}>
                    {o.shipping_info ? `${o.shipping_info.address}, ${o.shipping_info.district}, ${o.shipping_info.city}` : '—'}
                  </td>
                  <td>{formatDate(o.updated_at)}</td>
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
        title="Eliminar Envío"
        message={confirmState.step === 1 
          ? "¿Estás seguro de que deseas eliminar este envío del historial?" 
          : "ALERTA: Esta acción es permanente y eliminará el registro de venta. ¿Confirmas la eliminación total?"
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
