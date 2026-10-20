"use client";

import { useCallback } from "react";
import { sheetSize } from "@/lib/constants";
import { isFrameInvalid } from "@/lib/geometry";
import { formatSize } from "@/lib/units";
import { useElementSize } from "@/hooks/useElementSize";
import { MQ_BIG, useMediaQuery } from "@/hooks/useMediaQuery";
import { usePhotoImport } from "@/hooks/usePhotoImport";
import { selectCurrentPage, selectSelectedFrame, useEditor } from "@/store/editorStore";
import { usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { IconButton } from "../ui/Button";
import { SheetCanvas } from "./SheetCanvas";
import s from "./sheet.module.css";

/** ปุ่มเลื่อนแผ่นก่อน/ถัดไป และเพิ่มแผ่น (เพิ่มได้เฉพาะขั้นเลือกแบบ) */
function PageNav() {
  const pageIndex = useEditor((st) => st.pageIndex);
  const count = useEditor((st) => st.pages.length);
  const step = useEditor((st) => st.step);
  const goToPage = useEditor((st) => st.goToPage);
  const addPage = useEditor((st) => st.addPage);

  return (
    <div className={s.pager}>
      <IconButton icon="chev-l" label="แผ่นก่อนหน้า" disabled={pageIndex === 0} onClick={() => goToPage(pageIndex - 1)} />
      <span className={s.pagerLabel}>
        แผ่น {pageIndex + 1}/{count}
      </span>
      <IconButton icon="chev-r" label="แผ่นถัดไป" disabled={pageIndex >= count - 1} onClick={() => goToPage(pageIndex + 1)} />
      {step === "layout" && (
        <IconButton
          icon="page-plus"
          label="เพิ่มแผ่นใหม่"
          onClick={() => {
            addPage();
            toast(`เพิ่มแผ่นที่ ${pageIndex + 2} แล้ว`);
          }}
        />
      )}
    </div>
  );
}

/** ข้อความแนะนำใต้แผ่น เปลี่ยนตามขั้นตอนและสิ่งที่เลือก */
function useHint(): { text: string; bad: boolean } {
  const page = useEditor(selectCurrentPage);
  const step = useEditor((st) => st.step);
  const selected = useEditor(selectSelectedFrame);
  const unit = usePrefs((p) => p.unit);
  const big = useMediaQuery(MQ_BIG);

  if (step === "export") {
    const { w, h } = sheetSize(page.orientation);
    return { text: `ตัวอย่างก่อนพิมพ์ · ขนาดจริง ${formatSize(w, h, unit)}`, bad: false };
  }
  const invalid = page.frames.filter((f) => isFrameInvalid(f, page)).length;
  if (invalid) return { text: `กรอบสีแดง ${invalid} กรอบ ทับกันหรือล้นขอบ`, bad: true };
  if (step === "layout") {
    if (selected) return { text: "ลากเพื่อย้ายกรอบ", bad: false };
    return { text: big ? "แตะกรอบเพื่อแก้ขนาดหรือรูปทรง · ลากเพื่อย้าย · ตารางช่องละ 1 ซม." : "แตะกรอบเพื่อแก้ · ลากเพื่อย้าย", bad: false };
  }
  if (selected?.imageId) return { text: "ลากเพื่อเลื่อนรูป · ถ่างนิ้วเพื่อซูม · ส่วนจางจะถูกตัดทิ้ง", bad: false };
  return { text: big ? "แตะช่องว่างเพื่อเลือกรูป · แตะรูปเพื่อปรับ" : "แตะช่องว่างเพื่อใส่รูป", bad: false };
}

/** พื้นที่แสดงแผ่น: วัดขนาดพื้นที่แล้วคำนวณ scale ให้แผ่นพอดีจอ */
export function SheetStage() {
  const page = useEditor(selectCurrentPage);
  const step = useEditor((st) => st.step);
  const selectedId = useEditor((st) => st.selectedId);
  const images = useEditor((st) => st.images);
  const setStep = useEditor((st) => st.setStep);
  const { unit, marginMm, cutLines } = usePrefs();
  const { pickIntoFrame, importIntoFrame } = usePhotoImport();
  const [boxRef, box] = useElementSize<HTMLDivElement>();
  const hint = useHint();

  const { w, h } = sheetSize(page.orientation);
  const scale = Math.max(0.8, Math.min((box.width - 8) / w, (box.height - 8) / h));
  const goToLayout = useCallback(() => setStep("layout"), [setStep]);

  return (
    <section className={s.stage} style={{ ["--k" as string]: scale.toFixed(3) }} aria-label="แผ่นกระดาษ">
      <div ref={boxRef} className={s.box}>
        {box.width > 0 && (
          <SheetCanvas
            page={page}
            scale={scale}
            step={step}
            selectedId={selectedId}
            images={images}
            unit={unit}
            marginMm={marginMm}
            cutLines={cutLines}
            onPickPhoto={pickIntoFrame}
            onDropFiles={importIntoFrame}
            onGoToLayout={goToLayout}
          />
        )}
      </div>
      <PageNav />
      <p className={[s.hint, hint.bad && s.hintBad].filter(Boolean).join(" ")}>{hint.text}</p>
    </section>
  );
}
