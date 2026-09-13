import React, { useCallback, useEffect, useMemo, useState } from "react";
import { pageTitle } from "../config/branding";
import AddPersonel from "../components/AddPersonel";
import EditPersonelPopup from "../components/EditPersonelPopup";
import axios from "axios";
import AccessDenied from "../components/AccessDenied";
import { base_url, getAuthHeaders } from "../api/index";
import { Helmet } from "react-helmet";
import PasswordScreen from "../components/ScreenPassword";
import { useLanguage } from "../i18n/LanguageContext";
import { mapPersonelFromApi, usePersonelLabels } from "../utils/personelHelpers";
import { toast } from "react-toastify";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";

function PersonelTanimlari() {
  const { t } = useLanguage();
  const { roleLabel, roleBadgeClass } = usePersonelLabels();

  const [showAdd, setShowAdd] = useState(false);
  const [editPersonel, setEditPersonel] = useState(null);
  const [personels, setPersonels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchPersonels = useCallback(() => {
    setLoading(true);
    axios
      .get(`${base_url}/personal`, getAuthHeaders())
      .then((response) => {
        setPersonels((response.data.data || []).map(mapPersonelFromApi));
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          if (error.response.data?.message?.includes("active restaurant")) {
            toast.error(t("personel.loadError"));
          } else if (error.response.data?.message === "Forbidden") {
            setAccessDenied(true);
          }
        } else {
          toast.error(t("personel.loadError"));
        }
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    fetchPersonels();
  }, [fetchPersonels]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return personels;
    return personels.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        roleLabel(p.type).toLowerCase().includes(q)
    );
  }, [personels, search, roleLabel]);

  const stats = useMemo(
    () => ({
      total: personels.length,
      general: personels.filter((p) => p.type === "general").length,
      waiter: personels.filter((p) => p.type === "waiter").length,
    }),
    [personels]
  );

  const handleAdd = async (payload) => {
    try {
      const response = await axios.post(`${base_url}/personal`, payload, getAuthHeaders());
      const created = mapPersonelFromApi(response.data.data);
      setPersonels((prev) => [...prev, created]);
      setShowAdd(false);
      toast.success(t("personel.added"));
    } catch (error) {
      const msg = error.response?.data?.message || t("personel.saveError");
      toast.error(msg);
      throw error;
    }
  };

  const handleSave = async (payload) => {
    try {
      const response = await axios.put(`${base_url}/personal/${payload.id}`, payload, getAuthHeaders());
      const updated = mapPersonelFromApi(response.data.data);
      setPersonels((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditPersonel(null);
      toast.success(t("personel.updated"));
    } catch (error) {
      const msg = error.response?.data?.message || t("personel.saveError");
      toast.error(msg);
      throw error;
    }
  };

  const handleDelete = async (personel) => {
    if (!window.confirm(t("personel.deleteConfirm", { name: personel.name }))) return;
    try {
      await axios.delete(`${base_url}/personal/${personel.id}`, getAuthHeaders());
      setPersonels((prev) => prev.filter((p) => p.id !== personel.id));
      toast.success(t("personel.deleted"));
    } catch (error) {
      toast.error(error.response?.data?.message || t("personel.saveError"));
    }
  };

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <PasswordScreen />
      <Helmet>
        <title>{pageTitle(t("personel.title"))}</title>
        <meta name="description" content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi" />
      </Helmet>

      <section className="p-3 sm:p-4 max-w-[1200px] mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UserCog size={24} className="text-indigo-600" />
              {t("personel.title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("personel.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchPersonels}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {t("masalar.refresh")}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              <UserPlus size={16} />
              {t("personel.addNew")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("personel.statTotal"), value: stats.total, icon: Users, color: "indigo" },
            { label: t("personel.roleGeneral"), value: stats.general, icon: UserCog, color: "violet" },
            { label: t("personel.roleWaiter"), value: stats.waiter, icon: UtensilsCrossed, color: "emerald" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <s.icon size={14} />
                {s.label}
              </div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("personel.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm dark:bg-slate-800"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{t("personel.empty")}</p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            >
              <UserPlus size={16} />
              {t("personel.addNew")}
            </button>
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 font-semibold">{t("personel.fullName")}</th>
                    <th className="p-3 font-semibold">{t("personel.email")}</th>
                    <th className="p-3 font-semibold">{t("personel.type")}</th>
                    <th className="p-3 font-semibold text-center w-32">{t("common.detail")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((personel) => (
                    <tr key={personel.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{personel.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{personel.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${roleBadgeClass(personel.type)}`}>
                          {roleLabel(personel.type)}
                        </span>
                        {personel.type === "general" && personel.permissions?.length > 0 && (
                          <span className="ml-2 text-[10px] text-slate-400">
                            {personel.permissions.length} {t("personel.permCount")}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditPersonel(personel)}
                            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title={t("common.update")}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(personel)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title={t("common.delete")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((personel) => (
                <div
                  key={personel.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{personel.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{personel.email}</p>
                    </div>
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${roleBadgeClass(personel.type)}`}>
                      {roleLabel(personel.type)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditPersonel(personel)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium"
                    >
                      <Pencil size={14} />
                      {t("common.update")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(personel)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium"
                    >
                      <Trash2 size={14} />
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <AddPersonel open={showAdd} onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      {editPersonel && (
        <EditPersonelPopup
          personel={editPersonel}
          onSave={handleSave}
          onClose={() => setEditPersonel(null)}
        />
      )}
    </>
  );
}

export default PersonelTanimlari;
