"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * เงื่อนไขขนาดจอที่ใช้ทั้งแอป (ต้องตรงกับ @media ในไฟล์ CSS)
 * big  = iPad: ปุ่มและตัวอักษรใหญ่ขึ้น
 * side = จอกว้างหรือแนวนอน: แผงเครื่องมืออยู่ด้านขวา
 * two  = หน้าจัดการแสดงรายการกับรายละเอียดคู่กัน
 */
export const MQ_BIG = "(min-width: 600px) and (min-height: 600px)";
export const MQ_SIDE = "(min-width: 1000px), (orientation: landscape) and (min-width: 700px)";
export const MQ_TWO = "(min-width: 700px)";

/** คืน true เมื่อหน้าจอตรงกับ media query และอัปเดตเมื่อหมุนจอหรือย่อขยายหน้าต่าง */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
