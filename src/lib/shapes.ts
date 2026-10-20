import type { FrameSpec, HeartParams, Shape } from "@/types";

/** ค่าหัวใจเริ่มต้น: ร่องลึก 14% ปลายแหลมปานกลาง */
export const DEFAULT_HEART: HeartParams = { notchDepth: 0.14, tipSharpness: 0.5 };
/** ร่องลึกได้สูงสุด 40% ของความสูง */
export const HEART_DEPTH_MAX = 0.4;

export const HEART_DEPTH_PRESETS = [
  { value: 0, label: "ไม่มีร่อง" },
  { value: 0.08, label: "ตื้น" },
  { value: 0.14, label: "ปกติ" },
  { value: 0.24, label: "ลึก" },
  { value: 0.34, label: "ลึกมาก" },
];

export const HEART_TIP_PRESETS = [
  { value: 0.15, label: "มน" },
  { value: 0.5, label: "ปกติ" },
  { value: 0.85, label: "แหลม" },
];

type Point = [number, number];
type Segment = [Point, Point, Point, Point];

/** ค่าหัวใจของกรอบ ถ้าไม่มีใช้ค่าเริ่มต้น และบีบให้อยู่ในช่วงที่ถูกต้อง */
export function heartOf(spec: Pick<FrameSpec, "heart">): HeartParams {
  const h = spec.heart ?? DEFAULT_HEART;
  return {
    notchDepth: Math.min(HEART_DEPTH_MAX, Math.max(0, h.notchDepth)),
    tipSharpness: Math.min(1, Math.max(0, h.tipSharpness)),
  };
}

/** ระยะของจุดควบคุมที่ปลายล่าง (x, y) ตามความแหลม: ยิ่งแหลม x ยิ่งแคบ y ยิ่งยาว */
function tipHandle(sharpness: number): Point {
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  return sharpness < 0.5
    ? [lerp(0.26, 0.18, sharpness * 2), lerp(0.09, 0.14, sharpness * 2)]
    : [lerp(0.18, 0.08, (sharpness - 0.5) * 2), lerp(0.14, 0.22, (sharpness - 0.5) * 2)];
}

/**
 * เส้นโค้งเบซิเยร์ 3 ช่วงของหัวใจซีกซ้าย เป็นพิกัดสัดส่วน 0–1 ของกรอบ
 * ปลายล่าง → จุดกว้างสุด → ยอดโค้ง → ร่องกลาง
 */
export function heartLeftSegments(params: HeartParams): Segment[] {
  const d = params.notchDepth;
  const [tx, ty] = tipHandle(params.tipSharpness);
  // ร่องยิ่งลึก จุดกว้างสุดยิ่งเลื่อนลง เพื่อให้โค้งด้านบนยังกลม
  const widestY = 0.3 + d * 0.15;
  return [
    [[0.5, 1], [0.5 - tx, 1 - ty], [0, widestY + 0.3], [0, widestY]],
    [[0, widestY], [0, widestY - 0.2], [0.14, 0], [0.29, 0]],
    [[0.29, 0], [0.4, 0], [0.47, d * 0.43], [0.5, d]],
  ];
}

/** เส้นโค้งครบ 6 ช่วง โดยสะท้อนซีกซ้ายเป็นซีกขวา */
export function heartSegments(params: HeartParams): Segment[] {
  const left = heartLeftSegments(params);
  const right = left
    .slice()
    .reverse()
    .map((seg) => seg.slice().reverse().map(([x, y]) => [1 - x, y] as Point) as Segment);
  return [...left, ...right];
}

/** path SVG ของหัวใจในกรอบกว้าง w สูง h */
function heartPath(w: number, h: number, params: HeartParams): string {
  const segs = heartSegments(params);
  const p = ([x, y]: Point) => `${(x * w).toFixed(3)} ${(y * h).toFixed(3)}`;
  return `M${p(segs[0][0])}` + segs.map((s) => `C${p(s[1])} ${p(s[2])} ${p(s[3])}`).join("") + "Z";
}

/** มุมของปลายล่างหัวใจ (องศา) */
export function heartTipAngle(w: number, h: number, params: HeartParams): number {
  const [tx, ty] = tipHandle(params.tipSharpness);
  return (2 * Math.atan2(tx * w, ty * h) * 180) / Math.PI;
}

/**
 * path SVG ของรูปทรงในกรอบ w×h โดยมุมซ้ายบนอยู่ที่ (0,0)
 * ใช้ฟังก์ชันเดียวกันทั้งบนจอ ภาพย่อ และตอนส่งออก รูปจึงตรงกันทุกที่
 */
export function shapePath(shape: Shape, w: number, h: number, heart?: HeartParams): string {
  if (shape === "circle") {
    const rx = w / 2;
    const ry = h / 2;
    return `M0 ${ry}A${rx} ${ry} 0 1 0 ${w} ${ry}A${rx} ${ry} 0 1 0 0 ${ry}Z`;
  }
  if (shape === "round") {
    const r = Math.round(Math.min(w, h) * 0.07 * 100) / 100;
    return (
      `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}` +
      `H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`
    );
  }
  if (shape === "heart") return heartPath(w, h, heartOf({ heart }));
  return `M0 0H${w}V${h}H0Z`;
}

/** วงกลมที่กว้างไม่เท่าสูงจะกลายเป็นวงรี */
export function isEllipse(spec: FrameSpec): boolean {
  return spec.shape === "circle" && Math.abs(spec.wMm - spec.hMm) >= 0.05;
}
