import type { Frame, Page } from "@/types";
import { MM_PER_INCH, sheetSize } from "./constants";

const EPS = 1e-6;

interface Rect {
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
}

/** สองสี่เหลี่ยมทับกันหรือไม่ โดยนับระยะห่าง gap เป็นส่วนหนึ่งของกรอบ */
export function rectsOverlap(a: Rect, b: Rect, gap = 0): boolean {
  return (
    a.xMm < b.xMm + b.wMm + gap - EPS &&
    b.xMm < a.xMm + a.wMm + gap - EPS &&
    a.yMm < b.yMm + b.hMm + gap - EPS &&
    b.yMm < a.yMm + a.hMm + gap - EPS
  );
}

/** กรอบล้นขอบกระดาษหรือทับกรอบอื่นหรือไม่ (ใช้แสดงกรอบสีแดง) */
export function isFrameInvalid(frame: Frame, page: Page): boolean {
  const { w, h } = sheetSize(page.orientation);
  const outside =
    frame.xMm < -EPS || frame.yMm < -EPS || frame.xMm + frame.wMm > w + EPS || frame.yMm + frame.hMm > h + EPS;
  return outside || page.frames.some((o) => o.id !== frame.id && rectsOverlap(frame, o));
}

export interface ImageGeometry {
  /** mm ต่อ 1 พิกเซลของรูป */
  scale: number;
  /** ขนาดรูปทั้งรูปเมื่อวางในกรอบ (mm) */
  w: number;
  h: number;
  /** ตำแหน่งมุมซ้ายบนของรูปเทียบกับกรอบ (mm) */
  left: number;
  top: number;
  /** ส่วนที่ล้นกรอบ (ติดลบเมื่อรูปเล็กกว่ากรอบในโหมดเห็นทั้งรูป) */
  overflowX: number;
  overflowY: number;
}

/** คำนวณขนาดและตำแหน่งรูปภายในกรอบ จากโหมดเต็มกรอบ/เห็นทั้งรูป ซูม และการเลื่อน */
export function imageGeometry(frame: Frame, img: { width: number; height: number }): ImageGeometry {
  const fitScale =
    frame.fit === "cover"
      ? Math.max(frame.wMm / img.width, frame.hMm / img.height)
      : Math.min(frame.wMm / img.width, frame.hMm / img.height);
  const scale = fitScale * frame.zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  const overflowX = w - frame.wMm;
  const overflowY = h - frame.hMm;
  return {
    scale,
    w,
    h,
    overflowX,
    overflowY,
    left: (-overflowX * frame.panX) / 100,
    top: (-overflowY * frame.panY) / 100,
  };
}

/** ความละเอียดจริงของรูปเมื่อพิมพ์ออกมา (dpi) */
export function effectiveDpi(frame: Frame, img: { width: number; height: number }): number {
  return Math.round(MM_PER_INCH / imageGeometry(frame, img).scale);
}

/** จัดระดับความคมชัด: ≥300 คม, ≥150 พอใช้, ต่ำกว่านั้นแตก */
export function dpiLevel(dpi: number): "ok" | "warn" | "bad" {
  if (dpi >= 300) return "ok";
  if (dpi >= 150) return "warn";
  return "bad";
}

/** สัดส่วนรูปต่างจากกรอบเกิน 2% หรือไม่ (ควรให้ผู้ใช้เลือกส่วนที่จะพิมพ์) */
export function aspectMismatch(frame: Frame, img: { width: number; height: number }): boolean {
  const frameRatio = frame.wMm / frame.hMm;
  return Math.abs(img.width / img.height - frameRatio) / frameRatio > 0.02;
}

/** บีบค่าให้อยู่ในช่วง */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
