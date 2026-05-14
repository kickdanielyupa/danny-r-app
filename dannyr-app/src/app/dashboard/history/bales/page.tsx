'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bale } from '@/lib/types/database';
import { formatPrice, formatDate } from '@/lib/utils/format';
import ConfirmModal from '@/app/components/ConfirmModal';

export default function BalesHistoryPage() {
  const [bales, setBales] = useState<Bale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null; step: 1 | 2 }>({ isOpen: false, id: null, step: 1 });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/bales?status=ARCHIVED&search=${search}`);
      const data = await res.json();
      setBales(data.bales || []);
    } catch { setBales([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async () => {
    if (confirmState.step === 1) {
      setConfirmState(prev => ({ ...prev, step: 2 }));
      return;
    }

    const res = await fetch(`/api/bales/${confirmState.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmState({ isOpen: false, id: null, step: 1 });
      fetchHistory();
    }
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/bales/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    if (res.ok) fetchHistory();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Fardos</h1>
          <p className="page-subtitle">{bales.length} fardo{bales.length !== 1 ? 's' : ''} archivado{bales.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Buscar fardo..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando...</p></div>
      ) : bales.length === 0 ? (
        <div className="empty-state"><p>No hay fardos en el historial</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fardo</th>
                <th>Costo Total</th>
                <th>Prendas</th>
                <th>Vencido/Agotado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bales.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{formatPrice(b.cost)}</td>
                  <td>{b.total_items} prendas</td>
                  <td>
                    <span className="badge badge-sold">
                      {b.remaining_items === 0 ? 'AGOTADO' : 'ARCHIVADO'}
                    </span>
                  </td>
                  <td>{formatDate(b.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-ghost" title="Restaurar" onClick={() => handleRestore(b.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                      </button>
                      <button className="btn btn-sm btn-ghost" style={{ color: '#ef4444' }} onClick={() => setConfirmState({ isOpen: true, id: b.id, step: 1 })}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title="Eliminar Fardo Permanente"
        message={confirmState.step === 1 
          ? "¿Estás seguro de borrar este fardo del historial?" 
          : "ALERTA: Esto borrará el fardo y todas sus estadísticas de finanzas. ¿Confirmas?"
        }
        isDouble={true}
        step={confirmState.step}
        onConfirm={handleDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null, step: 1 })}
        confirmText="Sí, borrar todo"
      />
    </>
  );
}
