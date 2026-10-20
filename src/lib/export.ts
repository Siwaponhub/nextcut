import type { ImageInfo, Page } from "@/types";
import { CUT_LINE_COLOR, CUT_LINE_MM, PRINT_DPI, sheetSize } from "./constants";
import { dpiLevel, effectiveDpi, imageGeometry, isFrameInvalid } from "./geometry";
import { loadImageElement } from "./images";
import { shapePath } from "./shapes";

export interface RenderOptions {
  cutLines: boolean;
  /** หมุนแผ่นแนวนอนให้เป็นแนวตั้ง (ใช้ตอนสั่งพิมพ์บนกระดาษ 4×6 ที่ป้อนแนวตั้ง) */
  rotateToPortrait?: boolean;
}

/** ผลตรวจก่อนส่งออก */
export interface PreflightResult {
  totalFrames: number;
  emptyFrames: number;
  lowResFrames: number;
  invalidFrames: number;
}

/** ตรวจงานทุกแผ่น: ช่องที่ยังไม่มีรูป รูปความละเอียดต่ำกว่า 150 dpi และกรอบที่ทับกัน/ล้นขอบ */
export function preflight(pages: Page[], images: Record<string, ImageInfo>): PreflightResult {
  const r: PreflightResult = { totalFrames: 0, emptyFrames: 0, lowResFrames: 0, invalidFrames: 0 };
  for (const page of pages) {
    for (const f of page.frames) {
      r.totalFrames++;
      const img = f.imageId ? images[f.imageId] : undefined;
      if (!img) r.emptyFrames++;
      else if (dpiLevel(effectiveDpi(f, img)) === "bad") r.lowResFrames++;
      if (isFrameInvalid(f, page)) r.invalidFrames++;
    }
  }
  return r;
}

/** วาดแผ่นหนึ่งแผ่นลง canvas ที่ 300 dpi: พื้นหลัง → รูปที่ตัดตามรูปทรง → เส้นตัด */
export async function renderPage(
  page: Page,
  images: Record<string, ImageInfo>,
  opts: RenderOptions,
): Promise<HTMLCanvasElement> {
  const { w, h } = sheetSize(page.orientation);
  const pxPerMm = PRINT_DPI / 25.4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * pxPerMm);
  canvas.height = Math.round(h * pxPerMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = page.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const f of page.frames) {
    const path = new Path2D(shapePath(f.shape, f.wMm * pxPerMm, f.hMm * pxPerMm, f.heart));
    ctx.save();
    ctx.translate(f.xMm * pxPerMm, f.yMm * pxPerMm);
    const info = f.imageId ? images[f.imageId] : undefined;
    if (info) {
      const el = await loadImageElement(info.url);
      const g = imageGeometry(f, info);
      ctx.save();
      ctx.clip(path);
      ctx.drawImage(el, g.left * pxPerMm, g.top * pxPerMm, g.w * pxPerMm, g.h * pxPerMm);
      ctx.restore();
    }
    if (opts.cutLines) {
      ctx.lineWidth = CUT_LINE_MM * pxPerMm;
      ctx.strokeStyle = CUT_LINE_COLOR;
      ctx.stroke(path);
    }
    ctx.restore();
  }

  if (opts.rotateToPortrait && page.orientation === "landscape") return rotate90(canvas);
  return canvas;
}

/** หมุน canvas 90° ตามเข็มนาฬิกา */
function rotate90(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.height;
  out.height = src.width;
  const ctx = out.getContext("2d");
  if (!ctx) return src;
  ctx.translate(out.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return out;
}

/** แปลง canvas เป็นไฟล์ JPEG */
export function canvasToJpegFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(new File([b], name, { type: "image/jpeg" })) : reject(new Error("encode"))),
      "image/jpeg",
      0.92,
    ),
  );
}

/** ชื่อไฟล์ส่งออก เช่น nextcut-20261020-1.jpg */
function fileName(index: number, ext: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `nextcut-${stamp}${index >= 0 ? `-${index + 1}` : ""}.${ext}`;
}

/** สร้างไฟล์ JPG 300 dpi ทุกแผ่น */
export async function exportJpegFiles(
  pages: Page[],
  images: Record<string, ImageInfo>,
  opts: RenderOptions,
): Promise<File[]> {
  const files: File[] = [];
  for (let i = 0; i < pages.length; i++) {
    const canvas = await renderPage(pages[i], images, opts);
    files.push(await canvasToJpegFile(canvas, fileName(i, "jpg")));
  }
  return files;
}

/** สร้าง PDF ขนาดจริง หน้าละหนึ่งแผ่น (โหลด jsPDF เฉพาะตอนใช้ เพื่อให้แอปเปิดเร็ว) */
export async function exportPdfFile(
  pages: Page[],
  images: Record<string, ImageInfo>,
  opts: RenderOptions,
): Promise<File> {
  const { jsPDF } = await import("jspdf");
  let doc: InstanceType<typeof jsPDF> | null = null;
  for (const page of pages) {
    const { w, h } = sheetSize(page.orientation);
    const orientation = page.orientation === "portrait" ? "portrait" : "landscape";
    if (!doc) doc = new jsPDF({ unit: "mm", format: [100, 150], orientation });
    else doc.addPage([100, 150], orientation);
    const canvas = await renderPage(page, images, opts);
    doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  }
  if (!doc) throw new Error("no-pages");
  return new File([doc.output("blob")], fileName(-1, "pdf"), { type: "application/pdf" });
}

/**
 * ส่งไฟล์ผ่าน Share Sheet ของ iOS/Android ถ้ารองรับ (บันทึกลง Photos, Files, ส่งแอปเครื่องพิมพ์)
 * ถ้าไม่รองรับ (เช่นคอมพิวเตอร์) จะดาวน์โหลดไฟล์แทน
 * ต้องเรียกจากการกดปุ่มของผู้ใช้โดยตรง ไม่เช่นนั้น Safari จะไม่ยอมเปิด Share Sheet
 */
export async function shareOrDownload(files: File[]): Promise<"shared" | "downloaded" | "cancelled"> {
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      // แชร์ไม่สำเร็จด้วยเหตุผลอื่น ดาวน์โหลดแทน
    }
  }
  for (const f of files) downloadFile(f);
  return "downloaded";
}

/** ดาวน์โหลดไฟล์ผ่านลิงก์ชั่วคราว */
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
