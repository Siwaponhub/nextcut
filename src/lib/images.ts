/** ด้านยาวสุดของรูปที่เก็บไว้ (พอสำหรับซูม 4 เท่าบนกรอบใหญ่ และไม่ทำให้ iPhone หน่วยความจำเต็ม) */
const MAX_SIDE = 4000;

export interface DecodedImage {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * อ่านไฟล์รูปจากเครื่อง ถ้าใหญ่เกินจะย่อแล้วแปลงเป็น JPEG
 * createImageBitmap หมุนรูปตามข้อมูล EXIF ให้อัตโนมัติ (รูปจากมือถือไม่ตะแคง)
 */
export async function decodeAndResize(file: File): Promise<DecodedImage> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const browserFriendly = /^image\/(jpeg|png|webp)$/.test(file.type);
    if (longest <= MAX_SIDE && browserFriendly) return { blob: file, width, height };

    const scale = Math.min(1, MAX_SIDE / longest);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.92),
    );
    return { blob, width: w, height: h };
  } finally {
    bitmap.close();
  }
}

/** โหลดรูปจาก url เป็น HTMLImageElement ที่ถอดรหัสเสร็จแล้ว (ใช้วาดลง canvas ตอนส่งออก) */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load-failed: ${url}`));
    img.src = url;
  });
}
