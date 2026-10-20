import { create } from "zustand";
import type { Frame, ImageInfo, LayoutSettings, Orientation, Page, Preset, Step, Template } from "@/types";
import { HISTORY_LIMIT } from "@/lib/constants";
import {
  arrangePage,
  createPage,
  duplicateFrame,
  expandBasket,
  generateFrames,
  pageFromTemplate,
  type BasketItem,
  type GenerateResult,
} from "@/lib/layout";

interface HistoryEntry {
  pages: Page[];
  pageIndex: number;
}

/** แผงของกรอบที่เลือกในขั้นเลือกแบบ: เมนูหลัก หรือหน้าปรับขนาด/รูปทรง */
export type FramePanel = "main" | "size";
/** แท็บในขั้นเลือกแบบ */
export type LayoutTab = "templates" | "custom";

interface EditorState {
  pages: Page[];
  pageIndex: number;
  step: Step;
  selectedId: string | null;
  framePanel: FramePanel;
  layoutTab: LayoutTab;
  basket: BasketItem[];
  generateMode: "append" | "new";
  /** รูปที่นำเข้าแล้ว key = imageId */
  images: Record<string, ImageInfo>;
  history: HistoryEntry[];
  /** โหลดงานเก่าจาก IndexedDB เสร็จหรือยัง */
  hydrated: boolean;
  /** เทมเพลตที่เลือกจากหน้าจัดการ รอใช้เมื่อกลับมาหน้าจัดวาง */
  pendingTemplateId: string | null;

  hydrate: (pages: Page[] | null, pageIndex: number, images: Record<string, ImageInfo>) => void;
  pushHistory: () => void;
  undo: () => boolean;
  setStep: (step: Step) => void;
  select: (id: string | null) => void;
  setFramePanel: (panel: FramePanel) => void;
  setLayoutTab: (tab: LayoutTab) => void;
  goToPage: (index: number) => void;
  addPage: () => void;
  deletePage: () => void;
  setOrientation: (o: Orientation) => void;
  setBackground: (color: string) => void;
  updateFrame: (id: string, patch: Partial<Frame>, recordHistory?: boolean) => void;
  deleteFrame: (id: string) => void;
  duplicateFrame: (id: string, s: LayoutSettings) => boolean;
  fillWithDuplicates: (id: string, s: LayoutSettings) => number;
  applyTemplate: (t: Template, mode: "replace" | "new") => void;
  addToBasket: (presetId: string) => void;
  setBasketQty: (index: number, qty: number) => void;
  removeFromBasket: (index: number) => void;
  setGenerateMode: (mode: "append" | "new") => void;
  generate: (presets: Preset[], s: LayoutSettings) => GenerateResult;
  arrange: (s: LayoutSettings) => number;
  addImages: (entries: Record<string, ImageInfo>) => void;
  setFrameImage: (frameId: string, imageId: string | null) => void;
  fillEmptyFrames: (imageIds: string[]) => { placed: number; unused: number; stillEmpty: number };
  setPendingTemplate: (id: string | null) => void;
}

/** แทนที่แผ่นเดียวใน array โดยไม่แก้ array เดิม */
function replacePage(pages: Page[], index: number, page: Page): Page[] {
  const out = pages.slice();
  out[index] = page;
  return out;
}

/** กรอบที่ยังไม่มีรูป เรียงโดยเริ่มจากแผ่นปัจจุบันแล้ววนไปแผ่นอื่น */
export function emptyFramesInOrder(pages: Page[], startIndex: number): { pageIndex: number; frame: Frame }[] {
  const out: { pageIndex: number; frame: Frame }[] = [];
  for (let k = 0; k < pages.length; k++) {
    const pageIndex = (startIndex + k) % pages.length;
    for (const frame of pages[pageIndex].frames) if (!frame.imageId) out.push({ pageIndex, frame });
  }
  return out;
}

