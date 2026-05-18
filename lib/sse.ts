type Controller = ReadableStreamDefaultController<Uint8Array>;

const clients = new Set<Controller>();
const encoder = new TextEncoder();

export function addClient(controller: Controller): void {
  clients.add(controller);
}

export function removeClient(controller: Controller): void {
  clients.delete(controller);
}

export function broadcast(data: string): void {
  const message = `data: ${data}\n\n`;
  const encoded = encoder.encode(message);
  for (const controller of Array.from(clients)) {
    try {
      controller.enqueue(encoded);
    } catch {
      clients.delete(controller);
    }
  }
}
