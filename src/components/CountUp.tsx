"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";

export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(from.current, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString("en-IN"); },
    });
    from.current = value;
    return () => controls.stop();
  }, [value]);
  return <span ref={ref} className="tabular-nums">0</span>;
}
