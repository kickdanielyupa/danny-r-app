import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// PATCH /api/garments/[id] - Update garment
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.code) updates.code = body.code.toUpperCase().trim();
  if (body.name !== undefined) updates.name = body.name || null;
  if (body.category !== undefined) updates.category = body.category || null;
  if (body.price) updates.price = body.price;

  const { data, error } = await supabase.from('garments').update(updates).eq('id', id).select().single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Código duplicado' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ garment: data });
}

// DELETE /api/garments/[id] - Archive garment (logical delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;

  const { error } = await supabase.from('garments')
    .update({ is_archived: true, status: 'ARCHIVED' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
