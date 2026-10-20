import { create } from "zustand";

interface ToastState {
  message: string | null;
  /** เลขกำกับ ใช้รีเซ็ตตัวจับเวลาเมื่อข้อความใหม่มาซ้ำข้อความเดิม */
  seq: number;
  show: (message: string) => void;
  hide: () => void;
}

/** ข้อความแจ้งเตือนสั้น ๆ ด้านล่างจอ */
export const useToast = create<ToastState>()((set) => ({
  message: null,
  seq: 0,
  /** แสดงข้อความ (ปิดเองหลัง 2.6 วินาที ดูที่ ToastHost) */
  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),
  /** ซ่อนข้อความ */
  hide: () => set({ message: null }),
}));

/** เรียกแสดงข้อความจากที่ไหนก็ได้ (นอก React component) */
export function toast(message: string): void {
  useToast.getState().show(message);
}
