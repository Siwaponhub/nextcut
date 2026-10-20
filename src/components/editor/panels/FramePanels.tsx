"use client";

import { useRef } from "react";
import type { Frame, Shape } from "@/types";
import { MIN_FRAME_MM, SHAPE_LABEL, sheetSize } from "@/lib/constants";
import { DEFAULT_HEART, heartOf, isEllipse } from "@/lib/shapes";
import { formatSize, formatSizeConverted } from "@/lib/units";
import { usePhotoImport } from "@/hooks/usePhotoImport";
import { useCatalog } from "@/store/catalogStore";
import { selectCurrentPage, useEditor } from "@/store/editorStore";
import { layoutSettings, usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { HeartControls } from "../../shared/HeartControls";
import { IconButton } from "../../ui/Button";
import { Note } from "../../ui/Feedback";
import { Icon, ShapeIcon, type IconName } from "../../ui/Icon";
import { NumberField } from "../../ui/NumberField";
import { Segmented } from "../../ui/Segmented";
import s from "../editor.module.css";

/** ชื่อกรอบ: ใช้ชื่อขนาดสำเร็จรูปที่ตรงกัน ไม่มีก็บอกว่ากำหนดเอง */
function useFrameName(frame: Frame): string {
  const presets = useCatalog((c) => c.presets);
  const same = (a: number, b: number) => Math.abs(a - b) < 0.05;
  const match = presets.find(
    (p) =>
      p.shape === frame.shape &&
      ((same(p.wMm, frame.wMm) && same(p.hMm, frame.hMm)) || (same(p.wMm, frame.hMm) && same(p.hMm, frame.wMm))) &&
      (frame.shape !== "heart" || Math.abs(heartOf(p).notchDepth - heartOf(frame).notchDepth) < 0.01),
  );
  return match?.name ?? `${SHAPE_LABEL[frame.shape]} กำหนดเอง`;
}

/** ปุ่มเครื่องมือหนึ่งปุ่มในตาราง */
function Action({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={danger ? s.danger : undefined}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

/** เมนูของกรอบที่เลือกในขั้นเลือกแบบ: แก้ขนาด หมุน ใส่รูป ทำซ้ำ ลบ */
export function FrameActionsPanel({ frame }: { frame: Frame }) {
  const unit = usePrefs((p) => p.unit);
  const name = useFrameName(frame);
  const editor = useEditor();
  const { pickIntoFrame } = usePhotoImport();

  return (
    <>
      <div className={s.head}>
        <ShapeIcon shape={frame.shape} size={26} />
        <div className={s.headText}>
          <strong>
            {name} · {formatSize(frame.wMm, frame.hMm, unit)}
          </strong>
          <small className={s.accent}>{formatSizeConverted(frame.wMm, frame.hMm, unit)}</small>
        </div>
        <IconButton icon="x" label="ยกเลิกการเลือก" onClick={() => editor.select(null)} />
      </div>
      <div className={s.actions}>
        <Action icon="ruler" label="ขนาด/รูปทรง" onClick={() => editor.setFramePanel("size")} />
        <Action
          icon="rotate"
          label="หมุน 90°"
          onClick={() => editor.updateFrame(frame.id, { wMm: frame.hMm, hMm: frame.wMm })}
        />
        <Action
          icon={frame.imageId ? "photo" : "photo-plus"}
          label={frame.imageId ? "เปลี่ยนรูป" : "ใส่รูป"}
          onClick={() => {
            editor.setStep("photo");
            editor.select(frame.id);
            pickIntoFrame(frame.id);
          }}
        />
        <Action
          icon="copy"
          label="ทำซ้ำ"
          onClick={() => !editor.duplicateFrame(frame.id, layoutSettings()) && toast("ไม่มีที่ว่างพอในแผ่นนี้")}
        />
        <Action
          icon="copy-plus"
          label="ซ้ำจนเต็ม"
          onClick={() => {
            const n = editor.fillWithDuplicates(frame.id, layoutSettings());
            toast(n ? `เพิ่ม ${n} กรอบ` : "ไม่มีที่ว่างพอในแผ่นนี้");
          }}
        />
        <Action icon="trash" label="ลบ" danger onClick={() => editor.deleteFrame(frame.id)} />
      </div>
    </>
  );
}

/** หน้าปรับขนาด ตำแหน่ง และรูปทรงของกรอบ (รวมทรงหัวใจ) */
export function SizeShapePanel({ frame }: { frame: Frame }) {
  const { unit, setUnit } = usePrefs();
  const page = useEditor(selectCurrentPage);
  const editor = useEditor();
  const sheet = sheetSize(page.orientation);
  const adjusting = useRef(false);

  /** แก้ค่ากรอบหนึ่งครั้ง (บันทึกจุดย้อนกลับด้วย) */
  const patch = (p: Partial<Frame>) => editor.updateFrame(frame.id, p);

  return (
    <>
      <div className={s.head}>
        <IconButton icon="chev-l" label="กลับ" onClick={() => editor.setFramePanel("main")} />
        <div className={s.headText}>
          <strong>ขนาดและรูปทรง</strong>
        </div>
        <Segmented
          label="หน่วย"
          fit
          value={unit}
          onChange={setUnit}
          options={[
            { value: "cm", label: "ซม." },
            { value: "in", label: "นิ้ว" },
          ]}
        />
      </div>
      <Segmented<Shape>
        label="รูปทรง"
        tall
        value={frame.shape}
        onChange={(shape) => patch({ shape, heart: shape === "heart" ? (frame.heart ?? DEFAULT_HEART) : frame.heart })}
        options={(Object.keys(SHAPE_LABEL) as Shape[]).map((k) => ({
          value: k,
          label: SHAPE_LABEL[k],
          icon: <ShapeIcon shape={k} />,
        }))}
      />
      {frame.shape === "heart" && (
        <HeartControls
          heart={heartOf(frame)}
          wMm={frame.wMm}
          hMm={frame.hMm}
          unit={unit}
          onBeginAdjust={() => {
            // ลากแถบหนึ่งครั้งให้ย้อนกลับได้ในขั้นเดียว
            if (!adjusting.current) editor.pushHistory();
            adjusting.current = true;
            window.addEventListener("pointerup", () => (adjusting.current = false), { once: true });
          }}
          onChange={(heart) => editor.updateFrame(frame.id, { heart }, false)}
        />
      )}
      {isEllipse(frame) && (
        <Note tone="warn" action={{ label: "ทำเป็นวงกลม", onClick: () => patch({ hMm: frame.wMm }) }}>
          ตอนนี้เป็นวงรี {formatSize(frame.wMm, frame.hMm, unit)}
        </Note>
      )}
      <div className={[s.fields, s.fields4].join(" ")}>
        <NumberField label="กว้าง" unit={unit} valueMm={frame.wMm} minMm={MIN_FRAME_MM} maxMm={sheet.w} onChange={(wMm) => patch({ wMm })} />
        <NumberField label="สูง" unit={unit} valueMm={frame.hMm} minMm={MIN_FRAME_MM} maxMm={sheet.h} onChange={(hMm) => patch({ hMm })} />
        <NumberField
          label="X"
          unit={unit}
          valueMm={frame.xMm}
          minMm={0}
          maxMm={Math.max(0, sheet.w - frame.wMm)}
          onChange={(xMm) => patch({ xMm })}
        />
        <NumberField
          label="Y"
          unit={unit}
          valueMm={frame.yMm}
          minMm={0}
          maxMm={Math.max(0, sheet.h - frame.hMm)}
          onChange={(yMm) => patch({ yMm })}
        />
      </div>
    </>
  );
}
