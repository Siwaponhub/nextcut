import { describe, expect, it } from "vitest";
import { formatConverted, formatSize, formatSizeConverted, fromUnit, parseDecimal, snapIntoRange, stepMm, toUnit } from "./units";

describe("units", () => {
  it("แปลง mm เป็น ซม./นิ้ว และบอกว่าลงตัวหรือไม่", () => {
    expect(toUnit(25, "cm")).toEqual({ value: 2.5, exact: true });
    expect(toUnit(25.4, "in")).toEqual({ value: 1, exact: true });
    expect(toUnit(25, "in")).toEqual({ value: 0.98, exact: false });
  });

  it("แปลงค่าที่กรอกกลับเป็น mm", () => {
    expect(fromUnit(2.5, "cm")).toBe(25);
    expect(fromUnit(2, "in")).toBe(50.8);
  });

  it("ข้อความขนาดและค่าที่แปลงเป็นอีกหน่วย", () => {
    expect(formatSize(25, 30, "cm")).toBe("2.5×3 ซม.");
    expect(formatSizeConverted(25, 30, "cm")).toBe("≈ 0.98×1.18 นิ้ว");
    expect(formatSizeConverted(50.8, 50.8, "in")).toBe("= 5.08×5.08 ซม.");
    expect(formatConverted(25.4, "in")).toBe("= 2.54 ซม.");
  });

  it("รับทศนิยมแบบจุลภาค", () => {
    expect(parseDecimal("2,5")).toBe(2.5);
    expect(Number.isNaN(parseDecimal("abc"))).toBe(true);
  });

  it("ปุ่ม −/+ ปัดเข้าขั้นที่ลงตัว", () => {
    expect(stepMm(25, "in", 1)).toBe(25.4); // 0.98 นิ้ว → 1.00 นิ้ว
    expect(stepMm(25, "cm", 1)).toBe(26);
    expect(stepMm(25, "cm", -1)).toBe(24);
  });

  it("ยอมให้คลาด 0.5 mm แล้วปัดเข้าขอบ", () => {
    expect(snapIntoRange(100.08, 0, 100)).toBe(100);
    expect(snapIntoRange(101, 0, 100)).toBeNull();
  });
});
