// Rules for special posters. Pure, so the staff form, the upload route and the tests share them.

export const POSTER_TYPES = ["image/jpeg", "image/png"];
export const POSTER_MAX_BYTES = 10 * 1024 * 1024;

/** Why this file can't be used as a poster, or null if it's fine. */
export function posterFileError(file: { type: string; size: number }): string | null {
  if (!POSTER_TYPES.includes(file.type)) return "Please choose a JPG or PNG image.";
  if (file.size > POSTER_MAX_BYTES) return "That image is too large. The limit is 10 MB.";
  return null;
}

/** Posters must be files in the site's own Vercel Blob storage. */
export function isBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
