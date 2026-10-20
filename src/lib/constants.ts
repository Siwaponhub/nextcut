import type { Orientation, PresetCategory, Shape, TemplateCategory } from "@/types";

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

/** ขนาดกระดาษตามแนว (mm) */
export function sheetSize(orientation: Orientation): { w: number; h: number } {
  return orientation === "portrait" ? { w: 100, h: 150 } : { w: 150, h: 100 };
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
