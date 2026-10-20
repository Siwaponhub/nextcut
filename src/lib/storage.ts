import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";
import type { Page } from "@/types";

/**
 * เก็บงานจัดวางและไฟล์รูปไว้ใน IndexedDB ของเบราว์เซอร์
 * งานจึงไม่หายเมื่อ iOS รีโหลดแท็บเอง และรูปไม่ต้องอัปโหลดขึ้น server
 */

const PROJECT_KEY = "project:v1";
const IMAGE_PREFIX = "img:";

let db: UseStore | null = null;

/** เปิดฐานข้อมูล (สร้างครั้งแรกตอนเรียกใช้ เพราะ IndexedDB มีแค่ในเบราว์เซอร์) */
function store(): UseStore {
  db ??= createStore("nextcut", "kv");
  return db;
}

export interface SavedProject {
  version: 1;
  pages: Page[];
  pageIndex: number;
}

export interface SavedImage {
  blob: Blob;
  width: number;
  height: number;
}

/** บันทึกงานจัดวาง (แผ่นและกรอบ ไม่รวมไฟล์รูป) */
export async function saveProject(project: SavedProject): Promise<void> {
  await set(PROJECT_KEY, project, store());
}

/** โหลดงานจัดวางที่บันทึกไว้ ไม่มีคืน null */
export async function loadProject(): Promise<SavedProject | null> {
  const p = await get<SavedProject>(PROJECT_KEY, store());
  return p && p.version === 1 && Array.isArray(p.pages) && p.pages.length ? p : null;
}

/** เก็บไฟล์รูปหนึ่งรูป */
export async function saveImage(id: string, image: SavedImage): Promise<void> {
  await set(IMAGE_PREFIX + id, image, store());
}

/** อ่านไฟล์รูปหนึ่งรูป */
export async function loadImage(id: string): Promise<SavedImage | null> {
  return (await get<SavedImage>(IMAGE_PREFIX + id, store())) ?? null;
}

/** ลบไฟล์รูปที่ไม่มีกรอบไหนใช้แล้ว (เรียกตอนเปิดแอป) */
export async function pruneImages(usedIds: Set<string>): Promise<void> {
  const all = await keys(store());
  await Promise.all(
    all
      .filter((k): k is string => typeof k === "string" && k.startsWith(IMAGE_PREFIX))
      .filter((k) => !usedIds.has(k.slice(IMAGE_PREFIX.length)))
      .map((k) => del(k, store())),
  );
}
