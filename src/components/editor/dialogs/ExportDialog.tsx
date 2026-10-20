"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { exportJpegFiles, exportPdfFile, shareOrDownload } from "@/lib/export";
import { useDialog, type ExportFormat } from "@/store/dialogStore";
import { useEditor } from "@/store/editorStore";
import { usePrefs } from "@/store/prefsStore";
import { toast } from "@/store/toastStore";
import { Button } from "../../ui/Button";
import { Dialog, Note } from "../../ui/Feedback";
import s from "../editor.module.css";

interface Output {
  files: File[];
  /** url ของภาพตัวอย่างแต่ละแผ่น */
  previews: string[];
}

const TITLE: Record<ExportFormat, string> = {
  jpg: "รูป JPG 300 dpi",
  pdf: "PDF ขนาดจริง",
  print: "พิมพ์ (AirPrint)",
};

/** สร้างไฟล์ตามรูปแบบที่เลือก พร้อมภาพตัวอย่าง */
async function build(format: ExportFormat, ...args: Parameters<typeof exportJpegFiles>): Promise<Output> {
  const [pages, images, opts] = args;
  // ตอนพิมพ์หมุนแผ่นแนวนอนให้เป็นแนวตั้ง เพราะกระดาษ 4×6 ป้อนเข้าเครื่องแนวตั้ง
  const jpgs = await exportJpegFiles(pages, images, { ...opts, rotateToPortrait: format === "print" });
  const previews = jpgs.map((f) => URL.createObjectURL(f));
  if (format === "pdf") return { files: [await exportPdfFile(pages, images, opts)], previews };
  return { files: jpgs, previews };
}

/** ภาพแผ่นขนาดจริงที่แสดงเฉพาะตอนสั่งพิมพ์ (ใส่ไว้ใต้ body ให้ CSS ตอนพิมพ์ซ่อนส่วนอื่นได้) */
function PrintSheets({ urls }: { urls: string[] }) {
  return createPortal(
    <div className="print-only">
      {urls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- ต้องเป็นขนาด mm จริงตอนพิมพ์
        <img key={u} src={u} alt={`แผ่นที่ ${i + 1}`} style={{ width: "100mm", height: "150mm", display: "block", breakAfter: "page" }} />
      ))}
    </div>,
    document.body,
  );
}

/**
 * สร้างไฟล์ส่งออกแล้วแสดงตัวอย่าง
 * ปุ่มบันทึก/แชร์แยกออกมา เพราะ Safari ยอมเปิด Share Sheet เฉพาะตอนผู้ใช้แตะปุ่มโดยตรง
 */
export function ExportDialog({ format }: { format: ExportFormat }) {
  const close = useDialog((d) => d.close);
  const pages = useEditor((st) => st.pages);
  const images = useEditor((st) => st.images);
  const cutLines = usePrefs((p) => p.cutLines);
  const [output, setOutput] = useState<Output | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let made: Output | null = null;
    build(format, pages, images, { cutLines })
      .then((o) => {
        if (cancelled) o.previews.forEach((u) => URL.revokeObjectURL(u));
        else {
          made = o;
          setOutput(o);
        }
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      made?.previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [format, pages, images, cutLines]);

  /** บันทึกหรือแชร์ไฟล์ */
  const share = async () => {
    if (!output) return;
    const r = await shareOrDownload(output.files);
    if (r === "shared") toast("ส่งไฟล์แล้ว");
    else if (r === "downloaded") toast(`ดาวน์โหลด ${output.files.length} ไฟล์แล้ว`);
  };

  return (
    <Dialog title={TITLE[format]} subtitle={`${pages.length} แผ่น · ${cutLines ? "มีเส้นตัด" : "ไม่มีเส้นตัด"}`} onClose={close}>
      {failed ? (
        <Note tone="bad">สร้างไฟล์ไม่สำเร็จ ลองปิดแอปอื่นแล้วลองใหม่ หรือแบ่งงานเป็นหลายครั้ง</Note>
      ) : !output ? (
        <p className={s.text}>กำลังสร้างไฟล์…</p>
      ) : (
        <>
          <div className={s.previews}>
            {output.previews.map((u, i) => (
              <figure key={u}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ภาพจาก blob ในเครื่อง */}
                <img src={u} alt={`ภาพแผ่นที่ ${i + 1}`} />
                <figcaption>แผ่น {i + 1}</figcaption>
              </figure>
            ))}
          </div>
          {format === "print" ? (
            <>
              <Note>ในหน้าพิมพ์ เลือกกระดาษ 10×15 ซม. หรือ 4×6 นิ้ว ตั้งขนาด 100% และปิดการย่อให้พอดีหน้า</Note>
              <Button variant="primary" wide icon="printer" onClick={() => window.print()}>
                พิมพ์
              </Button>
              <PrintSheets urls={output.previews} />
            </>
          ) : (
            <Button variant="primary" wide icon="share" onClick={share}>
              {format === "pdf" ? "บันทึก PDF" : `บันทึก ${output.files.length} รูป`}
            </Button>
          )}
        </>
      )}
    </Dialog>
  );
}
