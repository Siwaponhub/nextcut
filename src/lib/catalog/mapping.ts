import type { HeartParams, Preset, Shape, Template, TemplateSlot } from "@/types";
import { heartOf } from "../shapes";

/**
 * แปลงข้อมูลระหว่างรูปแบบในแอปกับเอกสาร Firestore
 * ชื่อ field ใน Firestore อ่านง่ายและคงที่ (widthMm, shapeParams) แม้โค้ดในแอปจะเปลี่ยน
 */

export interface PresetDoc {
  name: string;
  category: Preset["category"];
  shape: Shape;
  widthMm: number;
  heightMm: number;
  inputUnit: Preset["inputUnit"];
  order: number;
  active: boolean;
  shapeParams?: { notchDepth: number; tipSharpness: number };
}

export interface TemplateSlotDoc {
  shape: Shape;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  shapeParams?: { notchDepth: number; tipSharpness: number };
}

export interface TemplateDoc {
  name: string;
  category: Template["category"];
  orientation: Template["orientation"];
  background: string;
  slots: TemplateSlotDoc[];
  order: number;
  active: boolean;
}

/** ค่าหัวใจในรูปแบบเอกสาร (เฉพาะรูปทรงหัวใจ) */
function heartToDoc(shape: Shape, heart?: HeartParams) {
  return shape === "heart" ? { shapeParams: { ...heartOf({ heart }) } } : {};
}

/** Preset → เอกสาร Firestore (ไม่รวม id และเวลาแก้ไข) */
export function presetToDoc(p: Preset): PresetDoc {
  return {
    name: p.name,
    category: p.category,
    shape: p.shape,
    widthMm: p.wMm,
    heightMm: p.hMm,
    inputUnit: p.inputUnit,
    order: p.order,
    active: p.active,
    ...heartToDoc(p.shape, p.heart),
  };
}

/** เอกสาร Firestore → Preset (ใส่ค่าเริ่มต้นให้ field ที่ขาด) */
export function docToPreset(id: string, d: Partial<PresetDoc>, updatedAt?: number): Preset {
  const shape = d.shape ?? "rect";
  return {
    id,
    name: d.name ?? "ไม่มีชื่อ",
    category: d.category ?? "general",
    shape,
    wMm: d.widthMm ?? 25,
    hMm: d.heightMm ?? 30,
    inputUnit: d.inputUnit ?? "cm",
    order: d.order ?? 999,
    active: d.active ?? true,
    heart: shape === "heart" ? heartOf({ heart: d.shapeParams }) : undefined,
    updatedAt,
  };
}

/** ช่องในเทมเพลต → เอกสาร */
function slotToDoc(s: TemplateSlot): TemplateSlotDoc {
  return { shape: s.shape, xMm: s.xMm, yMm: s.yMm, wMm: s.wMm, hMm: s.hMm, ...heartToDoc(s.shape, s.heart) };
}

/** เอกสาร → ช่องในเทมเพลต */
function docToSlot(d: TemplateSlotDoc): TemplateSlot {
  return {
    shape: d.shape,
    xMm: d.xMm,
    yMm: d.yMm,
    wMm: d.wMm,
    hMm: d.hMm,
    heart: d.shape === "heart" ? heartOf({ heart: d.shapeParams }) : undefined,
  };
}

/** Template → เอกสาร Firestore */
export function templateToDoc(t: Template): TemplateDoc {
  return {
    name: t.name,
    category: t.category,
    orientation: t.orientation,
    background: t.background,
    slots: t.slots.map(slotToDoc),
    order: t.order,
    active: t.active,
  };
}

/** เอกสาร Firestore → Template */
export function docToTemplate(id: string, d: Partial<TemplateDoc>): Template {
  return {
    id,
    name: d.name ?? "ไม่มีชื่อ",
    category: d.category ?? "gift",
    orientation: d.orientation ?? "portrait",
    background: d.background ?? "#FFFFFF",
    slots: (d.slots ?? []).map(docToSlot),
    order: d.order ?? 999,
    active: d.active ?? true,
  };
}

/** เรียงตาม order แล้วตามชื่อ */
export function byOrder<T extends { order: number; name: string }>(a: T, b: T): number {
  return a.order - b.order || a.name.localeCompare(b.name, "th");
}
