"use client";

import type { ReactNode } from "react";
import { missingFirebaseKeys } from "@/lib/firebase/config";
import { useCatalog } from "@/store/catalogStore";
import { Note } from "../ui/Feedback";

/**
 * บอกสถานะของรายการขนาด/เทมเพลตเมื่อยังไม่มีอะไรให้แสดง:
 * ยังไม่ได้ตั้งค่า Firebase → เชื่อมไม่สำเร็จ → กำลังโหลด → รายการว่าง
 */
export function CatalogNotice({ empty, emptyText }: { empty: boolean; emptyText: ReactNode }) {
  const configured = useCatalog((c) => c.configured);
  const loaded = useCatalog((c) => c.loaded);
  const error = useCatalog((c) => c.error);

  if (!configured)
    return (
      <Note tone="bad">
        ยังไม่ได้เชื่อม Firebase ใส่ค่า {missingFirebaseKeys.join(", ")} ใน .env.local แล้วเริ่ม npm run dev ใหม่
      </Note>
    );
  if (error) return <Note tone="bad">{error}</Note>;
  if (!loaded) return <Note icon="cloud">กำลังโหลดจาก Firebase…</Note>;
  if (empty) return <Note>{emptyText}</Note>;
  return null;
}
