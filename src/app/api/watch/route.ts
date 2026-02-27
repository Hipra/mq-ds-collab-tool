import { getWatcher, subscribers } from '@/lib/watcher';

/**
 * Prevent Next.js from caching this route — SSE must be streamed dynamically.
 */
export const dynamic = 'force-dynamic';

/**
 * SSE endpoint for file change notifications.
 *
 * Each connected client receives a stream of SSE events:
 *   data: {"file": "/path/to/changed/file"}\n\n
 *
 * The PreviewFrame component connects to this endpoint on mount and
 * sends a RELOAD postMessage to the iframe when a relevant file changes.
 *
 * Design decisions:
 * - Subscriber pattern: each request adds a callback to the subscribers Set
 *   in watcher.ts; callback is removed when the request aborts
 * - getWatcher() call ensures the chokidar watcher starts on first SSE connection
 * - ReadableStream + TextEncoder for proper Web Streams API usage in Next.js Edge/Node
 */
export async function GET(req: Request) {
  // Ensure the file watcher is running
  getWatcher();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const subscriber = (filePath: string) => {
        try {
          const data = JSON.stringify({ file: filePath });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Controller may be closed if client disconnected — ignore
        }
      };

      subscribers.add(subscriber);

      // Remove subscriber when the client disconnects
      req.signal.addEventListener('abort', () => {
        subscribers.delete(subscriber);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
