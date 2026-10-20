"use client";

import type { HeartParams, Unit } from "@/types";
import { HEART_DEPTH_MAX, HEART_DEPTH_PRESETS, HEART_TIP_PRESETS, heartTipAngle, shapePath } from "@/lib/shapes";
import { UNIT_LABEL, formatNumber } from "@/lib/units";
import { Chip, Segmented } from "../ui/Segmented";
import s from "../editor/editor.module.css";

interface HeartControlsProps {
  heart: HeartParams;
  wMm: number;
  hMm: number;
  unit: Unit;
  onChange: (heart: HeartParams) => void;
  /** เรียกครั้งแรกตอนเริ่มลากแถบ (ใช้บันทึกจุดย้อนกลับครั้งเดียวต่อการลาก) */
  onBeginAdjust?: () => void;
}

/**
 * ตัวปรับทรงหัวใจ: ความลึกร่องด้านบน 0–40% (แถบเลื่อน + ปุ่มลัด) และความแหลมของปลาย
 * มีภาพหัวใจตัวอย่างที่เปลี่ยนตามทันที
 */
export function HeartControls({ heart, wMm, hMm, unit, onChange, onBeginAdjust }: HeartControlsProps) {
  const depthPct = Math.round(heart.notchDepth * 100);
  const tipAngle = Math.round(heartTipAngle(wMm, hMm, heart));

  return (
    <div className={s.heartBox}>
      <div className={s.inline}>
        <svg className={s.heartPreview} viewBox={`0 0 ${wMm} ${hMm}`} aria-hidden="true">
          <path
            d={shapePath("heart", wMm, hMm, heart)}
            fill="var(--accent-bg)"
            stroke="var(--accent)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className={s.grow} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label className={s.inline} style={{ justifyContent: "space-between", fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
            <span>ความลึกร่องด้านบน</span>
            <span className={s.accentText}>
              {depthPct}% · {formatNumber(heart.notchDepth * hMm, unit)} {UNIT_LABEL[unit]}
            </span>
          </label>
          <input
            className={s.slider}
            type="range"
            min={0}
            max={HEART_DEPTH_MAX * 100}
            step={1}
            value={depthPct}
            aria-label="ความลึกร่องด้านบน"
            onPointerDown={onBeginAdjust}
            onKeyDown={onBeginAdjust}
            onChange={(e) => onChange({ ...heart, notchDepth: Number(e.target.value) / 100 })}
          />
          <span className={s.scale}>
            <span>ไม่มีร่อง</span>
            <span>ลึกมาก</span>
          </span>
        </div>
      </div>
      <div className={s.wrapRow}>
        {HEART_DEPTH_PRESETS.map((p) => (
          <Chip
            key={p.value}
            selected={Math.abs(heart.notchDepth - p.value) < 0.005}
            onClick={() => {
              onBeginAdjust?.();
              onChange({ ...heart, notchDepth: p.value });
            }}
          >
            {p.label}
          </Chip>
        ))}
      </div>
      <div className={s.inline}>
        <span className={s.grow} style={{ fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
          ปลายล่าง · มุม <span className={s.accentText}>{tipAngle}°</span>
        </span>
        <Segmented
          label="ความแหลมของปลาย"
          fit
          value={HEART_TIP_PRESETS.find((p) => Math.abs(p.value - heart.tipSharpness) < 0.05)?.value ?? -1}
          onChange={(v) => {
            onBeginAdjust?.();
            onChange({ ...heart, tipSharpness: v });
          }}
          options={HEART_TIP_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
        />
      </div>
    </div>
  );
}
