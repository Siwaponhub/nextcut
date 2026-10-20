import type { ThemeChoice } from "@/types";

const STORAGE_KEY = "nextcut-theme";
const EVENT = "nextcut-theme-change";

/**
 * script ที่ใส่ใน <head> ให้รันก่อนวาดหน้า: อ่านธีมที่เลือกไว้แล้วตั้ง data-theme
 * ทำให้จอไม่กระพริบสว่างก่อนเปลี่ยนเป็นมืด
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** อ่านธีมที่ผู้ใช้เลือก (ไม่ได้เลือก = ตามระบบ) */
export function readTheme(): ThemeChoice {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "system";
}

/** ตั้งธีม จำไว้ใน localStorage และแจ้งคอมโพเนนต์ที่ฟังอยู่ */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* เก็บไม่ได้ก็ยังใช้ธีมได้ในรอบนี้ */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** ตอนนี้แสดงผลเป็นธีมมืดอยู่หรือไม่ (รวมกรณีตามระบบ) */
export function isDarkNow(): boolean {
  const t = readTheme();
  return t === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : t === "dark";
}

/** ฟังการเปลี่ยนธีม ทั้งจากผู้ใช้และจากระบบ (ใช้กับ useSyncExternalStore) */
export function subscribeTheme(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(EVENT, onChange);
  mq.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    mq.removeEventListener("change", onChange);
  };
}
