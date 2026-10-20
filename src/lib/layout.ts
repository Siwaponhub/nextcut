import type { Frame, FrameSpec, LayoutSettings, Orientation, Page, Preset, Template } from "@/types";
import { sheetSize } from "./constants";
import { rectsOverlap } from "./geometry";
import { createId } from "./id";
import { heartOf } from "./shapes";

const EPS = 1e-6;
/** กันวนไม่จบตอนสร้างแผ่นใหม่ */
const MAX_NEW_PAGES = 40;

/** กรอบที่รอวาง (มีกรอบต้นทางได้ เพื่อคัดลอกรูปตอนจัดเรียงใหม่) */
export interface PlaceItem extends FrameSpec {
  source?: Frame;
}

/** ชุดขนาด + จำนวน ที่ผู้ใช้ตั้งในแท็บ "กำหนดขนาดและจำนวน" */
export interface BasketItem {
  presetId: string;
  qty: number;
}

export interface GenerateResult {
  pages: Page[];
  /** แผ่นแรกที่มีกรอบใหม่ (ให้ UI เลื่อนไปแสดง) */
  firstIndex: number;
  placed: number;
  failed: number;
  usedPages: number;
  addedPages: number;
}

/** คีย์ที่บอกว่ากรอบสองอันหน้าตาเหมือนกัน (ขนาด รูปทรง และทรงหัวใจ) */
export function specKey(spec: FrameSpec): string {
  const heart = spec.shape === "heart" ? `${heartOf(spec).notchDepth}/${heartOf(spec).tipSharpness}` : "";
  return `${spec.shape}|${spec.wMm}|${spec.hMm}|${heart}`;
}

/** ปัดเป็น 0.01 mm กันเลขทศนิยมเพี้ยน */
function r2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** สร้างแผ่นว่าง */
export function createPage(orientation: Orientation = "portrait", background = "#FFFFFF"): Page {
  return { id: createId("pg_"), orientation, background, frames: [] };
}

/** สร้างกรอบใหม่ที่ตำแหน่ง x,y (ถ้ามีกรอบต้นทาง คัดลอกรูปและการครอปมาด้วย) */
export function createFrame(spec: PlaceItem, xMm: number, yMm: number): Frame {
  const src = spec.source;
  return {
    id: createId("fr_"),
    shape: spec.shape,
    wMm: spec.wMm,
    hMm: spec.hMm,
    heart: spec.shape === "heart" ? heartOf(spec) : undefined,
    xMm: r2(xMm),
    yMm: r2(yMm),
    imageId: src?.imageId ?? null,
    zoom: src?.zoom ?? 1,
    panX: src?.panX ?? 50,
    panY: src?.panY ?? 50,
    fit: src?.fit ?? "cover",
  };
}

/** จำนวนกรอบขนาด w×h ที่เรียงเป็นตารางได้บนแผ่นเดียว */
export function gridCapacity(w: number, h: number, orientation: Orientation, s: LayoutSettings) {
  const sheet = sheetSize(orientation);
  const cols = Math.max(0, Math.floor((sheet.w - 2 * s.marginMm + s.gapMm) / (w + s.gapMm)));
  const rows = Math.max(0, Math.floor((sheet.h - 2 * s.marginMm + s.gapMm) / (h + s.gapMm)));
  return { cols, rows, count: cols * rows };
}

/**
 * หาตำแหน่งว่างแรกที่วางกรอบ w×h ได้ (บนลงล่าง ซ้ายไปขวา)
 * ตำแหน่งที่ลองคือขอบกระดาษ และขอบของกรอบที่มีอยู่ + ระยะห่าง
 */
export function findFreeSpot(page: Page, w: number, h: number, s: LayoutSettings): { x: number; y: number } | null {
  const sheet = sheetSize(page.orientation);
  const xs = [s.marginMm];
  const ys = [s.marginMm];
  for (const f of page.frames) {
    xs.push(f.xMm, f.xMm + f.wMm + s.gapMm);
    ys.push(f.yMm, f.yMm + f.hMm + s.gapMm);
  }
  const candidates: { x: number; y: number }[] = [];
  for (const y of ys) for (const x of xs) candidates.push({ x, y });
  candidates.sort((a, b) => a.y - b.y || a.x - b.x);

  for (const c of candidates) {
    const fits =
      c.x >= s.marginMm - EPS &&
      c.y >= s.marginMm - EPS &&
      c.x + w <= sheet.w - s.marginMm + EPS &&
      c.y + h <= sheet.h - s.marginMm + EPS;
    if (!fits) continue;
    const rect = { xMm: c.x, yMm: c.y, wMm: w, hMm: h };
    if (!page.frames.some((f) => rectsOverlap(rect, f, s.gapMm))) return c;
  }
  return null;
}

/**
 * วางรายการกรอบลงแผ่น คืนแผ่นใหม่และรายการที่วางไม่ลง
 * ถ้าแผ่นว่างและทุกกรอบเหมือนกัน จะจัดเป็นตารางกึ่งกลางแผ่นให้สวย
 */
