import { fitWithin } from "./poster";

const JPEG_QUALITY = 0.88;

/**
 * Makes a poster small enough to upload quickly on mobile data and load reliably on the website: a
 * phone PNG can be 7 MB, which is slow to upload and can make image optimisation time out. If the
 * browser can't process the image, or the result isn't smaller, the original file is used.
 */
export async function shrinkPoster(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    // JPEG has no transparency, so any see-through areas become white rather than black.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch (err) {
    console.warn("[specials] couldn't shrink poster, using the original", err);
    return file;
  }
}
