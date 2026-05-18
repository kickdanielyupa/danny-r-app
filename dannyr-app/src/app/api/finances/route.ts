import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();

  const { data: bales, error: balesError } = await supabase.from('bales').select('*');
  if (balesError) return NextResponse.json({ error: balesError.message }, { status: 500 });

  const { data: sales, error: salesError } = await supabase
    .from('live_session_sales')
    .select('total_price, quantity_sold, bale_id');
  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 500 });

  // 1. Total Investment (CAPEX) - Todo el dinero gastado comprando fardos
  let totalInvestment = 0;
  // 2. Inventory Value - El valor en "costo" de la mercancía que aún no se vende
  let inventoryValue = 0;
  // 3. COGS (Cost of Goods Sold) - El costo de la mercancía que SÍ se vendió
  let cogs = 0;

  if (bales) {
    bales.forEach(b => {
      const baleCost = Number(b.cost);
      const avgCost = Number(b.average_cost);
      
      totalInvestment += baleCost;
      const soldItems = b.total_items - b.remaining_items;
      const costOfSold = soldItems * avgCost;
      cogs += costOfSold;
      inventoryValue += (b.remaining_items * avgCost);
    });
  }

  // 4. Total Revenue - Todo el dinero que ha entrado por ventas
  let totalRevenue = 0;
  if (sales) {
    sales.forEach(s => {
      totalRevenue += Number(s.total_price);
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
    const baleCost = Number(b.cost);
    const avgCost = Number(b.average_cost);
    const soldItems = b.total_items - b.remaining_items;
    
    const salesFromThisBale = sales?.filter(s => s.bale_id === b.id) || [];
    const revenueFromThisBale = salesFromThisBale.reduce((sum, s) => sum + Number(s.total_price), 0);
    
    const costOfGoodsSold = soldItems * avgCost;
    const grossProfitBale = revenueFromThisBale - costOfGoodsSold;
    const marginPct = revenueFromThisBale > 0 ? (grossProfitBale / revenueFromThisBale) * 100 : 0;
    
    // Recovery status: has revenue surpassed the total cost of the bale?
    const cashFlowBale = revenueFromThisBale - baleCost;
    const recoveryPct = (revenueFromThisBale / baleCost) * 100;

    return {
      id: b.id,
      name: b.name,
      total_items: b.total_items,
      sold_items: soldItems,
      cost: baleCost, // Initial investment
      revenue: revenueFromThisBale, // Sales
      cogs: costOfGoodsSold,
      gross_profit: grossProfitBale, // Profit on sold items
      margin_pct: marginPct,
      cash_flow: cashFlowBale, // Money made vs Total Cost
      recovery_pct: recoveryPct
    };
  }) || [];

  // 8. Daily performance breakdown
  const { data: dailySales, error: dailyError } = await supabase
    .from('live_session_sales')
    .select(`
      quantity_sold,
      total_price,
      created_at,
      bales (
        id,
        name,
        average_cost
      ),
      live_sessions (
        id,
        name,
        session_date
      )
    `);

  const dailyPerformance: Record<string, {
    date: string;
    session_name: string;
    bale_name: string;
    quantity_sold: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_pct: number;
  }> = {};

  if (!dailyError && dailySales) {
    dailySales.forEach((sale: any) => {
      const session = sale.live_sessions;
      const bale = sale.bales;
      if (!session || !bale) return;

      const dateStr = session.session_date || new Date(sale.created_at).toISOString().split('T')[0];
      const key = `${dateStr}_${bale.id}`;

      if (!dailyPerformance[key]) {
        dailyPerformance[key] = {
          date: dateStr,
          session_name: session.name || 'Live Session',
          bale_name: bale.name || 'Fardo',
          quantity_sold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          margin_pct: 0
        };
      }

      const itemCost = Number(bale.average_cost || 0);
      const saleQty = Number(sale.quantity_sold || 0);
      const salePrice = Number(sale.total_price || 0);

      dailyPerformance[key].quantity_sold += saleQty;
      dailyPerformance[key].revenue += salePrice;
      dailyPerformance[key].cost += (saleQty * itemCost);
    });
  }

  const dailyPerformanceList = Object.values(dailyPerformance).map(item => {
    const profit = item.revenue - item.cost;
    const margin_pct = item.revenue > 0 ? (profit / item.revenue) * 100 : 0;
    return {
      ...item,
      profit,
      margin_pct
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ 
    total_revenue: totalRevenue,
    total_investment: totalInvestment,
    cogs: cogs,
    gross_profit: grossProfit,
    gross_margin_pct: grossMarginPct,
    cash_flow: cashFlow,
    inventory_value: inventoryValue,
    bales_performance: balesPerformance,
    daily_performance: dailyPerformanceList
  });
}
