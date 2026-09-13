import React, { useState, useEffect, useMemo } from "react";
import { pageTitle } from "../config/branding";
import { Helmet } from "react-helmet";
import { Banknote, List, BarChart3, Tags, CalendarRange } from "lucide-react";
import { expensesApi } from "../api/expensesApi";
import ExpenseListTab from "../components/expenses/ExpenseListTab";
import ExpenseGroupedTab from "../components/expenses/ExpenseGroupedTab";
import ExpenseStatsTab from "../components/expenses/ExpenseStatsTab";
import ExpenseCategoriesTab from "../components/expenses/ExpenseCategoriesTab";

const Box = "div";

const TABS = [
  { id: "list", label: "Siyahı", icon: List },
  { id: "grouped", label: "Günlük / Aylıq", icon: CalendarRange },
  { id: "stats", label: "Statistika", icon: BarChart3 },
  { id: "categories", label: "Kateqoriyalar", icon: Tags },
];

function useExpensePermissions() {
  return useMemo(() => {
    const role = localStorage.getItem("role") || "";
    const isAdmin = role === "admin" || role === "super-admin";
    return {
      view: isAdmin,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
      export: isAdmin,
      manageCategories: isAdmin,
    };
  }, []);
}

export default function Expenses() {
  const [tab, setTab] = useState("list");
  const [categories, setCategories] = useState([]);
  const permissions = useExpensePermissions();

  const loadCategories = async () => {
    try {
      const res = await expensesApi.listCategories();
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (permissions.view) loadCategories();
  }, [permissions.view]);

  if (!permissions.view) {
    return (
      <section className="p-8 text-center text-slate-600">
        Xərclər bölməsinə baxış icazəniz yoxdur.
      </section>
    );
  }

  return (
    <section className="w-full p-3 sm:p-4">
      <Helmet>
        <title>{pageTitle("Xərclər")}</title>
      </Helmet>

      <Box className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Box className="px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-3">
          <Box className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center">
            <Banknote size={22} />
          </Box>
          <Box>
            <h1 className="text-lg font-bold">Xərclər</h1>
            <p className="text-xs text-indigo-100">Qeyd, hesabat və kateqoriya idarəetməsi</p>
          </Box>
        </Box>

        <Box className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                tab === id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </Box>

        <Box className="p-4">
          {tab === "list" && (
            <ExpenseListTab categories={categories} permissions={permissions} />
          )}
          {tab === "grouped" && <ExpenseGroupedTab />}
          {tab === "stats" && (
            <ExpenseStatsTab permissions={permissions} />
          )}
          {tab === "categories" && (
            <ExpenseCategoriesTab
              categories={categories}
              onRefresh={loadCategories}
              permissions={permissions}
            />
          )}
        </Box>
      </Box>
    </section>
  );
}
