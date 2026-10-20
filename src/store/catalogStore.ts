import { create } from "zustand";
import type { Preset, Template } from "@/types";
import type { CatalogRepository } from "@/lib/catalog/types";
import { isFirebaseConfigured } from "@/lib/firebase/config";

/**
 * รายการขนาดกรอบและเทมเพลตของร้าน อ่าน/เขียนจาก Firebase Firestore เท่านั้น
 * (ไม่มีข้อมูลเก็บไว้ในโค้ด ใครเปิดหน้าจัดการก็เพิ่ม/แก้/ลบได้)
 */
interface CatalogState {
  presets: Preset[];
  templates: Template[];
  /** ตั้งค่า Firebase ใน env ครบหรือยัง */
  configured: boolean;
  started: boolean;
  /** ได้ข้อมูลจาก Firestore ครั้งแรกแล้วหรือยัง (ใช้แสดงสถานะกำลังโหลด) */
  loaded: boolean;
  /** ข้อความเมื่อเชื่อม Firestore ไม่สำเร็จ */
  error: string | null;
  online: boolean;
  fromCache: boolean;
  pendingWrites: boolean;
  repo: CatalogRepository | null;

  init: () => void;
  savePreset: (p: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  reorderPresets: (ids: string[]) => Promise<void>;
  saveTemplate: (t: Template) => Promise<void>;
  setTemplateActive: (id: string, active: boolean) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

/** ดึง repository ออกมาใช้ ถ้ายังไม่พร้อม (ไม่ได้ตั้งค่า/ยังโหลดไม่เสร็จ) ให้แจ้ง error */
function requireRepo(repo: CatalogRepository | null): CatalogRepository {
  if (!repo) throw new Error("firebase-not-ready");
  return repo;
}

export const useCatalog = create<CatalogState>()((set, get) => ({
  presets: [],
  templates: [],
  configured: isFirebaseConfigured,
  started: false,
  loaded: false,
  error: null,
  online: true,
  fromCache: false,
  pendingWrites: false,
  repo: null,

  /** เริ่มเชื่อม Firestore แบบเรียลไทม์ (เรียกซ้ำได้ ทำงานแค่ครั้งแรก) */
  init: () => {
    if (get().started || !isFirebaseConfigured) return;
    set({ started: true, online: navigator.onLine });
    window.addEventListener("online", () => set({ online: true }));
    window.addEventListener("offline", () => set({ online: false }));

    // โหลดโค้ด Firebase แยกไฟล์ หน้าเว็บจะเปิดได้ก่อนโดยไม่ต้องรอ
    import("@/lib/firebase/repository")
      .then(({ createFirebaseRepository }) => {
        const repo = createFirebaseRepository();
        set({ repo });
        repo.subscribe({
          onData: (u) =>
            set((s) => ({
              presets: u.presets ?? s.presets,
              templates: u.templates ?? s.templates,
              fromCache: u.fromCache ?? s.fromCache,
              pendingWrites: u.pendingWrites ?? s.pendingWrites,
              loaded: true,
              error: null,
            })),
          onError: (error) => set({ error, loaded: true }),
        });
      })
      .catch(() => set({ error: "โหลด Firebase SDK ไม่สำเร็จ", loaded: true }));
  },

  /** เพิ่ม/แก้ไขขนาด */
  savePreset: async (p) => {
    await requireRepo(get().repo).savePreset(p);
  },

  /** ลบขนาด */
  deletePreset: async (id) => {
    await requireRepo(get().repo).deletePreset(id);
  },

  /** บันทึกลำดับขนาดใหม่ (อัปเดตจอทันที ไม่ต้องรอ server) */
  reorderPresets: async (ids) => {
    set((s) => ({
      presets: ids
        .map((id, i) => {
          const p = s.presets.find((x) => x.id === id);
          return p ? { ...p, order: i + 1 } : null;
        })
        .filter((p): p is Preset => p !== null),
    }));
    await requireRepo(get().repo).reorderPresets(ids);
  },

  /** เพิ่ม/แก้ไขเทมเพลต */
  saveTemplate: async (t) => {
    await requireRepo(get().repo).saveTemplate(t);
  },

  /** ซ่อน/แสดงเทมเพลตในหน้าจัดวาง */
  setTemplateActive: async (id, active) => {
    const t = get().templates.find((x) => x.id === id);
    if (t) await get().saveTemplate({ ...t, active });
  },

  /** ลบเทมเพลต */
  deleteTemplate: async (id) => {
    await requireRepo(get().repo).deleteTemplate(id);
  },
}));
