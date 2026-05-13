'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Garment, CreateGarmentRequest } from '@/lib/types/database';
import { formatPrice, formatDate, getGarmentStatusLabel } from '@/lib/utils/format';

type GarmentFilter = 'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export default function InventoryPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GarmentFilter>('AVAILABLE');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const fetchGarments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/garments?${params}`);
      const data = await res.json();
      setGarments(data.garments || []);
    } catch { setGarments([]); } finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchGarments(); }, [fetchGarments]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (form: CreateGarmentRequest) => {
    const url = editingGarment ? `/api/garments/${editingGarment.id}` : '/api/garments';
    const method = editingGarment ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      showToast(editingGarment ? 'Prenda actualizada' : 'Prenda creada');
      setShowModal(false); setEditingGarment(null); fetchGarments();
    } else {
      try {
        const err = await res.json();
        showToast(err.error || 'Error al guardar', 'error');
      } catch (e) {
        showToast('Error del servidor (500). Revisa consola o variables de entorno.', 'error');
      }
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('¿Archivar esta prenda?')) return;
    const res = await fetch(`/api/garments/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Prenda archivada'); fetchGarments(); }
  };

  const filtered = garments;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="page-subtitle">{filtered.length} prenda{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setEditingGarment(null); setShowModal(true); }}>
            + Nueva prenda
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['ALL', 'AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'] as GarmentFilter[]).map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'Todas' : getGarmentStatusLabel(f)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input className="input" placeholder="Buscar por código..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>No hay prendas{filter !== 'ALL' ? ` con estado "${getGarmentStatusLabel(filter)}"` : ''}</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Creada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{g.code}</td>
                  <td>{g.name || '—'}</td>
                  <td>{g.category || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(g.price)}</td>
                  <td><span className={`badge badge-${g.status.toLowerCase()}`}>{getGarmentStatusLabel(g.status)}</span></td>
                  <td>{formatDate(g.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => { setEditingGarment(g); setShowModal(true); }}>Editar</button>
                      {g.status === 'AVAILABLE' && <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleArchive(g.id)}>Archivar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <GarmentModal
          garment={editingGarment}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingGarment(null); }}
        />
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </>
  );
}

function GarmentModal({ garment, onSave, onClose }: { garment: Garment | null; onSave: (f: CreateGarmentRequest) => void; onClose: () => void }) {
  const [code, setCode] = useState(garment?.code || '');
  const [name, setName] = useState(garment?.name || '');
  const [category, setCategory] = useState(garment?.category || '');
  const [price, setPrice] = useState(garment?.price?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !price) return;
    setSaving(true);
    await onSave({ code: code.toUpperCase().trim(), name: name || undefined, category: category || undefined, price: parseFloat(price) });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{garment ? 'Editar prenda' : 'Nueva prenda'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Código *</label>
            <input className="input" value={code} onChange={e => setCode(e.target.value)} placeholder="ABC-001" required />
          </div>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Polera vintage" />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <input className="input" value={category} onChange={e => setCategory(e.target.value)} placeholder="Poleras, Jeans, etc." />
          </div>
          <div className="form-group">
            <label className="form-label">Precio *</label>
            <input className="input" type="number" step="0.01" min="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="39.90" required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
