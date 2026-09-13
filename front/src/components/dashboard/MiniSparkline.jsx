import React from "react";

export default function MiniSparkline({ data = [], color = "#6366f1", height = 32 }) {
  const values = data.map((d) => (typeof d === "number" ? d : Number(d?.value) || 0));
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 80;
  const h = height;
  const step = w / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-80 shrink-0" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}
