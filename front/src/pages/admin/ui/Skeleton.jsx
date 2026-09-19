import React from "react";

export default function Skeleton({ className = "", rounded = "rounded-xl", ...rest }) {
  return (
    <div
      className={[
        "animate-pulse bg-slate-200/70 dark:bg-white/10",
        rounded,
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex gap-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "h-28" }) {
  return <Skeleton className={className} rounded="rounded-2xl" />;
}
