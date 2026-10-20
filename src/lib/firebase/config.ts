import type { FirebaseOptions } from "firebase/app";

/**
 * ค่าตั้ง Firebase อ่านจาก environment variables (NEXT_PUBLIC_*) ตอน build
 * - เครื่องตัวเอง: ใส่ใน .env.local
 * - Vercel: ใส่ใน Project Settings > Environment Variables
 * ค่าพวกนี้เปิดเผยได้ ความปลอดภัยของข้อมูลอยู่ที่ firestore.rules
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** ค่าที่จำเป็นแต่ยังไม่ได้ใส่ (ใช้บอกผู้ใช้ว่าขาดตัวไหน) */
export const missingFirebaseKeys: string[] = (
  [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", firebaseConfig.apiKey],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", firebaseConfig.appId],
  ] as const
)
  .filter(([, value]) => !value)
  .map(([key]) => key);

/** ตั้งค่า Firebase ครบหรือยัง */
export const isFirebaseConfigured = missingFirebaseKeys.length === 0;
