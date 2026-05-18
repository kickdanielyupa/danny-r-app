'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import { playCashSound } from '@/lib/utils/sfx';

interface Bale {
  id: string;
  name: string;
  remaining_items: number;
  average_cost: number;
}

interface SaleRow {
  bale_id: string;
  quantity_sold: number;
  total_price: number;
}

export default function NewLivePage() {
  const router = useRouter();
  const [bales, setBales] = useState<Bale[]>([]);
  const [name, setName] = useState('');
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [notes, setNotes] = useState('');
  const [sales, setSales] = useState<SaleRow[]>([
    { bale_id: '', quantity_sold: 1, total_price: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    async function fetchBales() {
      try {
        const res = await fetch('/api/bales?status=ACTIVE');
        if (res.ok) {
          const data = await res.json();
          setBales(data.bales || []);
        }
      } catch (error) {
        console.error('Error fetching bales', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBales();
  }, []);

  // Autofill Name when date changes
  useEffect(() => {
    if (sessionDate && !name) {
      const dateParts = sessionDate.split('-');
      if (dateParts.length === 3) {
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        setName(`Live del ${formattedDate}`);
      }
    }
  }, [sessionDate, name]);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddRow = () => {
    setSales([...sales, { bale_id: '', quantity_sold: 1, total_price: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (sales.length === 1) return;
    const newSales = [...sales];
    newSales.splice(index, 1);
    setSales(newSales);
  };

  const handleRowChange = (index: number, field: keyof SaleRow, value: string | number) => {
    const newSales = [...sales];
    newSales[index] = {
      ...newSales[index],
      [field]: value
    };
    setSales(newSales);
  };

  // Live Calculations
  const calculatedStats = sales.map((sale) => {
    const selectedBale = bales.find((b) => b.id === sale.bale_id);
    const averageCost = selectedBale ? selectedBale.average_cost : 0;
    const costOfGoods = sale.quantity_sold * averageCost;
    const profit = sale.total_price - costOfGoods;
    return {
      averageCost,
      costOfGoods,
      profit
    };
  });

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_price || 0), 0);
  const totalCost = calculatedStats.reduce((acc, s) => acc + s.costOfGoods, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalItems = sales.reduce((acc, s) => acc + Number(s.quantity_sold || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    // Validation
    if (!name || !sessionDate) {
      showToast('Por favor completa los campos principales.', 'error');
      return;
    }

    const invalidSales = sales.some((s) => !s.bale_id || s.quantity_sold <= 0 || s.total_price < 0);
    if (invalidSales) {
      showToast('Por favor completa todas las líneas de venta con fardos y cantidades válidas.', 'error');
      return;
    }

    // Stock check
    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i];
      const selectedBale = bales.find((b) => b.id === sale.bale_id);
      if (selectedBale && sale.quantity_sold > selectedBale.remaining_items) {
        showToast(`La cantidad vendida de "${selectedBale.name}" (${sale.quantity_sold}) excede el stock restante (${selectedBale.remaining_items}).`, 'error');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch('/api/lives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          session_date: sessionDate,
          notes,
          sales
        })
      });

      if (res.ok) {
        playCashSound();
        showToast('Venta de Live registrada con éxito');
        setTimeout(() => {
          router.push('/dashboard/lives');
        }, 1500);
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar', 'error');
      }
    } catch {
      showToast('Error del servidor', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">Registrar Nuevo Live / Venta Diaria</h1>
          <p className="page-subtitle">Ingresa el total vendido por fardo en la sesión del día</p>
        </div>
        <div>
          <Link href="/dashboard/lives" className="btn btn-ghost">
            Volver
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Cargando fardos activos...</p></div>
      ) : bales.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: 'var(--danger)', fontWeight: 'bold' }}>¡Atención! No hay fardos ACTIVOS registrados en el sistema.</p>
          <p className="text-sm text-muted-foreground mt-2">Debes crear al menos un fardo activo antes de poder ingresar ventas.</p>
          <Link href="/dashboard/bales" className="btn btn-primary mt-4">Crear Fardo</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Live metadata */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: '700', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              Datos del Live / Día
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className="form-group">
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Fecha de la Venta *</label>
                <input
                  className="input w-full p-2 border rounded"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Identificador / Nombre *</label>
                <input
                  className="input w-full p-2 border rounded"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Live Noche de Martes"
                  required
                />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Notas / Observaciones (Opcional)</label>
              <textarea
                className="input w-full p-2 border rounded"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ingresa notas sobre esta venta, ej: 'Excelente live con alta participación'."
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Section: Sales Items */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: '700', margin: 0 }}>Líneas de Venta por Fardo</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleAddRow}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', borderColor: 'var(--primary)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Agregar Fardo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sales.map((sale, index) => {
                const currentBale = bales.find((b) => b.id === sale.bale_id);
                const stats = calculatedStats[index];
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', 
                      gap: 12, 
                      alignItems: 'center',
                      background: 'var(--bg-muted)',
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid var(--border)'
                    }}
                  >
                    {/* Fardo Selector */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }}>Fardo</label>
                      <select
                        className="input w-full p-2 border rounded"
                        value={sale.bale_id}
                        onChange={(e) => handleRowChange(index, 'bale_id', e.target.value)}
                        required
                      >
                        <option value="">-- Seleccionar --</option>
                        {bales.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} (Stock: {b.remaining_items})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity sold */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }}>Cant. Vendida</label>
                      <input
                        className="input w-full p-2 border rounded"
                        type="number"
                        min="1"
                        max={currentBale ? currentBale.remaining_items : undefined}
                        value={sale.quantity_sold}
                        onChange={(e) => handleRowChange(index, 'quantity_sold', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    {/* Total Price */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }}>Total Cobrado ($)</label>
                      <input
                        className="input w-full p-2 border rounded"
                        type="number"
                        step="0.01"
                        min="0"
                        value={sale.total_price}
                        onChange={(e) => handleRowChange(index, 'total_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    {/* Cost of Goods Sold */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }}>Costo total prendas</label>
                      <div style={{ padding: '8px 4px', fontSize: 14, fontWeight: '600', color: 'var(--text-muted)' }}>
                        {formatPrice(stats.costOfGoods)}
                      </div>
                    </div>

                    {/* Profit */}
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: '700', textTransform: 'uppercase' }}>Ganancia</label>
                      <div style={{ 
                        padding: '8px 4px', 
                        fontSize: 14, 
                        fontWeight: '800', 
                        color: stats.profit >= 0 ? '#10b981' : '#ef4444' 
                      }}>
                        {formatPrice(stats.profit)}
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-icon btn-ghost"
                        style={{ color: 'var(--danger)', padding: 8, opacity: sales.length === 1 ? 0.3 : 1 }}
                        disabled={sales.length === 1}
                        onClick={() => handleRemoveRow(index)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Consolidado Preview */}
            <div 
              style={{ 
                marginTop: 20, 
                padding: '16px 20px', 
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(242, 207, 216, 0.05) 100%)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Prendas Totales:</span>
                <div style={{ fontSize: 18, fontWeight: '800' }}>{totalItems} uds.</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Costo Consolidado:</span>
                <div style={{ fontSize: 18, fontWeight: '800', color: 'var(--text-muted)' }}>{formatPrice(totalCost)}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Total Cobrado:</span>
                <div style={{ fontSize: 18, fontWeight: '800' }}>{formatPrice(totalRevenue)}</div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Balance Estimado:</span>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: '800', 
                  color: totalProfit >= 0 ? '#10b981' : '#ef4444' 
                }}>
                  {formatPrice(totalProfit)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'end', gap: 12, marginTop: 24 }}>
              <Link href="/dashboard/lives" className="btn btn-ghost px-6 py-2">
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn btn-primary bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-2.5 rounded-lg shadow-lg"
                disabled={saving}
              >
                {saving ? 'Guardando Venta...' : '⚡ Guardar Sesión de Venta'}
              </button>
            </div>
          </div>
        </form>
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
