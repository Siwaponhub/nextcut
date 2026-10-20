"use client";

import { memo, useId, useLayoutEffect, useRef } from "react";
import type { Frame, ImageInfo, Page, Step, Unit } from "@/types";
import { sheetSize } from "@/lib/constants";
import { imageGeometry, isFrameInvalid } from "@/lib/geometry";
import { shapePath } from "@/lib/shapes";
import { formatNumber } from "@/lib/units";
import { useSheetGestures } from "@/hooks/useSheetGestures";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import s from "./sheet.module.css";

interface FrameViewProps {
  frame: Frame;
  scale: number;
  image: ImageInfo | undefined;
  selected: boolean;
  invalid: boolean;
  step: Step;
  unit: Unit;
}

/** กรอบหนึ่งกรอบ: รูปตัดตามรูปทรง (clipPath) + เส้นขอบ + ป้ายขนาดเมื่อยังว่าง */
const FrameView = memo(function FrameView({ frame, scale, image, selected, invalid, step, unit }: FrameViewProps) {
  const clipId = useId();
  const path = shapePath(frame.shape, frame.wMm, frame.hMm, frame.heart);
  const geo = image ? imageGeometry(frame, image) : null;
  const cls = [s.frame, image && s.hasImage, selected && s.selected, invalid && s.invalid].filter(Boolean).join(" ");

  return (
    <div
      className={cls}
      data-frame-id={frame.id}
      style={{ left: frame.xMm * scale, top: frame.yMm * scale, width: frame.wMm * scale, height: frame.hMm * scale }}
    >
      <svg viewBox={`0 0 ${frame.wMm} ${frame.hMm}`} preserveAspectRatio="none" aria-hidden="true">
        {image && geo ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <path d={path} />
              </clipPath>
            </defs>
            <image
              href={image.url}
              x={geo.left}
              y={geo.top}
              width={geo.w}
              height={geo.h}
              preserveAspectRatio="none"
              clipPath={`url(#${clipId})`}
            />
          </>
        ) : (
          <path className={s.fill} d={path} />
        )}
        <path className={s.outline} d={path} />
      </svg>
      {!image && step !== "export" && (
        <span className={s.label}>
          {step === "photo" && <Icon name="photo-plus" />}
          <span>
            {formatNumber(frame.wMm, unit)}×{formatNumber(frame.hMm, unit)}
            {unit === "in" ? "″" : ""}
          </span>
        </span>
      )}
    </div>
  );
});

interface SheetCanvasProps {
  page: Page;
  /** px ต่อ 1 mm */
  scale: number;
  step: Step;
  selectedId: string | null;
  images: Record<string, ImageInfo>;
  unit: Unit;
  marginMm: number;
  cutLines: boolean;
  onPickPhoto: (frameId: string) => void;
  onDropFiles: (frameId: string, files: File[]) => void;
  onGoToLayout: () => void;
}

/**
 * กระดาษหนึ่งแผ่นที่แสดงบนจอ (ขนาดจริงเป็น mm คูณ scale)
 * ขั้นใส่รูปจะแสดงรูปเต็มแบบจางรอบกรอบที่เลือก ให้เห็นส่วนที่จะถูกตัด
 */
export function SheetCanvas(props: SheetCanvasProps) {
  const { page, scale, step, selectedId, images, unit, marginMm, cutLines, onPickPhoto, onDropFiles, onGoToLayout } = props;
  const sheetRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  useLayoutEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useSheetGestures(sheetRef, scaleRef, onPickPhoto, onDropFiles);

  const { w, h } = sheetSize(page.orientation);
  const locked = step === "export";
  const selected = page.frames.find((f) => f.id === selectedId);
  const ghostImage = step === "photo" && selected?.imageId ? images[selected.imageId] : undefined;
  const ghost = selected && ghostImage ? imageGeometry(selected, ghostImage) : null;
  const cls = [s.sheet, step === "photo" && s.photo, locked && s.locked, cutLines && s.cut].filter(Boolean).join(" ");

  return (
    <div ref={sheetRef} className={cls} style={{ width: w * scale, height: h * scale, background: page.background }}>
      {!locked && (
        <div
          className={s.safe}
          style={{
            left: marginMm * scale,
            top: marginMm * scale,
            width: (w - 2 * marginMm) * scale,
            height: (h - 2 * marginMm) * scale,
          }}
        />
      )}
      {page.frames.map((f) => (
        <FrameView
          key={f.id}
          frame={f}
          scale={scale}
          image={f.imageId ? images[f.imageId] : undefined}
          selected={!locked && f.id === selectedId}
          invalid={!locked && isFrameInvalid(f, page)}
          step={step}
          unit={unit}
        />
      ))}
      {selected && ghostImage && ghost && (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจาก blob ในเครื่อง ไม่ต้องผ่าน next/image
        <img
          className={s.ghost}
          src={ghostImage.url}
          alt=""
          style={{
            left: (selected.xMm + ghost.left) * scale,
            top: (selected.yMm + ghost.top) * scale,
            width: ghost.w * scale,
            height: ghost.h * scale,
          }}
        />
      )}
      {!page.frames.length && (
        <div className={s.emptyPage}>
          <p>แผ่นนี้ยังว่าง</p>
          {step === "layout" ? (
            <p>เลือกเทมเพลตหรือกำหนดขนาดในแผงเครื่องมือ</p>
          ) : (
            <Button size="sm" variant="primary" onClick={onGoToLayout}>
              ไปเลือกแบบ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
