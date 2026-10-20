import { describe, expect, it } from "vitest";
import { DEFAULT_HEART, heartOf, heartSegments, heartTipAngle, isEllipse, shapePath } from "./shapes";

describe("shapes", () => {
  it("หัวใจมี 6 ช่วงและเริ่ม-จบที่ปลายล่างกึ่งกลาง", () => {
    const segs = heartSegments(DEFAULT_HEART);
    expect(segs).toHaveLength(6);
    expect(segs[0][0]).toEqual([0.5, 1]);
    expect(segs[5][3]).toEqual([0.5, 1]);
  });

  it("ร่องอยู่ที่ความลึกตามค่าที่ตั้ง", () => {
    const segs = heartSegments({ notchDepth: 0.3, tipSharpness: 0.5 });
    expect(segs[2][3]).toEqual([0.5, 0.3]);
  });

  it("หัวใจแตะขอบกรอบทั้ง 4 ด้าน", () => {
    const pts = heartSegments(DEFAULT_HEART).flatMap((s) => [s[0], s[3]]);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(1);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(1);
  });

  it("บีบค่าหัวใจให้อยู่ในช่วง", () => {
    expect(heartOf({ heart: { notchDepth: 0.9, tipSharpness: -1 } })).toEqual({ notchDepth: 0.4, tipSharpness: 0 });
  });

  it("ปลายแหลมขึ้นเมื่อค่าความแหลมเพิ่ม", () => {
    expect(heartTipAngle(45, 40, { notchDepth: 0.14, tipSharpness: 0.85 })).toBeLessThan(
      heartTipAngle(45, 40, { notchDepth: 0.14, tipSharpness: 0.15 }),
    );
  });

  it("path ของแต่ละรูปทรงขึ้นต้นด้วย M และปิดด้วย Z", () => {
    for (const shape of ["rect", "round", "circle", "heart"] as const) {
      const d = shapePath(shape, 40, 30, DEFAULT_HEART);
      expect(d.startsWith("M")).toBe(true);
      expect(d.endsWith("Z")).toBe(true);
    }
  });

  it("ตรวจวงรี", () => {
    expect(isEllipse({ shape: "circle", wMm: 40, hMm: 40 })).toBe(false);
    expect(isEllipse({ shape: "circle", wMm: 40, hMm: 30 })).toBe(true);
  });
});
