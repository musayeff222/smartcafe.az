import React, { useState, useEffect } from "react";
import { pageTitle } from "../config/branding";
import axios from "axios";
import AddStok from "../components/AddStok";
import StokGruplari from "../components/StokGruplari";
import EditStok from "../components/EditStok";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import AccessDenied from "../components/AccessDenied";
import { base_url } from "../api/index";
import { Helmet } from "react-helmet";
import ScreenPassword from "../components/ScreenPassword";
import {
  Package,
  Plus,
  ChevronLeft,
  FolderPlus,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Eye,
  Layers,
  Pencil,
  Download,
} from "lucide-react";
import WoltImportPanel from "../components/WoltImportPanel";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

const Box = "div";

function Stok() {
  const [selectedCat, setSelectedCat] = useState(0);
  const [addStok, setAddStok] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [groups, setGroups] = useState([]);
  const [editGroupid, setEditGroupid] = useState(null);
  const [items, setItems] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([
    { id: "", quantity: 1, name: "" },
  ]);
  console.log("selectedRawMaterials", selectedRawMaterials);

  const [formData, setFormData] = useState({
    name: "",
    stock_group_id: "",
    image: null,
    show_on_qr: false,
    price: 0,
    amount: 0,
    alert_critical: false,
    critical_amount: 1,
    item_type: "sayilan",
    additionalPrices: [],
    description: "",
  });
  console.log("items", items);

  const [accessDenied, setAccessDenied] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  const [showWoltImport, setShowWoltImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  console.log("ActiveUser", ActiveUser);

  useEffect(() => {
    if (rawMaterials && rawMaterials.length > 0) {
      const formatted = rawMaterials.map((raw) => ({
        id: String(raw.id),
        quantity: parseFloat(raw.pivot?.quantity || "1"),
        name: raw.name,
      }));
      setSelectedRawMaterials(formatted);
    }
  }, [rawMaterials]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${base_url}/stock-groups`, getAuthHeaders());
        setGroups(response.data);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          if (error.response.data.message === "User does not belong to any active restaurant.") {
            setActiveUser(true);
          } else if (error.response.data.message === "Forbidden") {
            setAccessDenied(true);
          }
        } else {
          console.error("Error loading customers:", error);
        }
      }
    };

    const fetchItems = async () => {
      try {
        const response = await axios.get(`${base_url}/stocks`, getAuthHeaders());
        setItems(response.data);
        console.log(response.data, "stok");
      } catch (error) {
        console.error("Error fetching items", error);
      }
    };

    fetchGroups();
    fetchItems();
  }, [showPopup, addStok, refreshKey]);

  const handleGroupClick = (groupId) => {
    setSelectedCat(groupId);
  };

  const handleDetailsClick = (item) => {
    setDetailsItem(item);
    setShowDetails(true);
  };

  const handleDeleteItem = async () => {
    if (!detailsItem) return;

    try {
      await axios.delete(`${base_url}/stocks/${detailsItem.id}`, getAuthHeaders());
      setItems(items.filter((item) => item.id !== detailsItem.id));
      setShowDetails(false);
      setDetailsItem(null);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        if (error.response.data.message === "User does not belong to any active restaurant.") {
          setActiveUser(true);
        } else if (error.response.data.message === "Forbidden") {
          setAccessDenied(true);
        }
      } else {
        console.error("Error deleting item", error);
      }
    }
  };

  const handleEditItem = (item) => {
    setEditItem(item);
    setShowEditPopup(true);
    setShowDetails(false);
  };

  const handleUpdateItem = () => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${base_url}/stocks`, getAuthHeaders());
        setItems(response.data);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          if (error.response.data.message === "User does not belong to any active restaurant.") {
            setActiveUser(true);
          }
        } else {
          console.error("Error loading customers:", error);
        }
      }
    };

    fetchItems();
  };

  const handleCheckboxChange = async (item) => {
    const { image, ...updatedFormData } = {
      ...item,
      order_start: item.order_start ? item.order_start.slice(0, 5) : null,
      order_stop: item.order_stop ? item.order_stop.slice(0, 5) : null,
      show_on_qr: !item.show_on_qr,
    };

    try {
      await axios.put(`${base_url}/stocks/${item.id}`, updatedFormData, getAuthHeaders());
      setItems(items.map((i) => (i.id === item.id ? { ...i, show_on_qr: !i.show_on_qr } : i)));
    } catch (error) {
      console.error("Error updating item", error);
    }
  };

  const filteredItems =
    selectedCat === 0 ? items : items.filter((item) => item.stock_group_id === selectedCat);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Adı: item.name,
        Stok: item.amount,
        "Satış qiyməti": item.price,
        "Qr Menü": item.show_on_qr ? "Evet" : "Hayır",
        Grup: groups.find((group) => group.id === item.stock_group_id)?.name,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stocks");
    XLSX.writeFile(wb, "stocks.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Stocks Report", 14, 16);

    const tableData = filteredItems.map((item) => [
      item.name,
      item.amount,
      item.price,
      item.show_on_qr ? "Evet" : "Hayır",
      groups.find((group) => group.id === item.stock_group_id)?.name,
    ]);

    doc.autoTable({
      head: [["Adı", "Stok", "Satış qiyməti", "Qr Menü", "Grup"]],
      body: tableData,
      startY: 30,
    });

    doc.save("stocks.pdf");
  };

  useEffect(() => {
    const fetchRawMaterials = async () => {
      if (detailsItem) {
        try {
          const response = await axios.get(
            `${base_url}/stocks/${detailsItem.id}/raw-materials`,
            getAuthHeaders() // DİKKAT: getAuthHeaders() kullanıyoruz
          );
          setRawMaterials(response.data);
        } catch (error) {
          console.error("Xammal məlumatları yüklənərkən xəta:", error);
        }
      }
    };
    fetchRawMaterials();
  }, [detailsItem]);

