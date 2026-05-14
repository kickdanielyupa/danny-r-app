import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();

  const { data: bales, error: balesError } = await supabase.from('bales').select('*');
  if (balesError) return NextResponse.json({ error: balesError.message }, { status: 500 });

  const { data: soldGarments, error: garmentsError } = await supabase
    .from('garments')
    .select('price, bale_id, status')
    .in('status', ['SOLD', 'RESERVED']);
  if (garmentsError) return NextResponse.json({ error: garmentsError.message }, { status: 500 });

  // 1. Total Investment (CAPEX) - Todo el dinero gastado comprando fardos
  let totalInvestment = 0;
  // 2. Inventory Value - El valor en "costo" de la mercancía que aún no se vende
  let inventoryValue = 0;
  // 3. COGS (Cost of Goods Sold) - El costo de la mercancía que SÍ se vendió
  let cogs = 0;

  if (bales) {
    bales.forEach(b => {
      totalInvestment += b.cost;
      const soldItems = b.total_items - b.remaining_items;
      const costOfSold = soldItems * b.average_cost;
      cogs += costOfSold;
      inventoryValue += (b.remaining_items * b.average_cost);
    });
  }

  // 4. Total Revenue - Todo el dinero que ha entrado por ventas
  let totalRevenue = 0;
  if (soldGarments) {
    soldGarments.forEach(g => {
      totalRevenue += g.price;
    });
  }

  // 5. Gross Profit (Ganancia Bruta) - Lo que ganaste sobre lo que realmente vendiste
  const grossProfit = totalRevenue - cogs;

  // 6. Gross Margin % (Margen de Ganancia)
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // 7. Cash Flow (Flujo de Caja) - Dinero real en el bolsillo frente a la inversión inicial
  const cashFlow = totalRevenue - totalInvestment;

  // Breakdown per bale
  const balesPerformance = bales?.map(b => {
    const soldItems = b.total_items - b.remaining_items;
    const itemsFromThisBale = soldGarments?.filter(g => g.bale_id === b.id) || [];
    const revenueFromThisBale = itemsFromThisBale.reduce((sum, g) => sum + g.price, 0);
    
    const costOfGoodsSold = soldItems * b.average_cost;
    const grossProfitBale = revenueFromThisBale - costOfGoodsSold;
    const marginPct = revenueFromThisBale > 0 ? (grossProfitBale / revenueFromThisBale) * 100 : 0;
    
    // Recovery status: has revenue surpassed the total cost of the bale?
    const cashFlowBale = revenueFromThisBale - b.cost;
    const recoveryPct = (revenueFromThisBale / b.cost) * 100;

    return {
      id: b.id,
      name: b.name,
      total_items: b.total_items,
      sold_items: soldItems,
      cost: b.cost, // Initial investment
      revenue: revenueFromThisBale, // Sales
      cogs: costOfGoodsSold,
      gross_profit: grossProfitBale, // Profit on sold items
      margin_pct: marginPct,
      cash_flow: cashFlowBale, // Money made vs Total Cost
      recovery_pct: recoveryPct
    };
  }) || [];

  return NextResponse.json({ 
    total_revenue: totalRevenue,
    total_investment: totalInvestment,
    cogs: cogs,
    gross_profit: grossProfit,
    gross_margin_pct: grossMarginPct,
    cash_flow: cashFlow,
    inventory_value: inventoryValue,
    bales_performance: balesPerformance
  });
}
