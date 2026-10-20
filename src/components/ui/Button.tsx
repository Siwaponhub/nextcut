import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import s from "./ui.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  size?: "md" | "sm";
  wide?: boolean;
  icon?: IconName;
};

/** ปุ่มมาตรฐาน มีไอคอนด้านหน้าได้ */
export function Button({
  variant = "default",
  size = "md",
  wide,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = [
    s.btn,
    size === "sm" && s.sm,
    variant === "primary" && s.primary,
    variant === "danger" && s.danger,
    wide && s.wide,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  /** ข้อความสำหรับ screen reader และ tooltip */
  label: string;
};

/** ปุ่มไอคอนอย่างเดียว ขนาดอย่างน้อย 44pt ตามแนวทางของ Apple */
export function IconButton({ icon, label, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} className={[s.iconBtn, className].filter(Boolean).join(" ")} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
