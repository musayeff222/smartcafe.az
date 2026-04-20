import React, { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "./AccessDenied";
import { base_url, img_url } from "../api/index";
// import { FaTrash } from 'react-icons/fa';

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

const EditStok = ({ item, onClose, onUpdate, rawMaterials, detailsItem }) => {
  console.log("rawMaterials", rawMaterials);

  useEffect(() => {
    if (rawMaterials && rawMaterials.length > 0) {
      const formatted = rawMaterials?.map((raw) => ({
        id: String(raw.id),
        quantity: parseFloat(raw.pivot?.quantity || "1"),
      }));

      setSelectedRawMaterials(formatted);
    }
  }, [rawMaterials]);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    price: "",
    show_on_qr: false,
    stock_group_id: null,
    critical_amount: "",
    alert_critical: false,
    // order_start: '00:00',
    // order_stop: '24:00'
  });
  const [groups, setGroups] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);

  const [rawMaterialss, setRawMaterialss] = useState([]);

  const [selectedRawMaterials, setSelectedRawMaterials] = useState([{ id: "", quantity: 1 }]);

  const handleRawMaterialChange = (index, field, value) => {
    const updated = [...selectedRawMaterials];
    updated[index][field] = value;
    setSelectedRawMaterials(updated);
  };

  //   const addRawMaterialField = () => {
  //     setSelectedRawMaterials([...selectedRawMaterials, { id: "", quantity: 1 }]);
  //   };

  const removeMaterialField = (index) => {
    const updated = selectedRawMaterials.filter((_, i) => i !== index);
    setSelectedRawMaterials(updated);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${base_url}/raw-materials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("response", response);

      setRawMaterialss(response.data);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        amount: item.amount,
        price: item.price,
        show_on_qr: item.show_on_qr || false,
        stock_group_id: item.stock_group_id,
        critical_amount: item.critical_amount || "",
        alert_critical: item.alert_critical || false,
        // order_start: item.order_start.slice(0,5) || '00:00',
        // order_stop: item.order_stop.slice(0,5) || "24:00"
      });
    }
  }, [item]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${base_url}/stock-groups`, getAuthHeaders());
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching groups", error);
      }
    };

    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedFormData = {
      ...formData,
    };

    try {
      await axios.put(`${base_url}/stocks/${item.id}`, updatedFormData, getAuthHeaders());
      onUpdate(); // Refresh items after update
      onClose(); // Close the edit popup
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error updating item", error);
      }
    }

    try {
      const token = localStorage.getItem("token");

      // Sonra hammaddeleri güncelle
      const payload = {
        raw_materials: selectedRawMaterials
          .filter((mat) => mat.id && !isNaN(mat.id) && mat.quantity && !isNaN(mat.quantity))
          .map((mat) => ({
            id: Number(mat.id), // Must match raw_material.id, not stock.id
            quantity: Number(mat.quantity),
          })),
      };

      console.log("payload", payload);

      await axios.put(`${base_url}/stocks/${detailsItem.id}/raw-materials`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("ggggggggggggg",payload)

      onUpdate(); // Listeyi yenile
      onClose(); // Popup'u kapat
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error updating item or raw materials", error);
      }
    }
  };
  console.log("Göndərilən raw_materials:", rawMaterialss);

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 ">
      <div
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full overflow-y-auto"
        style={{ maxHeight: "90vh" }}>
        <h3 className="text-lg font-semibold mb-4">Yeniləyin Stok</h3>
        {item && item.image && (
          <div className="mb-4 flex justify-center">
            <img
              src={`${img_url}/${item.image}`}
              alt="Stock Image"
              className="w-full h-[100px] object-contain rounded mb-4"
            />
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="name">
              Adı
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="amount">
              Stok
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="price">
              Satış fiyatı
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="critical_amount">
              Kritik Miktar
            </label>
            <input
              type="number"
              id="critical_amount"
              name="critical_amount"
              value={formData.critical_amount}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <div className="w-full font-medium">Xammal</div>
            {selectedRawMaterials.map((material, index) => (
              <div key={index} className="flex flex-col items-center gap-2 mb-2">
                <div className="flex items-center gap-2 mb-2 w-full">
                  <select
                    className="border rounded py-2 px-3 w-full text-sm font-medium"
                    value={material.id}
                    onChange={(e) => handleRawMaterialChange(index, "id", e.target.value)}>
                    <option value="">Seçin</option>
                    {rawMaterialss?.map((raw) => (
                      <option key={raw.id} value={raw.id}>
                        {raw.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="border rounded py-2 px-3 w-full text-sm font-medium"
                    type="number"
                    step=""
                    min="1"
                    max="999"
                    value={material.quantity}
                    onChange={(e) => handleRawMaterialChange(index, "quantity", e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => removeMaterialField(index)}
                    className="bg-red-500 text-white px-3 rounded h-full">
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Yeni xammal əlavə et düyməsi */}
            <div className="mb-4 flex justify-start">
              <button
                type="button"
                onClick={() =>
                  setSelectedRawMaterials([...selectedRawMaterials, { id: "", quantity: 1 }])
                }
                className="border hover:bg-sky-500 rounded py-1 px-2 bg-sky-600 text-white text-sm font-medium">
                + Yeni xammal əlavə et
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                id="alert_critical"
                name="alert_critical"
                checked={formData.alert_critical}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span className="ml-2">Kritik uyarı aktif</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                id="show_on_qr"
                name="show_on_qr"
                checked={formData.show_on_qr}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span className="ml-2">QR Menüde Göster</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="stock_group_id">
              Grup
            </label>
            <select
              id="stock_group_id"
              name="stock_group_id"
              value={formData.stock_group_id || ""}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
              required>
              <option value="">Seçiniz</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Güncelle
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded">
              Kapat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStok;
