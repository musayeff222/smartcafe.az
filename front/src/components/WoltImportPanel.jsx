import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { base_url, getAuthHeaders } from "../api/index";
import { useLanguage } from "../i18n/LanguageContext";
import {
  X,
  Loader2,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ExternalLink,
} from "lucide-react";

function WoltImportPanel({ open, onClose, onImported }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState({});
  const [showOnQr, setShowOnQr] = useState(true);
  const [defaultAmount, setDefaultAmount] = useState(999);
  const [skipExisting, setSkipExisting] = useState(true);
  const [downloadImages, setDownloadImages] = useState(true);
  const [filter, setFilter] = useState("");

  const allItemIds = useMemo(() => {
    if (!preview?.categories) return [];
    return preview.categories.flatMap((c) => c.items.map((i) => i.wolt_id));
  }, [preview]);

  const filteredCategories = useMemo(() => {
    if (!preview?.categories) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return preview.categories;
    return preview.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [preview, filter]);

  const resetState = useCallback(() => {
    setPreview(null);
    setSelected(new Set());
    setExpanded({});
    setFilter("");
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePreview = async () => {
    if (!url.trim()) {
      toast.error(t("stok.woltUrlRequired"));
      return;
    }
    setLoading(true);
    resetState();
    try {
      const res = await axios.post(
        `${base_url}/wolt-menu/preview`,
        { url: url.trim() },
        getAuthHeaders()
      );
      setPreview(res.data);
      const ids = res.data.categories.flatMap((c) => c.items.map((i) => i.wolt_id));
      setSelected(new Set(ids));
      const exp = {};
      res.data.categories.forEach((c) => {
        exp[c.wolt_id] = true;
      });
      setExpanded(exp);
      toast.success(
        `${res.data.venue_name}: ${res.data.total_items} ${t("stok.woltProducts")}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || t("stok.woltPreviewError"));
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat) => {
    const ids = cat.items.map((i) => i.wolt_id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const selectAll = (value) => {
    setSelected(value ? new Set(allItemIds) : new Set());
  };

  const handleImport = async () => {
    if (!preview || selected.size === 0) {
      toast.error(t("stok.woltSelectItems"));
      return;
    }
    if (!window.confirm(t("stok.woltImportConfirm", { count: selected.size }))) return;

    setImporting(true);
    toast.info(t("stok.woltImportWait"), { autoClose: 8000 });
    try {
      const res = await axios.post(
        `${base_url}/wolt-menu/import`,
        {
          url: url.trim(),
          show_on_qr: showOnQr,
          default_amount: defaultAmount,
          skip_existing: skipExisting,
          download_images: downloadImages,
          item_ids: Array.from(selected),
        },
        { ...getAuthHeaders(), timeout: 300000 }
      );
      const s = res.data.stats;
      toast.success(
        `${t("stok.woltImportDone")}: ${s.imported} ${t("stok.woltAdded")}, ${s.skipped} ${t("stok.woltSkipped")}`
      );
      onImported?.();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t("stok.woltImportError"));
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-full sm:max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start gap-3 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Download size={20} className="text-indigo-600" />
              {t("stok.woltImportTitle")}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">{t("stok.woltImportHint")}</p>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("stok.woltUrlPlaceholder")}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2.5 text-sm dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {t("stok.woltFetch")}
            </button>
          </div>

          {preview && (
            <>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-4">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">{preview.venue_name}</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  {preview.total_categories} {t("stok.woltCategories")} · {preview.total_items} {t("stok.woltProducts")}
                </p>
                <a
                  href={`https://wolt.com/az/aze/baku/restaurant/${preview.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 hover:underline"
                >
                  Wolt <ExternalLink size={12} />
                </a>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={showOnQr} onChange={(e) => setShowOnQr(e.target.checked)} className="rounded text-indigo-600" />
                  {t("stok.woltShowOnQr")}
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} className="rounded text-indigo-600" />
                  {t("stok.woltSkipExisting")}
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={downloadImages} onChange={(e) => setDownloadImages(e.target.checked)} className="rounded text-indigo-600" />
                  {t("stok.woltDownloadImages")}
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-slate-600 shrink-0">{t("stok.woltDefaultStock")}:</span>
                  <input
                    type="number"
                    min={0}
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(Number(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:bg-slate-800"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={t("stok.woltSearchItems")}
                  className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:bg-slate-800"
                />
                <button type="button" onClick={() => selectAll(true)} className="text-xs font-medium text-indigo-600 hover:underline">
                  {t("stok.woltSelectAll")}
                </button>
                <button type="button" onClick={() => selectAll(false)} className="text-xs font-medium text-slate-500 hover:underline">
                  {t("stok.woltClearAll")}
                </button>
                <span className="text-xs text-slate-500 ml-auto">
                  {selected.size} / {allItemIds.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const catIds = cat.items.map((i) => i.wolt_id);
                  const catAll = catIds.length > 0 && catIds.every((id) => selected.has(id));
                  const isOpen = expanded[cat.wolt_id];

                  return (
                    <div key={cat.wolt_id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                        <button type="button" onClick={() => toggleCategory(cat)} className="text-indigo-600">
                          {catAll ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => ({ ...p, [cat.wolt_id]: !p[cat.wolt_id] }))}
                          className="flex-1 flex items-center justify-between text-left font-semibold text-sm text-slate-800 dark:text-slate-100"
                        >
                          <span>{cat.name} ({cat.items.length})</span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {isOpen && (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                          {cat.items.map((item) => (
                            <li key={item.wolt_id} className="flex items-start gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <button type="button" onClick={() => toggleItem(item.wolt_id)} className="mt-0.5 text-indigo-600 shrink-0">
                                {selected.has(item.wolt_id) ? <CheckSquare size={16} /> : <Square size={16} />}
                              </button>
                              {item.image_url && (
                                <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                                {item.description && (
                                  <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                {Number(item.price).toFixed(2)} ₼
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {preview && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {t("stok.woltImportBtn")} ({selected.size})
            </button>
            <button type="button" onClick={handleClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">
              {t("common.close")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default WoltImportPanel;
