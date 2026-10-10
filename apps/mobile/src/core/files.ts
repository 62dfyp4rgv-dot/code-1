import { MAX_CREST_URI_LENGTH, dataUriLength, type PickedImage } from './crestImport';
/** Web file helpers: download via an anchor, pick via a hidden <input type=file>. */
export async function exportTextFile(filename: string, content: string): Promise<'shared' | 'saved'> {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'saved';
}

export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (): void => {
      const f = input.files?.[0];
      if (!f) { resolve(null); return; }
      f.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

/** Multi-select image picker (png/jpeg/webp). Returns null when cancelled. Files over the crest size limit are not read. */
export function pickImageFiles(): Promise<PickedImage[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
    input.onchange = (): void => {
      const list = Array.from(input.files ?? []);
      if (list.length === 0) { resolve(null); return; }
      Promise.all(list.map(async (f): Promise<PickedImage> => ({
        name: f.name, mime: f.type || null, size: f.size, bytes: dataUriLength(f.size) > MAX_CREST_URI_LENGTH ? null : new Uint8Array(await f.arrayBuffer()),
      }))).then(resolve, () => resolve(null));
    };
    input.click();
  });
}
