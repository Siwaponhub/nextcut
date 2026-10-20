"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Template } from "@/types";
import { SHAPE_LABEL, TEMPLATE_CATEGORY_LABEL } from "@/lib/constants";
import { templateToDoc } from "@/lib/catalog/mapping";
import { specKey } from "@/lib/layout";
import { formatSize } from "@/lib/units";
import { useCatalog } from "@/store/catalogStore";
import { useEditor } from "@/store/editorStore";
import { usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { CatalogNotice } from "../shared/CatalogNotice";
import { TemplateThumb } from "../shared/Thumbs";
import { Button } from "../ui/Button";
import { Dialog, Toggle } from "../ui/Feedback";
import { Icon, ShapeIcon } from "../ui/Icon";
import { Segmented } from "../ui/Segmented";
import { JsonPreview } from "./PresetForm";
import s from "./manage.module.css";

type Filter = "all" | "on" | "off";

/** รายการเทมเพลตของร้าน กรองแสดง/ซ่อนได้ */
export function TemplateList({ selectedId, onOpen }: { selectedId: string | null; onOpen: (id: string) => void }) {
  const templates = useCatalog((c) => c.templates);
  const [filter, setFilter] = useState<Filter>("all");
  const visible = templates.filter((t) => filter === "all" || (filter === "on") === t.active);

  return (
    <>
      <div className={s.listHead}>
        <Segmented<Filter>
          label="ตัวกรอง"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "on", label: "แสดง" },
            { value: "off", label: "ซ่อน" },
          ]}
        />
      </div>
      <div className={s.list}>
        {visible.map((t) => (
          <button
            key={t.id}
            type="button"
            className={[s.row, !t.active && s.off].filter(Boolean).join(" ")}
            aria-current={t.id === selectedId}
            onClick={() => onOpen(t.id)}
          >
            <span className={s.thumb} style={{ flexBasis: 52, height: 60 }}>
              <TemplateThumb template={t} />
            </span>
            <span className={s.rowText}>
              <span className={s.name}>{t.name}</span>
              <span className={s.size}>
                {t.slots.length} กรอบ · {TEMPLATE_CATEGORY_LABEL[t.category]} · {t.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}
              </span>
            </span>
            {!t.active && <Icon name="eye-off" className={s.muted} />}
            <Icon name="chev-r" className={s.muted} />
          </button>
        ))}
        {!templates.length ? (
          <CatalogNotice
            empty
            emptyText="ยังไม่มีเทมเพลต สร้างได้ที่หน้าจัดวาง: จัดกรอบบนแผ่น แล้วกด ตั้งค่าแผ่น › บันทึกเป็นเทมเพลต"
          />
        ) : (
          !visible.length && (
            <div className={s.empty}>
              <Icon name="template" size={40} />
              <p>ไม่มีเทมเพลตในมุมมองนี้</p>
            </div>
          )
        )}
      </div>
    </>
  );
}

/** สรุปช่องในเทมเพลตเป็นกลุ่มตามขนาดและรูปทรง */
function slotGroups(t: Template) {
  const groups = new Map<string, { slot: Template["slots"][number]; count: number }>();
  for (const slot of t.slots) {
    const key = specKey(slot);
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { slot, count: 1 });
  }
  return [...groups.values()];
}

/** รายละเอียดเทมเพลต: ภาพ ช่องทั้งหมด ซ่อน/แสดง ใช้ในหน้าจัดวาง และลบ */
export function TemplateDetail({ template, onDeleted }: { template: Template; onDeleted: () => void }) {
  const router = useRouter();
  const unit = usePrefs((p) => p.unit);
  const { setTemplateActive, deleteTemplate } = useCatalog();
  const setPendingTemplate = useEditor((e) => e.setPendingTemplate);
  const [confirmDelete, setConfirmDelete] = useState(false);

  /** ไปหน้าจัดวางแล้วใช้เทมเพลตนี้ */
  const use = () => {
    setPendingTemplate(template.id);
    router.push("/");
  };

  /** ลบเทมเพลต */
  const remove = async () => {
    await deleteTemplate(template.id);
    setConfirmDelete(false);
    toast("ลบเทมเพลตแล้ว");
    onDeleted();
  };

  return (
    <>
      <div className={s.head}>
        <strong>{template.name}</strong>
      </div>
      <div className={s.tplDetail}>
        <div className={s.tplBig}>
          <TemplateThumb template={template} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className={s.wrap}>
            <span className={s.pill}>{TEMPLATE_CATEGORY_LABEL[template.category]}</span>
            <span className={s.pill}>{template.orientation === "portrait" ? "แนวตั้ง" : "แนวนอน"}</span>
          </div>
          <ul className={s.slots}>
            {slotGroups(template).map(({ slot, count }) => (
              <li key={specKey(slot)}>
                <ShapeIcon shape={slot.shape} size={18} />
                <span>
                  {SHAPE_LABEL[slot.shape]} {formatSize(slot.wMm, slot.hMm, unit)}
                </span>
                <b>× {count}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Toggle
        label="แสดงในหน้าจัดวาง"
        checked={template.active}
        onChange={(active) =>
          setTemplateActive(template.id, active).then(
            () => toast(active ? "แสดงในหน้าจัดวางแล้ว" : "ซ่อนจากหน้าจัดวางแล้ว"),
            () => toast("บันทึกไม่สำเร็จ ตรวจการเชื่อม Firebase แล้วลองใหม่"),
          )
        }
      />
      <div className={s.row2}>
        <Button icon="template" onClick={use}>
          ใช้ในหน้าจัดวาง
        </Button>
        <Button icon="trash" variant="danger" onClick={() => setConfirmDelete(true)}>
          ลบ
        </Button>
      </div>
      <JsonPreview path={`templates/${template.id}`} data={templateToDoc(template)} />
      {confirmDelete && (
        <Dialog
          title={`ลบเทมเพลต "${template.name}"?`}
          subtitle="จะหายจากทุกเครื่อง"
          onClose={() => setConfirmDelete(false)}
        >
          <p style={{ margin: 0, fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>แผ่นที่สร้างจากเทมเพลตนี้ไปแล้วไม่ได้รับผลกระทบ</p>
          <div className={s.row2}>
            <Button onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
            <Button variant="danger" onClick={remove}>
              ลบเทมเพลต
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
