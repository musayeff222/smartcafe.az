import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Eye, Download, Printer } from "lucide-react";
import { expensesApi } from "../../api/expensesApi";
import { paymentLabel, statusLabel, PAYMENT_METHODS, EXPENSE_STATUSES } from "./constants";
import ExpenseFormModal from "./ExpenseFormModal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { img_url } from "../../api/index";

const Box = "div";

export default function ExpenseListTab({ categories, permissions }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    date_from: "",
    date_to: "",
    amount_min: "",
    amount_max: "",
    status: "",
    payment_method: "",
    page: 1,
  });
  const [modal, setModal] = useState({ open: false, item: null, view: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page: filters.page };
      Object.entries(filters).forEach(([k, v]) => {
        if (k !== "page" && v !== "" && v != null) params[k] = v;
      });
      const res = await expensesApi.list(params);
      setRows(res.data.data || []);
      setMeta({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value, page: 1 }));
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (modal.item?.id) {
        await expensesApi.update(modal.item.id, formData);
      } else {
        await expensesApi.create(formData);
      }
      setModal({ open: false, item: null, view: false });
      load();
    } catch (e) {
      alert("Xəta: saxlanılmadı");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu xərc silinsin?")) return;
    try {
      await expensesApi.remove(id);
      load();
    } catch (e) {
      alert("Silinmədi");
    }
  };

  const doExport = async () => {
    const res = await expensesApi.exportRows({
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id,
    });
    const data = (res.data.rows || []).map((r) => ({
      ID: r.id,
      Ad: r.name,
      Kateqoriya: r.category?.name,
      Mebleg: r.amount,
      Tarix: r.expense_date,
      Odenis: paymentLabel(r.payment_method),
      "Elave eden": r.creator?.name,
      Status: statusLabel(r.status),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xərclər");
    XLSX.writeFile(wb, "xercler.xlsx");
  };

  const doPrint = async () => {
    const res = await expensesApi.exportRows({
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id,
    });
    const doc = new jsPDF();
    doc.text("Xərc hesabatı", 14, 16);
    doc.autoTable({
      head: [["ID", "Ad", "Kateqoriya", "Məbləğ", "Tarix", "Ödəniş", "Status"]],
      body: (res.data.rows || []).map((r) => [
        r.id,
        r.name,
        r.category?.name,
        r.amount,
        r.expense_date,
        paymentLabel(r.payment_method),
        statusLabel(r.status),
      ]),
      startY: 24,
    });
    doc.save("xercler.pdf");
  };

  return (
    <Box>
      <Box className="flex flex-wrap gap-2 mb-4">
        {permissions.create && (
          <button
            type="button"
            onClick={() => setModal({ open: true, item: null, view: false })}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">
            <Plus size={16} /> Xərc əlavə et
          </button>
        )}
        {permissions.export && (
          <>
            <button type="button" onClick={doExport} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm">
              <Download size={16} /> Excel
            </button>
            <button type="button" onClick={doPrint} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm">
              <Printer size={16} /> PDF
            </button>
          </>
        )}
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <Box className="relative">
          <Search className="absolute left-2 top-2.5 text-slate-400" size={16} />
          <input name="search" value={filters.search} onChange={handleFilter} placeholder="Axtarış..." className="w-full pl-8 rounded-lg border py-2 text-sm" />
        </Box>
        <select name="category_id" value={filters.category_id} onChange={handleFilter} className="rounded-lg border py-2 text-sm">
          <option value="">Bütün kateqoriyalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input type="date" name="date_from" value={filters.date_from} onChange={handleFilter} className="rounded-lg border py-2 text-sm" />
        <input type="date" name="date_to" value={filters.date_to} onChange={handleFilter} className="rounded-lg border py-2 text-sm" />
        <input type="number" name="amount_min" value={filters.amount_min} onChange={handleFilter} placeholder="Min ₼" className="rounded-lg border py-2 text-sm" />
        <input type="number" name="amount_max" value={filters.amount_max} onChange={handleFilter} placeholder="Max ₼" className="rounded-lg border py-2 text-sm" />
        <select name="status" value={filters.status} onChange={handleFilter} className="rounded-lg border py-2 text-sm">
          <option value="">Status</option>
          {EXPENSE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select name="payment_method" value={filters.payment_method} onChange={handleFilter} className="rounded-lg border py-2 text-sm">
          <option value="">Ödəniş üsulu</option>
          {PAYMENT_METHODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </Box>

      <Box className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Ad</th>
              <th className="p-3">Kateqoriya</th>
              <th className="p-3 text-right">Məbləğ</th>
              <th className="p-3">Tarix</th>
              <th className="p-3">Ödəniş</th>
              <th className="p-3">Əlavə edən</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="p-6 text-center text-slate-500">Yüklənir...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="p-6 text-center text-slate-500">Xərc tapılmadı</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-3">{row.id}</td>
                  <td className="p-3 font-medium">{row.name}</td>
                  <td className="p-3">{row.category?.name}</td>
                  <td className="p-3 text-right font-semibold text-red-600">{Number(row.amount).toFixed(2)} ₼</td>
                  <td className="p-3">{row.expense_date?.slice?.(0, 10) || row.expense_date}</td>
                  <td className="p-3">{paymentLabel(row.payment_method)}</td>
                  <td className="p-3">{row.creator?.name || "—"}</td>
                  <td className="p-3">{statusLabel(row.status)}</td>
                  <td className="p-3">
                    <Box className="flex justify-center gap-1">
                      <button type="button" onClick={() => setModal({ open: true, item: row, view: true })} className="p-1.5 rounded bg-slate-100" title="Bax">
                        <Eye size={14} />
                      </button>
                      {permissions.update && (
                        <button type="button" onClick={() => setModal({ open: true, item: row, view: false })} className="p-1.5 rounded bg-indigo-50 text-indigo-700">
                          <Pencil size={14} />
                        </button>
                      )}
                      {permissions.delete && (
                        <button type="button" onClick={() => handleDelete(row.id)} className="p-1.5 rounded bg-red-50 text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </Box>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Box>

      <Box className="flex items-center justify-between mt-3 text-sm">
        <span className="text-slate-500">Cəmi: {meta.total}</span>
        <Box className="flex gap-2">
          <button type="button" disabled={meta.current_page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="px-3 py-1 border rounded disabled:opacity-40">Əvvəl</button>
          <span>{meta.current_page} / {meta.last_page}</span>
          <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="px-3 py-1 border rounded disabled:opacity-40">Sonra</button>
        </Box>
      </Box>

      {modal.open && modal.view && modal.item && (
        <Box className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60" onClick={() => setModal({ open: false, item: null, view: false })}>
          <Box className="bg-white rounded-xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">{modal.item.name}</h3>
            <dl className="text-sm space-y-1">
              <div><dt className="text-slate-500 inline">Kateqoriya: </dt>{modal.item.category?.name}</div>
              <div><dt className="text-slate-500 inline">Məbləğ: </dt>{Number(modal.item.amount).toFixed(2)} ₼</div>
              <div><dt className="text-slate-500 inline">Tarix: </dt>{modal.item.expense_date}</div>
              <div><dt className="text-slate-500 inline">Ödəniş: </dt>{paymentLabel(modal.item.payment_method)}</div>
              <div><dt className="text-slate-500 inline">Status: </dt>{statusLabel(modal.item.status)}</div>
              <div><dt className="text-slate-500 inline">Qeyd: </dt>{modal.item.note || "—"}</div>
              <div><dt className="text-slate-500 inline">Əlavə edən: </dt>{modal.item.creator?.name || "—"}</div>
            </dl>
            {modal.item.receipt_path && (
              <a href={`${img_url}/${modal.item.receipt_path}`} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm mt-2 inline-block">Çekə bax</a>
            )}
            <button type="button" className="mt-4 w-full rounded-lg border py-2" onClick={() => setModal({ open: false, item: null, view: false })}>Bağla</button>
          </Box>
        </Box>
      )}

      <ExpenseFormModal
        open={modal.open && !modal.view}
        onClose={() => setModal({ open: false, item: null, view: false })}
        onSubmit={handleSave}
        categories={categories}
        initial={modal.item}
        saving={saving}
        canEdit={permissions.update || permissions.create}
      />
    </Box>
  );
}
