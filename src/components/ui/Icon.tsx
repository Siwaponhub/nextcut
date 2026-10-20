import type { Shape } from "@/types";

/** path ของไอคอนเส้น (viewBox 0 0 24 24) */
const PATHS = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  "chev-l": "M15 5l-7 7 7 7",
  "chev-r": "M9 5l7 7-7 7",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7",
  copy: "M8 8h12v12H8zM16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8",
  "copy-plus": "M8 8h12v12H8zM16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M14 11v6M11 14h6",
  photo: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM21 16l-5-5-9 8M8.5 8.5v.01",
  "photo-plus": "M13 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5M3 16l4-4 4 4M17 15v6M14 18h6M8.5 9.5v.01",
  "photo-off": "M15 5h2a2 2 0 0 1 2 2v8M19 19H5a2 2 0 0 1-2-2V7c0-.6.3-1.2.7-1.5M3 3l18 18M3 16l4-4 4 4",
  photos: "M9 3h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM17 19H5a2 2 0 0 1-2-2V8M7 12l3-3 3 3 2-2 4 4",
  ruler: "M3.5 16.5l13-13 4 4-13 13zM8 12l2 2M11 9l2 2M14 6l2 2",
  undo: "M9 15L4 10l5-5M4 10h10.5a5.5 5.5 0 0 1 0 11H11",
  "eye-off": "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 4l16 16",
  share: "M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7",
  printer: "M7 9V3.5h10V9M5 9h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM7 14h10v6.5H7z",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  template: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 9h18M9 21V9",
  rotate: "M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5",
  swap: "M7 7h13l-4-4M17 17H4l4 4",
  move: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3",
  zoom: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.2-4.2M11 8.5v5M8.5 11h5",
  focus: "M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2",
  cloud: "M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 9.6a4.2 4.2 0 0 1-.6 8.9z",
  "cloud-ok": "M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 9.6a4.2 4.2 0 0 1-.6 8.9zM9.5 13.5l2 2 3.5-3.5",
  "cloud-off": "M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 9.6a4.2 4.2 0 0 1-.6 8.9zM3 3l18 18",
  "cloud-up": "M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 9.6a4.2 4.2 0 0 1-.6 8.9zM12 16v-5M9.5 13l2.5-2.5 2.5 2.5",
  search: "M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.2-4.2",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  lock: "M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7.5a4 4 0 0 1 8 0V11",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  alert: "M12 4l9.5 16.5h-19zM12 10v4.5M12 17.5v.01",
  "page-plus": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M12 11v6M9 14h6",
  portrait: "M7.5 3h9A1.5 1.5 0 0 1 18 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3z",
  landscape: "M4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6z",
  logo: "M7 2v5H2M17 2v5h5M7 22v-5H2M17 22v-5h5M10 9h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0",
  "shape-rect": "M4 4h16v16H4z",
  "shape-round": "M8.5 4h7A4.5 4.5 0 0 1 20 8.5v7a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 15.5v-7A4.5 4.5 0 0 1 8.5 4z",
  "shape-circle": "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z",
  "shape-heart": "M12 20s-7.5-4.6-9-9.6C2 6.9 4.3 4 7.4 4c2 0 3.6 1.1 4.6 2.8C13 5.1 14.6 4 16.6 4c3.1 0 5.4 2.9 4.4 6.4-1.5 5-9 9.6-9 9.6z",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number | string;
  className?: string;
}

/** ไอคอนเส้นขนาดตามตัวแปร --ico (ตกแต่งอย่างเดียว ผู้ใช้ screen reader จะไม่ได้ยิน) */
export function Icon({ name, size, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? "var(--ico)"}
      height={size ?? "var(--ico)"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "0 0 auto", display: "block", width: size ?? "var(--ico)", height: size ?? "var(--ico)" }}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** ไอคอนของรูปทรงกรอบ */
export function ShapeIcon({ shape, size, className }: { shape: Shape; size?: number | string; className?: string }) {
  return <Icon name={`shape-${shape}`} size={size} className={className} />;
}
