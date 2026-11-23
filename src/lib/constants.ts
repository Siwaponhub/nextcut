import type { PaperSize, PresetCategory, Shape, SheetLike, TemplateCategory } from "@/types";

/** มิลลิเมตรต่อ 1 นิ้ว */
export const MM_PER_INCH = 25.4;
/** ความละเอียดที่ใช้ส่งออกและพิมพ์ */
export const PRINT_DPI = 300;
/** ขนาดกรอบเล็กสุดที่ยอมให้ตั้ง */
export const MIN_FRAME_MM = 5;
/** ซูมรูปได้สูงสุดกี่เท่า */
export const MAX_ZOOM = 4;
/** จำนวนขั้นที่ย้อนกลับได้ */
export const HISTORY_LIMIT = 60;
/** ความหนาเส้นตัดตอนพิมพ์ */
export const CUT_LINE_MM = 0.25;
export const CUT_LINE_COLOR = "#8A9086";

/** ขนาดกระดาษตั้งต้น 10×15 ซม. (4×6 นิ้ว) */
export const DEFAULT_PAPER: PaperSize = { wMm: 100, hMm: 150 };
/** ช่วงขนาดกระดาษที่กำหนดเองได้ (mm) */
export const PAPER_MIN_MM = 50;
export const PAPER_MAX_MM = 330;

/** ขนาดกระดาษสำเร็จรูป (เก็บแบบแนวตั้ง) */
export const PAPER_PRESETS: { id: string; label: string; note: string; paper: PaperSize }[] = [
  { id: "4x6", label: "10×15 ซม.", note: "4×6 นิ้ว · 4R", paper: { wMm: 100, hMm: 150 } },
  { id: "3r", label: "9×13 ซม.", note: "3.5×5 นิ้ว · 3R", paper: { wMm: 89, hMm: 127 } },
  { id: "5r", label: "13×18 ซม.", note: "5×7 นิ้ว · 5R", paper: { wMm: 127, hMm: 178 } },
  { id: "6r", label: "15×20 ซม.", note: "6×8 นิ้ว · 6R", paper: { wMm: 152, hMm: 203 } },
  { id: "a6", label: "A6", note: "10.5×14.8 ซม.", paper: { wMm: 105, hMm: 148 } },
  { id: "a5", label: "A5", note: "14.8×21 ซม.", paper: { wMm: 148, hMm: 210 } },
  { id: "a4", label: "A4", note: "21×29.7 ซม.", paper: { wMm: 210, hMm: 297 } },
];

/** ขนาดกระดาษของแผ่น (แบบแนวตั้ง) */
export function paperOf(sheet: SheetLike): PaperSize {
  return sheet.paper ?? DEFAULT_PAPER;
}

/** ขนาดกระดาษสองขนาดเท่ากันหรือไม่ */
export function samePaper(a: PaperSize, b: PaperSize): boolean {
  return Math.abs(a.wMm - b.wMm) < 0.01 && Math.abs(a.hMm - b.hMm) < 0.01;
}

/** ชื่อขนาดกระดาษสำเร็จรูป (ไม่ตรงกับแบบไหน คืน null) */
export function paperPreset(paper: PaperSize) {
  return PAPER_PRESETS.find((p) => samePaper(p.paper, paper)) ?? null;
}

/** ขนาดกระดาษทุกขนาดที่ใช้ในงาน (ไม่ซ้ำ) */
export function papersInUse(sheets: SheetLike[]): PaperSize[] {
  const out: PaperSize[] = [];
  for (const s of sheets) {
    const p = paperOf(s);
    if (!out.some((o) => samePaper(o, p))) out.push(p);
  }
  return out;
}

/** ขนาดแผ่นตามแนวที่วาง (mm) */
export function sheetSize(sheet: SheetLike): { w: number; h: number } {
  const p = paperOf(sheet);
  return sheet.orientation === "portrait" ? { w: p.wMm, h: p.hMm } : { w: p.hMm, h: p.wMm };
}

/** แปลงขนาดที่เห็น (กว้าง×สูง) เป็นขนาดกระดาษแบบแนวตั้ง + แนววาง */
export function sheetFromSize(w: number, h: number): Required<SheetLike> {
  return {
    orientation: w > h ? "landscape" : "portrait",
    paper: { wMm: Math.min(w, h), hMm: Math.max(w, h) },
  };
}

export const SHAPE_LABEL: Record<Shape, string> = {
  rect: "สี่เหลี่ยม",
  round: "มุมมน",
  circle: "วงกลม",
  heart: "หัวใจ",
};

export const PRESET_CATEGORY_LABEL: Record<PresetCategory, string> = {
  id: "ติดบัตร",
  instant: "โพลารอยด์",
  sticker: "สติกเกอร์",
  general: "ทั่วไป",
};

export const TEMPLATE_CATEGORY_LABEL: Record<TemplateCategory, string> = {
  id: "ติดบัตร",
  gift: "ของขวัญ",
  sticker: "สติกเกอร์",
  instant: "โพลารอยด์",
};

/** สีพื้นหลังแผ่นที่เลือกได้ */
export const BACKGROUNDS: { color: string; label: string }[] = [
  { color: "#FFFFFF", label: "ขาว" },
  { color: "#FFF7E8", label: "ครีม" },
  { color: "#FFEFF2", label: "ชมพู" },
  { color: "#EAF6EF", label: "มิ้นต์" },
  { color: "#E8F2FB", label: "ฟ้า" },
  { color: "#EEEEEC", label: "เทา" },
];
