import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const body = await req.json();
  const { id } = await params;

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'ID de fardo no válido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bales')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'ID de fardo no válido' }, { status: 400 });
  }

  // 1. Get all garments linked to this bale
  const { data: garments, error: garmentFetchError } = await supabase
    .from('garments')
    .select('id')
    .eq('bale_id', id);

  if (garmentFetchError) return NextResponse.json({ error: garmentFetchError.message }, { status: 500 });

  if (garments && garments.length > 0) {
    const garmentIds = garments.map(g => g.id);
    
    // 2. Delete orders linked to these garments
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .in('garment_id', garmentIds);
    
    if (orderError) return NextResponse.json({ error: 'Error al eliminar pedidos: ' + orderError.message }, { status: 500 });

    // 3. Delete the garments
    const { error: garmentDeleteError } = await supabase
      .from('garments')
      .delete()
      .in('id', garmentIds);

    if (garmentDeleteError) return NextResponse.json({ error: 'Error al eliminar prendas: ' + garmentDeleteError.message }, { status: 500 });
  }

  // 4. Finally delete the bale
  const { error: baleError } = await supabase
    .from('bales')
    .delete()
    .eq('id', id);

  if (baleError) return NextResponse.json({ error: 'Error al eliminar fardo: ' + baleError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
