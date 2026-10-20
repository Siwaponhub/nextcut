import { create } from "zustand";

export type ExportFormat = "jpg" | "pdf" | "print";

/** หน้าต่างโต้ตอบที่เปิดได้ในหน้าจัดวาง (เปิดได้ทีละอัน) */
export type EditorDialog =
  | { kind: "sheet" }
  | { kind: "applyTemplate"; templateId: string }
  | { kind: "saveTemplate" }
  | { kind: "deletePage" }
  | { kind: "export"; format: ExportFormat };

interface DialogState {
  dialog: EditorDialog | null;
  open: (d: EditorDialog) => void;
  close: () => void;
}

export const useDialog = create<DialogState>()((set) => ({
  dialog: null,
  /** เปิดหน้าต่าง (ปิดอันเดิมให้อัตโนมัติ) */
  open: (dialog) => set({ dialog }),
  /** ปิดหน้าต่าง */
  close: () => set({ dialog: null }),
}));
