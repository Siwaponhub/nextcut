import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
  type Timestamp,
} from "firebase/firestore";
import {
  byOrder,
  docToPreset,
  docToTemplate,
  presetToDoc,
  templateToDoc,
  type PresetDoc,
  type TemplateDoc,
} from "../catalog/mapping";
import type { CatalogRepository } from "../catalog/types";
import { firebaseConfig } from "./config";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/** ใช้ Firebase app ตัวเดียวทั้งแอป */
function firebaseApp(): FirebaseApp {
  app ??= getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

/**
 * ต่อ Firestore แบบเก็บ cache ในเครื่อง (persistentLocalCache)
 * เน็ตหลุดก็ยังอ่านรายการล่าสุดได้ และแก้ตอนออฟไลน์ได้ ระบบซิงก์ให้เมื่อกลับมาออนไลน์
 */
function firestore(): Firestore {
  db ??= initializeFirestore(firebaseApp(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return db;
}

/** แปลง error ของ Firestore เป็นข้อความที่ผู้ใช้อ่านเข้าใจ */
function describeError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "permission-denied") return "Firestore ไม่อนุญาต ตรวจว่าวางกฎจาก firestore.rules แล้วกด Publish";
  if (code === "unavailable") return "ติดต่อ Firestore ไม่ได้ ตรวจอินเทอร์เน็ต";
  if (code === "failed-precondition") return "ยังไม่ได้สร้างฐานข้อมูล Firestore ในโปรเจกต์";
  return `เชื่อม Firestore ไม่สำเร็จ (${code || "unknown"})`;
}

/**
 * repository ที่อ่าน/เขียน Firestore (ไม่มีการล็อกอิน ใครเปิดแอปก็อ่าน/เขียนได้)
 * collections: presets (ขนาดกรอบ), templates (เทมเพลต)
 */
export function createFirebaseRepository(): CatalogRepository {
  return {
    /** ฟัง presets และ templates แบบเรียลไทม์ */
    subscribe({ onData, onError }) {
      const unsubPresets = onSnapshot(
        collection(firestore(), "presets"),
        { includeMetadataChanges: true },
        (snap) => {
          const presets = snap.docs
            .map((d) => {
              const data = d.data() as Partial<PresetDoc> & { updatedAt?: Timestamp };
              return docToPreset(d.id, data, data.updatedAt?.toMillis?.());
            })
            .sort(byOrder);
          onData({ presets, fromCache: snap.metadata.fromCache, pendingWrites: snap.metadata.hasPendingWrites });
        },
        (e) => onError(describeError(e)),
      );

      const unsubTemplates = onSnapshot(
        collection(firestore(), "templates"),
        { includeMetadataChanges: true },
        (snap) => {
          const templates = snap.docs.map((d) => docToTemplate(d.id, d.data() as Partial<TemplateDoc>)).sort(byOrder);
          onData({ templates, fromCache: snap.metadata.fromCache, pendingWrites: snap.metadata.hasPendingWrites });
        },
        (e) => onError(describeError(e)),
      );

      return () => {
        unsubPresets();
        unsubTemplates();
      };
    },

    /** เพิ่มหรือแก้ไขขนาด (setDoc ทับทั้งเอกสาร) */
    async savePreset(p) {
      await setDoc(doc(firestore(), "presets", p.id), { ...presetToDoc(p), updatedAt: serverTimestamp() });
    },

    /** ลบขนาด */
    async deletePreset(id) {
      await deleteDoc(doc(firestore(), "presets", id));
    },

    /** เขียน order ใหม่ทุกอันในการเขียนรอบเดียว จะไม่มีจังหวะที่ลำดับครึ่งเก่าครึ่งใหม่ */
    async reorderPresets(ids) {
      const batch = writeBatch(firestore());
      ids.forEach((id, i) => batch.update(doc(firestore(), "presets", id), { order: i + 1 }));
      await batch.commit();
    },

    /** เพิ่มหรือแก้ไขเทมเพลต */
    async saveTemplate(t) {
      await setDoc(doc(firestore(), "templates", t.id), { ...templateToDoc(t), updatedAt: serverTimestamp() });
    },

    /** ลบเทมเพลต */
    async deleteTemplate(id) {
      await deleteDoc(doc(firestore(), "templates", id));
    },
  };
}
