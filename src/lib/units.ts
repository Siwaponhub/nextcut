import type { Unit } from "@/types";
import { MM_PER_INCH } from "./constants";

export const MM_PER_UNIT: Record<Unit, number> = { cm: 10, in: MM_PER_INCH };
export const UNIT_LABEL: Record<Unit, string> = { cm: "ซม.", in: "นิ้ว" };
/** ระยะที่ปุ่ม −/+ เพิ่มลดต่อครั้ง ในหน่วยนั้น ๆ */
export const UNIT_STEP: Record<Unit, number> = { cm: 0.1, in: 0.05 };

/** ปัดเป็นทศนิยม 2 ตำแหน่ง */
export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** คืนหน่วยอีกตัว ใช้แสดงค่าแปลงกำกับ */
export function otherUnit(unit: Unit): Unit {
  return unit === "cm" ? "in" : "cm";
}

/** แปลง mm เป็นค่าในหน่วยที่เลือก และบอกว่าปัดเศษหรือลงตัวพอดี */
export function toUnit(mm: number, unit: Unit): { value: number; exact: boolean } {
  const raw = mm / MM_PER_UNIT[unit];
  const value = round2(raw);
  return { value, exact: Math.abs(value - raw) < 1e-6 };
}

/** แปลงค่าที่กรอกในหน่วยที่เลือกกลับเป็น mm */
export function fromUnit(value: number, unit: Unit): number {
  return round2(value * MM_PER_UNIT[unit]);
}

/** ตัวเลขอย่างเดียว เช่น "2.5" */
export function formatNumber(mm: number, unit: Unit): string {
  return String(toUnit(mm, unit).value);
}

/** ข้อความขนาด เช่น "2.5×3 ซม." */
export function formatSize(wMm: number, hMm: number, unit: Unit): string {
  return `${formatNumber(wMm, unit)}×${formatNumber(hMm, unit)} ${UNIT_LABEL[unit]}`;
}

/** ข้อความขนาดในหน่วยอีกตัว เช่น "≈ 0.98×1.18 นิ้ว" (ใช้ = เมื่อแปลงได้ลงตัว) */
export function formatSizeConverted(wMm: number, hMm: number, unit: Unit): string {
  const other = otherUnit(unit);
  const w = toUnit(wMm, other);
  const h = toUnit(hMm, other);
  return `${w.exact && h.exact ? "=" : "≈"} ${w.value}×${h.value} ${UNIT_LABEL[other]}`;
}

/** ค่าเดียวในหน่วยอีกตัว เช่น "= 2.54 ซม." */
export function formatConverted(mm: number, unit: Unit): string {
  const other = otherUnit(unit);
  const v = toUnit(mm, other);
  return `${v.exact ? "=" : "≈"} ${v.value} ${UNIT_LABEL[other]}`;
}

/** แปลงข้อความเป็นตัวเลข รองรับทั้ง . และ , เป็นจุดทศนิยม (แป้นตัวเลขบางภาษาใช้ ,) */
export function parseDecimal(text: string): number {
  return parseFloat(text.trim().replace(",", "."));
}

/** เลื่อนค่าไปขั้นถัดไป (0.1 ซม. หรือ 0.05 นิ้ว) โดยปัดให้ลงตัวกับขั้นก่อน */
export function stepMm(mm: number, unit: Unit, direction: 1 | -1): number {
  const step = UNIT_STEP[unit];
  const current = mm / MM_PER_UNIT[unit];
  const next =
    direction > 0
      ? Math.floor(current / step + 1e-6) * step + step
      : Math.ceil(current / step - 1e-6) * step - step;
  return fromUnit(Math.round(next / step) * step, unit);
}

/**
 * ตรวจว่าค่าอยู่ในช่วงหรือไม่ โดยยอมให้คลาดได้ 0.5 mm แล้วปัดเข้าขอบ
 * (เช่นกระดาษ 100 mm แสดงเป็น 3.94 นิ้ว แต่ 3.94 นิ้ว = 100.08 mm)
 */
export function snapIntoRange(mm: number, min: number, max: number, tolerance = 0.5): number | null {
  if (mm < min - tolerance || mm > max + tolerance) return null;
  return Math.min(max, Math.max(min, mm));
}
