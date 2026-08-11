/**
 * Read image files, resize/compress them to a max dimension and JPEG quality,
 * and return base64 data URIs kept under the target byte size.
 */
const MAX_DIMENSION = 1024;
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.4;
const TARGET_BYTES = 380_000; // ~400KB headroom for document overhead

export async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);

  // progressively lower quality until under target size
  let quality = INITIAL_QUALITY;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (out.length > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  return out;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
