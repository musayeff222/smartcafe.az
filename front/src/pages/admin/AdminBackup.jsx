import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Database,
  Loader2,
  Download,
  Trash2,
  Send,
  Bot,
  Plus,
  RotateCcw,
} from "lucide-react";
import { adminDelete, adminGet, adminPost, adminPut, friendlyError } from "./adminApi";
import { base_url } from "../../api/index";
import ConfirmDialog from "./ui/ConfirmDialog";
import Button from "./ui/Button";

function fmtSize(n) {
  const b = Number(n || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function typeLabel(row) {
  if (row.type === "manual") return "Versiya";
  if (row.type === "auto") return "Avtomatik";
  return row.type || "—";
}

function AdminBackup() {
  const [data, setData] = useState(null);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [chatId, setChatId] = useState("");
  const [savingTg, setSavingTg] = useState(false);
  const [testingTg, setTestingTg] = useState(false);
  const [restoreRow, setRestoreRow] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const load = () =>
    Promise.all([adminGet("/admin/backups"), adminGet("/admin/telegram")])
      .then(([b, t]) => {
        setData(b.data);
        setChatId(t.data?.chat_id || "");
      })
      .catch((e) => toast.error(friendlyError(e, "Backup siyahısı yüklənmədi")));

  useEffect(() => {
    load();
  }, []);

  const run = async (e) => {
    e?.preventDefault?.();
    const name = label.trim();
    if (!name) {
      toast.error("Backup üçün ad yazın");
      return;
    }
    setRunning(true);
    try {
      const res = await adminPost("/admin/backups", { label: name });
      toast.success(res.data.message || "Backup hazırdır");
      setLabel("");
      await load();
    } catch (err) {
      toast.error(friendlyError(err, "Backup alınmadı"));
      await load();
    } finally {
      setRunning(false);
    }
  };

  const saveChatId = async (e) => {
    e.preventDefault();
    setSavingTg(true);
    try {
      const res = await adminPut("/admin/telegram", { chat_id: chatId.trim() });
      setChatId(res.data.chat_id || chatId);
      toast.success(res.data.message || "Chat ID yadda saxlandı");
      await load();
    } catch (err) {
      toast.error(friendlyError(err, "Chat ID saxlanmadı"));
    } finally {
      setSavingTg(false);
    }
  };

  const testTelegram = async () => {
    setTestingTg(true);
    try {
      const res = await adminPost("/admin/telegram/test", {});
      toast.success(res.data.message || "Test mesajı göndərildi");
    } catch (err) {
      toast.error(friendlyError(err, "Test mesajı getmədi"));
    } finally {
      setTestingTg(false);
    }
  };

  const download = (row) => {
    const url = `${base_url}/admin/backups/${row.id}/download`;
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Yüklənmədi");
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = row.name;
        a.click();
      })
      .catch(() => toast.error("Yüklənmədi"));
  };

  const remove = async (row) => {
    if (!password) {
      toast.error("Silmək üçün super-admin şifrəsini daxil edin");
      return;
    }
    if (!window.confirm(`${row.label || row.name} silinsin?`)) return;
    try {
      await adminDelete(`/admin/backups/${row.id}`, { password });
      toast.success("Silindi");
      await load();
    } catch (e) {
      toast.error(friendlyError(e, "Silinmədi"));
    }
  };

  const restore = async ({ password: pin }) => {
    if (!restoreRow) return;
    setRestoring(true);
    try {
      const res = await adminPost(
        `/admin/backups/${restoreRow.id}/restore`,
        { password: pin, confirm: "BƏRPA" },
        { "X-Confirm-Restore": "RESTORE" }
      );
      toast.success(res.data.message || "Versiya bərpa olundu");
      setRestoreRow(null);
      await load();
    } catch (e) {
      toast.error(friendlyError(e, "Bərpa alınmadı"));
    } finally {
      setRestoring(false);
    }
  };

  if (!data) return <div className="h-40 rounded-2xl bg-white border animate-pulse" />;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database size={22} className="text-indigo-600" /> Backup / Versiyalar
        </h2>
      </div>

      <form
        onSubmit={run}
        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
      >
        <div className="font-semibold text-slate-800">Yeni backup al</div>
        <p className="text-sm text-slate-500">
          Ad yazın — bu backup versiya kimi saxlanır və buradan geri yüklənə bilər.
          Avtomatik gecə backup-ları 14 gün sonra silinir; adlı versiyalar qalır.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Məs: 25 avqust axşam, menyu dəyişməmişdən əvvəl"
            maxLength={80}
            className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
          <Button type="submit" variant="primary" loading={running} icon={Plus}>
            Backup al
          </Button>
        </div>
      </form>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border p-4 text-sm">
          Avtomatik: {data.automatic ? "aktiv (03:00)" : "yox"}
        </div>
        <div className="bg-white rounded-2xl border p-4 text-sm">
          Son: {data.last_backup_at ? String(data.last_backup_at).replace("T", " ").slice(0, 19) : "-"}
        </div>
        <div className="bg-white rounded-2xl border p-4 text-sm">
          Növbəti: {data.next_backup_at ? String(data.next_backup_at).replace("T", " ").slice(0, 16) : "-"}
          <div className="text-xs text-slate-400 mt-1">
            Telegram: {data.telegram_configured ? "hazırdır" : "token və ya Chat ID çatışmır"}
          </div>
        </div>
      </div>

      <form onSubmit={saveChatId} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Bot size={18} className="text-indigo-600" />
          Telegram bot
        </div>
        <p className="text-sm text-slate-500">
          Backup hazır olanda ZIP faylı Telegram-a göndərilir. Chat ID-ni burada əlavə edin.
        </p>
        <div className="text-xs">
          Token:{" "}
          <span className={data.telegram?.bot_token_configured ? "text-emerald-700" : "text-amber-700"}>
            {data.telegram?.bot_token_configured ? "serverdə var" : "hələ yoxdur — tokeni mənə göndərin"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Chat ID, məs: 123456789 və ya -100..."
            required
            className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
          <button
            type="submit"
            disabled={savingTg}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {savingTg && <Loader2 size={16} className="animate-spin" />}
            Saxla
          </button>
          <button
            type="button"
            onClick={testTelegram}
            disabled={testingTg}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm inline-flex items-center justify-center gap-2"
          >
            {testingTg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Test
          </button>
        </div>
      </form>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Silmə üçün super-admin şifrəsi"
        className="w-full max-w-sm px-3 py-2 border rounded-xl text-sm"
      />

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs uppercase text-slate-500 bg-slate-50">
          <div className="col-span-4">Versiya</div>
          <div className="col-span-2">Tip</div>
          <div className="col-span-2">Ölçü</div>
          <div className="col-span-2">Vaxt</div>
          <div className="col-span-2">Əməliyyat</div>
        </div>
        {(data.items || []).length === 0 && (
          <p className="p-5 text-sm text-slate-500">Backup yoxdur.</p>
        )}
        {(data.items || []).map((row) => (
          <div key={row.id} className="grid md:grid-cols-12 gap-2 px-4 py-3 border-t text-sm">
            <div className="md:col-span-4 min-w-0">
              <div className="font-medium text-slate-800 break-words">
                {row.label || row.name}
              </div>
              {row.label && (
                <div className="text-xs text-slate-400 break-all">{row.name}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <span className={row.status === "success" ? "text-emerald-700" : "text-rose-700"}>
                {row.status === "success" ? typeLabel(row) : row.status}
              </span>
            </div>
            <div className="md:col-span-2 text-slate-500">{fmtSize(row.size_bytes)}</div>
            <div className="md:col-span-2 text-slate-500">
              {String(row.created_at || "").replace("T", " ").slice(0, 16)}
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              {row.status === "success" && (
                <>
                  <button
                    type="button"
                    title="Geri yüklə"
                    onClick={() => setRestoreRow(row)}
                    className="p-2 border rounded-lg text-indigo-600"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button type="button" onClick={() => download(row)} className="p-2 border rounded-lg">
                    <Download size={14} />
                  </button>
                </>
              )}
              <button type="button" onClick={() => remove(row)} className="p-2 border rounded-lg text-rose-600">
                <Trash2 size={14} />
              </button>
            </div>
            {row.error && <div className="md:col-span-12 text-xs text-rose-600">{row.error}</div>}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Geri yükləmə bazanı və yüklənmiş faylları həmin versiyaya qaytarır. Kod (PHP/JS) dəyişmir.
        Bərpadan sonra yenidən daxil olmaq lazım ola bilər.
      </p>

      <ConfirmDialog
        open={!!restoreRow}
        onClose={() => !restoring && setRestoreRow(null)}
        onConfirm={restore}
        title="Bu versiyanı geri yükləmək?"
        description={
          restoreRow
            ? `"${restoreRow.label || restoreRow.name}" canlı bazanı əvəz edəcək. Bu əməliyyat geri alına bilməz.`
            : ""
        }
        confirmText="Geri yüklə"
        requireTyped="BƏRPA"
        requirePassword
        loading={restoring}
      />
    </div>
  );
}

export default AdminBackup;
