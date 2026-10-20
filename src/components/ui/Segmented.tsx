import type { ButtonHTMLAttributes, ReactNode } from "react";
import s from "./ui.module.css";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** ชื่อกลุ่มสำหรับ screen reader */
  label: string;
  /** ไอคอนอยู่บนข้อความ (ใช้กับปุ่มเลือกรูปทรง) */
  tall?: boolean;
  /** กว้างตามเนื้อหา ไม่ขยายเต็มแถว */
  fit?: boolean;
  className?: string;
}

/** ตัวเลือกแบบแบ่งช่อง เลือกได้ทีละอย่าง */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  tall,
  fit,
  className,
}: SegmentedProps<T>) {
  const cls = [s.seg, tall && s.segTall, fit && s.segFit, className].filter(Boolean).join(" ");
  return (
    <div className={cls} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={s.segBtn}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** ปุ่มชิป ใช้เป็นตัวกรองหรือตัวเลือกด่วน */
export function Chip({
  selected,
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button type={type} className={[s.chip, className].filter(Boolean).join(" ")} aria-pressed={selected} {...rest} />
  );
}
