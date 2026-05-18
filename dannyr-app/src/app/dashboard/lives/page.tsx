'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice, formatShortDate } from '@/lib/utils/format';
import ConfirmModal from '@/app/components/ConfirmModal';
import Link from 'next/link';

interface LiveSessionSale {
  id: string;
  quantity_sold: number;
  total_price: number;
  bale_id: string;
  bale_name: string;
  bale_average_cost: number;
  profit: number;
}

interface LiveSession {
  id: string;
  name: string;
  session_date: string;
  notes: string | null;
  created_at: string;
  sales: LiveSessionSale[];
  total_revenue: number;
  total_items: number;
  total_profit: number;
}

export default function LivesPage() {
  const [lives, setLives] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const fetchLives = useCallback(async () => {
    try {
      const res = await fetch('/api/lives');
      const data = await res.json();
      setLives(data.lives || []);
    } catch {
      setLives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLives();
  }, [fetchLives]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteLive = async () => {
    if (!confirmState.id) return;
    try {
      const res = await fetch(`/api/lives/${confirmState.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Sesión de Live eliminada con éxito');
        fetchLives();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar', 'error');
      }
    } catch {
      showToast('Error del servidor', 'error');
    } finally {
      setConfirmState({ isOpen: false, id: null });
    }
  };

  // Calculate high-level stats
  const totalRevenueAllTime = lives.reduce((acc, l) => acc + l.total_revenue, 0);
  const totalItemsAllTime = lives.reduce((acc, l) => acc + l.total_items, 0);
  const totalProfitAllTime = lives.reduce((acc, l) => acc + l.total_profit, 0);

  return (
    <>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Ventas de Live</h1>
          <p className="page-subtitle">Registro financiero consolidado y balance de lives o ventas diarias</p>
        </div>
        <div>
          <Link
            href="/dashboard/lives/new"
            className="btn btn-primary bg-purple-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Registrar Live / Venta Diaria
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-stats mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <div className="card stat-card" style={{ padding: 20 }}>
          <div className="text-muted-foreground" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendido Total</div>
          <div style={{ fontSize: 28, fontWeight: '800', color: 'var(--text)', marginTop: 8 }}>
            {formatPrice(totalRevenueAllTime)}
          </div>
        </div>
        <div className="card stat-card" style={{ padding: 20 }}>
          <div className="text-muted-foreground" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prendas Vendidas</div>
          <div style={{ fontSize: 28, fontWeight: '800', color: 'var(--text)', marginTop: 8 }}>
            {totalItemsAllTime} uds.
          </div>
        </div>
        <div className="card stat-card" style={{ padding: 20 }}>
          <div className="text-muted-foreground" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ganancia Consolidada</div>
          <div style={{ 
            fontSize: 28, 
            fontWeight: '800', 
            color: totalProfitAllTime >= 0 ? '#10b981' : '#ef4444', 
            marginTop: 8 
          }}>
            {formatPrice(totalProfitAllTime)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando sesiones de venta...</p></div>
      ) : lives.length === 0 ? (
        <div className="empty-state">
          <p>No se han registrado sesiones de venta de Live aún.</p>
          <Link href="/dashboard/lives/new" className="btn btn-primary btn-sm mt-4">Registrar la Primera</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {lives.map(live => (
            <div key={live.id} className="card" style={{ padding: 24, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h3 className="card-title" style={{ fontSize: 20, margin: 0 }}>{live.name}</h3>
                    <span style={{ fontSize: 13, background: 'var(--bg-muted)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {formatShortDate(live.session_date)}
                    </span>
                  </div>
                  {live.notes && (
                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                      {live.notes}
                    </p>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ganancia neta</div>
                    <span style={{ 
                      fontSize: 18, 
                      fontWeight: '800', 
                      color: live.total_profit >= 0 ? '#10b981' : '#ef4444' 
                    }}>
                      {formatPrice(live.total_profit)}
                    </span>
                  </div>
                  
                  <button 
                    className="btn btn-icon btn-ghost" 
                    style={{ color: 'var(--danger)', padding: 8 }} 
                    title="Eliminar Live" 
                    onClick={() => setConfirmState({ isOpen: true, id: live.id })}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Detalle de Ventas por Fardo
                </h4>
                
                <div className="table-responsive">
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Fardo</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Prendas Vendidas</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Costo Promedio c/u</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Inversión (Costo)</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Total Cobrado</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>Ganancia Neta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {live.sales.map((sale) => {
                        const investment = sale.quantity_sold * sale.bale_average_cost;
                        return (
                          <tr key={sale.id}>
                            <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: '600' }}>{sale.bale_name}</td>
                            <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>{sale.quantity_sold} uds.</td>
                            <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right', color: 'var(--text-muted)' }}>{formatPrice(sale.bale_average_cost)}</td>
                            <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right', color: 'var(--text-muted)' }}>{formatPrice(investment)}</td>
                            <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right', fontWeight: '600' }}>{formatPrice(sale.total_price)}</td>
                            <td style={{ 
                              padding: '10px 12px', 
                              fontSize: 14, 
                              textAlign: 'right', 
                              fontWeight: '700',
                              color: sale.profit >= 0 ? '#10b981' : '#ef4444'
                            }}>
                              {formatPrice(sale.profit)}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Summary Row */}
                      <tr style={{ background: 'var(--bg-muted)', fontWeight: '700' }}>
                        <td style={{ padding: '12px', borderRadius: '0 0 0 8px' }}>Total Consolidado</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{live.total_items} uds.</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {formatPrice(live.total_revenue - live.total_profit)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{formatPrice(live.total_revenue)}</td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right',
                          borderRadius: '0 0 8px 0',
                          color: live.total_profit >= 0 ? '#10b981' : '#ef4444'
                        }}>
                          {formatPrice(live.total_profit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Eliminar Sesión de Venta"
        message="¿Estás seguro de que deseas eliminar este registro de Live? Esto restaurará automáticamente las prendas vendidas al stock de sus respectivos fardos. Esta acción no se puede deshacer."
        onConfirm={handleDeleteLive}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
        confirmText="Sí, eliminar"
      />

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
