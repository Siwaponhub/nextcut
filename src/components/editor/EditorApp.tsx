"use client";

import { useEffect } from "react";
import { useProjectPersistence } from "@/hooks/useProjectPersistence";
import { useCatalog } from "@/store/catalogStore";
import { useDialog } from "@/store/dialogStore";
import { selectCurrentPage, selectSelectedFrame, useEditor } from "@/store/editorStore";
import { ToastHost } from "../ui/Feedback";
import { ExportDialog } from "./dialogs/ExportDialog";
import { ApplyTemplateDialog, DeletePageDialog, SaveTemplateDialog, SheetSettingsDialog } from "./dialogs/SheetDialogs";
import { ExportPanel } from "./panels/ExportPanel";
import { FrameActionsPanel, SizeShapePanel } from "./panels/FramePanels";
import { LayoutPanel } from "./panels/LayoutPanel";
import { PhotoAdjustPanel, PhotoHomePanel } from "./panels/PhotoPanels";
import { SheetStage } from "./SheetStage";
import { TopBar } from "./TopBar";
import s from "./editor.module.css";

/** แผงเครื่องมือ: เลือกเนื้อหาตามขั้นตอนและกรอบที่เลือก */
function ToolPanel() {
  const step = useEditor((st) => st.step);
  const framePanel = useEditor((st) => st.framePanel);
  const selected = useEditor(selectSelectedFrame);

  if (step === "export") return <ExportPanel />;
  if (step === "photo") return selected?.imageId ? <PhotoAdjustPanel frame={selected} /> : <PhotoHomePanel />;
  if (selected) return framePanel === "size" ? <SizeShapePanel frame={selected} /> : <FrameActionsPanel frame={selected} />;
  return <LayoutPanel />;
}

/** แสดงหน้าต่างโต้ตอบที่เปิดอยู่ */
function DialogHost() {
  const dialog = useDialog((d) => d.dialog);
  if (!dialog) return null;
  switch (dialog.kind) {
    case "sheet":
      return <SheetSettingsDialog />;
    case "applyTemplate":
      return <ApplyTemplateDialog templateId={dialog.templateId} />;
    case "saveTemplate":
      return <SaveTemplateDialog />;
    case "deletePage":
      return <DeletePageDialog />;
    case "export":
      return <ExportDialog format={dialog.format} />;
  }
}

/**
 * ใช้เทมเพลตที่เลือกมาจากหน้าจัดการ
 * แผ่นว่างใช้ได้ทันที แผ่นที่มีกรอบแล้วเปิดหน้าต่างถามก่อน
 */
function usePendingTemplate() {
  const hydrated = useEditor((st) => st.hydrated);
  const pendingId = useEditor((st) => st.pendingTemplateId);
  const templates = useCatalog((c) => c.templates);

  useEffect(() => {
    if (!hydrated || !pendingId) return;
    const editor = useEditor.getState();
    const t = templates.find((x) => x.id === pendingId);
    editor.setPendingTemplate(null);
    if (!t) return;
    editor.setStep("layout");
    if (!selectCurrentPage(editor).frames.length) editor.applyTemplate(t, "replace");
    else useDialog.getState().open({ kind: "applyTemplate", templateId: t.id });
  }, [hydrated, pendingId, templates]);
}

/** หน้าจัดวาง: แถบบน + แผ่นกระดาษ + แผงเครื่องมือ */
export default function EditorApp() {
  useProjectPersistence();
  usePendingTemplate();
  useEffect(() => useCatalog.getState().init(), []);
  const hydrated = useEditor((st) => st.hydrated);

  if (!hydrated) return <div className={s.loading}>กำลังเปิดงานล่าสุด…</div>;

  return (
    <div className={s.app}>
      <TopBar />
      <div className={s.main}>
        <SheetStage />
        <aside className={s.panel} aria-label="เครื่องมือ">
          <ToolPanel />
        </aside>
      </div>
      <DialogHost />
      <ToastHost />
    </div>
  );
}
