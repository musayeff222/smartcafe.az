import React, { useState } from "react";
import axios from "axios";
import { base_url } from "../api";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const PasswordScreenFour = ({ pendingRemoveData, onClose, fetchTableOrders, tableId }) => {
  const [passwordNew, setPasswordNew] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Hər rol üçün fərqli şifrələr
  const rolePasswords = {
    waiter: "5669",      // Ofisiant şifrəsi
    admin: "6768",       // Admin şifrəsi
    manager: "9999",     // Menecer şifrəsi
    cashier: "5555",     // Kassir şifrəsi
  };

  // Rol adlarını tərcümə etmək üçün obyekt
  const roleTranslations = {
    waiter: "ofisiant",
    admin: "admin", 
    manager: "menecer",
    cashier: "kassir"
  };

  // Cari istifadəçinin rolunu al və tərcümə et
  const currentRole = localStorage.getItem("role") || "waiter";
  const translatedRole = roleTranslations[currentRole] || "ofisiant";
  
  // Rol üçün müvafiq şifrəni seç
  const correctPassword = rolePasswords[currentRole] || rolePasswords.waiter;

  const handleButtonClick = (value) => {
    if (value === "clear") setPasswordNew("");
    else if (value === "back") setPasswordNew(passwordNew.slice(0, -1));
    else setPasswordNew((prev) => (prev.length < 6 ? prev + value : prev));
  };

  const handleSubmit = () => {
    if (passwordNew === correctPassword) {
      setLoading(true);
      setTimeout(async () => {
        try {
          await axios.post(
            `${base_url}/tables/${tableId}/subtract-stock`,
            {
              stock_id: pendingRemoveData.stockId,
              quantity: pendingRemoveData.quantity || 1,
              pivotId: pendingRemoveData.pivot_id,
              increase: pendingRemoveData.increase_boolean,
            },
            getHeaders()
          );
          fetchTableOrders();
          onClose();
        } catch (err) {
          console.error("Silinmə zamanı xəta:", err);
        } finally {
          setLoading(false);
        }
      }, 3000);
    } else {
      alert("Şifrə yanlışdır!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[90%] max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4">Şifrəni daxil edin</h2>
        
        {/* Rol məlumatını göstər (tərcümə edilmiş) */}
        <p className="text-sm text-gray-600 mb-2">
          {translatedRole} şifrəsini daxil edin
        </p>

        <div className="border px-4 py-5 mb-4 text-lg bg-gray-100 rounded">
          {isPasswordVisible ? passwordNew : passwordNew.replace(/./g, "*")}
        </div>

        <button
          onClick={() => setPasswordVisible(!isPasswordVisible)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isPasswordVisible ? "Gizlə" : "Göstər"}
        </button>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleButtonClick(num.toString())}
              className="bg-gray-200 py-3 rounded text-lg font-semibold hover:bg-gray-300"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleButtonClick("clear")}
            className="bg-red-500 text-white py-3 rounded hover:bg-red-600"
          >
            Təmizlə
          </button>
          <button
            onClick={() => handleButtonClick("0")}
            className="bg-gray-200 py-3 rounded text-lg font-semibold hover:bg-gray-300"
          >
            0
          </button>
          <button
            onClick={() => handleButtonClick("back")}
            className="bg-yellow-400 py-3 rounded hover:bg-yellow-500"
          >
            Geri
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full text-white py-3 rounded mb-2 ${
            loading ? "bg-green-300" : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {loading ? "Yüklənir..." : "Təsdiq et və Sil"}
        </button>

        <button onClick={onClose} className="w-full bg-gray-300 py-3 rounded hover:bg-gray-400">
          Bağla
        </button>
      </div>
    </div>
  );
};

export default PasswordScreenFour;