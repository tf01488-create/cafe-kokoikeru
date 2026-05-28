export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getStores, getCrowdingStatus, addCrowdingReport } from '@/lib/db';
import { broadcast } from '@/lib/sse';

const VALID_STATUSES = ['空きあり', '混雑しているが空きあり', '満席'];

// Rate limiting: 1 post per IP per store per 5 minutes
const RATE_LIMIT_MS = 5 * 60 * 1000;
const rateLimitStore = new Map<string, number>();

// Periodically evict expired entries to prevent unbounded memory growth
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_MS;
  for (const [key, ts] of Array.from(rateLimitStore)) {
    if (ts < cutoff) rateLimitStore.delete(key);
  }
}, RATE_LIMIT_MS);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string, storeId: number): boolean {
  const key = `${ip}:${storeId}`;
  const last = rateLimitStore.get(key);
  if (last !== undefined && Date.now() - last < RATE_LIMIT_MS) return true;
  rateLimitStore.set(key, Date.now());
  return false;
}

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

  const stores = getStores();
  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip, storeId)) {
    return NextResponse.json(
      { error: '同じ店舗への連続投稿は5分間隔でお願いします' },
      { status: 429 }
    );
  }

  await addCrowdingReport(storeId, status);

  const allCrowding = getCrowdingStatus();
  const updated = allCrowding.find((c) => c.storeId === storeId);
  if (updated) {
    broadcast(JSON.stringify(updated));
  }

  return NextResponse.json({ success: true });
}
