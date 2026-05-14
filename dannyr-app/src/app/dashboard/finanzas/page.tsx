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
}

export default function FinancesPage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="p-8 text-center"><p>Cargando datos financieros...</p></div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500"><p>Error al cargar finanzas.</p></div>;
  }

  return (
    <>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-2xl font-bold">Inteligencia Financiera</h1>
          <p className="page-subtitle text-muted-foreground">Métricas operativas y flujo de caja empresarial</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="card p-6" style={{ borderLeft: '4px solid var(--info)' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Ingresos Brutos</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--info)', lineHeight: 1 }}>{formatPrice(data.total_revenue)}</p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Todo el dinero ingresado por ventas, sin descontar costos.
          </p>
        </div>

        <div className="card p-6" style={{ borderLeft: `4px solid ${data.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Ganancia Operativa</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: data.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
            {formatPrice(data.gross_profit)}
          </p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Margen: {data.gross_margin_pct.toFixed(1)}%</span><br/>
            Ingresos menos el costo de las prendas específicas que se vendieron (COGS: {formatPrice(data.cogs)}).
          </p>
        </div>

        <div className="card p-6" style={{ borderLeft: `4px solid ${data.cash_flow >= 0 ? 'var(--info)' : 'var(--warning)'}` }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Flujo de Caja Neto</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: data.cash_flow >= 0 ? 'var(--info)' : 'var(--warning)', lineHeight: 1 }}>
            {formatPrice(data.cash_flow)}
          </p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Ingresos menos la <strong>Inversión Total ({formatPrice(data.total_investment)})</strong>. Indica si tienes liquidez.
          </p>
        </div>

        <div className="card p-6" style={{ borderLeft: '4px solid var(--text-muted)' }}>
          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Valor del Inventario</h3>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>{formatPrice(data.inventory_value)}</p>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Capital inmovilizado. El costo de las prendas que aún tienes en stock y faltan por vender.
          </p>
        </div>

      </div>

      {/* Bales Performance Table */}
      <h2 className="text-xl font-bold mb-4 mt-8">Rendimiento por Fardo (Unit Economics)</h2>
      {data.bales_performance.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay datos de fardos para analizar.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fardo</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Rotación</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Inversión</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ingresos</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Rentabilidad (Margen)</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Recuperación (ROI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.bales_performance.map(b => {
                const percentSold = (b.sold_items / b.total_items) * 100;
                const isRecovered = b.recovery_pct >= 100;
                
                return (
                  <tr key={b.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-sm">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b.sold_items} de {b.total_items} prendas vendidas</p>
                    </td>
                    <td className="p-4">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min(percentSold, 100)}%` }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{percentSold.toFixed(0)}% vendido</span>
                    </td>
                    <td className="p-4 text-sm font-medium">{formatPrice(b.cost)}</td>
                    <td className="p-4 text-sm font-medium" style={{ color: 'var(--accent)' }}>{formatPrice(b.revenue)}</td>
                    <td className="p-4">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: b.gross_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {formatPrice(b.gross_profit)}
                        </span>
                        <span className="text-xs text-muted-foreground">Margen: {b.margin_pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span className={`badge ${isRecovered ? 'badge-paid' : 'badge-pending'}`} style={{ fontSize: 10 }}>
                          {isRecovered ? 'RECUPERADO' : 'RECUPERANDO'}
                        </span>
                        <span className="text-xs" style={{ fontWeight: 600, color: isRecovered ? '#10b981' : '#f59e0b' }}>
                          {b.recovery_pct.toFixed(0)}% (Flujo: {formatPrice(b.cash_flow)})
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-6 border-t text-xs text-muted-foreground bg-secondary leading-relaxed" style={{ background: 'var(--bg-secondary)' }}>
            <p className="mb-2"><strong>DICCIONARIO FINANCIERO:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Rentabilidad (Ganancia Operativa):</strong> <span className="text-gray-600">Calcula si estás vendiendo las prendas lo suficientemente caras. Se calcula tomando los ingresos y restando solo el costo proporcional de las prendas que ya entregaste.</span></li>
              <li><strong>Margen (%):</strong> <span className="text-gray-600">Por cada $100 que vendes, cuánto es ganancia pura. Lo ideal en retail de ropa es mantener un margen superior al 40%.</span></li>
              <li><strong>Recuperación (Flujo de Caja):</strong> <span className="text-gray-600">Compara lo que ha entrado de dinero contra lo que gastaste en comprar el fardo completo. Cuando supera el 100%, el fardo ya se pagó solo y todo lo demás es liquidez pura.</span></li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
