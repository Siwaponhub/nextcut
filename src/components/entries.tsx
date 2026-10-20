"use client";

import dynamic from "next/dynamic";

/** หน้าจอระหว่างโหลดโค้ดของแอป */
function Loading() {
  return (
    <div style={{ height: "100dvh", display: "grid", placeItems: "center", color: "var(--fg-2)" }}>กำลังเปิด NextCut…</div>
  );
}

/**
 * หน้าจัดวางและหน้าจัดการใช้ข้อมูลในเครื่องล้วน (IndexedDB, localStorage)
 * จึงโหลดเฉพาะฝั่งเบราว์เซอร์ (ssr: false) ไม่ต้องเรนเดอร์ล่วงหน้าที่ server และไม่เกิด hydration mismatch
 */
export const EditorEntry = dynamic(() => import("./editor/EditorApp"), { ssr: false, loading: Loading });
export const ManageEntry = dynamic(() => import("./manage/ManageApp"), { ssr: false, loading: Loading });