export const useEditor = create<EditorState>()((set, get) => {
  /** จำสถานะปัจจุบันไว้ก่อนแก้ไข เพื่อให้กดย้อนกลับได้ */
  const record = () =>
    set((s) => ({ history: [...s.history, { pages: s.pages, pageIndex: s.pageIndex }].slice(-HISTORY_LIMIT) }));

  /** แก้แผ่นปัจจุบันด้วยฟังก์ชันที่ส่งมา */
  const editPage = (fn: (page: Page) => Page) =>
    set((s) => ({ pages: replacePage(s.pages, s.pageIndex, fn(s.pages[s.pageIndex])) }));

  return {
    pages: [createPage()],
    pageIndex: 0,
    step: "layout",
    selectedId: null,
    framePanel: "main",
    layoutTab: "templates",
    basket: [],
    generateMode: "append",
    images: {},
    history: [],
    hydrated: false,
    pendingTemplateId: null,

    /** ใส่งานที่โหลดจาก IndexedDB (ไม่มีงานเก่าจะเริ่มด้วยแผ่นว่าง) */
    hydrate: (pages, pageIndex, images) =>
      set((s) => ({
        pages: pages?.length ? pages : s.pages,
        pageIndex: pages?.length ? Math.min(pageIndex, pages.length - 1) : 0,
        images: { ...s.images, ...images },
        hydrated: true,
      })),

    /** บันทึกจุดย้อนกลับ (ใช้ตอนเริ่มลากกรอบหรือถ่างนิ้ว) */
    pushHistory: record,

    /** ย้อนกลับหนึ่งขั้น คืน false ถ้าไม่มีอะไรให้ย้อน */
    undo: () => {
      const { history, selectedId } = get();
      const last = history[history.length - 1];
      if (!last) return false;
      const stillExists = last.pages[last.pageIndex]?.frames.some((f) => f.id === selectedId);
      set({
        pages: last.pages,
        pageIndex: Math.min(last.pageIndex, last.pages.length - 1),
        history: history.slice(0, -1),
        selectedId: stillExists ? selectedId : null,
      });
      return true;
    },

    /** เปลี่ยนขั้นตอน และยกเลิกการเลือกกรอบ */
    setStep: (step) => set({ step, selectedId: null, framePanel: "main" }),

    /** เลือกกรอบ (เลือกกรอบใหม่จะกลับไปเมนูหลักของกรอบ) */
    select: (id) => set((s) => ({ selectedId: id, framePanel: id === s.selectedId ? s.framePanel : "main" })),

    /** สลับแผงของกรอบที่เลือก */
    setFramePanel: (framePanel) => set({ framePanel }),

    /** สลับแท็บเทมเพลต/กำหนดขนาด */
    setLayoutTab: (layoutTab) => set({ layoutTab }),

    /** ไปแผ่นที่ index */
    goToPage: (index) =>
      set((s) => ({ pageIndex: Math.max(0, Math.min(s.pages.length - 1, index)), selectedId: null })),

    /** เพิ่มแผ่นว่างต่อจากแผ่นปัจจุบัน (แนวเดียวกัน) */
    addPage: () => {
      record();
      set((s) => {
        const pages = s.pages.slice();
        pages.splice(s.pageIndex + 1, 0, createPage(s.pages[s.pageIndex].orientation));
        return { pages, pageIndex: s.pageIndex + 1, selectedId: null };
      });
    },

    /** ลบแผ่นปัจจุบัน (ต้องเหลืออย่างน้อย 1 แผ่น) */
    deletePage: () => {
      if (get().pages.length < 2) return;
      record();
      set((s) => ({
        pages: s.pages.filter((_, i) => i !== s.pageIndex),
        pageIndex: Math.max(0, s.pageIndex - 1),
        selectedId: null,
      }));
    },

    /** เปลี่ยนแนวกระดาษของแผ่นปัจจุบัน */
    setOrientation: (orientation) => {
      record();
      editPage((p) => ({ ...p, orientation }));
      set({ selectedId: null });
    },

    /** เปลี่ยนสีพื้นหลังของแผ่นปัจจุบัน */
    setBackground: (background) => {
      record();
      editPage((p) => ({ ...p, background }));
    },

    /** แก้ค่ากรอบ (ระหว่างลากส่ง recordHistory = false เพราะบันทึกไว้แล้วตอนเริ่มลาก) */
    updateFrame: (id, patch, recordHistory = true) => {
      if (recordHistory) record();
      editPage((p) => ({ ...p, frames: p.frames.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    },

    /** ลบกรอบ */
    deleteFrame: (id) => {
      record();
      editPage((p) => ({ ...p, frames: p.frames.filter((f) => f.id !== id) }));
      set({ selectedId: null, framePanel: "main" });
    },

    /** ทำซ้ำกรอบหนึ่งครั้ง แล้วเลือกกรอบใหม่ */
    duplicateFrame: (id, settings) => {
      const s = get();
      const page = s.pages[s.pageIndex];
      const frame = page.frames.find((f) => f.id === id);
      if (!frame) return false;
      const r = duplicateFrame(page, frame, settings);
      if (!r.frame) return false;
      record();
      set({ pages: replacePage(s.pages, s.pageIndex, r.page), selectedId: r.frame.id });
      return true;
    },

    /** ทำซ้ำกรอบจนแผ่นเต็ม คืนจำนวนที่เพิ่ม */
    fillWithDuplicates: (id, settings) => {
      const s = get();
      let page = s.pages[s.pageIndex];
      const frame = page.frames.find((f) => f.id === id);
      if (!frame) return 0;
      let added = 0;
      for (;;) {
        const r = duplicateFrame(page, frame, settings);
        if (!r.frame) break;
        page = r.page;
        added++;
      }
      if (added) {
        record();
        set({ pages: replacePage(s.pages, s.pageIndex, page) });
      }
      return added;
    },

    /** ใช้เทมเพลต: แทนที่แผ่นนี้ หรือเพิ่มเป็นแผ่นใหม่ แล้วไปขั้นใส่รูป */
    applyTemplate: (t, mode) => {
      record();
      const page = pageFromTemplate(t);
      set((s) =>
        mode === "replace"
          ? { pages: replacePage(s.pages, s.pageIndex, page) }
          : { pages: [...s.pages, page], pageIndex: s.pages.length },
      );
      set({ step: "photo", selectedId: null, framePanel: "main" });
    },

    /** เพิ่มขนาดลงชุด (มีอยู่แล้วเพิ่มจำนวน 1) */
    addToBasket: (presetId) =>
      set((s) => {
        const found = s.basket.findIndex((b) => b.presetId === presetId);
        if (found < 0) return { basket: [...s.basket, { presetId, qty: 1 }] };
        return { basket: s.basket.map((b, i) => (i === found ? { ...b, qty: Math.min(200, b.qty + 1) } : b)) };
      }),

    /** ตั้งจำนวนของขนาดในชุด (1–200) */
    setBasketQty: (index, qty) =>
      set((s) => ({
        basket: s.basket.map((b, i) => (i === index ? { ...b, qty: Math.max(1, Math.min(200, qty)) } : b)),
      })),

    /** เอาขนาดออกจากชุด */
    removeFromBasket: (index) => set((s) => ({ basket: s.basket.filter((_, i) => i !== index) })),

    /** ต่อจากแผ่นนี้ หรือเริ่มแผ่นใหม่ */
    setGenerateMode: (generateMode) => set({ generateMode }),

    /** สร้างกรอบตามชุดที่ตั้ง แล้วล้างชุดและไปขั้นใส่รูป */
    generate: (presets, settings) => {
      const s = get();
      const result = generateFrames({
        pages: s.pages,
        pageIndex: s.pageIndex,
        items: expandBasket(s.basket, presets),
        mode: s.generateMode,
        settings,
      });
      if (result.placed > 0) {
        record();
        set({
          pages: result.pages,
          pageIndex: result.firstIndex,
          basket: [],
          step: "photo",
          selectedId: null,
        });
      }
      return result;
    },

    /** จัดเรียงกรอบบนแผ่นใหม่ คืนจำนวนแผ่นที่ต้องเพิ่ม */
    arrange: (settings) => {
      const s = get();
      if (!s.pages[s.pageIndex].frames.length) return 0;
      record();
      const r = arrangePage(s.pages, s.pageIndex, settings);
      set({ pages: r.pages, selectedId: null });
      return r.added;
    },

    /** ลงทะเบียนรูปที่นำเข้าแล้ว */
    addImages: (entries) => set((s) => ({ images: { ...s.images, ...entries } })),

    /** ใส่/เอารูปออกจากกรอบ (รีเซ็ตซูมและตำแหน่ง) */
    setFrameImage: (frameId, imageId) => {
      record();
      editPage((p) => ({
        ...p,
        frames: p.frames.map((f) =>
          f.id === frameId ? { ...f, imageId, zoom: 1, panX: 50, panY: 50, fit: "cover" } : f,
        ),
      }));
    },

    /** เติมรูปลงช่องว่างทุกแผ่นตามลำดับ (เริ่มจากแผ่นปัจจุบัน) */
    fillEmptyFrames: (imageIds) => {
      const s = get();
      const slots = emptyFramesInOrder(s.pages, s.pageIndex);
      const n = Math.min(slots.length, imageIds.length);
      if (!n) return { placed: 0, unused: imageIds.length, stillEmpty: slots.length };
      record();
      const assign = new Map(slots.slice(0, n).map((slot, i) => [slot.frame.id, imageIds[i]]));
      set({
        pages: s.pages.map((p) => ({
          ...p,
          frames: p.frames.map((f) =>
            assign.has(f.id)
              ? { ...f, imageId: assign.get(f.id) ?? null, zoom: 1, panX: 50, panY: 50, fit: "cover" }
              : f,
          ),
        })),
        selectedId: null,
      });
      return { placed: n, unused: imageIds.length - n, stillEmpty: slots.length - n };
    },

    /** ตั้งเทมเพลตที่จะใช้เมื่อกลับมาหน้าจัดวาง */
    setPendingTemplate: (pendingTemplateId) => set({ pendingTemplateId }),
  };
});

/** แผ่นที่กำลังแสดง */
export function selectCurrentPage(s: EditorState): Page {
  return s.pages[s.pageIndex];
}

/** กรอบที่เลือกอยู่ (ไม่มีคืน null) */
export function selectSelectedFrame(s: EditorState): Frame | null {
  return s.pages[s.pageIndex]?.frames.find((f) => f.id === s.selectedId) ?? null;
}
