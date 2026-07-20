import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { type SaveResult } from './types';

/**
 * Native: write the CSV into the cache directory and hand it to the system
 * share sheet, so the parent can drop it in Files, Drive, or an email.
 *
 * The web build resolves `saveCsv.web.ts` instead (browser download).
 */
export async function saveCsv(filename: string, csv: string): Promise<SaveResult> {
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    // BOM so Excel opens it as UTF-8 rather than mangling names and notes.
    file.write(`﻿${csv}`);

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, message: `Saved to ${file.uri}, but sharing is unavailable here.` };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export Baby Bean data',
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Could not write the file.' };
  }
}
