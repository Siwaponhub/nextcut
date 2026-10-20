"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/store/toastStore";
import { Icon, type IconName } from "./Icon";
import { IconButton } from "./Button";
import s from "./ui.module.css";

interface NoteProps {
  tone?: "info" | "ok" | "warn" | "bad";
  icon?: IconName;
  children: ReactNode;
  /** ปุ่มข้อความด้านขวา เช่น "ไปแก้" */
  action?: { label: string; onClick: () => void };
}

/** กล่องข้อความแจ้ง มีสีตามระดับความสำคัญ */
export function Note({ tone = "info", icon, children, action }: NoteProps) {
  const toneClass = { info: "", ok: s.noteOk, warn: s.noteWarn, bad: s.noteBad }[tone];
  const fallbackIcon: IconName = tone === "ok" ? "check" : tone === "info" ? "alert" : "alert";
  return (
    <div className={[s.note, toneClass].join(" ")}>
      <Icon name={icon ?? fallbackIcon} size={18} />
      <span className={s.noteBody}>{children}</span>
      {action && (
        <button type="button" className={s.noteAction} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** สวิตช์เปิด/ปิดแบบ iOS */
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className={s.toggle}>
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

interface DialogProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** ปุ่มย้อนกลับด้านซ้าย (ถ้ามี) */
  onBack?: () => void;
  children: ReactNode;
}

/** หน้าต่างโต้ตอบ: ปิดได้ด้วยปุ่ม X แตะพื้นหลัง หรือกด Esc */
export function Dialog({ title, subtitle, onClose, onBack, children }: DialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className={s.overlay}>
      <div className={s.scrim} onClick={onClose} />
      <div className={s.dialog} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.dialogHead}>
          {onBack && <IconButton icon="chev-l" label="กลับ" onClick={onBack} />}
          <div className={s.dialogTitle}>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <IconButton icon="x" label="ปิด" onClick={onClose} autoFocus />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** แสดงข้อความแจ้งเตือนจาก toastStore แล้วซ่อนเองหลัง 2.6 วินาที */
export function ToastHost() {
  const message = useToast((t) => t.message);
  const seq = useToast((t) => t.seq);
  const hide = useToast((t) => t.hide);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 2600);
    return () => clearTimeout(timer);
  }, [message, seq, hide]);

  if (!message) return null;
  return (
    <div className={s.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
