'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bale, CreateBaleRequest } from '@/lib/types/database';
import { formatPrice, formatDate } from '@/lib/utils/format';
import ConfirmModal from '@/app/components/ConfirmModal';
import Link from 'next/link';

export default function BalesPage() {
  const [bales, setBales] = useState<Bale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState<{ isOpen: boolean; baleId: string | null }>({ isOpen: false, baleId: null });
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  
  // Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null; step: 1 | 2 }>({ isOpen: false, id: null, step: 1 });

  const fetchBales = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: filter });
      if (search) params.set('search', search);
      const res = await fetch(`/api/bales?${params}`);
      const data = await res.json();
      setBales(data.bales || []);
    } catch { 
      setBales([]); 
    } finally { 
      setLoading(false); 
    }
  }, [filter, search]);

  useEffect(() => { fetchBales(); }, [fetchBales]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveBale = async (form: CreateBaleRequest) => {
    const res = await fetch('/api/bales', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    if (res.ok) {
      showToast('Fardo registrado');
      setShowModal(false);
      fetchBales();
    } else {
      try {
        const err = await res.json();
        showToast(err.error || 'Error al guardar', 'error');
      } catch {
        showToast('Error del servidor', 'error');
      }
    }
  };

  const handleQuickSale = async (baleId: string, price: number, customerName: string, customerPhone: string, description: string, status?: string) => {
    const res = await fetch('/api/sales/generic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bale_id: baleId, price, customer_name: customerName, customer_phone: customerPhone, description, status })
    });

    if (res.ok) {
      showToast('Venta registrada con éxito');
      setShowSaleModal({ isOpen: false, baleId: null });
      fetchBales();
    } else {
      const err = await res.json();
      showToast(err.error || 'Error al registrar venta', 'error');
    }
  };

  const handleDeleteBale = async () => {
    if (confirmState.step === 1) {
      setConfirmState(prev => ({ ...prev, step: 2 }));
      return;
    }

    const res = await fetch(`/api/bales/${confirmState.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Fardo y datos asociados eliminados');
      setConfirmState({ isOpen: false, id: null, step: 1 });
      fetchBales();
    } else {
      const err = await res.json();
      showToast(err.error || 'Error al eliminar', 'error');
      setConfirmState({ isOpen: false, id: null, step: 1 });
    }
  };

  const handleArchiveBale = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    const res = await fetch(`/api/bales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(newStatus === 'ARCHIVED' ? 'Fardo archivado' : 'Fardo restaurado');
      fetchBales();
    }
  };

  return (
    <>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Gestión de Fardos (Live)</h1>
          <p className="page-subtitle">Control de stock y ventas rápidas en tiempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard/history/bales" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            Ver Historial
          </Link>
          <button className="btn btn-primary bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Fardo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${filter === 'ACTIVE' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('ACTIVE')}>Activos</button>
          <button className={`btn btn-sm ${filter === 'ARCHIVED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('ARCHIVED')}>Recientemente Archivados</button>
        </div>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input" placeholder="Buscar fardo por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : bales.length === 0 ? (
        <div className="empty-state"><p>No hay fardos registrados</p></div>
      ) : (
        <div className="grid-cards">
          {bales.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="card-header" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 className="card-title" style={{ fontSize: 18, margin: 0 }}>{b.name}</h3>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {b.id.split('-')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-icon btn-ghost" title="Archivar" onClick={() => handleArchiveBale(b.id, b.status)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    </button>
                    <button className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} title="Eliminar" onClick={() => setConfirmState({ isOpen: true, id: b.id, step: 1 })}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <span className={`badge ${b.status === 'ACTIVE' ? "badge-available" : b.status === 'COMPLETED' ? "badge-sold" : "badge-archived"}`}>
                    {b.status === 'ACTIVE' ? 'Activo' : b.status === 'COMPLETED' ? 'Agotado' : 'Archivado'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Prendas Restantes:</span>
                    <span className="font-semibold">{b.remaining_items} / {b.total_items}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-semibold">{formatPrice(b.cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Promedio c/u:</span>
                    <span className="font-semibold">{formatPrice(b.average_cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-xs mt-2">
                    <span className="text-muted-foreground">Registrado:</span>
                    <span>{formatDate(b.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="btn btn-primary w-full"
                disabled={b.status !== 'ACTIVE' || b.remaining_items <= 0}
                onClick={() => setShowSaleModal({ isOpen: true, baleId: b.id })}
              >
                ⚡ Venta Rápida
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="Eliminar Fardo"
        message={confirmState.step === 1 
          ? "¿Estás seguro de que deseas eliminar este fardo?" 
          : "ATENCIÓN: Si eliminas este fardo, se borrarán TAMBIÉN todas las prendas y ventas asociadas a él. ¿Deseas continuar?"
        }
        isDouble={true}
        step={confirmState.step}
        onConfirm={handleDeleteBale}
        onCancel={() => setConfirmState({ isOpen: false, id: null, step: 1 })}
        confirmText="Sí, eliminar todo"
      />

      {showModal && (
        <BaleModal
          onSave={handleSaveBale}
          onClose={() => setShowModal(false)}
        />
      )}

      {showSaleModal.isOpen && showSaleModal.baleId && (
        <QuickSaleModal
          baleId={showSaleModal.baleId}
          onSave={handleQuickSale}
          onClose={() => setShowSaleModal({ isOpen: false, baleId: null })}
        />
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}

function BaleModal({ onSave, onClose }: { onSave: (f: CreateBaleRequest) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [totalItems, setTotalItems] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalItems || !cost) return;
    setSaving(true);
    await onSave({ name, total_items: parseInt(totalItems), cost: parseFloat(cost) } as any);
    setSaving(false);
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title text-xl font-bold mb-4">Registrar Nuevo Fardo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Nombre del Fardo *</label>
            <input className="input w-full p-2 border rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Fardo Poleras Vintage" required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Cantidad de Prendas *</label>
            <input className="input w-full p-2 border rounded" type="number" min="1" value={totalItems} onChange={e => setTotalItems(e.target.value)} placeholder="200" required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Costo Total ($) *</label>
            <input className="input w-full p-2 border rounded" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="500.00" required />
          </div>
          {totalItems && cost && parseInt(totalItems) > 0 ? (
            <div className="bg-purple-50 p-3 rounded-md text-sm text-purple-800">
              Costo Promedio por Prenda: <strong>{formatPrice(parseFloat(cost) / parseInt(totalItems))}</strong>
            </div>
          ) : null}
          <div className="modal-actions flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-ghost px-4 py-2 text-gray-600 hover:bg-gray-100 rounded" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Fardo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickSaleModal({ baleId, onSave, onClose }: { baleId: string; onSave: (baleId: string, price: number, customerName: string, customerPhone: string, description: string, status?: string) => void; onClose: () => void }) {
  const [price, setPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isReservation, setIsReservation] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !customerName) return;
    setSaving(true);
    await onSave(
      baleId, 
      parseFloat(price), 
      customerName, 
      customerPhone || '000000000', 
      description,
      isReservation ? 'PENDING_PAYMENT' : 'PAID'
    );
    setSaving(false);
  };

  const quickPrices = [10, 15, 20, 25, 30];

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title text-xl font-bold mb-4">⚡ Venta Rápida</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Precio de Venta ($) *</label>
            <div className="flex gap-2 mb-2">
              {quickPrices.map(p => (
                <button type="button" key={p} onClick={() => setPrice(p.toString())} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">
                  ${p}
                </button>
              ))}
            </div>
            <input className="input w-full p-2 border rounded" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="15.00" required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Nombre del Cliente *</label>
            <input className="input w-full p-2 border rounded" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej. Juan Pérez" required />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Teléfono / WhatsApp (Opcional)</label>
            <input className="input w-full p-2 border rounded" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+56912345678" />
          </div>
          <div className="form-group">
            <label className="block text-sm font-medium mb-1">Descripción / Prenda (Opcional)</label>
            <input className="input w-full p-2 border rounded" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. POLO NEGRO" />
          </div>
          <div className="form-group flex items-center gap-2 mt-2">
            <input type="checkbox" id="isReservation" checked={isReservation} onChange={e => setIsReservation(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="isReservation" className="text-sm font-medium cursor-pointer">Enviar a "Pendiente de Pago"</label>
          </div>
          <div className="modal-actions flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-ghost px-4 py-2 text-gray-600 hover:bg-gray-100 rounded" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold" disabled={saving}>
              {saving ? 'Registrando...' : isReservation ? 'Crear Pedido Pendiente' : 'Confirmar Venta Pagada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
