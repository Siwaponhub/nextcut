import type { Preset, Template } from "@/types";

/** ข้อมูลที่ repository ส่งกลับมาทุกครั้งที่มีการเปลี่ยนแปลง */
export interface CatalogUpdate {
  presets?: Preset[];
  templates?: Template[];
  /** ข้อมูลมาจาก cache ในเครื่อง (ยังติดต่อ server ไม่ได้) */
  fromCache?: boolean;
  /** มีการแก้ไขที่ยังไม่ได้ส่งขึ้น server */
  pendingWrites?: boolean;
}

/** ตัวรับข้อมูลจาก repository */
export interface CatalogListeners {
  onData: (u: CatalogUpdate) => void;
  /** อ่านข้อมูลไม่ได้ เช่น ค่าตั้งผิดหรือกฎ Firestore ไม่อนุญาต */
  onError: (message: string) => void;
}

/**
 * ช่องทางอ่าน/เขียนรายการขนาดและเทมเพลตของร้าน (ตอนนี้มีแบบเดียวคือ Firestore)
 * แยกเป็น interface ไว้ เพื่อให้ store ไม่ผูกกับ Firebase โดยตรง และทดสอบด้วยข้อมูลจำลองได้
 */
export interface CatalogRepository {
  /** เริ่มฟังข้อมูลแบบเรียลไทม์ คืนฟังก์ชันหยุดฟัง */
  subscribe(listeners: CatalogListeners): () => void;
  savePreset(preset: Preset): Promise<void>;
  deletePreset(id: string): Promise<void>;
  /** บันทึกลำดับใหม่ทั้งรายการในครั้งเดียว */
  reorderPresets(orderedIds: string[]): Promise<void>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
}
