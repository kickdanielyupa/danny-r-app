import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { CreateBaleRequest } from '@/lib/types/database';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase.from('bales').select('*').order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bales: data });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = (await req.json()) as CreateBaleRequest;

  if (!body.name || !body.total_items || !body.cost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const average_cost = body.cost / body.total_items;

  const { data, error } = await supabase
    .from('bales')
    .insert({
      name: body.name,
      total_items: body.total_items,
      remaining_items: body.total_items,
      cost: body.cost,
      average_cost: average_cost,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
