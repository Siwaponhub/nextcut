"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MQ_TWO, useMediaQuery } from "@/hooks/useMediaQuery";
import { useCatalog } from "@/store/catalogStore";
import { Button } from "../ui/Button";
import { ToastHost } from "../ui/Feedback";
import { Icon, type IconName } from "../ui/Icon";
import { Segmented } from "../ui/Segmented";
import { PresetForm } from "./PresetForm";
import { PresetList } from "./PresetList";
import { TemplateDetail, TemplateList } from "./TemplatePanes";
import s from "./manage.module.css";

type Tab = "sizes" | "templates";

/** สถานะการเชื่อม Firebase (ยังไม่ตั้งค่า / ผิดพลาด / ออฟไลน์ / กำลังซิงก์ / ซิงก์แล้ว) */
function SyncStatus() {
  const { configured, loaded, error, online, pendingWrites, fromCache } = useCatalog();
  let icon: IconName = "cloud-ok";
  let text = "ซิงก์กับ Firebase แล้ว";
  let color = "var(--ok)";
  if (!configured || error) {
    icon = "cloud-off";
    text = configured ? "เชื่อม Firebase ไม่สำเร็จ" : "ยังไม่ได้เชื่อม Firebase";
    color = "var(--danger)";
  } else if (!loaded) {
    icon = "cloud";
    text = "กำลังเชื่อม Firebase…";
    color = "var(--fg-2)";
  } else if (!online || fromCache) {
    icon = "cloud-off";
    text = pendingWrites ? "ออฟไลน์ · รอซิงก์" : "ออฟไลน์ · ใช้ข้อมูลในเครื่อง";
    color = "var(--warn)";
  } else if (pendingWrites) {
    icon = "cloud-up";
    text = "กำลังซิงก์…";
    color = "var(--fg-2)";
  }
  return (
    <span className={s.sync} style={{ color }}>
      <Icon name={icon} size={16} />
      <span>{text}</span>
    </span>
  );
}

/** หน้าจัดการขนาดกรอบและเทมเพลต ใครเปิดก็แก้ไขได้ (จอกว้าง: รายการคู่รายละเอียด, iPhone: ทีละหน้า) */
export default function ManageApp() {
  useEffect(() => useCatalog.getState().init(), []);
  const twoPane = useMediaQuery(MQ_TWO);
  const presets = useCatalog((c) => c.presets);
  const templates = useCatalog((c) => c.templates);
  const [tab, setTab] = useState<Tab>("sizes");
  /** "new" = กำลังเพิ่มขนาดใหม่ */
  const [presetId, setPresetId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  /** เพิ่มค่าเพื่อล้างฟอร์มกลับเป็นค่าเดิม (ปุ่มยกเลิก) */
  const [formVersion, setFormVersion] = useState(0);

  const preset = presetId && presetId !== "new" ? (presets.find((p) => p.id === presetId) ?? null) : null;
  const template = templateId ? (templates.find((t) => t.id === templateId) ?? null) : null;
  const listHidden = !twoPane && showDetail;
  const detailHidden = !twoPane && !showDetail;

  /** เปิดรายละเอียดขนาด ("new" = ฟอร์มเพิ่มใหม่) */
  const openPreset = (id: string) => {
    setPresetId(id);
    setShowDetail(true);
  };
  /** เปิดรายละเอียดเทมเพลต */
  const openTemplate = (id: string) => {
    setTemplateId(id);
    setShowDetail(true);
  };
  /** กลับไปรายการ (จอแคบ) */
  const back = () => setShowDetail(false);

  /** เนื้อหาฝั่งรายละเอียด */
  const detail = () => {
    if (tab === "templates") {
      if (!template) return <Empty icon="template" text="เลือกเทมเพลตจากรายการเพื่อดูรายละเอียด" />;
      return (
        <TemplateDetail
          template={template}
          onDeleted={() => {
            setTemplateId(null);
            back();
          }}
        />
      );
    }
    if (!presetId || (presetId !== "new" && !preset))
      return (
        <Empty icon="ruler" text="เลือกขนาดจากรายการเพื่อแก้ไข">
          <Button variant="primary" icon="plus" onClick={() => openPreset("new")}>
            เพิ่มขนาดใหม่
          </Button>
        </Empty>
      );
    return (
      <PresetForm
        key={`${presetId}-${formVersion}`}
        preset={preset}
        showHeader={twoPane}
        onSaved={(id) => {
          setPresetId(id);
          if (!twoPane) back();
        }}
        onDeleted={() => {
          setPresetId(null);
          back();
        }}
        onCancel={() => (presetId === "new" ? setPresetId(null) : setFormVersion((v) => v + 1))}
      />
    );
  };

  return (
    <div className={s.app}>
      <header className={s.top}>
        {listHidden ? (
          <button type="button" className={s.back} onClick={back}>
            <Icon name="chev-l" />
            {tab === "sizes" ? "ขนาดกรอบ" : "เทมเพลต"}
          </button>
        ) : (
          <Link href="/" className={s.back}>
            <Icon name="chev-l" />
            จัดวาง
          </Link>
        )}
        <div className={s.title}>
          <strong>จัดการ</strong>
          <SyncStatus />
        </div>
        {tab === "sizes" && !listHidden && (
          <Button size="sm" variant="primary" icon="plus" onClick={() => openPreset("new")}>
            เพิ่ม
          </Button>
        )}
      </header>
      <div className={s.main}>
        <section className={s.listPane} hidden={listHidden} aria-label="รายการ">
          <div className={s.listHead} style={{ borderBottom: 0, paddingBottom: 0 }}>
            <Segmented<Tab>
              label="ประเภท"
              value={tab}
              onChange={(t) => {
                setTab(t);
                setShowDetail(false);
              }}
              options={[
                { value: "sizes", label: "ขนาดกรอบ" },
                { value: "templates", label: "เทมเพลต" },
              ]}
            />
          </div>
          {tab === "sizes" ? (
            <PresetList selectedId={twoPane ? presetId : null} onOpen={openPreset} />
          ) : (
            <TemplateList selectedId={twoPane ? templateId : null} onOpen={openTemplate} />
          )}
        </section>
        <section className={s.detailPane} hidden={detailHidden} aria-label="รายละเอียด">
          {detail()}
        </section>
      </div>
      <ToastHost />
    </div>
  );
}

/** สถานะว่างของฝั่งรายละเอียด */
function Empty({ icon, text, children }: { icon: IconName; text: string; children?: React.ReactNode }) {
  return (
    <div className={s.empty}>
      <Icon name={icon} size={40} />
      <p>{text}</p>
      {children}
    </div>
  );
}
