import type { FrameSpec, Template } from "@/types";
import { sheetSize } from "@/lib/constants";
import { gridCapacity } from "@/lib/layout";
import { shapePath } from "@/lib/shapes";

/** ภาพย่อของเทมเพลต: แผ่นกระดาษพร้อมกรอบทุกช่อง */
export function TemplateThumb({ template, className }: { template: Template; className?: string }) {
  const { w, h } = sheetSize(template.orientation);
  return (
    <svg className={className} viewBox={`-1 -1 ${w + 2} ${h + 2}`} aria-hidden="true">
      <rect width={w} height={h} fill={template.background} stroke="var(--line-strong)" strokeWidth={1} />
      <g fill="var(--paper-ph)" stroke="var(--paper-sel)" strokeWidth={1}>
        {template.slots.map((slot, i) => (
          <path key={i} transform={`translate(${slot.xMm} ${slot.yMm})`} d={shapePath(slot.shape, slot.wMm, slot.hMm, slot.heart)} />
        ))}
      </g>
    </svg>
  );
}

/** รูปทรงของกรอบตามสัดส่วนจริง (ใช้ในรายการขนาด) */
export function ShapeThumb({ spec, size = 36 }: { spec: FrameSpec; size?: number }) {
  const max = Math.max(spec.wMm, spec.hMm);
  return (
    <svg
      viewBox={`0 0 ${spec.wMm} ${spec.hMm}`}
      width={(spec.wMm / max) * size}
      height={(spec.hMm / max) * size}
      style={{ overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      <path
        d={shapePath(spec.shape, spec.wMm, spec.hMm, spec.heart)}
        fill="var(--accent-bg)"
        stroke="var(--accent)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** แผ่นตัวอย่างบอกว่ากรอบขนาดนี้วางได้กี่ชิ้นต่อแผ่น */
export function SheetFitPreview({
  spec,
  marginMm,
  gapMm,
  scale = 1.2,
}: {
  spec: FrameSpec;
  marginMm: number;
  gapMm: number;
  scale?: number;
}) {
  const settings = { marginMm, gapMm };
  const grid = gridCapacity(spec.wMm, spec.hMm, "portrait", settings);
  const rotated = gridCapacity(spec.hMm, spec.wMm, "portrait", settings);
  const ox = (100 - (grid.cols * spec.wMm + (grid.cols - 1) * gapMm)) / 2;
  const oy = (150 - (grid.rows * spec.hMm + (grid.rows - 1) * gapMm)) / 2;
  const cells = [];
  for (let r = 0; r < grid.rows; r++)
    for (let c = 0; c < grid.cols; c++)
      cells.push(
        <path
          key={`${r}-${c}`}
          transform={`translate(${ox + c * (spec.wMm + gapMm)} ${oy + r * (spec.hMm + gapMm)})`}
          d={shapePath(spec.shape, spec.wMm, spec.hMm, spec.heart)}
        />,
      );

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)", borderRadius: 12, padding: 12 }}>
      <svg viewBox="-1 -1 102 152" width={102 * scale} height={152 * scale} style={{ flex: "0 0 auto" }} aria-hidden="true">
        <rect width={100} height={150} fill="#FFFFFF" stroke="var(--line-strong)" strokeWidth={1} />
        <g fill="var(--paper-ph)" stroke="var(--paper-sel)" strokeWidth={0.8}>
          {cells}
        </g>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "var(--fs-s)", color: "var(--fg-2)", lineHeight: 1.45 }}>
        {grid.count ? (
          <>
            <strong style={{ fontSize: "calc(var(--fs) + 9px)", color: "var(--fg)", fontWeight: 600 }}>{grid.count} ชิ้น</strong>
            <span>ต่อแผ่น 10×15 ซม.</span>
            <span>
              {grid.cols} คอลัมน์ × {grid.rows} แถว
            </span>
            {rotated.count > grid.count && <span style={{ color: "var(--accent)" }}>ถ้าหมุนกรอบ 90° จะได้ {rotated.count} ชิ้น</span>}
          </>
        ) : (
          <>
            <strong style={{ fontSize: "calc(var(--fs) + 9px)", color: "var(--danger)", fontWeight: 600 }}>วางไม่ได้</strong>
            <span>{rotated.count ? `ต้องหมุนกรอบ 90° จึงจะได้ ${rotated.count} ชิ้น` : "ใหญ่เกินกระดาษ 10×15 ซม."}</span>
          </>
        )}
      </div>
    </div>
  );
}
