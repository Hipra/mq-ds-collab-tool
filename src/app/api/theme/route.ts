import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import fs from 'node:fs/promises';
import { MUI_DEFAULTS } from '@/lib/theme-config';
import type { ThemeConfig } from '@/lib/theme-config';

export const dynamic = 'force-dynamic';

const CONFIG_FILE = 'theme-config.json';

function configPath(): string {
  return path.join(process.cwd(), CONFIG_FILE);
}

/** Deep-merge saved config over defaults so missing keys are filled in. */
function deepMerge<T>(defaults: T, saved: Partial<T>): T {
  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(defaults as Record<string, unknown>)) {
    const defVal = (defaults as Record<string, unknown>)[key];
    const savedVal = (saved as Record<string, unknown>)?.[key];
    if (savedVal === undefined) continue;
    if (defVal && typeof defVal === 'object' && !Array.isArray(defVal) && savedVal && typeof savedVal === 'object') {
      result[key] = deepMerge(defVal, savedVal as Partial<typeof defVal>);
    } else {
      result[key] = savedVal;
    }
  }
  return result as T;
}

/**
 * GET /api/theme
 * Returns the current theme config merged over MUI defaults.
 * Missing keys in saved config are filled from defaults.
 */
export async function GET() {
  try {
    const raw = await fs.readFile(configPath(), 'utf-8');
    const saved = JSON.parse(raw) as Partial<ThemeConfig>;
    return NextResponse.json(deepMerge(MUI_DEFAULTS, saved));
  } catch {
    return NextResponse.json(MUI_DEFAULTS);
  }
}

/**
 * PUT /api/theme
 * Writes the full ThemeConfig body to theme-config.json.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as ThemeConfig;
    await fs.writeFile(configPath(), JSON.stringify(body, null, 2));
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/theme
 * Deletes theme-config.json, resetting to MUI defaults.
 */
export async function DELETE() {
  try {
    await fs.unlink(configPath());
  } catch {
    // File doesn't exist — already at defaults
  }
  return NextResponse.json(MUI_DEFAULTS);
}
