export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getStores, getCrowdingStatus, addCrowdingReport } from '@/lib/db';
import { broadcast } from '@/lib/sse';

const VALID_STATUSES = ['空きあり', '混雑しているが空きあり', '満席'];

export async function GET() {
  const crowding = getCrowdingStatus();
  return NextResponse.json({ crowding });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { storeId, status } = body as { storeId?: unknown; status?: unknown };

  if (typeof storeId !== 'number' || !Number.isInteger(storeId)) {
    return NextResponse.json({ error: 'storeId must be an integer' }, { status: 400 });
  }

  if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate store exists
  const stores = getStores();
  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  addCrowdingReport(storeId, status);

  // Get updated status for this store to broadcast
  const allCrowding = getCrowdingStatus();
  const updated = allCrowding.find((c) => c.storeId === storeId);
  if (updated) {
    broadcast(JSON.stringify(updated));
  }

  return NextResponse.json({ success: true });
}
