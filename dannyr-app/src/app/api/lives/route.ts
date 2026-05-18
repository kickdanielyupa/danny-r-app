import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();

  // Fetch lives with their sales
  const { data: lives, error } = await supabase
    .from('live_sessions')
    .select(`
      id,
      name,
      session_date,
      notes,
      created_at,
      live_session_sales (
        id,
        quantity_sold,
        total_price,
        bale_id,
        bales (
          name,
          average_cost
        )
      )
    `)
    .order('session_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map to calculate totals per live session
  const processedLives = (lives || []).map((live: any) => {
    let totalRevenue = 0;
    let totalItems = 0;
    let totalProfit = 0;

    const sales = (live.live_session_sales || []).map((sale: any) => {
      const averageCost = sale.bales?.average_cost || 0;
      const costOfGoods = sale.quantity_sold * averageCost;
      const profit = Number(sale.total_price) - costOfGoods;

      totalRevenue += Number(sale.total_price);
      totalItems += sale.quantity_sold;
      totalProfit += profit;

      return {
        id: sale.id,
        quantity_sold: sale.quantity_sold,
        total_price: Number(sale.total_price),
        bale_id: sale.bale_id,
        bale_name: sale.bales?.name || 'Desconocido',
        bale_average_cost: averageCost,
        profit: profit
      };
    });

    return {
      id: live.id,
      name: live.name,
      session_date: live.session_date,
      notes: live.notes,
      created_at: live.created_at,
      sales,
      total_revenue: totalRevenue,
      total_items: totalItems,
      total_profit: totalProfit
    };
  });

  return NextResponse.json({ lives: processedLives });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();

  const { name, session_date, notes, sales } = body;

  if (!name || !session_date || !sales || !Array.isArray(sales) || sales.length === 0) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  // Insert live session
  const { data: session, error: sessionError } = await supabase
    .from('live_sessions')
    .insert({
      name,
      session_date,
      notes
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Insert sales
  const salesToInsert = sales.map((sale: any) => ({
    live_session_id: session.id,
    bale_id: sale.bale_id,
    quantity_sold: parseInt(sale.quantity_sold),
    total_price: parseFloat(sale.total_price)
  }));

  const { error: salesError } = await supabase
    .from('live_session_sales')
    .insert(salesToInsert);

  if (salesError) {
    // Attempt rollback/cleanup of session
    await supabase.from('live_sessions').delete().eq('id', session.id);
    return NextResponse.json({ error: salesError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, session_id: session.id });
}
