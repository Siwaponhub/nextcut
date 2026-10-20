"use client";

import { useState } from "react";
import type { Orientation, TemplateCategory, ThemeChoice } from "@/types";
import { BACKGROUNDS, TEMPLATE_CATEGORY_LABEL } from "@/lib/constants";
import { createId } from "@/lib/id";
import { useTheme } from "@/hooks/useTheme";
import { useCatalog } from "@/store/catalogStore";
import { useDialog } from "@/store/dialogStore";
import { selectCurrentPage, useEditor } from "@/store/editorStore";
import { layoutSettings, usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { TemplateThumb } from "../../shared/Thumbs";
import { Button } from "../../ui/Button";
import { Dialog, Toggle } from "../../ui/Feedback";
import { Icon } from "../../ui/Icon";
import { NumberField } from "../../ui/NumberField";
import { Chip, Segmented } from "../../ui/Segmented";
import s from "../editor.module.css";

/** ตั้งค่าแผ่น: แนวกระดาษ สีพื้นหลัง หน่วย ขอบ ระยะห่าง เส้นตัด ธีม และเครื่องมือของแผ่น */
export function SheetSettingsDialog() {
  const close = useDialog((d) => d.close);
  const open = useDialog((d) => d.open);
  const page = useEditor(selectCurrentPage);
  const pageIndex = useEditor((st) => st.pageIndex);
  const pageCount = useEditor((st) => st.pages.length);
  const editor = useEditor();
  const prefs = usePrefs();
  const { choice, setTheme } = useTheme();

  return (
    <Dialog title={`ตั้งค่าแผ่นที่ ${pageIndex + 1}`} subtitle="มีผลกับการวางกรอบและการพิมพ์" onClose={close}>
      <p className={s.sectionLabel}>แนวกระดาษ</p>
      <Segmented<Orientation>
        label="แนวกระดาษ"
        value={page.orientation}
        onChange={editor.setOrientation}
        options={[
          { value: "portrait", label: "แนวตั้ง", icon: <Icon name="portrait" /> },
          { value: "landscape", label: "แนวนอน", icon: <Icon name="landscape" /> },
        ]}
      />
      <p className={s.sectionLabel}>สีพื้นหลัง</p>
      <div className={s.wrapRow}>
        {BACKGROUNDS.map((b) => (
          <button
            key={b.color}
            type="button"
            className={s.swatch}
            aria-pressed={page.background === b.color}
            onClick={() => editor.setBackground(b.color)}
          >
            <span style={{ background: b.color }} />
            {b.label}
          </button>
        ))}
      </div>
      <div className={s.inline}>
        <span className={s.grow} style={{ fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
          หน่วยที่แสดง
        </span>
        <Segmented
          label="หน่วย"
          fit
          value={prefs.unit}
          onChange={prefs.setUnit}
          options={[
            { value: "cm", label: "ซม." },
            { value: "in", label: "นิ้ว" },
          ]}
        />
      </div>
      <div className={s.fields}>
        <NumberField label="ขอบ" unit={prefs.unit} valueMm={prefs.marginMm} minMm={0} maxMm={15} onChange={prefs.setMargin} />
        <NumberField label="ระยะห่าง" unit={prefs.unit} valueMm={prefs.gapMm} minMm={0} maxMm={10} onChange={prefs.setGap} />
      </div>
      <Toggle label="เส้นตัดตอนพิมพ์" checked={prefs.cutLines} onChange={prefs.setCutLines} />
      <p className={s.sectionLabel}>ธีมแอป</p>
      <Segmented<ThemeChoice>
        label="ธีม"
        value={choice}
        onChange={setTheme}
        options={[
          { value: "light", label: "สว่าง" },
          { value: "dark", label: "มืด" },
          { value: "system", label: "ตามระบบ" },
        ]}
      />
      <div className={s.grid3}>
        <Button
          icon="grid"
          onClick={() => {
            if (!page.frames.length) return toast("แผ่นนี้ยังไม่มีกรอบ");
            const added = editor.arrange(layoutSettings());
            close();
            toast(added ? `จัดเรียงแล้ว · ย้ายกรอบที่ไม่พอไปแผ่นใหม่ ${added} แผ่น` : "จัดเรียงแล้ว");
          }}
        >
          จัดเรียงอัตโนมัติ
        </Button>
        <Button
          icon="template"
          onClick={() => (page.frames.length ? open({ kind: "saveTemplate" }) : toast("แผ่นนี้ยังไม่มีกรอบ"))}
        >
          บันทึกเป็นเทมเพลต
        </Button>
        <Button icon="trash" variant="danger" disabled={pageCount < 2} onClick={() => open({ kind: "deletePage" })}>
          ลบแผ่นนี้
        </Button>
      </div>
    </Dialog>
  );
}

/** ถามว่าจะใช้เทมเพลตแทนที่แผ่นนี้ หรือเพิ่มเป็นแผ่นใหม่ */
export function ApplyTemplateDialog({ templateId }: { templateId: string }) {
  const close = useDialog((d) => d.close);
  const templates = useCatalog((c) => c.templates);
  const page = useEditor(selectCurrentPage);
  const pageIndex = useEditor((st) => st.pageIndex);
  const applyTemplate = useEditor((st) => st.applyTemplate);
  const t = templates.find((x) => x.id === templateId);
  if (!t) return null;

  /** ใช้เทมเพลตแล้วปิดหน้าต่าง */
  const apply = (mode: "replace" | "new") => {
    applyTemplate(t, mode);
    close();
    toast(`ใช้เทมเพลต "${t.name}" · ขั้นต่อไป ใส่รูป`);
  };

  return (
    <Dialog
      title={`ใช้เทมเพลต "${t.name}"`}
      subtitle={`${t.slots.length} กรอบ · ${t.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}`}
      onClose={close}
    >
      <div className={s.tplPreview}>
        <TemplateThumb template={t} className={s.thumb} />
      </div>
      <p className={s.text}>
        แผ่นที่ {pageIndex + 1} มีกรอบอยู่แล้ว {page.frames.length} กรอบ จะเพิ่มเป็นแผ่นใหม่ หรือแทนที่แผ่นนี้
      </p>
      <div className={s.row}>
        <Button icon="page-plus" onClick={() => apply("new")}>
          เพิ่มเป็นแผ่นใหม่
        </Button>
        <Button variant="primary" onClick={() => apply("replace")}>
          แทนที่แผ่นนี้
        </Button>
      </div>
    </Dialog>
  );
}

/** บันทึกแผ่นปัจจุบันเป็นเทมเพลตลง Firestore ให้ทุกเครื่องเห็น */
export function SaveTemplateDialog() {
  const close = useDialog((d) => d.close);
  const page = useEditor(selectCurrentPage);
  const { saveTemplate, templates } = useCatalog();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("gift");
  const [error, setError] = useState("");

  /** ตรวจชื่อแล้วบันทึก */
  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("ตั้งชื่อเทมเพลตก่อน");
    if (trimmed.length > 40) return setError("ชื่อยาวเกิน 40 ตัวอักษร");
    try {
      await saveTemplate({
        id: createId("t_"),
        name: trimmed,
        category,
        orientation: page.orientation,
        background: page.background,
        slots: page.frames.map((f) => ({ shape: f.shape, wMm: f.wMm, hMm: f.hMm, heart: f.heart, xMm: f.xMm, yMm: f.yMm })),
        order: templates.length + 1,
        active: true,
      });
      close();
      toast("บันทึกแล้ว ทุกเครื่องจะเห็นเทมเพลตนี้");
    } catch {
      setError("บันทึกไม่สำเร็จ ตรวจการเชื่อม Firebase แล้วลองใหม่");
    }
  };

  return (
    <Dialog
      title="บันทึกเป็นเทมเพลต"
      subtitle={`${page.frames.length} กรอบ · เก็บตำแหน่งกรอบ ไม่เก็บรูป`}
      onClose={close}
    >
      <label className={s.sectionLabel} htmlFor="tpl-name">
        ชื่อเทมเพลต
      </label>
      <input
        id="tpl-name"
        className={s.textInput}
        placeholder="รูปติดบัตรผสม"
        value={name}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setName(e.target.value);
          setError("");
        }}
      />
      {error && <p style={{ margin: 0, color: "var(--danger)", fontSize: "var(--fs-s)" }}>{error}</p>}
      <p className={s.sectionLabel}>หมวด</p>
      <div className={s.wrapRow}>
        {(Object.keys(TEMPLATE_CATEGORY_LABEL) as TemplateCategory[]).map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
            {TEMPLATE_CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>
      <div className={s.row}>
        <Button onClick={close}>ยกเลิก</Button>
        <Button variant="primary" onClick={save}>
          บันทึก
        </Button>
      </div>
    </Dialog>
  );
}

/** ยืนยันการลบแผ่น (กดย้อนกลับได้) */
export function DeletePageDialog() {
  const close = useDialog((d) => d.close);
  const pageIndex = useEditor((st) => st.pageIndex);
  const frames = useEditor((st) => selectCurrentPage(st).frames.length);
  const deletePage = useEditor((st) => st.deletePage);
  return (
    <Dialog title={`ลบแผ่นที่ ${pageIndex + 1}?`} subtitle={`${frames} กรอบในแผ่นนี้จะหายไป กดย้อนกลับได้`} onClose={close}>
      <div className={s.row}>
        <Button onClick={close}>ยกเลิก</Button>
        <Button
          variant="danger"
          onClick={() => {
            deletePage();
            close();
            toast("ลบแผ่นแล้ว");
          }}
        >
          ลบแผ่น
        </Button>
      </div>
    </Dialog>
  );
}
