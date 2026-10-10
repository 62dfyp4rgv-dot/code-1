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
