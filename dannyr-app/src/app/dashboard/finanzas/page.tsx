'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '@/lib/utils/format';

interface FinanceData {
  total_revenue: number;
  total_investment: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  cash_flow: number;
  inventory_value: number;
  bales_performance: {
    id: string;
    name: string;
    total_items: number;
    sold_items: number;
    cost: number;
    revenue: number;
    cogs: number;
    gross_profit: number;
    margin_pct: number;
    cash_flow: number;
    recovery_pct: number;
  }[];
  daily_performance: {
    date: string;
    session_name: string;
    bale_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_pct: number;
  }[];
}

export default function FinancesPage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'bales'>('daily');

  const fetchFinances = useCallback(async () => {
    try {
      const res = await fetch('/api/finances');
      const json = await res.json();
      setData(json);
    } catch { 
      // Handle error implicitly
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchFinances(); }, [fetchFinances]);

  if (loading) {
    return (
      <div className="p-12 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner mb-4" style={{ width: 40, height: 40, border: '4px solid rgba(212, 175, 55, 0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Cargando métricas financieras en tiempo real...</p>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500"><p>Error al cargar finanzas.</p></div>;
  }

  return (
    <>
      <div className="page-header mb-8" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title text-2xl font-bold" style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            background: 'linear-gradient(135deg, #d4af37, #ff7eb6)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>Inteligencia Financiera</h1>
          <p className="page-subtitle text-muted-foreground" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Rendimiento neto de lives, costos de fardos y margen de utilidad diaria
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="card p-6" style={{ 
          borderLeft: '4px solid var(--info)',
          background: 'rgba(30, 20, 50, 0.25)',
          border: '1px solid var(--border)',
          borderLeftWidth: '4px',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Ingresos Brutos</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--info)', lineHeight: 1 }}>{formatPrice(data.total_revenue)}</p>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Dinero bruto cobrado de clientes en transmisiones en vivo.
          </p>
        </div>

        <div className="card p-6" style={{ 
          borderLeft: `4px solid ${data.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)'}`,
          background: 'rgba(30, 20, 50, 0.25)',
          border: '1px solid var(--border)',
          borderLeftWidth: '4px',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Utilidad Real</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: data.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
            {formatPrice(data.gross_profit)}
          </p>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <span style={{ fontWeight: 700, color: 'var(--success)' }}>Margen Operativo: {data.gross_margin_pct.toFixed(1)}%</span><br/>
            Ingresos menos costo proporcional (COGS: {formatPrice(data.cogs)}).
          </p>
        </div>

        <div className="card p-6" style={{ 
          borderLeft: `4px solid ${data.cash_flow >= 0 ? 'var(--accent)' : 'var(--warning)'}`,
          background: 'rgba(30, 20, 50, 0.25)',
          border: '1px solid var(--border)',
          borderLeftWidth: '4px',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Flujo Caja Neto (Liquidez)</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: data.cash_flow >= 0 ? 'var(--accent)' : 'var(--warning)', lineHeight: 1 }}>
            {formatPrice(data.cash_flow)}
          </p>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Ventas cobradas menos Inversión Total ({formatPrice(data.total_investment)}).
          </p>
        </div>

        <div className="card p-6" style={{ 
          borderLeft: '4px solid #a855f7',
          background: 'rgba(30, 20, 50, 0.25)',
          border: '1px solid var(--border)',
          borderLeftWidth: '4px',
          borderRadius: '20px',
          boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Valor del Inventario</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>{formatPrice(data.inventory_value)}</p>
          <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Capital inmovilizado. Costo de las prendas aún no vendidas.
          </p>
        </div>

      </div>

      {/* Interactive Tabs for Section Navigation */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('daily')} 
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            background: activeTab === 'daily' ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
            color: activeTab === 'daily' ? 'var(--accent)' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeTab === 'daily' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          📈 Rendimiento Diario por Fardo
        </button>
        <button 
          onClick={() => setActiveTab('bales')} 
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            background: activeTab === 'bales' ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
            color: activeTab === 'bales' ? 'var(--accent)' : 'var(--text-secondary)',
            border: '1px solid',
            borderColor: activeTab === 'bales' ? 'rgba(212, 175, 55, 0.25)' : 'transparent',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          🏷️ Unit Economics por Fardo
        </button>
      </div>

      {/* Render selected view */}
      {activeTab === 'daily' ? (
        <>
          {data.daily_performance.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '24px', background: 'rgba(30, 20, 50, 0.15)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 16px auto', color: 'var(--text-muted)' }}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Aún no se han registrado ventas de fardos en tus Lives.</p>
              <p style={{ fontSize: '12px', marginTop: 4 }}>Ve a la sección de "Ventas de Live" para registrar prendas vendidas y ver su rentabilidad diaria.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: '24px', background: 'rgba(30, 20, 50, 0.15)', overflow: 'hidden' }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(20, 10, 35, 0.4)' }}>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Fecha y Sesión Live</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Fardo Vendido</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px', textAlign: 'center' }}>Prendas</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Ingresos Brutos</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Costo Proporcional</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Utilidad (Margen %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.daily_performance.map((item, idx) => {
                    const marginColor = item.profit >= 0 ? 'var(--success)' : 'var(--danger)';
                    return (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            background: 'rgba(212, 175, 55, 0.08)', 
                            color: 'var(--accent)', 
                            padding: '4px 8px', 
                            borderRadius: '8px', 
                            fontWeight: '700', 
                            letterSpacing: '0.05em' 
                          }}>
                            {item.date}
                          </span>
                          <p style={{ fontWeight: '600', fontSize: '13px', marginTop: '6px', color: 'var(--text-primary)' }}>{item.session_name}</p>
                        </td>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>{item.bale_name}</span>
                        </td>
                        <td className="p-4" style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            fontWeight: '800', 
                            fontSize: '13px', 
                            color: 'white', 
                            background: 'rgba(255,255,255,0.08)',
                            padding: '4px 10px',
                            borderRadius: '10px'
                          }}>
                            {item.quantity_sold} uds
                          </span>
                        </td>
                        <td className="p-4" style={{ padding: '16px', fontWeight: '600', color: 'var(--info)', fontSize: '14px' }}>
                          {formatPrice(item.revenue)}
                        </td>
                        <td className="p-4" style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                          {formatPrice(item.cost)}
                        </td>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: marginColor }}>
                              {item.profit >= 0 ? '+' : ''}{formatPrice(item.profit)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                              Margen: {item.margin_pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border)', background: 'rgba(20, 10, 35, 0.4)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                💡 <strong>¿Cómo se calcula el rendimiento diario?</strong> Tomamos el número de prendas vendidas en el Live de ese día, restamos el costo proporcional exacto de adquisición de esas prendas (según el promedio del fardo original) y obtenemos la utilidad neta pura con su respectivo margen de retorno.
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {data.bales_performance.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay datos de fardos para analizar.
            </div>
          ) : (
            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: '24px', background: 'rgba(30, 20, 50, 0.15)', overflow: 'hidden' }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(20, 10, 35, 0.4)' }}>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Fardo</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Rotación (Stock)</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Inversión Fardo</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Ventas Totales</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Rentabilidad Neta</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', padding: '16px' }}>Recuperación (ROI)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.bales_performance.map(b => {
                    const percentSold = (b.sold_items / b.total_items) * 100;
                    const isRecovered = b.recovery_pct >= 100;
                    
                    return (
                      <tr key={b.id} className="hover:bg-muted/50 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <p className="font-semibold text-sm" style={{ color: 'white' }}>{b.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{b.sold_items} de {b.total_items} prendas vendidas</p>
                        </td>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', height: '6px', marginBottom: '8px', overflow: 'hidden' }}>
                            <div style={{ background: 'linear-gradient(90deg, #ff7eb6, #a855f7)', height: '6px', borderRadius: '9999px', width: `${Math.min(percentSold, 100)}%` }}></div>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{percentSold.toFixed(0)}% vendido</span>
                        </td>
                        <td className="p-4 text-sm font-medium" style={{ padding: '16px' }}>{formatPrice(b.cost)}</td>
                        <td className="p-4 text-sm font-bold" style={{ color: 'var(--accent)', padding: '16px' }}>{formatPrice(b.revenue)}</td>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: b.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {formatPrice(b.gross_profit)}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Margen: {b.margin_pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="p-4" style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                            <span style={{ 
                              fontSize: '9px',
                              fontWeight: '700',
                              letterSpacing: '0.05em',
                              background: isRecovered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isRecovered ? '#10b981' : '#f59e0b',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {isRecovered ? 'COMPLETAMENTE RECUPERADO' : 'RECUPERANDO INVERSIÓN'}
                            </span>
                            <span className="text-xs" style={{ fontWeight: 600, color: isRecovered ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                              {b.recovery_pct.toFixed(0)}% (Flujo: {formatPrice(b.cash_flow)})
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="p-6 border-t text-xs text-muted-foreground bg-secondary leading-relaxed" style={{ background: 'rgba(20, 10, 35, 0.4)', padding: '24px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <p className="mb-2" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>DICCIONARIO FINANCIERO OPERATIVO:</p>
                <ul style={{ paddingLeft: '20px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Ganancia Operativa:</strong> Mide si los precios del Live son lo suficientemente rentables frente al costo de adquisición real de cada prenda entregada.</li>
                  <li><strong>Flujo de Caja del Fardo:</strong> Compara la ganancia de ventas directas contra el costo original en el que compraste el fardo entero. Al superar el 100%, el fardo es ganancia 100% libre.</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
