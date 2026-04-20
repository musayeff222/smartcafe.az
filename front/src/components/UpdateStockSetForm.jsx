import React, { useState, useEffect } from "react";
import axios from "axios";
import { base_url } from "../api";

const UpdateStockSetForm = ({ detailsItem, onClose, onUpdate }) => {
  console.log("reddddddddd", detailsItem.id);

  const [stockSets, setStockSets] = useState([]);
  const [stockAllSets, setStockAllSets] = useState([]);
  const [selectedStockSet, setSelectedStockSet] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [loading, setLoading] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState([{ id: "", quantity: 1 }]);

  console.log("formData", formData);
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
  };

  useEffect(() => {
    axios
      .get(`${base_url}/stock-sets`, getAuthHeaders())
      .then((res) => setStockAllSets(res.data))
      .catch((err) => console.error("Error loading sets:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    if (!selectedStockSet) return;
    Close();

    const validStocks = selectedStocks.map((stock) => ({
      id: Number(stock.id),
      quantity: Math.max(Number(stock.quantity || 0), 1),
      price: Number(stock.price),
    }));

    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stocks: validStocks,
      };

      // Convert image to base64 if exists
      if (formData.image instanceof File) {
        const base64Image = await convertFileToBase64(formData.image);
        payload.image = base64Image;
      }

      const response = await axios.put(`${base_url}/stock-sets/${selectedStockSet.id}`, payload, {
        headers: {
          ...getAuthHeaders().headers,
          "Content-Type": "application/json",
        },
      });

      alert("Uğurla güncəlləndi!");
      console.log("Updated:", response.data);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      alert("Xəta baş verdi!");
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleStockChange = (index, field, value) => {
    const updated = [...selectedStocks];
    updated[index][field] = value;
    setSelectedStocks(updated);
  };

  const addStockField = () => {
    setSelectedStocks([...selectedStocks, { id: "", quantity: 1 }]);
  };

  const removeStockField = (index) => {
    const updated = selectedStocks.filter((_, i) => i !== index);
    setSelectedStocks(updated);
  };

  function Close() {
    if (onClose) onClose();
  }
  useEffect(() => {
    const fetchStockSets = async () => {
      try {
        const response = await axios.get(`${base_url}/stock-all`, getAuthHeaders());
        console.log("responsestocksets", response);

        setStockSets(response.data); // API yapınıza göre response path'ini ayarlayın
      } catch (error) {
        console.error("Error fetching stock sets:", error);
      }
    };
    fetchStockSets();
  }, []);

  useEffect(() => {
    if (detailsItem?.id) {
      setLoading(true);
      axios
        .get(`${base_url}/stock-sets/${detailsItem.id}`, getAuthHeaders())
        .then((res) => {
          setSelectedStockSet(res.data);
          setFormData({
            name: res.data.name,
            price: res.data.price,
          });

          const mappedStocks = res.data.stocks.map((stock) => ({
            id: stock.id,
            quantity: stock.pivot.quantity,
            price: stock.pivot.price,
          }));
          setSelectedStocks(mappedStocks);
        })
        .finally(() => setLoading(false));
    }
  }, [detailsItem]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg mx-auto mt-1 w-[700px] max-h-[800px]">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">📦 Stock Set Güncəlləmə</h2>

      {loading ? (
        <p className="text-center py-6 text-gray-500">⏳ Yüklənir...</p>
      ) : (
        selectedStockSet && (
          <>
            <div className="flex flex-col gap-y-3">
              <div className="text-right">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-300 duration-300"
                  onClick={Close}>
                  X
                </button>
              </div>
              <div className="flex flex-col items-start gap-y-2">
                <label>
                  <b>Ad:</b>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  className="border rounded py-2 px-3 w-full"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col items-start gap-y-2">
                <label>
                  <b>Satış qiyməti:</b>
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  className="border rounded py-2 px-3 w-full"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex  items-center  gap-y-2  my-3  justify-between">
                <div className="flex justify-between items-center gap-x-3">
                  <label className="whitespace-nowrap">
                    <b>Qr Menu:</b>
                  </label>
                  <input
                    type="checkbox"
                    name="qr_menu"
                    value={formData.show_on_qr ? 0 : 1}
                    className="border rounded py-2 px-3 w-full"
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-col ">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Set şəkli:</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center gap-y-6">
              {/* Ekle Butonu */}
              <button
                type="button"
                onClick={addStockField}
                className="bg-blue-500 text-white px-3 py-1 rounded my-4 ">
                + Stok Ekle
              </button>
            </div>
            <div className="mb-4 max-h-[150px] overflow-y-scroll">
              {selectedStocks.map((stock, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  {/* Stok Seçimi */}
                  <span className="whitespace-nowrap">
                    <b className="text-red-900">Stok adı:</b>
                  </span>
                  <select
                    value={stock.id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedItem = stockSets.find(
                        (item) => item.id === parseInt(selectedId)
                      );
                      handleStockChange(index, "id", selectedId);
                      if (selectedItem) {
                        handleStockChange(index, "price", selectedItem.price); // fiyatı da set et
                      }
                    }}
                    className="border rounded py-2 px-3 w-full"
                    required>
                    <option value="">Stok seçin</option>
                    {stockSets.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {/* Miktar */}
                  <label>
                    <b className="text-red-900">Miqdar:</b>
                  </label>
                  <input
                    type="number"
                    value={stock.quantity}
                    onChange={(e) => handleStockChange(index, "quantity", e.target.value)}
                    className="border rounded py-2 px-3 w-20"
                    min="1"
                    required
                  />
                  {/* Fiyat (düzenlenebilir) */}
                  <label>
                    <b className="text-red-900">Qiymət:</b>
                  </label>
                  <input
                    type="number"
                    value={stock.price || ""}
                    onChange={(e) => handleStockChange(index, "price", e.target.value)}
                    className="border rounded py-2 px-3 w-24"
                    step="0.01"
                    min="0"
                  />

                  {/* Sil Butonu */}
                  <button
                    type="button"
                    onClick={() => removeStockField(index)}
                    className="bg-red-500 text-white px-3 rounded h-full">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg w-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}>
              ✅ Yenilə
            </button>
          </>
        )
      )}
    </div>
  );
};

export default UpdateStockSetForm;