export function placeOnPage(page: Page, items: PlaceItem[], s: LayoutSettings): { page: Page; rest: PlaceItem[] } {
  if (!items.length) return { page, rest: items };
  const frames = page.frames.slice();
  const sameSpec = items.every((it) => specKey(it) === specKey(items[0]));

  if (!frames.length && sameSpec) {
    const first = items[0];
    const grid = gridCapacity(first.wMm, first.hMm, page.orientation, s);
    if (!grid.count) return { page, rest: items };
    const sheet = sheetSize(page.orientation);
    const n = Math.min(grid.count, items.length);
    const cols = Math.min(grid.cols, n);
    const rows = Math.ceil(n / cols);
    const ox = (sheet.w - (cols * first.wMm + (cols - 1) * s.gapMm)) / 2;
    const oy = (sheet.h - (rows * first.hMm + (rows - 1) * s.gapMm)) / 2;
    for (let i = 0; i < n; i++) {
      const x = ox + (i % cols) * (first.wMm + s.gapMm);
      const y = oy + Math.floor(i / cols) * (first.hMm + s.gapMm);
      frames.push(createFrame(items[i], x, y));
    }
    return { page: { ...page, frames }, rest: items.slice(n) };
  }

  const rest: PlaceItem[] = [];
  let working: Page = { ...page, frames };
  for (const it of items) {
    const spot = findFreeSpot(working, it.wMm, it.hMm, s);
    if (spot) working = { ...working, frames: [...working.frames, createFrame(it, spot.x, spot.y)] };
    else rest.push(it);
  }
  return { page: working, rest };
}

/** แปลงชุดขนาด+จำนวน เป็นรายการกรอบ เรียงจากใหญ่ไปเล็กเพื่อให้วางได้แน่นขึ้น */
export function expandBasket(basket: BasketItem[], presets: Preset[]): PlaceItem[] {
  const items: PlaceItem[] = [];
  for (const b of basket) {
    const p = presets.find((x) => x.id === b.presetId);
    if (!p) continue;
    for (let i = 0; i < b.qty; i++) items.push({ shape: p.shape, wMm: p.wMm, hMm: p.hMm, heart: p.heart });
  }
  return items.sort((a, b) => b.wMm * b.hMm - a.wMm * a.hMm);
}

/**
 * สร้างกรอบตามจำนวนที่ตั้ง ถ้าแผ่นปัจจุบันไม่พอจะเพิ่มแผ่นใหม่ให้เอง
 * mode "append" = ต่อจากแผ่นนี้, "new" = เริ่มแผ่นใหม่
 * ไม่แก้ข้อมูลเดิม คืน pages ชุดใหม่ (ใช้คำนวณสรุปก่อนกดสร้างได้ด้วย)
 */
export function generateFrames(args: {
  pages: Page[];
  pageIndex: number;
  items: PlaceItem[];
  mode: "append" | "new";
  settings: LayoutSettings;
}): GenerateResult {
  const { items, mode, settings } = args;
  const pages = args.pages.slice();
  const orientation = pages[args.pageIndex].orientation;
  const used = new Set<number>();
  let index = args.pageIndex;
  let added = 0;
  if (!items.length) return { pages, firstIndex: index, placed: 0, failed: 0, usedPages: 0, addedPages: 0 };

  if (mode === "new") {
    pages.push(createPage(orientation));
    index = pages.length - 1;
    added++;
  }
  const first = placeOnPage(pages[index], items, settings);
  pages[index] = first.page;
  let rest = first.rest;
  if (rest.length < items.length) used.add(index);
  else if (mode === "new") {
    // แผ่นใหม่ที่เพิ่งเพิ่มวางอะไรไม่ได้เลย เอาออก
    pages.splice(index, 1);
    added--;
    index = args.pageIndex;
  }

  while (rest.length && added < MAX_NEW_PAGES) {
    const next = placeOnPage(createPage(orientation), rest, settings);
    if (next.rest.length === rest.length) break; // กรอบใหญ่เกินแผ่น วางไม่ได้แน่นอน
    pages.push(next.page);
    added++;
    used.add(pages.length - 1);
    rest = next.rest;
  }
  return {
    pages,
    firstIndex: index,
    placed: items.length - rest.length,
    failed: rest.length,
    usedPages: used.size,
    addedPages: added,
  };
}

/** จัดเรียงกรอบบนแผ่นใหม่ให้เป็นระเบียบ กรอบที่ไม่พอจะย้ายไปแผ่นใหม่ต่อท้ายแผ่นนี้ */
export function arrangePage(pages: Page[], pageIndex: number, s: LayoutSettings): { pages: Page[]; added: number } {
  const page = pages[pageIndex];
  const items: PlaceItem[] = page.frames
    .map((f) => ({ shape: f.shape, wMm: f.wMm, hMm: f.hMm, heart: f.heart, source: f }))
    .sort((a, b) => b.wMm * b.hMm - a.wMm * a.hMm);
  const out = pages.slice();
  const first = placeOnPage({ ...page, frames: [] }, items, s);
  out[pageIndex] = first.page;
  let rest = first.rest;
  let added = 0;
  while (rest.length && added < 10) {
    const next = placeOnPage(createPage(page.orientation, page.background), rest, s);
    if (next.rest.length === rest.length) break;
    out.splice(pageIndex + 1 + added, 0, next.page);
    added++;
    rest = next.rest;
  }
  return { pages: out, added };
}

/** ทำซ้ำกรอบ (พร้อมรูปและการครอป) ไปวางที่ว่างถัดไปบนแผ่นเดียวกัน */
export function duplicateFrame(page: Page, frame: Frame, s: LayoutSettings): { page: Page; frame: Frame | null } {
  const spot = findFreeSpot(page, frame.wMm, frame.hMm, s);
  if (!spot) return { page, frame: null };
  const copy: Frame = { ...frame, id: createId("fr_"), xMm: r2(spot.x), yMm: r2(spot.y) };
  return { page: { ...page, frames: [...page.frames, copy] }, frame: copy };
}

/** สร้างแผ่นใหม่จากเทมเพลต (มีแต่กรอบ ยังไม่มีรูป) */
export function pageFromTemplate(t: Template): Page {
  const page = createPage(t.orientation, t.background);
  return { ...page, frames: t.slots.map((s) => createFrame(s, s.xMm, s.yMm)) };
}
