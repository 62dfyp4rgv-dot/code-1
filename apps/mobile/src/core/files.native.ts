/** Native file helpers (expo-file-system + expo-sharing + expo-document-picker). Unverified on a device in this sandbox. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { MAX_CREST_URI_LENGTH, dataUriLength, type PickedImage } from './crestImport';

export async function exportTextFile(filename: string, content: string): Promise<'shared' | 'saved'> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: filename });
    return 'shared';
  }
  return 'saved';
}

export async function pickTextFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets[0]) return null;
  return new File(res.assets[0].uri).text();
}

/** Multi-select image picker (png/jpeg/webp) via expo-document-picker. Returns null when cancelled. Files over the crest size limit are not read. */
export async function pickImageFiles(): Promise<PickedImage[] | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['image/png', 'image/jpeg', 'image/webp'], multiple: true, copyToCacheDirectory: true });
  if (res.canceled || res.assets.length === 0) return null;
  const out: PickedImage[] = [];
  for (const a of res.assets) {
    const file = new File(a.uri);
    const size = a.size ?? file.size ?? 0;
    out.push({ name: a.name, mime: a.mimeType ?? null, size, bytes: dataUriLength(size) > MAX_CREST_URI_LENGTH ? null : new Uint8Array(await file.arrayBuffer()) });
  }
  return out;
}
