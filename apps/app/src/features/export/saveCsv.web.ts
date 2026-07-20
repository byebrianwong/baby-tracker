import { type SaveResult } from './types';

/**
 * Web: trigger a normal browser download. No server round-trip — the CSV is
 * built on-device from the local store, so export works offline like everything
 * else.
 */
export async function saveCsv(filename: string, csv: string): Promise<SaveResult> {
  try {
    // BOM so Excel opens it as UTF-8 rather than mangling names and notes.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not start the download.' };
  }
}
