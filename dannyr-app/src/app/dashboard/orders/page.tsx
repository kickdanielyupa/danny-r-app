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

  const handleCreateOrder = async (form: any) => {
    if (form.success) {
      showToast('Pedido creado exitosamente');
      setShowModal(false);
      fetchOrders();
      return;
    }

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

function NewOrderModal({ onSave, onClose }: { onSave: (f: any) => void; onClose: () => void }) {
  const [bales, setBales] = useState<any[]>([]);
  const [selectedBaleId, setSelectedBaleId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/bales?status=ACTIVE').then(res => res.json()).then(data => {
      setBales(data.bales || []);
      if (data.bales?.length > 0) setSelectedBaleId(data.bales[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaleId || selectedBaleId === 'undefined' || !price || !name || !phone) {
      alert('Por favor selecciona un fardo válido y completa todos los campos.');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/sales/generic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bale_id: selectedBaleId,
        price: parseFloat(price),
        customer_name: name,
        customer_phone: phone.replace(/\D/g, ''),
        status: 'PENDING_PAYMENT',
        description: description || undefined
      })
    });
    const data = await res.json();
    if (data.success) {
      onSave({ success: true }); // Trigger refresh
    } else {
      alert(data.error || 'Error al crear pedido de fardo');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Nuevo Pedido Manual</h2>
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-sm btn-ghost" style={{ flex: 1, cursor: 'not-allowed', opacity: 0.5 }} disabled title="Opción deshabilitada. Usar ventas por fardo.">Con Código 🔒</button>
          <button type="button" className="btn btn-sm btn-primary" style={{ flex: 1 }}>Desde Fardo ✨</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <>
            <div className="form-group">
              <label className="form-label">Seleccionar Fardo *</label>
              <select className="select" value={selectedBaleId} onChange={e => setSelectedBaleId(e.target.value)} required>
                {bales.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.remaining_items} disp.)</option>
                ))}
                {bales.length === 0 && <option value="">No hay fardos activos</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio de Venta ($) *</label>
              <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="15.00" required />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción / Prenda (Opcional)</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. POLO NEGRO" />
            </div>
          </>

          <div className="form-group">
            <label className="form-label">Nombre del cliente *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ana" required />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp del cliente *</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="51999888777" required />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || bales.length === 0}>
              {saving ? 'Creando...' : 'Crear Pedido'}
            </button>
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
  return (
    <div className="card">
      <div className="card-header">
        <span className="badge badge-pending">Pendiente de pago</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, fontSize: 13 }}>
        <div style={{ gridColumn: 'span 2' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Prenda / Descripción</span>
          <p style={{ fontWeight: 600, color: 'var(--accent)' }}>
            {order.garment?.name || order.garment?.code || '—'} 
            {order.garment?.bale_id && <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>(Fardo)</span>}
          </p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Cliente</span>
          <p style={{ fontWeight: 600 }}>{order.customer_name}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>WhatsApp</span>
          <p>{formatPhone(order.customer_phone)}</p>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Precio</span>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{formatPrice(order.garment?.price || 0)}</p>
        </div>
      </div>

      {order.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>📝 {order.notes}</p>}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{formatDate(order.created_at)}</p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-success" style={{ flex: 1 }} onClick={() => onConfirm(order.id)}>
          ☑ PAGADO
        </button>
        <button className="btn btn-danger" onClick={() => onCancel(order.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}
