export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getCrowdingStatus } from '@/lib/db';
import { addClient, removeClient } from '@/lib/sse';

const encoder = new TextEncoder();

export async function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addClient(controller);

      try {
        const current = getCrowdingStatus();
        const initMessage = `event: init\ndata: ${JSON.stringify(current)}\n\n`;
        controller.enqueue(encoder.encode(initMessage));
      } catch {
        // ignore init errors
      }

      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAliveInterval);
          removeClient(controller);
        }
      }, 30_000);

      (controller as unknown as { _cleanup: () => void })._cleanup = () => {
        clearInterval(keepAliveInterval);
        removeClient(controller);
      };
    },
    cancel(controller) {
      const c = controller as unknown as { _cleanup?: () => void };
      if (c._cleanup) c._cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
