import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/cron/expire-reservations - Called by Vercel Cron every minute
export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('expire_reservations');

  if (error) {
    console.error('Cron expire error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Cron executed:', data);
  return NextResponse.json(data);
}
