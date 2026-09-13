import React, { useState } from "react";
import { Pencil, Trash2, FolderPlus } from "lucide-react";
import { expensesApi } from "../../api/expensesApi";

const Box = "div";

export default function ExpenseCategoriesTab({ categories, onRefresh, permissions }) {
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await expensesApi.createCategory(name.trim());
    setName("");
    onRefresh();
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    await expensesApi.updateCategory(editId, editName.trim());
    setEditId(null);
    onRefresh();
  };

  const remove = async (cat) => {
    if (!window.confirm(`"${cat.name}" silinsin?`)) return;
    await expensesApi.deleteCategory(cat.id);
    onRefresh();
  };

  if (!permissions.manageCategories) {
    return <p className="text-sm text-slate-500">Kateqoriya idarəetmə icazəniz yoxdur.</p>;
  }

  return (
    <Box>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yeni kateqoriya adı"
          className="flex-1 rounded-lg border py-2 px-3 text-sm"
        />
        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white font-semibold">
          <FolderPlus size={16} /> Əlavə et
        </button>
      </form>

      <Box className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="p-3 text-left">Ad</th>
              <th className="p-3 text-right">Cəmi xərc</th>
              <th className="p-3 text-center">Tip</th>
              <th className="p-3 w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="p-3">
                  {editId === cat.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded border px-2 py-1"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="p-3 text-right">{Number(cat.total_expense).toFixed(2)} ₼</td>
                <td className="p-3 text-center text-xs">
                  {cat.is_system ? (
                    <span className="text-slate-500">Standart</span>
                  ) : (
                    <span className="text-indigo-600">Xüsusi</span>
                  )}
                </td>
                <td className="p-3">
                  <Box className="flex justify-end gap-1">
                    {editId === cat.id ? (
                      <button type="button" onClick={saveEdit} className="text-xs text-indigo-600 font-semibold px-2">
                        Saxla
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setEditId(cat.id); setEditName(cat.name); }} className="p-1.5 rounded bg-slate-100">
                        <Pencil size={14} />
                      </button>
                    )}
                    {!cat.is_system && (
                      <button type="button" onClick={() => remove(cat)} className="p-1.5 rounded bg-red-50 text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      <p className="text-xs text-slate-500 mt-2">
        Standart kateqoriyalar: Məhsul alışları, Maaş, Kommunal, İcarə, Vergi, Təmir, Reklam, Kuryer, Mətbəx xərcləri, Digər
      </p>
    </Box>
  );
}
