"use client";

import { useCallback } from "react";
import type { ImageInfo } from "@/types";
import { createId } from "@/lib/id";
import { decodeAndResize } from "@/lib/images";
import { saveImage } from "@/lib/storage";
import { useEditor } from "@/store/editorStore";
import { toast } from "@/store/toastStore";

/**
 * เปิดหน้าต่างเลือกรูปของระบบ (บน iPhone/iPad จะเปิดคลังภาพหรือกล้อง)
 * ต้องเรียกจากการแตะของผู้ใช้โดยตรง iOS ถึงจะยอมเปิด
 */
function pickFiles(multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;
    input.style.display = "none";
    const done = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", () => done(Array.from(input.files ?? [])));
    input.addEventListener("cancel", () => done([]));
    document.body.appendChild(input);
    input.click();
  });
}

/** นำเข้าไฟล์รูป: ย่อ เก็บลง IndexedDB และลงทะเบียนใน store คืน id ของรูปที่สำเร็จ */
export async function importFiles(files: File[]): Promise<{ ids: string[]; failed: number }> {
  const entries: Record<string, ImageInfo> = {};
  const ids: string[] = [];
  let failed = 0;
  for (const file of files) {
    try {
      const img = await decodeAndResize(file);
      const id = createId("img_");
      await saveImage(id, img);
      entries[id] = { url: URL.createObjectURL(img.blob), width: img.width, height: img.height };
      ids.push(id);
    } catch {
      failed++;
    }
  }
  if (ids.length) useEditor.getState().addImages(entries);
  return { ids, failed };
}

/** ฟังก์ชันใส่รูปลงกรอบ ทั้งแบบเลือกทีละช่อง เลือกหลายรูป และลากไฟล์มาวาง */
export function usePhotoImport() {
  /** ใส่รูปลงกรอบเดียว แล้วเลือกกรอบนั้นไว้ให้ปรับต่อ */
  const importIntoFrame = useCallback(async (frameId: string, files: File[]) => {
    if (!files.length) return;
    const { ids } = await importFiles(files.slice(0, 1));
    if (!ids.length) {
      toast("เปิดไฟล์นี้ไม่ได้ เลือกไฟล์รูปภาพ");
      return;
    }
    const editor = useEditor.getState();
    editor.setFrameImage(frameId, ids[0]);
    editor.select(frameId);
    toast("ใส่รูปแล้ว · ลากเพื่อเลื่อน ถ่างนิ้วเพื่อซูม");
  }, []);

  /** เปิดคลังภาพแล้วใส่รูปลงกรอบที่ระบุ */
  const pickIntoFrame = useCallback(
    (frameId: string) => {
      pickFiles(false).then((files) => importIntoFrame(frameId, files));
    },
    [importIntoFrame],
  );

  /** เลือกหลายรูปแล้วเติมลงช่องว่างทุกแผ่นตามลำดับ */
  const pickAndFill = useCallback(() => {
    pickFiles(true).then(async (files) => {
      if (!files.length) return;
      toast(`กำลังนำเข้า ${files.length} รูป…`);
      const { ids, failed } = await importFiles(files);
      const r = useEditor.getState().fillEmptyFrames(ids);
      const parts = [`ใส่ ${r.placed} รูปแล้ว`];
      if (r.unused) parts.push(`อีก ${r.unused} รูปไม่มีช่องว่าง`);
      if (r.stillEmpty) parts.push(`ยังว่าง ${r.stillEmpty} ช่อง`);
      if (failed) parts.push(`เปิดไม่ได้ ${failed} ไฟล์`);
      toast(parts.join(" · "));
    });
  }, []);

  return { pickIntoFrame, pickAndFill, importIntoFrame };
}
