"use client";

import { useMemo, useState } from "react";
import type { TemplateCategory } from "@/types";
import { TEMPLATE_CATEGORY_LABEL, sheetSize } from "@/lib/constants";
import { expandBasket, generateFrames, gridCapacity, type GenerateResult } from "@/lib/layout";
import { formatSize, formatSizeConverted } from "@/lib/units";
import { useCatalog } from "@/store/catalogStore";
import { useDialog } from "@/store/dialogStore";
import { selectCurrentPage, useEditor } from "@/store/editorStore";
import { layoutSettings, usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { CatalogNotice } from "../../shared/CatalogNotice";
import { TemplateThumb } from "../../shared/Thumbs";
import { Button, IconButton } from "../../ui/Button";
import { Icon, ShapeIcon } from "../../ui/Icon";
import { QuantityField } from "../../ui/NumberField";
import { Chip, Segmented } from "../../ui/Segmented";
import s from "../editor.module.css";

/** แกลเลอรีเทมเพลต กรองตามหมวด แตะเพื่อใช้ */
function TemplateGallery() {
  const templates = useCatalog((c) => c.templates);
  const page = useEditor(selectCurrentPage);
  const applyTemplate = useEditor((st) => st.applyTemplate);
  const openDialog = useDialog((d) => d.open);
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const active = templates.filter((t) => t.active);
  const list = active.filter((t) => category === "all" || t.category === category);

  if (!active.length)
    return (
      <CatalogNotice
        empty
        emptyText="ยังไม่มีเทมเพลต สร้างได้โดยจัดกรอบบนแผ่น แล้วกด ตั้งค่าแผ่น › บันทึกเป็นเทมเพลต"
      />
    );

  /** แผ่นว่างใช้ได้ทันที แผ่นที่มีกรอบแล้วให้ถามก่อน */
  const pick = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (!page.frames.length) {
      applyTemplate(t, "replace");
      toast(`ใช้เทมเพลต "${t.name}" · ขั้นต่อไป ใส่รูป`);
    } else openDialog({ kind: "applyTemplate", templateId: id });
  };

  return (
    <>
      <div className={s.chipRow}>
        <Chip selected={category === "all"} onClick={() => setCategory("all")}>
          ทั้งหมด
        </Chip>
        {(Object.keys(TEMPLATE_CATEGORY_LABEL) as TemplateCategory[]).map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(c)}>
            {TEMPLATE_CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>
      <div className={s.tplGrid}>
        {list.map((t) => (
          <button key={t.id} type="button" className={s.tplCard} onClick={() => pick(t.id)}>
            <span className={s.tplThumbBox}>
              <TemplateThumb template={t} className={s.thumb} />
            </span>
            <span className={s.tplName}>{t.name}</span>
            <span className={s.tplMeta}>
              {t.slots.length} กรอบ · {t.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
            </span>
          </button>
        ))}
        {!list.length && <p className={s.text}>ยังไม่มีเทมเพลตในหมวดนี้</p>}
      </div>
    </>
  );
}

/** ข้อความสรุปผลก่อนกดสร้าง */
function summary(r: GenerateResult): string {
  const total = r.placed + r.failed;
  if (!total) return "ยังไม่มีขนาดในชุด";
  let text = `รวม ${total} กรอบ · ใช้ ${r.usedPages} แผ่น`;
  if (r.addedPages) text += ` (เพิ่มแผ่นใหม่ ${r.addedPages})`;
  if (r.failed) text += ` · ใส่ไม่ได้ ${r.failed} กรอบ เพราะใหญ่เกินแผ่น`;
  return text;
}

/** เลือกขนาดกรอบและจำนวน แล้วสร้างทีเดียว (ไม่พอระบบเพิ่มแผ่นให้) */
function BuildSet() {
  const presets = useCatalog((c) => c.presets);
  const { basket, generateMode, pages, pageIndex } = useEditor();
  const { addToBasket, setBasketQty, removeFromBasket, setGenerateMode, generate } = useEditor();
  const { unit, marginMm, gapMm } = usePrefs();
  const orientation = pages[pageIndex].orientation;
  const active = presets.filter((p) => p.active);

  // คำนวณผลลัพธ์ล่วงหน้า (ไม่แก้ข้อมูลจริง) เพื่อบอกว่าจะใช้กี่แผ่น
  const preview = useMemo(
    () =>
      generateFrames({
        pages,
        pageIndex,
        items: expandBasket(basket, presets),
        mode: generateMode,
        settings: { marginMm, gapMm },
      }),
    [pages, pageIndex, basket, presets, generateMode, marginMm, gapMm],
  );

  /** กดสร้าง */
  const onGenerate = () => {
    const r = generate(presets, layoutSettings());
    if (!r.placed) {
      toast("สร้างไม่ได้ กรอบใหญ่เกินแผ่น");
      return;
    }
    toast(`สร้าง ${r.placed} กรอบ${r.addedPages ? ` · เพิ่มแผ่นใหม่ ${r.addedPages} แผ่น` : ""} · ขั้นต่อไป ใส่รูป`);
  };

  if (!active.length)
    return <CatalogNotice empty emptyText="ยังไม่มีขนาดกรอบ เพิ่มได้ในหน้าจัดการ (ไอคอนซ้ายบน)" />;

  return (
    <>
      <p className={s.sectionLabel}>แตะขนาดเพื่อเพิ่มลงชุด</p>
      <div className={s.chipRow}>
        {active.map((p) => (
          <Chip key={p.id} className={s.presetChip} onClick={() => addToBasket(p.id)}>
            <ShapeIcon shape={p.shape} />
            <span className={s.chipText}>
              <span>{p.name}</span>
              <small>{formatSize(p.wMm, p.hMm, unit)}</small>
            </span>
          </Chip>
        ))}
      </div>

      {!basket.length ? (
        <div className={s.empty}>
          <Icon name="grid" size={26} />
          <p>ยังไม่มีขนาดในชุด เลือกขนาดด้านบน แล้วตั้งจำนวนที่ต้องการ</p>
        </div>
      ) : (
        <>
          <p className={s.sectionLabel}>ชุดที่จะสร้าง</p>
          <div className={s.basket}>
            {basket.map((b, i) => {
              const p = presets.find((x) => x.id === b.presetId);
              if (!p) return null;
              const perSheet = gridCapacity(p.wMm, p.hMm, orientation, { marginMm, gapMm }).count;
              return (
                <div key={b.presetId} className={s.basketRow}>
                  <ShapeIcon shape={p.shape} size={26} />
                  <div className={s.basketText}>
                    <strong>{p.name}</strong>
                    <small>
                      {formatSize(p.wMm, p.hMm, unit)} {formatSizeConverted(p.wMm, p.hMm, unit)}
                    </small>
                  </div>
                  <IconButton icon="x" label={`เอา ${p.name} ออกจากชุด`} onClick={() => removeFromBasket(i)} />
                  <div className={s.basketQty}>
                    <span>จำนวน</span>
                    <QuantityField label={`จำนวน ${p.name}`} value={b.qty} onChange={(n) => setBasketQty(i, n)} />
                    <button type="button" className={s.link} onClick={() => setBasketQty(i, Math.max(1, perSheet))}>
                      เต็มแผ่น ({perSheet})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <Segmented
            label="ตำแหน่งที่สร้าง"
            value={generateMode}
            onChange={setGenerateMode}
            options={[
              { value: "append", label: "ต่อจากแผ่นนี้" },
              { value: "new", label: "เริ่มแผ่นใหม่" },
            ]}
          />
          <p className={s.text}>{summary(preview)}</p>
          <Button variant="primary" wide icon="grid" onClick={onGenerate}>
            สร้าง {preview.placed + preview.failed} กรอบ
          </Button>
        </>
      )}
    </>
  );
}

/** ขั้นที่ 1 เลือกแบบ: เลือกเทมเพลต หรือกำหนดขนาดและจำนวนเอง */
export function LayoutPanel() {
  const page = useEditor(selectCurrentPage);
  const pageIndex = useEditor((st) => st.pageIndex);
  const tab = useEditor((st) => st.layoutTab);
  const setTab = useEditor((st) => st.setLayoutTab);
  const unit = usePrefs((p) => p.unit);
  const openDialog = useDialog((d) => d.open);
  const { w, h } = sheetSize(page.orientation);

  return (
    <>
      <div className={s.head}>
        <div className={s.headText}>
          <strong>เลือกแบบ · แผ่นที่ {pageIndex + 1}</strong>
          <small>
            {formatSize(w, h, unit)} · {page.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"} · {page.frames.length} กรอบ
          </small>
        </div>
        <Button size="sm" icon="sliders" onClick={() => openDialog({ kind: "sheet" })}>
          ตั้งค่าแผ่น
        </Button>
      </div>
      <Segmented
        label="วิธีเลือกแบบ"
        value={tab}
        onChange={setTab}
        options={[
          { value: "templates", label: "เทมเพลตสำเร็จรูป" },
          { value: "custom", label: "กำหนดขนาดและจำนวน" },
        ]}
      />
      {tab === "templates" ? <TemplateGallery /> : <BuildSet />}
    </>
  );
}
