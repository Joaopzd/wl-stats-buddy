/**
 * Compress an image File into a data-URL that fits under `maxBytes`.
 *
 * Preserves transparency: if the source image has an alpha channel
 * (PNG / WebP with transparent pixels), the output stays PNG so the
 * card background remains see-through. Opaque sources are encoded as
 * JPEG for smaller files.
 */
export async function compressImageToDataURL(
  file: File,
  maxBytes = 2 * 1024 * 1024,
  maxDimension = 1024,
): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

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

  const hasAlpha = detectAlpha(ctx, width, height);
  const sizeOf = (s: string) => Math.ceil((s.length - s.indexOf(",") - 1) * 0.75);

  if (hasAlpha) {
    // Keep PNG to preserve transparency. Downscale until under budget.
    let out = canvas.toDataURL("image/png");
    while (sizeOf(out) > maxBytes && (canvas.width > 256 || canvas.height > 256)) {
      canvas.width = Math.round(canvas.width * 0.8);
      canvas.height = Math.round(canvas.height * 0.8);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      out = canvas.toDataURL("image/png");
    }
    return out;
  }

  // Opaque source — JPEG is fine and much smaller.
  let quality = 0.9;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (sizeOf(out) > maxBytes && quality > 0.4) {
    quality -= 0.1;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  while (sizeOf(out) > maxBytes && (canvas.width > 320 || canvas.height > 320)) {
    canvas.width = Math.round(canvas.width * 0.8);
    canvas.height = Math.round(canvas.height * 0.8);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
}

/**
 * Sample the canvas for any non-opaque pixel. Sampling on a stride keeps
 * this cheap for large images while still catching transparent areas.
 */
function detectAlpha(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): boolean {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = 4 * 4; // every 4th pixel
    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 255) return true;
    }
  } catch {
    // Tainted canvas (cross-origin) — assume alpha to be safe.
    return true;
  }
  return false;
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
