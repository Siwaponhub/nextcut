"use client";

import { useRef, useState } from "react";
import type { Preset } from "@/types";
import { PRESET_CATEGORY_LABEL, SHAPE_LABEL } from "@/lib/constants";
import { formatSize, formatSizeConverted, otherUnit } from "@/lib/units";
import { useCatalog } from "@/store/catalogStore";
import { toast } from "@/store/toastStore";
import { CatalogNotice } from "../shared/CatalogNotice";
import { ShapeThumb } from "../shared/Thumbs";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Segmented } from "../ui/Segmented";
import s from "./manage.module.css";

type Filter = "all" | "on" | "off";

interface PresetListProps {
  selectedId: string | null;
  onOpen: (id: string) => void;
}

interface DragState {
  id: string;
  startY: number;
  startIndex: number;
  rowStep: number;
}

/** แถวหนึ่งแถวของรายการขนาด */
function PresetRow({ p, selected, reorder }: { p: Preset; selected: boolean; reorder: boolean }) {
  return (
    <>
      {reorder && (
        <span className={s.handle} data-handle aria-label="ลากเพื่อย้ายลำดับ">
          <Icon name="grip" />
        </span>
      )}
      <span className={s.thumb}>
        <ShapeThumb spec={p} />
      </span>
      <span className={s.rowText}>
        <span className={s.name}>{p.name}</span>
        <span className={s.size}>
          {formatSize(p.wMm, p.hMm, p.inputUnit)} <em>{formatSizeConverted(p.wMm, p.hMm, p.inputUnit)}</em>
        </span>
      </span>
      {!p.active && <Icon name="eye-off" className={s.muted} />}
      <span className={[s.pill, s.catPill].join(" ")}>{PRESET_CATEGORY_LABEL[p.category]}</span>
      {!reorder && <Icon name="chev-r" className={selected ? undefined : s.muted} />}
    </>
  );
}

/**
 * รายการขนาดกรอบ: ค้นหา กรองแสดง/ซ่อน และโหมดจัดลำดับด้วยการลาก
 * ลำดับนี้คือลำดับที่เห็นในหน้าจัดวาง
 */
export function PresetList({ selectedId, onOpen }: PresetListProps) {
  const presets = useCatalog((c) => c.presets);
  const reorderPresets = useCatalog((c) => c.reorderPresets);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [reorder, setReorder] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const drag = useRef<DragState | null>(null);

  const q = query.trim().toLowerCase();
  const visible = reorder
    ? (order ?? presets.map((p) => p.id)).map((id) => presets.find((p) => p.id === id)).filter((p): p is Preset => !!p)
    : presets.filter(
        (p) =>
          (filter === "all" || (filter === "on") === p.active) &&
          (!q ||
            p.name.toLowerCase().includes(q) ||
            SHAPE_LABEL[p.shape].includes(q) ||
            formatSize(p.wMm, p.hMm, p.inputUnit).includes(q) ||
            formatSize(p.wMm, p.hMm, otherUnit(p.inputUnit)).includes(q)),
      );

  /** เริ่มลากจากที่จับ */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const handle = (e.target as HTMLElement).closest("[data-handle]");
    const row = handle?.closest<HTMLElement>("[data-id]");
    if (!reorder || !row) return;
    e.preventDefault();
    const ids = order ?? presets.map((p) => p.id);
    const gap = parseFloat(getComputedStyle(e.currentTarget).rowGap) || 8;
    drag.current = {
      id: row.dataset.id ?? "",
      startY: e.clientY,
      startIndex: ids.indexOf(row.dataset.id ?? ""),
      rowStep: row.getBoundingClientRect().height + gap,
    };
    setOrder(ids);
    setDragId(drag.current.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  /** ลาก: คำนวณตำแหน่งใหม่จากระยะที่เลื่อน แล้วสลับลำดับ */
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !order) return;
    const dy = e.clientY - d.startY;
    const target = Math.max(0, Math.min(order.length - 1, d.startIndex + Math.round(dy / d.rowStep)));
    const current = order.indexOf(d.id);
    if (target !== current) {
      const next = order.filter((id) => id !== d.id);
      next.splice(target, 0, d.id);
      setOrder(next);
    }
    setOffset(dy - (target - d.startIndex) * d.rowStep);
  };

  /** ปล่อยนิ้ว: บันทึกลำดับใหม่ถ้ามีการเปลี่ยน */
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragId(null);
    setOffset(0);
    if (!d || !order) return;
    const before = presets.map((p) => p.id).join();
    if (order.join() !== before) {
      reorderPresets(order).then(
        () => toast("จัดลำดับแล้ว"),
        () => toast("บันทึกลำดับไม่สำเร็จ"),
      );
    }
  };

  return (
    <>
      <div className={s.listHead}>
        {reorder ? (
          <div className={s.inline}>
            <p className={s.grow} style={{ margin: 0, fontSize: "var(--fs-s)", color: "var(--fg-2)" }}>
              ลากที่จับเพื่อเรียงลำดับ ลำดับนี้คือลำดับในหน้าจัดวาง
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setReorder(false);
                setOrder(null);
              }}
            >
              เสร็จ
            </Button>
          </div>
        ) : (
          <>
            <div className={s.search}>
              <Icon name="search" />
              <input type="search" placeholder="ค้นหาชื่อหรือขนาด" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="ค้นหาขนาด" />
            </div>
            <div className={s.filters}>
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
              <Button size="sm" onClick={() => setReorder(true)}>
                จัดลำดับ
              </Button>
            </div>
          </>
        )}
      </div>
      <div className={s.list} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {visible.map((p) => {
          const dragging = dragId === p.id;
          const cls = [s.row, !p.active && s.off, dragging && s.dragging].filter(Boolean).join(" ");
          return reorder ? (
            <div key={p.id} data-id={p.id} className={cls} style={dragging ? { transform: `translateY(${offset}px)` } : undefined}>
              <PresetRow p={p} selected={false} reorder />
            </div>
          ) : (
            <button key={p.id} type="button" data-id={p.id} className={cls} aria-current={p.id === selectedId} onClick={() => onOpen(p.id)}>
              <PresetRow p={p} selected={p.id === selectedId} reorder={false} />
            </button>
          );
        })}
        {!presets.length ? (
          <CatalogNotice empty emptyText="ยังไม่มีขนาดกรอบ กด “เพิ่ม” ด้านบนเพื่อเพิ่มขนาดแรก" />
        ) : (
          !visible.length && (
            <div className={s.empty}>
              <Icon name="search" size={40} />
              <p>ไม่พบขนาดที่ค้นหา</p>
            </div>
          )
        )}
      </div>
    </>
  );
}
