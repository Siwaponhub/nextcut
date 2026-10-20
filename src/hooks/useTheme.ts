"use client";

import { useSyncExternalStore } from "react";
import type { ThemeChoice } from "@/types";
import { applyTheme, isDarkNow, readTheme, subscribeTheme } from "@/lib/theme";

/** อ่านธีมที่เลือก (สว่าง/มืด/ตามระบบ) ว่าตอนนี้มืดอยู่ไหม และฟังก์ชันเปลี่ยนธีม */
export function useTheme(): { choice: ThemeChoice; dark: boolean; setTheme: (t: ThemeChoice) => void } {
  const choice = useSyncExternalStore(subscribeTheme, readTheme, () => "system" as ThemeChoice);
  const dark = useSyncExternalStore(subscribeTheme, isDarkNow, () => false);
  return { choice, dark, setTheme: applyTheme };
}
