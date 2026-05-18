export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getStores } from '@/lib/db';

export async function GET() {
  const stores = getStores();
  return NextResponse.json({ stores });
}
