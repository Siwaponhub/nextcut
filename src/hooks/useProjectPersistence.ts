"use client";

import { useEffect } from "react";
import type { ImageInfo, Page } from "@/types";
import { loadImage, loadProject, pruneImages, saveProject } from "@/lib/storage";
import { useEditor } from "@/store/editorStore";

/** โหลดงานเก่าและไฟล์รูปจาก IndexedDB แล้วสร้าง url ให้รูป */
async function restore(): Promise<{ pages: Page[] | null; pageIndex: number; images: Record<string, ImageInfo> }> {
  const saved = await loadProject();
  if (!saved) return { pages: null, pageIndex: 0, images: {} };

  const images: Record<string, ImageInfo> = {};
  const ids = new Set(saved.pages.flatMap((p) => p.frames.map((f) => f.imageId).filter((id): id is string => !!id)));
  for (const id of ids) {
    const img = await loadImage(id);
    if (img) images[id] = { url: URL.createObjectURL(img.blob), width: img.width, height: img.height };
  }
  // กรอบที่ไฟล์รูปหายไปแล้ว ให้กลับเป็นช่องว่าง
  const pages = saved.pages.map((p) => ({
    ...p,
    frames: p.frames.map((f) => (f.imageId && !images[f.imageId] ? { ...f, imageId: null } : f)),
  }));
  pruneImages(new Set(Object.keys(images))).catch(() => {});
  return { pages, pageIndex: saved.pageIndex, images };
}

/**
 * โหลดงานเก่าตอนเปิดหน้า และบันทึกอัตโนมัติทุกครั้งที่แก้ (หน่วง 400ms)
 * บันทึกทันทีเมื่อสลับแอปหรือออกจากหน้า เพราะ iOS อาจปิดแท็บทิ้งระหว่างอยู่เบื้องหลัง
 */
export function useProjectPersistence(): void {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (!useEditor.getState().hydrated) {
      restore()
        .then((r) => !cancelled && useEditor.getState().hydrate(r.pages, r.pageIndex, r.images))
        .catch(() => !cancelled && useEditor.getState().hydrate(null, 0, {}));
    }

    /** บันทึกสถานะปัจจุบันทันที */
    const flush = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      const s = useEditor.getState();
      if (s.hydrated) saveProject({ version: 1, pages: s.pages, pageIndex: s.pageIndex }).catch(() => {});
    };

    const unsubscribe = useEditor.subscribe((s, prev) => {
      if (!s.hydrated || (s.pages === prev.pages && s.pageIndex === prev.pageIndex)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 400);
    });

    const onHide = () => document.visibilityState === "hidden" && timer && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      if (timer) flush();
    };
  }, []);
}
