import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const DENSITY = {
  compact: { row: "py-1.5", cell: "px-3 py-1.5", head: "px-3 py-2" },
  comfortable: { row: "py-2.5", cell: "px-3 py-2.5", head: "px-3 py-2.5" },
  spacious: { row: "py-4", cell: "px-4 py-3.5", head: "px-4 py-3" },
};

export default function Table({
  columns,
  rows,
  getRowKey,
  sort,
  onSort,
  density = "comfortable",
  emptyState = null,
  stickyHeader = true,
  className = "",
  rowClassName,
  onRowClick,
  selection,
  onSelectionChange,
  allSelected = false,
  onSelectAll,
}) {
  const d = DENSITY[density] || DENSITY.comfortable;
  const visibleCols = columns.filter((c) => !c.hidden);

  const toggleSort = (col) => {
    if (!col.sortable || !onSort) return;
    if (sort?.key === col.key) {
      onSort({ key: col.key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      onSort({ key: col.key, dir: "asc" });
    }
  };

  return (
    <div className={["overflow-x-auto", className].join(" ")}>
      <table className="min-w-full text-sm">
        <thead
          className={[
            "text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400",
            "bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-[#1f2a44]",
            stickyHeader ? "sticky top-0 z-10" : "",
          ].join(" ")}
        >
          <tr>
            {onSelectionChange && (
              <th className={[d.head, "text-left w-8"].join(" ")}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  aria-label="Hamısını seç"
                />
              </th>
            )}
            {visibleCols.map((col) => {
              const isSorted = sort?.key === col.key;
              const align = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
              return (
                <th
                  key={col.key}
                  className={[d.head, align, col.className || "", "font-semibold whitespace-nowrap"].join(" ")}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-100"
                    >
                      {col.label}
                      {isSorted ? (
                        sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleCols.length + (onSelectionChange ? 1 : 0)}
                className="p-0"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = getRowKey ? getRowKey(row) : row.id;
              const selected = selection?.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={[
                    "transition",
                    onRowClick ? "cursor-pointer" : "",
                    selected
                      ? "bg-indigo-50/60 dark:bg-indigo-500/10"
                      : "hover:bg-slate-50/70 dark:hover:bg-white/[0.02]",
                    typeof rowClassName === "function" ? rowClassName(row) : "",
                  ].join(" ")}
                >
                  {onSelectionChange && (
                    <td
                      className={[d.cell, "w-8"].join(" ")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...(selection || []), key]
                            : (selection || []).filter((x) => x !== key);
                          onSelectionChange?.(next);
                        }}
                        aria-label={`Sətir ${key} seçimi`}
                      />
                    </td>
                  )}
                  {visibleCols.map((col) => {
                    const align = col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";
                    const content = col.render
                      ? col.render(row)
                      : col.key.split(".").reduce((v, k) => v?.[k], row);
                    return (
                      <td
                        key={col.key}
                        className={[d.cell, align, col.cellClassName || "", "text-slate-700 dark:text-slate-200 align-middle"].join(" ")}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
