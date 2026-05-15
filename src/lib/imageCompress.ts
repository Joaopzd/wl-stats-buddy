/**
 * Compress an image File into a JPEG (or PNG when transparency matters)
 * data-URL that fits under `maxBytes`. Iteratively downscales and lowers
 * JPEG quality until it fits, so the user never has to resize manually.
 */
export async function compressImageToDataURL(
  file: File,
  maxBytes = 2 * 1024 * 1024,
  maxDimension = 1024,
): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // Already small enough? Skip the canvas round-trip.
  if (file.size <= maxBytes && Math.max(img.width, img.height) <= maxDimension) {
    return dataUrl;
  }

  let { width, height } = img;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.9;
  let out = canvas.toDataURL("image/jpeg", quality);
  // dataURL byte size ≈ (length - prefix) * 0.75
  const sizeOf = (s: string) => Math.ceil((s.length - s.indexOf(",") - 1) * 0.75);

  while (sizeOf(out) > maxBytes && quality > 0.4) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }

  // Still too big? Downscale further until it fits.
  while (sizeOf(out) > maxBytes && (canvas.width > 320 || canvas.height > 320)) {
    canvas.width = Math.round(canvas.width * 0.8);
    canvas.height = Math.round(canvas.height * 0.8);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    out = canvas.toDataURL("image/jpeg", quality);
  }

  return out;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
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
