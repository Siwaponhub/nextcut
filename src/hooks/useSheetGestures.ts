"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { Frame } from "@/types";
import { MAX_ZOOM, sheetSize } from "@/lib/constants";
import { clamp, imageGeometry } from "@/lib/geometry";
import { selectCurrentPage, useEditor } from "@/store/editorStore";

interface DragState {
  kind: "move" | "pan";
  frameId: string;
  startX: number;
  startY: number;
  /** ค่าเริ่มต้น: move = ตำแหน่ง x,y (mm), pan = panX,panY (%) */
  originA: number;
  originB: number;
  overflowX: number;
  overflowY: number;
  moved: boolean;
}

interface PinchState {
  frameId: string;
  startDistance: number;
  startZoom: number;
  recorded: boolean;
}

/** กรอบที่อยู่ใต้นิ้ว (ดูจาก data-frame-id) */
function frameUnder(target: EventTarget | null): string | null {
  return (target as HTMLElement | null)?.closest<HTMLElement>("[data-frame-id]")?.dataset.frameId ?? null;
}

/** ปัดเป็นทุก 0.5 mm ให้วางกรอบได้ตรงง่าย */
function snapHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

/**
 * จัดการท่าทางบนแผ่นกระดาษ (ใช้ Pointer Events จึงรองรับทั้งนิ้ว เมาส์ และ Apple Pencil)
 * - ขั้นเลือกแบบ: แตะเพื่อเลือก ลากเพื่อย้ายกรอบ
 * - ขั้นใส่รูป: แตะช่องว่างเพื่อเลือกรูป ลากเพื่อเลื่อนรูป ถ่างสองนิ้ว/หมุนล้อเมาส์เพื่อซูม
 * - ขั้นส่งออก: ล็อกแผ่นไว้
 * scaleRef = จำนวน px ต่อ 1 mm ของแผ่นที่แสดงอยู่
 */
