import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/garments - List garments with filters
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase.from('garments').select('*').order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('code', `%${search}%`);

  // By default don't show archived unless specifically filtered
  if (status !== 'ARCHIVED') query = query.eq('is_archived', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ garments: data });
}

// POST /api/garments - Create garment
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const { code, name, category, price } = body;

  if (!code || !price) {
    return NextResponse.json({ error: 'Código y precio son requeridos' }, { status: 400 });
  }

  const { data, error } = await supabase.from('garments').insert({
    code: code.toUpperCase().trim(),
    name: name || null,
    category: category || null,
    price,
  }).select().single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una prenda con ese código' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ garment: data }, { status: 201 });
}
