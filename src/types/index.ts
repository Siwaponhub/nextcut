/**
 * ชนิดข้อมูลหลักของแอป
 * ค่าขนาดและตำแหน่งทุกตัวเก็บเป็นมิลลิเมตร (mm) เสมอ หน่วย ซม./นิ้ว ใช้แค่ตอนแสดงผลและรับค่า
 */

/** หน่วยที่ผู้ใช้เลือกแสดงผล */
export type Unit = "cm" | "in";

/** รูปทรงของกรอบ */
export type Shape = "rect" | "round" | "circle" | "heart";

/** แนวกระดาษ: portrait = 100×150 mm, landscape = 150×100 mm */
export type Orientation = "portrait" | "landscape";

/** cover = รูปเต็มกรอบ (ตัดส่วนเกิน), contain = เห็นทั้งรูป (อาจมีขอบว่าง) */
export type ImageFit = "cover" | "contain";

/** ขั้นตอนการใช้งาน 3 ขั้น */
export type Step = "layout" | "photo" | "export";

export type PresetCategory = "id" | "instant" | "sticker" | "general";
export type TemplateCategory = "id" | "gift" | "sticker" | "instant";
export type ThemeChoice = "light" | "dark" | "system";

/** ค่าปรับทรงหัวใจ */
export interface HeartParams {
  /** ความลึกร่องด้านบน เป็นสัดส่วนของความสูง 0–0.4 */
  notchDepth: number;
  /** ความแหลมของปลายล่าง 0 = มน, 1 = แหลม */
  tipSharpness: number;
}

/** ข้อมูลที่บอกว่ากรอบหน้าตาแบบไหน (ไม่รวมตำแหน่ง) */
export interface FrameSpec {
  shape: Shape;
  wMm: number;
  hMm: number;
  heart?: HeartParams;
}

/** ขนาดกรอบสำเร็จรูป (เก็บใน Firestore จัดการได้ที่หน้า /manage) */
export interface Preset extends FrameSpec {
  id: string;
  name: string;
  category: PresetCategory;
  /** หน่วยที่ใช้ตอนกำหนดขนาด ใช้แสดงค่าให้ลงตัว เช่น "2×2 นิ้ว" */
  inputUnit: Unit;
  order: number;
  active: boolean;
  updatedAt?: number;
}

/** ช่องหนึ่งช่องในเทมเพลต */
export interface TemplateSlot extends FrameSpec {
  xMm: number;
  yMm: number;
}

/** แผ่นสำเร็จรูปที่จัดกรอบไว้แล้ว (ไม่มีรูป) */
export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  orientation: Orientation;
  background: string;
  slots: TemplateSlot[];
  order: number;
  active: boolean;
}

/** กรอบที่วางอยู่บนแผ่น */
export interface Frame extends FrameSpec {
  id: string;
  xMm: number;
  yMm: number;
  imageId: string | null;
  /** ซูม 1–4 เท่าของขนาดพอดีกรอบ */
  zoom: number;
  /** ตำแหน่งรูป 0–100 = เปอร์เซ็นต์ของส่วนที่ล้นกรอบ (50 = กึ่งกลาง) */
  panX: number;
  panY: number;
  fit: ImageFit;
}

/** กระดาษหนึ่งแผ่น */
export interface Page {
  id: string;
  orientation: Orientation;
  background: string;
  frames: Frame[];
}

/** ระยะที่ใช้ตอนจัดวางกรอบอัตโนมัติ */
export interface LayoutSettings {
  marginMm: number;
  gapMm: number;
}

/** รูปที่นำเข้าแล้ว (url ชี้ไปที่ blob ในหน่วยความจำ) */
export interface ImageInfo {
  url: string;
  width: number;
  height: number;
}
