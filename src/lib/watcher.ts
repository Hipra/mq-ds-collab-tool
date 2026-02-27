import chokidar, { type FSWatcher } from 'chokidar';

/**
 * Subscriber set for SSE connections.
 * Each entry is a callback that receives the changed file path.
 * Subscribers are added when a client connects to /api/watch
 * and removed when the connection closes.
 */
export const subscribers = new Set<(filePath: string) => void>();

let watcher: FSWatcher | null = null;

/**
 * Returns the singleton chokidar file watcher, creating it on first call.
 *
 * Watches PROTOTYPES_DIR (default: ./prototypes) for 'change' and 'add' events.
 * Notifies all subscribers with the changed file path.
 *
 * Design decisions:
 * - Singleton pattern: only one FSWatcher per Node.js process (avoids EMFILE)
 * - ignoreInitial: true — only fires on changes AFTER startup, not for existing files
 * - chokidar v4 (CJS): compatible with Node 18+ (v5 is ESM-only, requires Node 20+)
 * - Process env fallback: PROTOTYPES_DIR env var allows deployment customization
 */
export function getWatcher(): FSWatcher {
  if (watcher) {
    return watcher;
  }

  const watchDir = process.env.PROTOTYPES_DIR ?? './prototypes';

  watcher = chokidar.watch(watchDir, {
    ignoreInitial: true,
    // Avoid watching hidden files inside prototypes dir
    ignored: /(^|[/\\])\../,
  });

  const notify = (filePath: string) => {
    for (const subscriber of subscribers) {
      subscriber(filePath);
    }
  };

  watcher.on('change', notify);
  watcher.on('add', notify);

  return watcher;
}
