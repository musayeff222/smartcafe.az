import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bell } from "lucide-react";
import { base_url } from "../api/index";

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function RestaurantNoticeBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await axios.get(
        `${base_url}/restaurant/notifications`,
        getAuthHeaders()
      );
      setUnread(res.data.unread || 0);
      setItems(res.data.items || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const markAll = async () => {
    await axios.post(
      `${base_url}/restaurant/notifications/read-all`,
      {},
      getAuthHeaders()
    );
    load();
  };

  if (!localStorage.getItem("token")) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-700"
        title="Bildirişlər"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">
              Bildirişlər
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-indigo-600"
              >
                Hamısını oxu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="p-4 text-sm text-slate-500">Bildiriş yoxdur</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-2.5 border-b border-slate-50 ${
                  n.read_at ? "opacity-70" : "bg-indigo-50/50"
                }`}
              >
                <div className="text-sm font-medium text-slate-800">
                  {n.title}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">
                  {n.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantNoticeBell;
