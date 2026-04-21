import React, { useState, useEffect } from "react";
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
  }, [showPopup, addStok]);

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

//https://betaapi.smartcafe.az/api/stock-refresh
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
        <title>Anbar | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <section className="p-4">
        <div className="rounded-t border flex flex-col md:flex-row items-center justify-between bg-[#fafbfc] py-2 px-3">
          <h4>
            <strong>Anbar Mal əlavə edilməsi</strong>
          </h4>
          <button
            onClick={() => setAddStok(!addStok)}
            className={`ml-auto py-2 px-4 rounded text-white ${
              addStok ? "bg-gray-700" : "bg-green-600"
            }`}>
            {addStok ? (
              <>
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  className="bi bi-chevron-double-left"
                  viewBox="0 0 16 16">
                  {" "}
                  <path
                    fillRule="evenodd"
                    d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                  />{" "}
                  <path
                    fillRule="evenodd"
                    d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                  />{" "}
                </svg>
                Geri{" "}
              </>
            ) : (
              <>
                <i className="fa-solid fa-plus"></i> Yeni stok əlavə edin
              </>
            )}
          </button>
        </div>
        <div className="border border-t-0 bg-white py-3 px-3 flex flex-col md:flex-row gap-4">
          {!addStok ? (
            <>
              <ul className="list-none w-full md:w-1/4">
                <li
                  onClick={() => setShowPopup(true)}
                  className="text-green-600 stok-li justify-center bg-green-50 hover:border-green-600">
                  <i className="fa-solid fa-plus"></i> Grup/Kategori/Menü əlavə edin
                </li>
                <li
                  onClick={() => setSelectedCat(0)}
                  className={`stok-li ${
                    selectedCat === 0 ? "text-blue-500 bg-blue-50" : "bg-white"
                  }`}>
                  Hamısı
                </li>
                {groups.map((group) => (
                  <li
                    key={group.id}
                    onClick={() => handleGroupClick(group.id)}
                    className={`stok-li ${
                      selectedCat === group.id ? "text-blue-500 bg-blue-50" : "bg-white"
                    }`}>
                    <button
                      onClick={() => (setShowPopup(true), setEditGroupid(group.id))}
                      className="mr-2">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    {group.name}
                  </li>
                ))}
              </ul>
              <div className="w-full md:w-3/4">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                  <p className="my-2">Siyahida toplam {filteredItems.length} qeyd vardir.</p>
                  <button
                    className="rounded py-2 px-4 bg-zinc-600 text-white"
                    onClick={exportToExcel}>
                    EXCEL
                  </button>
                  <button
                    className="rounded py-2 px-4 bg-zinc-600 text-white"
                    onClick={exportToPDF}>
                    PDF
                  </button>
                   <button
                    className="rounded py-2 px-4 bg-red-900 text-white"
                    onClick={handleResetInventory}>
                    Anbarı Sıfırla
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border rounded bg-[#fafbfc]">
                    <thead className="border-b border-gray-400 bg-gray-100">
                      <tr className="border-b border-gray-300">
                        <th className="p-3 font-semibold">Adı</th>
                        <th className="p-3 font-semibold text-right">Stok</th>
                        <th className="p-3 font-semibold text-right">Satış qiyməti</th>
                        <th className="p-3 font-semibold">Qr Menü</th>
                        <th className="p-3 font-semibold">Grup</th>
                        <th className="p-3 font-semibold">Detay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems?.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            item.alert_critical && item.amount < item.critical_amount
                              ? "bg-red-200 animate-pulse"
                              : ""
                          }>
                          <td className="p-3">{item.name}</td>
                          <td className="p-3 text-right">{item.amount}</td>
                          <td className="p-3 text-right">{item.price} ₼</td>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={item.show_on_qr}
                              onChange={() => handleCheckboxChange(item)}
                            />
                          </td>
                          <td className="p-3 text-center">
                            {groups.find((group) => group.id === item.stock_group_id)?.name}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              className="rounded px-3 py-1 bg-green-600 text-white"
                              onClick={() => handleDetailsClick(item)}>
                              Detay
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <AddStok setAddStok={setAddStok} item={detailsItem} onClose={() => setAddStok(false)} />
          )}
        </div>
      </section>
      {showPopup && (
        <StokGruplari
          setShowPopup={setShowPopup}
          editGroupid={editGroupid}
          seteditGroupid={setEditGroupid}
          onAddGroup={(newGroup) => setGroups([...groups, newGroup])}
        />
      )}
      {showDetails && detailsItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full md:w-1/2 lg:w-1/3">
            <h3 className="text-lg font-semibold mb-4">Stok Detayları</h3>
            <p>
              <strong>Adı:</strong> {detailsItem.name}
            </p>
            <p>
              <strong>Stok:</strong> {detailsItem.amount}
            </p>
            <p>
              <strong>Satış qiyməti:</strong> {detailsItem.price} ₼
            </p>
            <p>
              <strong>Qr Menü:</strong> {detailsItem.show_on_qr ? "Evet" : "Hayır"}
            </p>
            <p>
              <strong>Grup:</strong>{" "}
              {groups.find((group) => group.id === detailsItem.stock_group_id)?.name}
            </p>
            <div className="  w-full md:w-1/2 lg:w-1/3">
              {/* Mevcut içerik... */}

              <p className="mt-4 ">
                <strong>Xammallar:</strong>
              </p>
              {rawMaterials.length > 0 ? (
                selectedRawMaterials.map((material) => (
                  <div key={material.id} className="mt-2 flex gap-3">
                    <span className="font-medium">{material.name}</span> -
                    <h1 className=" flex w-64">Miqdar:</h1>
                    <h1>
                      {" "}
                      {material.amount} {material.quantity || "ədəd"}
                    </h1>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 w-72">Heç bir xammal tapılmadı.</div>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleDeleteItem}>
                Sil
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => handleEditItem(detailsItem)}>
                Yeniləyin
              </button>
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowDetails(false)}>
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditPopup && editItem && (
        <EditStok
          item={editItem}
          onClose={() => setShowEditPopup(false)}
          onUpdate={handleUpdateItem}
          rawMaterials={rawMaterials}
          detailsItem={detailsItem}
        />
      )}
    </>
  );
}

export default Stok;
