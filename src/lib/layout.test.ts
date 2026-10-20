import { describe, expect, it } from "vitest";
import type { Frame, Page, Preset } from "@/types";
import { imageGeometry, isFrameInvalid, rectsOverlap } from "./geometry";
import {
  arrangePage,
  createFrame,
  createPage,
  duplicateFrame,
  expandBasket,
  findFreeSpot,
  generateFrames,
  gridCapacity,
  pageFromTemplate,
} from "./layout";

const settings = { marginMm: 3, gapMm: 2 };
const oneInch = { shape: "rect" as const, wMm: 25, hMm: 30 };

/** ขนาดจำลองสำหรับทดสอบ (ข้อมูลจริงอยู่ใน Firestore) */
const presets: Preset[] = [
  { id: "p-1in", name: "ติดบัตร 1 นิ้ว", category: "id", inputUnit: "cm", order: 1, active: true, ...oneInch },
];

/** ตรวจว่าทุกกรอบในแผ่นไม่ทับกันและไม่ล้นขอบ */
function allValid(page: Page) {
  return page.frames.every((f) => !isFrameInvalid(f, page));
}

describe("layout", () => {
  it("รูป 1 นิ้ว วางได้ 12 ช่องต่อแผ่นแนวตั้ง", () => {
    expect(gridCapacity(25, 30, "portrait", settings)).toEqual({ cols: 3, rows: 4, count: 12 });
  });

  it("หาที่ว่างโดยเว้นขอบและระยะห่าง", () => {
    const page = createPage();
    expect(findFreeSpot(page, 25, 30, settings)).toEqual({ x: 3, y: 3 });
    const withOne = { ...page, frames: [createFrame(oneInch, 3, 3)] };
    expect(findFreeSpot(withOne, 25, 30, settings)).toEqual({ x: 30, y: 3 });
  });

  it("สร้างตามจำนวน ถ้าเกินแผ่นจะเพิ่มแผ่นใหม่", () => {
    const pages = [createPage()];
    const items = expandBasket([{ presetId: "p-1in", qty: 20 }], presets);
    const r = generateFrames({ pages, pageIndex: 0, items, mode: "append", settings });
    expect(r.placed).toBe(20);
    expect(r.failed).toBe(0);
    expect(r.pages).toHaveLength(2);
    expect(r.pages[0].frames).toHaveLength(12);
    expect(r.pages.every(allValid)).toBe(true);
    expect(pages[0].frames).toHaveLength(0); // ไม่แก้ข้อมูลเดิม
  });

  it("กรอบใหญ่เกินแผ่นนับเป็นใส่ไม่ได้", () => {
    const r = generateFrames({
      pages: [createPage()],
      pageIndex: 0,
      items: [{ shape: "rect", wMm: 120, hMm: 120 }],
      mode: "new",
      settings,
    });
    expect(r.placed).toBe(0);
    expect(r.failed).toBe(1);
    expect(r.pages).toHaveLength(1);
  });

  it("ทำซ้ำกรอบไปที่ว่างถัดไป", () => {
    const frame = createFrame(oneInch, 3, 3);
    const page = { ...createPage(), frames: [frame] };
    const r = duplicateFrame(page, frame, settings);
    expect(r.frame?.xMm).toBe(30);
    expect(r.page.frames).toHaveLength(2);
  });

  it("จัดเรียงใหม่แล้วไม่มีกรอบทับกัน", () => {
    const messy: Page = {
      ...createPage(),
      frames: [createFrame(oneInch, 10, 10), createFrame(oneInch, 12, 12), createFrame({ shape: "circle", wMm: 40, hMm: 40 }, 15, 15)],
    };
    const r = arrangePage([messy], 0, settings);
    expect(r.pages[0].frames).toHaveLength(3);
    expect(allValid(r.pages[0])).toBe(true);
  });

  it("สร้างแผ่นจากเทมเพลตได้ครบทุกช่องและรักษาค่าหัวใจ", () => {
    const page = pageFromTemplate({
      id: "t",
      name: "ทดสอบ",
      category: "gift",
      orientation: "portrait",
      background: "#FFFFFF",
      order: 1,
      active: true,
      slots: [
        { ...oneInch, xMm: 3, yMm: 3 },
        { shape: "heart", wMm: 45, hMm: 40, xMm: 30, yMm: 3, heart: { notchDepth: 0.3, tipSharpness: 0.8 } },
      ],
    });
    expect(page.frames).toHaveLength(2);
    expect(page.frames[1].heart).toEqual({ notchDepth: 0.3, tipSharpness: 0.8 });
    expect(allValid(page)).toBe(true);
  });
});

describe("geometry", () => {
  const frame = (patch: Partial<Frame>): Frame => ({ ...createFrame(oneInch, 0, 0), ...patch });

  it("ตรวจการทับกันโดยนับระยะห่าง", () => {
    const a = { xMm: 0, yMm: 0, wMm: 10, hMm: 10 };
    expect(rectsOverlap(a, { xMm: 10, yMm: 0, wMm: 10, hMm: 10 })).toBe(false);
    expect(rectsOverlap(a, { xMm: 11, yMm: 0, wMm: 10, hMm: 10 }, 2)).toBe(true);
  });

  it("รูปแนวนอนในกรอบแนวตั้ง: เต็มกรอบจะล้นด้านข้าง", () => {
    const g = imageGeometry(frame({ panX: 50, panY: 50 }), { width: 1200, height: 800 });
    expect(g.h).toBeCloseTo(30);
    expect(g.overflowX).toBeCloseTo(20);
    expect(g.left).toBeCloseTo(-10);
  });

  it("เห็นทั้งรูป: รูปเล็กกว่ากรอบ", () => {
    const g = imageGeometry(frame({ fit: "contain" }), { width: 1200, height: 800 });
    expect(g.w).toBeCloseTo(25);
    expect(g.overflowY).toBeLessThan(0);
  });
});
