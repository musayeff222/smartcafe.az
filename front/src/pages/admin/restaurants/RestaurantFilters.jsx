import React from "react";
import { Search, RefreshCw, Rows3, Rows2, StretchHorizontal, Columns3 } from "lucide-react";
import Button from "../ui/Button";

const STATUS = [
  { id: "all", label: "Hamısı" },
  { id: "active", label: "Aktiv" },
  { id: "expiring", label: "Bitmək üzrə" },
  { id: "expired", label: "Vaxtı keçib" },
  { id: "inactive", label: "Passiv" },
];

const DENSITY_ICONS = {
  compact: Rows3,
  comfortable: Rows2,
  spacious: StretchHorizontal,
};

export default function RestaurantFilters({
  search,
  onSearch,
  status,
  onStatus,
  onRefresh,
  density,
  onDensity,
  columns,
  visibleColumns,
  onColumnsChange,
}) {
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const cycleDensity = () => {
    const order = ["compact", "comfortable", "spacious"];
    const i = order.indexOf(density);
    onDensity?.(order[(i + 1) % order.length]);
  };
  const DensityIcon = DENSITY_ICONS[density] || Rows2;

  return (
    <div className="bg-white dark:bg-[#111a2e] rounded-2xl border border-slate-200 dark:border-[#1f2a44] p-3 sm:p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Restoran adı, admin, email və ya ID..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0f1830] border border-slate-200 dark:border-[#1f2a44] rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <div className="flex overflow-x-auto gap-1.5">
          {STATUS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onStatus(f.id)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition ${
                status === f.id
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={DensityIcon} onClick={cycleDensity} title="Sıxlıq">
            <span className="hidden sm:inline capitalize">{density}</span>
          </Button>
          <div ref={ref} className="relative">
            <Button
              variant="secondary"
              size="sm"
              icon={Columns3}
              onClick={() => setColumnsOpen((v) => !v)}
              title="Sütunlar"
            >
              <span className="hidden sm:inline">Sütunlar</span>
            </Button>
            {columnsOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-[#1f2a44] shadow-admin-lg z-20 py-1">
                {columns.map((c) => {
                  const on = visibleColumns.includes(c.key);
                  return (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...visibleColumns, c.key]
                            : visibleColumns.filter((k) => k !== c.key);
                          onColumnsChange?.(next);
                        }}
                      />
                      <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRefresh} title="Yenilə" />
        </div>
      </div>
    </div>
  );
}
