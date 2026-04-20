import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import MasaAyarlari from "../components/MasaAyarlari";
import { useParams } from "react-router-dom";
import AccessDenied from "../components/AccessDenied";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import { fetchTableOrderStocks } from "../redux/stocksSlice";
import { useDispatch, useSelector } from "react-redux";
import ExpiredTablesAlert from "../components/ExpiredTablesAlert";
import soundFile from "../assets/sound1.mp3";
import {
  Settings2,
  Search,
  MoreVertical,
  Clock,
  Utensils,
  LayoutGrid,
  CheckCircle2,
  CircleDot,
  RefreshCw,
} from "lucide-react";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const Masalar = () => {
  const [masaType, setMasaType] = useState(
    Number(localStorage.getItem("masaType")) || 0
  );
  const [showDetail, setShowDetail] = useState(null);
  const [masaAyarlar, setMasaAyarlar] = useState(false);
  const [groups, setGroups] = useState([]);
  const [tables, setTables] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [role] = useState(localStorage.getItem("role"));
  const [loading, setLoading] = useState(false);
  const [tableItemData, setTableItemData] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const tablesRef = useRef([]);

  const { id } = useParams();
  const dispatch = useDispatch();
  useSelector((state) => state.stocks);

  const [tableColors, setTableColors] = useState({
    empty: "#10b981",
    booked: "#ef4444",
  });

  const getTableById = useCallback(
    (tableId) => tables.find((t) => t.id === tableId),
    [tables]
  );

  const handleTableNavigation = (tableId, openSettings = false) => {
    const table = getTableById(tableId);
    if (!table) return;

    if (openSettings) {
      localStorage.setItem(`masa_siparis_${tableId}_openPsModal`, "true");
      localStorage.setItem(`masa_siparis_${tableId}_openPsSettings`, "true");
      const isExpired =
        table.ps_timer_status === "expired" ||
        Number(table.expiredMinutes) > 0;
      if (isExpired) {
        localStorage.setItem(`table_${tableId}_isExpired`, "true");
      }
    } else {
      const savedIsExpired = localStorage.getItem(`table_${tableId}_isExpired`);
      const savedEndTime = localStorage.getItem(`table_${tableId}_endTime`);
      const currentTime = Date.now();
      const isTableExpired =
        savedIsExpired === "true" ||
        (savedEndTime && currentTime > parseInt(savedEndTime));
      if (isTableExpired) {
        localStorage.setItem(`table_${tableId}_isExpired`, "true");
      }
      localStorage.removeItem(`masa_siparis_${tableId}_openPsModal`);
      localStorage.removeItem(`masa_siparis_${tableId}_openPsSettings`);
    }

    window.location.href = `/masa-siparis/${tableId}`;
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        `${base_url}/table-groups`,
        getHeaders()
      );
      setGroups(response.data);
    } catch (error) {
      if (
        error.response?.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        // handled upstream
      } else if (
        error.response?.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        // keep
      } else {
        console.error("Error loading groups:", error);
      }
    }
  };

  const fetchTables = async (groupId, { silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${base_url}/tables`, {
        ...getHeaders(),
        params: groupId === 0 ? {} : { table_group_id: groupId },
      });

      const nextTables = response.data.tables || [];
      const prevJson = JSON.stringify(tablesRef.current || []);
      const nextJson = JSON.stringify(nextTables);
      if (prevJson !== nextJson) setTables(nextTables);

      const nextEmpty =
        localStorage.getItem("empty_table_color") ||
        response.data.empty_table_color ||
        "#10b981";
      const nextBooked =
        localStorage.getItem("booked_table_color") ||
        response.data.booked_table_color ||
        "#ef4444";

      setTableColors((prev) =>
        prev.empty !== nextEmpty || prev.booked !== nextBooked
          ? { empty: nextEmpty, booked: nextBooked }
          : prev
      );
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTables(masaType, { silent: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [masaType]);

  useEffect(() => {
    fetchGroups();
    const storedMasaType = localStorage.getItem("masaType");
    if (storedMasaType) setMasaType(Number(storedMasaType));
  }, []);

  useEffect(() => {
    fetchTables(masaType);
    localStorage.setItem("masaType", masaType);
  }, [masaType]);

  useEffect(() => {
    if (id) dispatch(fetchTableOrderStocks(id));
  }, [id, dispatch]);

  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter((t) => !t.is_available).length;
    const free = total - occupied;
    const revenue = tables.reduce(
      (sum, t) => sum + (Number(t.total_price) || 0),
      0
    );
    return { total, occupied, free, revenue };
  }, [tables]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter((t) => {
      if (q && !t.name?.toLowerCase().includes(q)) return false;
      if (statusFilter === "free" && !t.is_available) return false;
      if (statusFilter === "occupied" && t.is_available) return false;
      return true;
    });
  }, [tables, search, statusFilter]);

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <Helmet>
        <title>Masalar | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi"
        />
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        <ExpiredTablesAlert
          tables={tables}
          onTableClick={(tableId) => handleTableNavigation(tableId, false)}
          soundFile={soundFile}
        />

        <section className="max-w-[1600px] mx-auto px-3 sm:px-5 py-4 sm:py-5 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <StatCard
              icon={<LayoutGrid size={18} />}
              label="Ümumi masa"
              value={stats.total}
              color="from-indigo-500 to-blue-600"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Boş"
              value={stats.free}
              color="from-emerald-500 to-green-600"
            />
            <StatCard
              icon={<CircleDot size={18} />}
              label="Dolu"
              value={stats.occupied}
              color="from-rose-500 to-red-600"
            />
            <StatCard
              icon={<Utensils size={18} />}
              label="Aktiv dövriyyə"
              value={`₼ ${stats.revenue.toFixed(2)}`}
              color="from-amber-500 to-orange-600"
              wide
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Masa axtar..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {[
                  { id: "all", label: "Hamısı" },
                  { id: "free", label: "Boş" },
                  { id: "occupied", label: "Dolu" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
                      statusFilter === f.id
                        ? "bg-white text-slate-800 shadow"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => fetchTables(masaType)}
                  className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  title="Yenilə"
                >
                  <RefreshCw size={16} />
                </button>
                {role !== "waiter" && (
                  <button
                    onClick={() => setMasaAyarlar(true)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                    title="Masa ayarları"
                  >
                    <Settings2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
              <GroupTab
                active={masaType === 0}
                onClick={() => setMasaType(0)}
                label="Hamısı"
                count={stats.total}
              />
              {groups.map((group) => (
                <GroupTab
                  key={group.id}
                  active={masaType === group.id}
                  onClick={() => setMasaType(group.id)}
                  label={group.name}
                />
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
          )}

          {filteredTables.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-500">
              <LayoutGrid size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Masa tapılmadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
              {filteredTables.map((table) => {
                const occupied = !table.is_available;
                const accentColor = occupied
                  ? tableColors.booked
                  : tableColors.empty;
                const hasTotal =
                  table.total_price !== undefined &&
                  table.total_price !== null &&
                  Number(table.total_price) !== 0;

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableNavigation(table.id)}
                    className="group relative text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden p-3 sm:p-4 min-h-[140px] sm:min-h-[160px] flex flex-col"
                  >
                    <span
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: accentColor }}
                    />

                    <div className="flex items-start justify-between gap-2 mt-1">
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 truncate">
                          {table.name}
                        </h4>
                        <StatusBadge occupied={occupied} color={accentColor} />
                      </div>
                      {role !== "waiter" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetail(table.id);
                            setTableItemData(table);
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          aria-label="Masa seçimləri"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>

                    <div className="mt-auto pt-3">
                      {hasTotal ? (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Ümumi
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
                            ₼ {Number(table.total_price).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 font-medium">
                          Boşdur
                        </div>
                      )}

                      {table.book_time && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                          <Clock size={11} />
                          {table.book_time}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showDetail != null && (
        <Modal
          type={true}
          groups={groups}
          tableItemData={tableItemData}
          setShowDetail={setShowDetail}
          _modalMain={"main"}
        />
      )}
      {masaAyarlar && <MasaAyarlari setMasaAyarlar={setMasaAyarlar} />}
    </>
  );
};

const StatCard = ({ icon, label, value, color, wide }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex items-center gap-2.5 ${
      wide ? "col-span-2 lg:col-span-1" : ""
    }`}
  >
    <div
      className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} text-white grid place-items-center shadow shrink-0`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider truncate">
        {label}
      </div>
      <div className="text-base sm:text-lg font-bold text-slate-800 truncate">
        {value}
      </div>
    </div>
  </div>
);

const GroupTab = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${
      active
        ? "bg-indigo-600 border-indigo-600 text-white shadow"
        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
    }`}
  >
    {label}
    {count !== undefined && (
      <span
        className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatusBadge = ({ occupied, color }) => (
  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color }}
    />
    {occupied ? "Dolu" : "Boş"}
  </div>
);

export default Masalar;