const handleResetInventory = async () => {
  const confirmed = window.confirm("Anbarı sıfırlamağa əminsiniz?");
  if (!confirmed) return;

  try {
    // Bu xətti düzəltdik!
    await axios.get(`${base_url}/stock-refresh`, getAuthHeaders());

    const response = await axios.get(`${base_url}/stocks`, getAuthHeaders());
    setItems(response.data);

    alert("Anbar uğurla sıfırlandı.");
  } catch (error) {
    console.error("Anbarı sıfırlamaq mümkün olmadı:", error);
    alert("Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
  }
};



  //   if (ActiveUser) return <DontActiveAcount onClose={setActiveUser} />;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <ScreenPassword category="anbar" />
      <Helmet>
        <title>{pageTitle("Anbar")}</title>
        <meta name="description" content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi " />
      </Helmet>
      <section className="p-4 max-w-[1400px] mx-auto">
        <Box className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <Box className="flex items-center gap-3">
              <Box className="w-10 h-10 rounded-xl bg-white/20 grid place-items-center">
                <Package size={22} />
              </Box>
              <Box>
                <h1 className="text-lg font-bold">Anbar</h1>
                <p className="text-xs text-indigo-100">Məhsul və stok idarəetməsi</p>
              </Box>
            </Box>
            <button
              type="button"
              onClick={() => setAddStok(!addStok)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                addStok ? "bg-white/20 hover:bg-white/30" : "bg-white text-indigo-700 hover:bg-indigo-50"
              }`}>
              {addStok ? <><ChevronLeft size={16} /> Geri</> : <><Plus size={16} /> Yeni stok</>}
            </button>
          </Box>
          <Box className="p-4 flex flex-col lg:flex-row gap-4">
            {!addStok ? (
              <>
                <Box className="w-full lg:w-64 shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 px-1">Kateqoriyalar</p>
                  <ul className="list-none space-y-1">
                    <li onClick={() => setShowPopup(true)} className="stok-li text-emerald-700 justify-center bg-emerald-50 border-emerald-200 hover:border-emerald-400">
                      <FolderPlus size={16} /> Qrup əlavə et
                    </li>
                    <li onClick={() => setSelectedCat(0)} className={`stok-li ${selectedCat === 0 ? "text-indigo-700 bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200" : "bg-white"}`}>
                      <Layers size={16} className="opacity-60" /> Hamısı
                    </li>
                    {groups.map((group) => (
                      <li
                        key={group.id}
                        onClick={() => handleGroupClick(group.id)}
                        className={`stok-li ${selectedCat === group.id ? "text-indigo-700 bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200" : "bg-white"}`}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowPopup(true); setEditGroupid(group.id); }} className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                          <Pencil size={14} />
                        </button>
                        <span className="truncate">{group.name}</span>
                      </li>
                    ))}
                  </ul>
                </Box>
                <Box className="flex-1 min-w-0">
                  <Box className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5">
                      <strong className="text-slate-800">{filteredItems.length}</strong> məhsul
                    </span>
                    <button type="button" onClick={exportToExcel} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <FileSpreadsheet size={14} /> Excel
                    </button>
                    <button type="button" onClick={exportToPDF} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      <FileText size={14} /> PDF
                    </button>
                    <button type="button" onClick={() => setShowWoltImport(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                      <Download size={14} /> Wolt import
                    </button>
                    <button type="button" onClick={handleResetInventory} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 ml-auto">
                      <RotateCcw size={14} /> Anbarı sıfırla
                    </button>
                  </Box>
                  <Box className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 font-semibold">Məhsul</th>
                          <th className="p-3 font-semibold text-right">Stok</th>
                          <th className="p-3 font-semibold text-right">Qiymət</th>
                          <th className="p-3 font-semibold text-center">QR</th>
                          <th className="p-3 font-semibold">Qrup</th>
                          <th className="p-3 font-semibold text-center w-24"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems?.map((item) => {
                          const low = item.alert_critical && item.amount < item.critical_amount;
                          const variants = item.details?.length || 0;
                          return (
                            <tr key={item.id} className={`hover:bg-slate-50/80 transition ${low ? "bg-red-50" : "bg-white"}`}>
                              <td className="p-3">
                                <span className="font-medium text-slate-800">{item.name}</span>
                                {variants > 0 && (
                                  <span
                                    className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
                                    title={`${variants} fərqli satış qiyməti (ölçü/vahid seçimi)`}>
                                    {variants} qiymət
                                  </span>
                                )}
                                {low && <span className="block text-[10px] text-red-600 font-medium mt-0.5">Kritik stok</span>}
                              </td>
                              <td className={`p-3 text-right font-medium ${low ? "text-red-600" : "text-slate-700"}`}>{item.amount}</td>
                              <td className="p-3 text-right text-slate-700">
                                {variants > 0 ? (
                                  <span className="text-indigo-600 text-xs font-medium">Çoxlu qiymət</span>
                                ) : (
                                  <>{Number(item.price).toFixed(2)} ₼</>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <input type="checkbox" checked={item.show_on_qr} onChange={() => handleCheckboxChange(item)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                              </td>
                              <td className="p-3 text-slate-600">{groups.find((g) => g.id === item.stock_group_id)?.name || "—"}</td>
                              <td className="p-3 text-center">
                                <button type="button" onClick={() => handleDetailsClick(item)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                                  <Eye size={14} /> Detay
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredItems.length === 0 && (
                      <p className="p-8 text-center text-sm text-slate-500">Bu qrupda məhsul yoxdur</p>
                    )}
                  </Box>
                </Box>
              </>
            ) : (
              <Box className="w-full">
                <AddStok setAddStok={setAddStok} item={detailsItem} onClose={() => setAddStok(false)} />
              </Box>
            )}
          </Box>
        </Box>
      </section>
      {showPopup && (
        <StokGruplari setShowPopup={setShowPopup} editGroupid={editGroupid} seteditGroupid={setEditGroupid} onAddGroup={(newGroup) => setGroups([...groups, newGroup])} />
      )}
      {showDetails && detailsItem && (
        <Box className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <Box className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Box className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
              <p className="text-[10px] uppercase tracking-wider text-indigo-100 font-semibold">Məhsul detayı</p>
              <h3 className="text-xl font-bold truncate">{detailsItem.name}</h3>
            </Box>
            <Box className="p-5 space-y-3 text-sm">
              <Box className="grid grid-cols-2 gap-3">
                <Box className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Stok</p>
                  <p className="text-lg font-bold text-slate-800">{detailsItem.amount}</p>
                </Box>
                <Box className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Satış qiyməti</p>
                  <p className="text-lg font-bold text-slate-800">{Number(detailsItem.price).toFixed(2)} ₼</p>
                </Box>
                {detailsItem.cost_price != null && detailsItem.cost_price !== "" && (
                  <Box className="rounded-xl bg-slate-50 p-3 border border-slate-100 col-span-2">
                    <p className="text-[10px] uppercase text-slate-400 font-semibold">Maya dəyəri</p>
                    <p className="text-lg font-bold text-slate-800">{Number(detailsItem.cost_price).toFixed(2)} ₼</p>
                  </Box>
                )}
              </Box>
              {detailsItem.details?.length > 0 && (
                <Box>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Variantlar</p>
                  <Box className="space-y-1.5">
                    {detailsItem.details.map((d) => (
                      <Box key={d.id} className="flex justify-between rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                        <span className="font-medium text-slate-700">{d.count} {d.unit}</span>
                        <span className="font-bold text-indigo-700">{Number(d.price).toFixed(2)} ₼</span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              <p className="text-slate-600"><span className="font-semibold text-slate-800">QR:</span> {detailsItem.show_on_qr ? "Bəli" : "Xeyr"}</p>
              <p className="text-slate-600"><span className="font-semibold text-slate-800">Qrup:</span> {groups.find((g) => g.id === detailsItem.stock_group_id)?.name || "—"}</p>
              <Box>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Xammallar</p>
                {rawMaterials.length > 0 ? (
                  selectedRawMaterials.map((material) => (
                    <Box key={material.id} className="flex justify-between text-slate-700 py-1 border-b border-slate-50 last:border-0">
                      <span>{material.name}</span>
                      <span className="text-slate-500">{material.amount} {material.quantity || "ədəd"}</span>
                    </Box>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">Xammal yoxdur</p>
                )}
              </Box>
            </Box>
            <Box className="flex gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
              <button type="button" onClick={handleDeleteItem} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Sil</button>
              <button type="button" onClick={() => handleEditItem(detailsItem)} className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Yenilə</button>
              <button type="button" onClick={() => setShowDetails(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white">Bağla</button>
            </Box>
          </Box>
        </Box>
      )}
      {showEditPopup && editItem && (
        <EditStok item={editItem} onClose={() => setShowEditPopup(false)} onUpdate={handleUpdateItem} rawMaterials={rawMaterials} />
      )}
      <WoltImportPanel
        open={showWoltImport}
        onClose={() => setShowWoltImport(false)}
        onImported={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}

export default Stok;
