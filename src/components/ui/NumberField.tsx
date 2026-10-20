"use client";

import { useId, useState } from "react";
import type { Unit } from "@/types";
import {
  UNIT_LABEL,
  formatConverted,
  formatNumber,
  fromUnit,
  parseDecimal,
  snapIntoRange,
  stepMm,
} from "@/lib/units";
import { Icon } from "./Icon";
import s from "./ui.module.css";

interface NumberFieldProps {
  label: string;
  /** ค่าปัจจุบันเป็น mm */
  valueMm: number;
  unit: Unit;
  minMm: number;
  maxMm: number;
  /** เรียกเมื่อได้ค่าที่ถูกต้อง (mm) */
  onChange: (mm: number) => void;
}

/**
 * ช่องกรอกขนาดพร้อมปุ่ม −/+ แสดงตามหน่วยที่เลือก และบอกค่าในอีกหน่วยกำกับ
 * ระหว่างพิมพ์จะเก็บข้อความไว้ก่อน ค่าที่ผิดช่วงจะขึ้นข้อความเตือนแต่ไม่ส่งออกไป
 */
export function NumberField({ label, valueMm, unit, minMm, maxMm, onChange }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");
  const rangeText = `${formatNumber(minMm, unit)}–${formatNumber(maxMm, unit)} ${UNIT_LABEL[unit]}`;

  /** ตรวจช่วงแล้วส่งค่าออก คืน true เมื่อสำเร็จ */
  const commit = (mm: number): boolean => {
    const ok = snapIntoRange(mm, minMm, maxMm);
    if (ok === null) {
      setError(`ต้องอยู่ระหว่าง ${rangeText}`);
      return false;
    }
    setError("");
    onChange(ok);
    return true;
  };

  /** พิมพ์ตัวเลข */
  const onType = (text: string) => {
    setDraft(text);
    const v = parseDecimal(text);
    if (Number.isNaN(v)) {
      setError("ใส่ตัวเลขก่อน");
      return;
    }
    commit(fromUnit(v, unit));
  };

  /** กด − หรือ + */
  const onStep = (dir: 1 | -1) => {
    setDraft(null);
    commit(stepMm(valueMm, unit, dir));
  };

  return (
    <div className={s.field}>
      <label className={s.fieldLabel} htmlFor={id}>
        <span>
          {label} ({UNIT_LABEL[unit]})
        </span>
        <span className={s.converted}>{formatConverted(valueMm, unit)}</span>
      </label>
      <div className={s.stepper}>
        <button type="button" onClick={() => onStep(-1)} aria-label={`ลด${label}`}>
          <Icon name="minus" />
        </button>
        <input
          id={id}
          inputMode="decimal"
          value={draft ?? formatNumber(valueMm, unit)}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onType(e.target.value)}
          onBlur={() => setDraft(null)}
        />
        <button type="button" onClick={() => onStep(1)} aria-label={`เพิ่ม${label}`}>
          <Icon name="plus" />
        </button>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface QuantityFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}

/** ช่องจำนวนเต็มพร้อมปุ่ม −/+ (ใช้ตั้งจำนวนกรอบ) */
export function QuantityField({ label, value, min = 1, max = 200, onChange }: QuantityFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState("");

  /** พิมพ์จำนวน */
  const onType = (text: string) => {
    setDraft(text);
    const n = parseInt(text, 10);
    if (Number.isNaN(n) || n < min || n > max) {
      setError(`ใส่จำนวน ${min}–${max}`);
      return;
    }
    setError("");
    onChange(n);
  };

  /** กด − หรือ + */
  const onStep = (dir: 1 | -1) => {
    setDraft(null);
    setError("");
    onChange(Math.max(min, Math.min(max, value + dir)));
  };

  return (
    <div className={s.field}>
      <div className={s.stepper} style={{ width: "fit-content" }}>
        <button type="button" onClick={() => onStep(-1)} aria-label={`ลด${label}`}>
          <Icon name="minus" />
        </button>
        <input
          inputMode="numeric"
          style={{ width: 64 }}
          value={draft ?? String(value)}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onType(e.target.value)}
          onBlur={() => setDraft(null)}
        />
        <button type="button" onClick={() => onStep(1)} aria-label={`เพิ่ม${label}`}>
          <Icon name="plus" />
        </button>
      </div>
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
