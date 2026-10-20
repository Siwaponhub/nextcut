"use client";

import Link from "next/link";
import type { Step } from "@/types";
import { formatSize } from "@/lib/units";
import { sheetSize } from "@/lib/constants";
import { useTheme } from "@/hooks/useTheme";
import { selectCurrentPage, useEditor } from "@/store/editorStore";
import { usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/Button";
import s from "./editor.module.css";
import ui from "../ui/ui.module.css";

const STEPS: { key: Step; label: string }[] = [
  { key: "layout", label: "เลือกแบบ" },
  { key: "photo", label: "ใส่รูป" },
  { key: "export", label: "ส่งออก" },
];

/** นับกรอบทั้งหมดและกรอบที่มีรูปแล้ว */
function useFrameStats() {
  const pages = useEditor((st) => st.pages);
  let total = 0;
  let filled = 0;
  for (const p of pages)
    for (const f of p.frames) {
      total++;
      if (f.imageId) filled++;
    }
  return { total, filled };
}

/** แถบขั้นตอน 1 เลือกแบบ → 2 ใส่รูป → 3 ส่งออก พร้อมสถานะของแต่ละขั้น */
function StepBar() {
  const step = useEditor((st) => st.step);
  const setStep = useEditor((st) => st.setStep);
  const { total, filled } = useFrameStats();
  const done: Record<Step, boolean> = { layout: total > 0, photo: total > 0 && filled === total, export: false };
  const stat: Record<Step, string> = { layout: `${total} กรอบ`, photo: `${filled}/${total}`, export: "" };

  return (
    <nav className={s.steps} aria-label="ขั้นตอน">
      {STEPS.map((it, i) => {
        const current = it.key === step;
        const ok = done[it.key] && !current;
        return (
          <button
            key={it.key}
            type="button"
            className={s.step}
            aria-current={current ? "step" : undefined}
            onClick={() => setStep(it.key)}
          >
            <span className={[s.stepNo, ok && s.stepDone].filter(Boolean).join(" ")}>
              {ok ? <Icon name="check" size={13} /> : i + 1}
            </span>
            <span className={s.stepLabel}>{it.label}</span>
            {stat[it.key] && <span className={s.stepStat}>{stat[it.key]}</span>}
          </button>
        );
      })}
    </nav>
  );
}

/** แถบบนของหน้าจัดวาง: ไปหน้าจัดการ, ขั้นตอน, ย้อนกลับ, สลับธีม */
export function TopBar() {
  const unit = usePrefs((p) => p.unit);
  const page = useEditor(selectCurrentPage);
  const pageCount = useEditor((st) => st.pages.length);
  const canUndo = useEditor((st) => st.history.length > 0);
  const undo = useEditor((st) => st.undo);
  const { dark, setTheme } = useTheme();
  const size = sheetSize(page.orientation);

  return (
    <header className={s.top}>
      <Link href="/manage" className={ui.iconBtn} aria-label="จัดการขนาดและเทมเพลต" title="จัดการขนาดและเทมเพลต">
        <Icon name="sliders" />
      </Link>
      <div className={s.brand}>
        <strong>NextCut</strong>
        <small>
          {formatSize(size.w, size.h, unit)} · {pageCount} แผ่น
        </small>
      </div>
      <StepBar />
      <IconButton icon="undo" label="ย้อนกลับ" disabled={!canUndo} onClick={() => undo() && toast("ย้อนกลับแล้ว")} />
      <IconButton
        icon={dark ? "sun" : "moon"}
        label={dark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"}
        className={s.bigOnly}
        onClick={() => setTheme(dark ? "light" : "dark")}
      />
    </header>
  );
}
