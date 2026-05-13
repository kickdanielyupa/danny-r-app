'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrderWithGarment } from '@/lib/types/database';
import { formatPrice, formatDate, formatPhone } from '@/lib/utils/format';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithGarment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const [showModal, setShowModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?status=PENDING_PAYMENT');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const confirmPayment = async (orderId: string) => {
    if (!confirm('¿Confirmar pago de este pedido?')) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_payment' }),
    });
    const data = await res.json();
    if (data.success) { showToast('Pago confirmado ✓'); fetchOrders(); }
    else showToast(data.error || 'Error', 'error');
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('¿Cancelar este pedido? La prenda volverá a estar disponible.')) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json();
    if (data.success) { showToast('Pedido cancelado'); fetchOrders(); }
    else showToast(data.error || 'Error', 'error');
  };

  const handleCreateOrder = async (form: { code: string, customer_name: string, customer_phone: string }) => {
    const res = await fetch('/api/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Pedido creado exitosamente');
      setShowModal(false);
      fetchOrders();
    } else {
      showToast(data.message || data.error || 'Error al crear pedido', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos Activos</h1>
          <p className="page-subtitle">{orders.length} pendiente{orders.length !== 1 ? 's' : ''} de pago</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nuevo pedido manual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No hay pedidos pendientes de pago</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Los pedidos aparecerán aquí cuando una clienta reserve una prenda</p>
        </div>
      ) : (
        <div className="grid-cards">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onConfirm={confirmPayment} onCancel={cancelOrder} />
          ))}
        </div>
      )}

      {showModal && (
        <NewOrderModal 
          onSave={handleCreateOrder} 
          onClose={() => setShowModal(false)} 
        />
      )}

      {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
    </>
  );
}

function NewOrderModal({ onSave, onClose }: { onSave: (f: {code: string, customer_name: string, customer_phone: string}) => void; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !phone) return;
    setSaving(true);
    await onSave({ code: code.toUpperCase().trim(), customer_name: name, customer_phone: phone.replace(/\D/g, '') });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Nuevo Pedido Manual</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Código de la prenda *</label>
            <input className="input" value={code} onChange={e => setCode(e.target.value)} placeholder="ABC-001" required />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre del cliente *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ana" required />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp del cliente *</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="51999888777" required />
            <span style={{fontSize: 11, color: 'var(--text-muted)'}}>Incluir código de país sin el +. Ej: 51987654321</span>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear Pedido'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderCard({ order, onConfirm, onCancel }: {
  order: OrderWithGarment;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!order.expires_at) return;
      const now = Date.now();
      const exp = new Date(order.expires_at).getTime();
      const diff = exp - now;
      if (diff <= 0) { setTimeLeft('00:00'); setIsExpired(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      setIsExpired(false);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [order.expires_at]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="badge badge-pending">Pendiente de pago</span>
        <span className={`timer ${isExpired ? 'timer-danger' : 'timer-ok'}`}>⏱ {timeLeft}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, fontSize: 13 }}>
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
          <p style={{ fontWeight: 600, color: 'var(--accent)' }}>{order.garment?.code || '—'}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Precio</span>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{formatPrice(order.garment?.price || 0)}</p>
        </div>
      </div>

      {order.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>📝 {order.notes}</p>}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{formatDate(order.created_at)}</p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-success" style={{ flex: 1 }} onClick={() => onConfirm(order.id)} disabled={isExpired}>
          ☑ PAGADO
        </button>
        <button className="btn btn-danger" onClick={() => onCancel(order.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}