export function useSheetGestures(
  sheetRef: RefObject<HTMLDivElement | null>,
  scaleRef: RefObject<number>,
  onPickPhoto: (frameId: string) => void,
  onDropFiles: (frameId: string, files: File[]) => void,
) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<DragState | null>(null);
  const pinch = useRef<PinchState | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const editor = useEditor;

    /** หากรอบในแผ่นปัจจุบันจาก id */
    const findFrame = (id: string): Frame | undefined => selectCurrentPage(editor.getState()).frames.find((f) => f.id === id);
    /** px ต่อ mm โดยคิดรวมการย่อขยายของหน้าเว็บด้วย */
    const pxPerMm = () => scaleRef.current * (sheet.getBoundingClientRect().width / (sheet.offsetWidth || 1));

    /** นิ้วแตะลง: เริ่มลาก/เลื่อน หรือเริ่มถ่างนิ้วเมื่อเป็นนิ้วที่สอง */
    const onDown = (e: PointerEvent) => {
      const s = editor.getState();
      if (s.step === "export") return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2) {
        const frame = s.selectedId ? findFrame(s.selectedId) : undefined;
        if (s.step === "photo" && frame?.imageId) {
          const [a, b] = [...pointers.current.values()];
          pinch.current = {
            frameId: frame.id,
            startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
            startZoom: frame.zoom,
            recorded: false,
          };
          drag.current = null;
          sheet.setPointerCapture(e.pointerId);
        }
        return;
      }
      if (pointers.current.size > 2) return;

      const id = frameUnder(e.target);
      if (!id) {
        if (s.selectedId) s.select(null);
        return;
      }
      const frame = findFrame(id);
      if (!frame) return;
      suppressClick.current = false;

      if (s.step === "photo") {
        if (!frame.imageId) return; // ช่องว่าง: ให้ click เปิดคลังภาพ
        s.select(id);
        const info = s.images[frame.imageId];
        if (!info) return;
        const g = imageGeometry(frame, info);
        drag.current = {
          kind: "pan",
          frameId: id,
          startX: e.clientX,
          startY: e.clientY,
          originA: frame.panX,
          originB: frame.panY,
          overflowX: g.overflowX,
          overflowY: g.overflowY,
          moved: false,
        };
      } else {
        s.select(id);
        drag.current = {
          kind: "move",
          frameId: id,
          startX: e.clientX,
          startY: e.clientY,
          originA: frame.xMm,
          originB: frame.yMm,
          overflowX: 0,
          overflowY: 0,
          moved: false,
        };
      }
      sheet.setPointerCapture(e.pointerId);
    };

    /** นิ้วเลื่อน: ย้ายกรอบ เลื่อนรูป หรือซูม */
    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const s = editor.getState();

      const p = pinch.current;
      if (p) {
        if (pointers.current.size < 2) return;
        const [a, b] = [...pointers.current.values()];
        if (!p.recorded) {
          s.pushHistory();
          p.recorded = true;
        }
        const zoom = clamp((p.startZoom * Math.hypot(a.x - b.x, a.y - b.y)) / p.startDistance, 1, MAX_ZOOM);
        s.updateFrame(p.frameId, { zoom }, false);
        return;
      }

      const d = drag.current;
      if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) < 4) return;
        d.moved = true;
        suppressClick.current = true;
        s.pushHistory();
      }
      const k = pxPerMm();
      const dx = (e.clientX - d.startX) / k;
      const dy = (e.clientY - d.startY) / k;
      const frame = findFrame(d.frameId);
      if (!frame) return;

      if (d.kind === "move") {
        const sheetMm = sheetSize(selectCurrentPage(s).orientation);
        s.updateFrame(
          d.frameId,
          {
            xMm: snapHalf(clamp(d.originA + dx, 0, Math.max(0, sheetMm.w - frame.wMm))),
            yMm: snapHalf(clamp(d.originB + dy, 0, Math.max(0, sheetMm.h - frame.hMm))),
          },
          false,
        );
      } else {
        const patch: Partial<Frame> = {};
        if (Math.abs(d.overflowX) > 0.01) patch.panX = clamp(d.originA - (dx / d.overflowX) * 100, 0, 100);
        if (Math.abs(d.overflowY) > 0.01) patch.panY = clamp(d.originB - (dy / d.overflowY) * 100, 0, 100);
        s.updateFrame(d.frameId, patch, false);
      }
    };

    /** นิ้วยกขึ้น: จบการลาก/ถ่างนิ้ว */
    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pinch.current) {
        if (pointers.current.size < 2) pinch.current = null;
        drag.current = null;
        return;
      }
      drag.current = null;
    };

    /** แตะช่องว่างในขั้นใส่รูป: เปิดคลังภาพ (ต้องเป็น click เพื่อให้ iOS ยอมเปิด) */
    const onClick = (e: MouseEvent) => {
      if (suppressClick.current) return;
      const s = editor.getState();
      if (s.step !== "photo") return;
      const id = frameUnder(e.target);
      const frame = id ? findFrame(id) : undefined;
      if (frame && !frame.imageId) {
        s.select(frame.id);
        onPickPhoto(frame.id);
      }
    };

    /** หมุนล้อเมาส์บนรูปที่เลือก: ซูม */
    const onWheel = (e: WheelEvent) => {
      const s = editor.getState();
      if (s.step !== "photo" || !s.selectedId || frameUnder(e.target) !== s.selectedId) return;
      const frame = findFrame(s.selectedId);
      if (!frame?.imageId) return;
      e.preventDefault();
      const zoom = clamp(frame.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 1, MAX_ZOOM);
      s.updateFrame(frame.id, { zoom }, false);
    };

    /** ลากไฟล์รูปมาเหนือกรอบ (คอมพิวเตอร์/iPad ที่ใช้ Split View) */
    const onDragOver = (e: DragEvent) => {
      if (frameUnder(e.target) && e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };

    /** วางไฟล์รูปลงกรอบ */
    const onDrop = (e: DragEvent) => {
      const id = frameUnder(e.target);
      const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!id || !files.length) return;
      e.preventDefault();
      if (editor.getState().step !== "photo") editor.getState().setStep("photo");
      onDropFiles(id, files);
    };

    sheet.addEventListener("pointerdown", onDown);
    sheet.addEventListener("pointermove", onMove);
    sheet.addEventListener("pointerup", onUp);
    sheet.addEventListener("pointercancel", onUp);
    sheet.addEventListener("click", onClick);
    sheet.addEventListener("wheel", onWheel, { passive: false });
    sheet.addEventListener("dragover", onDragOver);
    sheet.addEventListener("drop", onDrop);
    return () => {
      sheet.removeEventListener("pointerdown", onDown);
      sheet.removeEventListener("pointermove", onMove);
      sheet.removeEventListener("pointerup", onUp);
      sheet.removeEventListener("pointercancel", onUp);
      sheet.removeEventListener("click", onClick);
      sheet.removeEventListener("wheel", onWheel);
      sheet.removeEventListener("dragover", onDragOver);
      sheet.removeEventListener("drop", onDrop);
    };
  }, [sheetRef, scaleRef, onPickPhoto, onDropFiles]);
}
