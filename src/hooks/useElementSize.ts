"use client";

import { useEffect, useState } from "react";

/**
 * วัดขนาดกล่องแบบสด ๆ ด้วย ResizeObserver
 * คืน callback ref ไปใส่ที่ element และขนาดล่าสุด (px)
 */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(element);
    return () => ro.disconnect();
  }, [element]);

  return [setElement, size] as const;
}
