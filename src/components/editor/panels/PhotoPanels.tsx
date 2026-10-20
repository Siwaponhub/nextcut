"use client";

import { useRef } from "react";
import type { Frame, ImageFit } from "@/types";
import { MAX_ZOOM, SHAPE_LABEL } from "@/lib/constants";
import { dpiLevel, effectiveDpi } from "@/lib/geometry";
import { usePhotoImport } from "@/hooks/usePhotoImport";
import { useEditor } from "@/store/editorStore";
import { Button, IconButton } from "../../ui/Button";
import { Note } from "../../ui/Feedback";
import { Icon, ShapeIcon } from "../../ui/Icon";
import { Segmented } from "../../ui/Segmented";
import s from "../editor.module.css";

/** ขั้นที่ 2 ใส่รูป (ยังไม่ได้เลือกรูป): ปุ่มเลือกหลายรูปเติมช่องว่าง และวิธีใช้ */
export function PhotoHomePanel() {
  const pages = useEditor((st) => st.pages);
  const setStep = useEditor((st) => st.setStep);
  const { pickAndFill } = usePhotoImport();
  let total = 0;
  let empty = 0;
  for (const p of pages)
    for (const f of p.frames) {
      total++;
      if (!f.imageId) empty++;
    }

  if (!total)
    return (
      <>
        <div className={s.head}>
          <div className={s.headText}>
            <strong>ใส่รูป</strong>
            <small>ยังไม่มีช่องใส่รูป</small>
          </div>
        </div>
        <Note tone="warn">เลือกเทมเพลตหรือกำหนดขนาดในขั้นที่ 1 ก่อน</Note>
        <Button variant="primary" wide onClick={() => setStep("layout")}>
          ไปเลือกแบบ
        </Button>
      </>
    );

  return (
    <>
      <div className={s.head}>
        <div className={s.headText}>
          <strong>ใส่รูป</strong>
          <small>{empty ? `ว่าง ${empty} จาก ${total} ช่อง ใน ${pages.length} แผ่น` : `ใส่รูปครบ ${total} ช่องแล้ว`}</small>
        </div>
      </div>
      {empty ? (
        <Button variant="primary" wide icon="photos" onClick={pickAndFill}>
          เลือกหลายรูป เติม {empty} ช่องว่าง
        </Button>
      ) : (
        <>
          <Note tone="ok">ใส่รูปครบทุกช่องแล้ว</Note>
          <Button variant="primary" wide icon="share" onClick={() => setStep("export")}>
            ไปขั้นส่งออก
          </Button>
        </>
      )}
      <ul className={s.tips}>
        <li>
          <Icon name="photo-plus" />
          <span>แตะช่องว่างบนแผ่น เพื่อเลือกรูปใส่ทีละช่อง</span>
        </li>
        <li>
          <Icon name="move" />
          <span>แตะรูปแล้วลาก เพื่อเลื่อนส่วนที่ต้องการให้อยู่ในกรอบ</span>
        </li>
        <li>
          <Icon name="zoom" />
          <span>ถ่างสองนิ้ว หรือหมุนล้อเมาส์ เพื่อซูมรูป</span>
        </li>
      </ul>
    </>
  );
}

/** แจ้งความคมชัดของรูปเมื่อพิมพ์ (dpi) */
function DpiNote({ frame }: { frame: Frame }) {
  const image = useEditor((st) => (frame.imageId ? st.images[frame.imageId] : undefined));
  if (!image) return null;
  const dpi = effectiveDpi(frame, image);
  const level = dpiLevel(dpi);
  const text = { ok: "คมชัด", warn: "พอใช้", bad: "แตก ควรใช้รูปใหญ่ขึ้น" }[level];
  const cut = frame.shape === "circle" || frame.shape === "heart" ? ` · ส่วนนอก${SHAPE_LABEL[frame.shape]}จะถูกตัดทิ้ง` : "";
  return (
    <Note tone={level}>
      ความละเอียดจริง ~{dpi} dpi {text}
      {cut}
    </Note>
  );
}

/** ขั้นที่ 2 เมื่อเลือกรูปแล้ว: เต็มกรอบ/เห็นทั้งรูป ซูม จัดกึ่งกลาง เปลี่ยน/เอารูปออก */
export function PhotoAdjustPanel({ frame }: { frame: Frame }) {
  const editor = useEditor();
  const { pickIntoFrame } = usePhotoImport();
  const sliding = useRef(false);

  return (
    <>
      <div className={s.head}>
        <ShapeIcon shape={frame.shape} size={26} />
        <div className={s.headText}>
          <strong>รูปใน{SHAPE_LABEL[frame.shape]}</strong>
          <small>ลากบนแผ่นเพื่อเลื่อน · ถ่างนิ้วเพื่อซูม</small>
        </div>
        <IconButton icon="check" label="เสร็จ" onClick={() => editor.select(null)} />
      </div>
      <Segmented<ImageFit>
        label="การวางรูป"
        value={frame.fit}
        onChange={(fit) => editor.updateFrame(frame.id, { fit, zoom: 1, panX: 50, panY: 50 })}
        options={[
          { value: "cover", label: "เต็มกรอบ" },
          { value: "contain", label: "เห็นทั้งรูป" },
        ]}
      />
      <div className={s.inline} style={{ fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
        <Icon name="zoom" />
        <input
          className={s.slider}
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.05}
          value={frame.zoom}
          aria-label="ซูม"
          onPointerDown={() => {
            if (!sliding.current) editor.pushHistory();
            sliding.current = true;
            window.addEventListener("pointerup", () => (sliding.current = false), { once: true });
          }}
          onChange={(e) => editor.updateFrame(frame.id, { zoom: Number(e.target.value) }, false)}
        />
        <span style={{ width: 46, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(frame.zoom * 100)}%
        </span>
        <IconButton icon="focus" label="จัดรูปกึ่งกลาง" onClick={() => editor.updateFrame(frame.id, { panX: 50, panY: 50 })} />
      </div>
      <div className={s.row}>
        <Button size="sm" icon="photo" onClick={() => pickIntoFrame(frame.id)}>
          เปลี่ยนรูป
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon="photo-off"
          onClick={() => {
            editor.setFrameImage(frame.id, null);
            editor.select(null);
          }}
        >
          เอารูปออก
        </Button>
      </div>
      <DpiNote frame={frame} />
    </>
  );
}
