import path from 'path';
import fs from 'node:fs/promises';
import type { TextEntry } from '@/lib/text-extractor';

export interface EditHistoryEntry {
  value: string;
  timestamp: string;   // ISO timestamp
}

export interface CopyOverlay {
  version: 1;
  entries: Record<string, {
    editedValue: string;
    editedAt: string;          // ISO timestamp of latest edit
    sourceValueAtEdit: string; // for conflict detection
    edits: EditHistoryEntry[]; // chronological list of all edits (per CONTEXT.md locked decision)
  }>;
}

export interface ConflictEntry {
  key: string;
  designerValue: string;   // new source value (what the designer changed it to)
  copywriterValue: string; // edited value from overlay (what the copywriter had changed it to)
}

function getOverlayPath(prototypeId: string): string {
  const protoDir = process.env.PROTOTYPES_DIR ?? path.join(process.cwd(), 'prototypes');
  return path.join(protoDir, prototypeId, 'copy-overlay.json');
}

/**
 * Read copy-overlay.json for the given prototype.
 * Returns an empty overlay structure if the file does not exist.
 */
export async function readOverlay(prototypeId: string): Promise<CopyOverlay> {
  const overlayPath = getOverlayPath(prototypeId);
  try {
    const raw = await fs.readFile(overlayPath, 'utf-8');
    return JSON.parse(raw) as CopyOverlay;
  } catch {
    return { version: 1, entries: {} };
  }
}

/**
 * Persist a text edit to copy-overlay.json.
 * Creates or updates the entry for the given key.
 * Appends to the edits history array.
 */
export async function patchOverlay(
  prototypeId: string,
  key: string,
  value: string,
  sourceValue: string
): Promise<void> {
  const overlayPath = getOverlayPath(prototypeId);
  const overlay = await readOverlay(prototypeId);

  const now = new Date().toISOString();
  const existing = overlay.entries[key];

  overlay.entries[key] = {
    editedValue: value,
    editedAt: now,
    sourceValueAtEdit: sourceValue,
    edits: existing
      ? [...existing.edits, { value, timestamp: now }]
      : [{ value, timestamp: now }],
  };

  await fs.writeFile(overlayPath, JSON.stringify(overlay, null, 2), 'utf-8');
}

/**
 * Merge overlay edits into extracted text entries.
 *
 * - If overlay key matches and sourceValueAtEdit === entry.sourceValue:
 *   apply edit by setting currentValue = editedValue
 * - If sourceValueAtEdit !== entry.sourceValue AND editedValue !== entry.sourceValue:
 *   flag as conflict (source changed under the copywriter's edit)
 *
 * Returns modified entries array and list of conflicts.
 */
export function mergeOverlayIntoEntries(
  entries: TextEntry[],
  overlay: CopyOverlay
): { entries: TextEntry[]; conflicts: ConflictEntry[] } {
  const conflicts: ConflictEntry[] = [];

  const mergedEntries = entries.map((entry) => {
    const overlayEntry = overlay.entries[entry.key];
    if (!overlayEntry) {
      return entry;
    }

    const sourceChanged = overlayEntry.sourceValueAtEdit !== entry.sourceValue;
    const editDiffersFromSource = overlayEntry.editedValue !== entry.sourceValue;

    if (sourceChanged && editDiffersFromSource) {
      // Conflict: designer changed source, copywriter had an edit
      conflicts.push({
        key: entry.key,
        designerValue: entry.sourceValue,
        copywriterValue: overlayEntry.editedValue,
      });
      return entry; // Keep source value when conflicted
    }

    if (!sourceChanged) {
      // Clean apply: source hasn't changed, apply the edit
      return { ...entry, currentValue: overlayEntry.editedValue };
    }

    return entry;
  });

  return { entries: mergedEntries, conflicts };
}
