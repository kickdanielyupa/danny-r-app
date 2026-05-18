import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { id } = await params;

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'ID de live no válido' }, { status: 400 });
  }

  // Deleting the live session will automatically cascade delete the sales in the database.
  // And our database trigger `trg_update_bale_stock` on DELETE will automatically
  // restore the remaining items of the bales!
  const { error } = await supabase
    .from('live_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
