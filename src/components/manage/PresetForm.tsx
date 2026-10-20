"use client";

import { useState } from "react";
import type { HeartParams, Preset, PresetCategory, Shape, Unit } from "@/types";
import { MIN_FRAME_MM, PRESET_CATEGORY_LABEL, SHAPE_LABEL } from "@/lib/constants";
import { presetToDoc } from "@/lib/catalog/mapping";
import { createId } from "@/lib/id";
import { DEFAULT_HEART, heartOf, isEllipse } from "@/lib/shapes";
import { formatSize } from "@/lib/units";
import { useCatalog } from "@/store/catalogStore";
import { usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { HeartControls } from "../shared/HeartControls";
import { SheetFitPreview } from "../shared/Thumbs";
import { Button, IconButton } from "../ui/Button";
import { Dialog, Note, Toggle } from "../ui/Feedback";
import { Icon, ShapeIcon } from "../ui/Icon";
import { NumberField } from "../ui/NumberField";
import { Chip, Segmented } from "../ui/Segmented";
import s from "./manage.module.css";

/** ข้อมูลในฟอร์ม (ยังไม่บันทึก) */
interface Draft {
  name: string;
  category: PresetCategory;
  inputUnit: Unit;
  shape: Shape;
  wMm: number;
  hMm: number;
  heart: HeartParams;
  active: boolean;
}

/** สร้างข้อมูลตั้งต้นของฟอร์มจากขนาดที่เลือก (ไม่มี = ขนาดใหม่) */
function initialDraft(p: Preset | null): Draft {
  if (!p) return { name: "", category: "general", inputUnit: "cm", shape: "rect", wMm: 40, hMm: 50, heart: DEFAULT_HEART, active: true };
  return { name: p.name, category: p.category, inputUnit: p.inputUnit, shape: p.shape, wMm: p.wMm, hMm: p.hMm, heart: heartOf(p), active: p.active };
}

/** ข้อมูลเอกสาร Firestore ที่จะบันทึก (กดเปิดดูได้) */
export function JsonPreview({ path, data }: { path: string; data: unknown }) {
  return (
    <details className={s.json}>
      <summary>
        <Icon name="cloud" size={18} />
        <span>
          ข้อมูลที่เก็บ · <code>{path}</code>
        </span>
      </summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

interface PresetFormProps {
  /** ขนาดที่แก้ไข (null = เพิ่มใหม่) */
  preset: Preset | null;
  /** แสดงหัวฟอร์มพร้อมปุ่มบันทึก (จอกว้าง) */
  showHeader: boolean;
  onSaved: (id: string) => void;
  onDeleted: () => void;
  onCancel: () => void;
}

/**
 * ฟอร์มเพิ่ม/แก้ไขขนาดกรอบ
 * กำหนดขนาดเป็น ซม. หรือ นิ้ว ก็ได้ ค่าที่เก็บยังเป็น mm
 */
export function PresetForm({ preset, showHeader, onSaved, onDeleted, onCancel }: PresetFormProps) {
  const presets = useCatalog((c) => c.presets);
  const savePreset = useCatalog((c) => c.savePreset);
  const deletePreset = useCatalog((c) => c.deletePreset);
  const { marginMm, gapMm } = usePrefs();
  const [draft, setDraft] = useState<Draft>(() => initialDraft(preset));
  const [isCopy, setIsCopy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [nameError, setNameError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editingId = isCopy ? null : (preset?.id ?? null);

  /** แก้ข้อมูลในฟอร์ม */
  const update = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  /** ประกอบเป็น Preset ที่จะบันทึก */
  const toPreset = (id: string): Preset => ({
    id,
    name: draft.name.trim(),
    category: draft.category,
    inputUnit: draft.inputUnit,
    shape: draft.shape,
    wMm: draft.wMm,
    hMm: draft.hMm,
    heart: draft.shape === "heart" ? draft.heart : undefined,
    active: draft.active,
    order: (editingId && preset?.order) || presets.length + 1,
  });

  /** ตรวจข้อมูลแล้วบันทึก */
  const save = async () => {
    const name = draft.name.trim();
    if (!name) return setNameError("ใส่ชื่อขนาดก่อน");
    if (name.length > 40) return setNameError("ชื่อยาวเกิน 40 ตัวอักษร");
    const id = editingId ?? createId("p_");
    try {
      await savePreset(toPreset(id));
      setDirty(false);
      toast("บันทึกแล้ว หน้าจัดวางทุกเครื่องเห็นทันที");
      onSaved(id);
    } catch {
      toast("บันทึกไม่สำเร็จ ตรวจการเชื่อม Firebase แล้วลองใหม่");
    }
  };

  /** ซ่อนแทนการลบ */
  const hide = async () => {
    if (!preset) return;
    await savePreset({ ...preset, active: false });
    setConfirmDelete(false);
    toast("ซ่อนแล้ว");
    onSaved(preset.id);
  };

  /** ลบจริง */
  const remove = async () => {
    if (!preset) return;
    await deletePreset(preset.id);
    setConfirmDelete(false);
    toast("ลบแล้ว");
    onDeleted();
  };

  const same = (a: number, b: number) => Math.abs(a - b) < 0.05;
  const duplicate = presets.find(
    (p) =>
      p.id !== editingId &&
      p.shape === draft.shape &&
      ((same(p.wMm, draft.wMm) && same(p.hMm, draft.hMm)) || (same(p.wMm, draft.hMm) && same(p.hMm, draft.wMm))) &&
      (draft.shape !== "heart" || Math.abs(heartOf(p).notchDepth - draft.heart.notchDepth) < 0.01),
  );
  const spec = { shape: draft.shape, wMm: draft.wMm, hMm: draft.hMm, heart: draft.heart };

  return (
    <>
      {showHeader && (
        <div className={s.head}>
          <strong>{editingId ? "แก้ไขขนาด" : "เพิ่มขนาดใหม่"}</strong>
          <Button size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button size="sm" variant="primary" onClick={save}>
            บันทึก
          </Button>
        </div>
      )}
      {dirty && <p className={s.warn}>• มีการแก้ไขที่ยังไม่บันทึก</p>}

      <div className={s.group}>
        <label className={s.label} htmlFor="preset-name">
          <span>ชื่อ</span>
          <span>{draft.name.length}/40</span>
        </label>
        <input
          id="preset-name"
          className={s.input}
          placeholder="รูปโปรไฟล์"
          value={draft.name}
          aria-invalid={nameError ? true : undefined}
          onChange={(e) => {
            update({ name: e.target.value });
            setNameError("");
          }}
        />
        {nameError && <p className={s.error}>{nameError}</p>}
      </div>

      <div className={s.group}>
        <p className={s.label}>รูปทรง</p>
        <Segmented<Shape>
          label="รูปทรง"
          tall
          value={draft.shape}
          onChange={(shape) => update({ shape })}
          options={(Object.keys(SHAPE_LABEL) as Shape[]).map((k) => ({ value: k, label: SHAPE_LABEL[k], icon: <ShapeIcon shape={k} /> }))}
        />
        {isEllipse(draft) && (
          <Note tone="warn" action={{ label: "ทำเป็นวงกลม", onClick: () => update({ hMm: draft.wMm }) }}>
            ตอนนี้เป็นวงรี {formatSize(draft.wMm, draft.hMm, draft.inputUnit)}
          </Note>
        )}
      </div>

      {draft.shape === "heart" && (
        <HeartControls heart={draft.heart} wMm={draft.wMm} hMm={draft.hMm} unit={draft.inputUnit} onChange={(heart) => update({ heart })} />
      )}

      <div className={s.group}>
        <p className={s.label}>หมวด</p>
        <div className={s.wrap}>
          {(Object.keys(PRESET_CATEGORY_LABEL) as PresetCategory[]).map((c) => (
            <Chip key={c} selected={draft.category === c} onClick={() => update({ category: c })}>
              {PRESET_CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      </div>

      <div className={s.inline}>
        <span className={s.grow} style={{ fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
          กำหนดขนาดเป็น
        </span>
        <Segmented<Unit>
          label="หน่วยที่ใช้กำหนดขนาด"
          fit
          value={draft.inputUnit}
          onChange={(inputUnit) => update({ inputUnit })}
          options={[
            { value: "cm", label: "ซม." },
            { value: "in", label: "นิ้ว" },
          ]}
        />
        <IconButton icon="swap" label="สลับกว้างกับสูง" onClick={() => update({ wMm: draft.hMm, hMm: draft.wMm })} />
      </div>
      <div className={s.fields}>
        <NumberField label="กว้าง" unit={draft.inputUnit} valueMm={draft.wMm} minMm={MIN_FRAME_MM} maxMm={150} onChange={(wMm) => update({ wMm })} />
        <NumberField label="สูง" unit={draft.inputUnit} valueMm={draft.hMm} minMm={MIN_FRAME_MM} maxMm={150} onChange={(hMm) => update({ hMm })} />
      </div>
      {duplicate && (
        <p className={s.warn}>
          <Icon name="alert" size={18} />
          ขนาดและรูปทรงนี้ซ้ำกับ &quot;{duplicate.name}&quot;
        </p>
      )}
      <SheetFitPreview spec={spec} marginMm={marginMm} gapMm={gapMm} />
      <Toggle label="แสดงในหน้าจัดวาง" checked={draft.active} onChange={(active) => update({ active })} />
      <p className={s.meta}>
        {editingId && preset
          ? `ลำดับที่ ${preset.order}${preset.updatedAt ? ` · แก้ไขล่าสุด ${new Date(preset.updatedAt).toLocaleString("th-TH")}` : ""}`
          : "ขนาดใหม่จะต่อท้ายรายการ จัดลำดับทีหลังได้"}
      </p>
      {!showHeader && (
        <Button variant="primary" wide onClick={save}>
          บันทึก
        </Button>
      )}
      {editingId && (
        <div className={s.row2}>
          <Button
            icon="copy"
            onClick={() => {
              setIsCopy(true);
              update({ name: `${draft.name} (สำเนา)`.slice(0, 40) });
            }}
          >
            ทำสำเนา
          </Button>
          <Button icon="trash" variant="danger" onClick={() => setConfirmDelete(true)}>
            ลบ
          </Button>
        </div>
      )}
      <JsonPreview path={`presets/${editingId ?? "(id ใหม่)"}`} data={presetToDoc(toPreset(editingId ?? "new"))} />

      {confirmDelete && preset && (
        <Dialog title={`ลบ "${preset.name}"?`} onClose={() => setConfirmDelete(false)}>
          <p style={{ margin: 0, fontSize: "var(--fs-s)", color: "var(--fg-2)", lineHeight: 1.55 }}>
            ขนาดนี้จะหายจากทุกเครื่อง แต่กรอบที่วางบนแผ่นอยู่แล้วไม่หาย เพราะแต่ละกรอบเก็บขนาดของตัวเอง ถ้าแค่ไม่อยากให้เลือกได้ ใช้ &quot;ซ่อนแทน&quot;
          </p>
          <div className={s.row2}>
            <Button onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
            <Button onClick={hide}>ซ่อนแทน</Button>
            <Button variant="danger" onClick={remove}>
              ลบ
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
