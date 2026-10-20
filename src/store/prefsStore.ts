import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LayoutSettings, Unit } from "@/types";

/** ค่าตั้งของผู้ใช้ที่จำไว้ในเครื่อง (localStorage) */
interface PrefsState extends LayoutSettings {
  unit: Unit;
  cutLines: boolean;
  setUnit: (unit: Unit) => void;
  setMargin: (mm: number) => void;
  setGap: (mm: number) => void;
  setCutLines: (on: boolean) => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      unit: "cm",
      marginMm: 3,
      gapMm: 2,
      cutLines: true,
      /** เปลี่ยนหน่วยที่แสดง (ค่าภายในยังเป็น mm) */
      setUnit: (unit) => set({ unit }),
      /** ตั้งขอบปลอดภัยของกระดาษ */
      setMargin: (marginMm) => set({ marginMm }),
      /** ตั้งระยะห่างระหว่างกรอบ */
      setGap: (gapMm) => set({ gapMm }),
      /** เปิด/ปิดเส้นตัดตอนพิมพ์ */
      setCutLines: (cutLines) => set({ cutLines }),
    }),
    { name: "nextcut-prefs" },
  ),
);

/** ดึงเฉพาะค่าระยะสำหรับฟังก์ชันจัดวาง */
export function layoutSettings(): LayoutSettings {
  const { marginMm, gapMm } = usePrefs.getState();
  return { marginMm, gapMm };
}
