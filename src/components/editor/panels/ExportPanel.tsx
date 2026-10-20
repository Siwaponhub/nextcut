"use client";

import { preflight } from "@/lib/export";
import { formatSize } from "@/lib/units";
import { useDialog } from "@/store/dialogStore";
import { useEditor } from "@/store/editorStore";
import { usePrefs } from "@/store/prefsStore";
import { Note, Toggle } from "../../ui/Feedback";
import { Icon, type IconName } from "../../ui/Icon";
import s from "../editor.module.css";

/** ปุ่มตัวเลือกรูปแบบไฟล์ */
function Option({ icon, title, detail, onClick }: { icon: IconName; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" className={s.option} onClick={onClick}>
      <Icon name={icon} size={28} />
      <span className={s.optionText}>
        {title}
        <small>{detail}</small>
      </span>
    </button>
  );
}

/** ขั้นที่ 3 ส่งออก: ตรวจงานก่อน แล้วเลือก JPG / PDF / พิมพ์ */
export function ExportPanel() {
  const pages = useEditor((st) => st.pages);
  const images = useEditor((st) => st.images);
  const setStep = useEditor((st) => st.setStep);
  const { unit, cutLines, setCutLines } = usePrefs();
  const open = useDialog((d) => d.open);
  const r = preflight(pages, images);

  return (
    <>
      <div className={s.head}>
        <div className={s.headText}>
          <strong>ตรวจก่อนส่งออก</strong>
          <small>
            {pages.length} แผ่น · {r.totalFrames} กรอบ · {formatSize(100, 150, unit)}
          </small>
        </div>
      </div>
      <ul className={s.checks}>
        <li>
          <Note
            tone={r.emptyFrames ? "warn" : "ok"}
            action={r.emptyFrames ? { label: "ไปใส่รูป", onClick: () => setStep("photo") } : undefined}
          >
            {r.emptyFrames ? `ยังว่าง ${r.emptyFrames} ช่อง จะพิมพ์ออกมาเป็นช่องเปล่า` : "ใส่รูปครบทุกช่อง"}
          </Note>
        </li>
        <li>
          <Note tone={r.lowResFrames ? "warn" : "ok"}>
            {r.lowResFrames ? `${r.lowResFrames} รูปความละเอียดต่ำกว่า 150 dpi อาจไม่คม` : "ทุกรูปคมพอสำหรับพิมพ์"}
          </Note>
        </li>
        <li>
          <Note
            tone={r.invalidFrames ? "warn" : "ok"}
            action={r.invalidFrames ? { label: "ไปแก้", onClick: () => setStep("layout") } : undefined}
          >
            {r.invalidFrames ? `${r.invalidFrames} กรอบทับกันหรือล้นขอบ` : "ไม่มีกรอบทับกันหรือล้นขอบ"}
          </Note>
        </li>
      </ul>
      <Toggle label="พิมพ์เส้นตัด" checked={cutLines} onChange={setCutLines} />
      <p className={s.sectionLabel}>เลือกรูปแบบไฟล์</p>
      <Option
        icon="photo"
        title="รูป JPG 300 dpi"
        detail="1181×1772 px ต่อแผ่น · บันทึกลง Photos หรือส่งแอปเครื่องพิมพ์"
        onClick={() => open({ kind: "export", format: "jpg" })}
      />
      <Option
        icon="file"
        title="PDF ขนาดจริง"
        detail={`${pages.length} หน้า · หน้าละ 100×150 mm · เก็บใน Files`}
        onClick={() => open({ kind: "export", format: "pdf" })}
      />
      <Option
        icon="printer"
        title="พิมพ์ (AirPrint)"
        detail="เลือกกระดาษ 10×15 ซม. หรือ 4×6 นิ้ว และขนาด 100%"
        onClick={() => open({ kind: "export", format: "print" })}
      />
    </>
  );
}
