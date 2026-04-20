import React, { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "./AccessDenied";
import { base_url } from "../api/index";
import { FaTrash } from "react-icons/fa";
// import UpdateStockSetForm from "./UpdateStockSetForm";

// Function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
};

// Component for additional price inputs
const AdditionalPriceInput = ({
  prices,
  onPriceChange,
  onCountChange,
  onNumberChange,
  addPrice,
  removePrice,
}) => (
  <>
    {prices.map((priceObj, index) => (
      <div key={index} className="flex mb-3 gap-2">
        {/* Quantity Input */}
        <input
          className="border rounded-l py-2 px-3 w-5/12 text-sm font-medium"
          type="number"
          value={priceObj.count}
          onChange={(e) => onNumberChange(e, index)}
          placeholder="1 "
          required
        />
        <input
          className="border rounded-l py-2 px-3 w-5/12 text-sm font-medium"
          type="string"
          value={priceObj.unit}
          onChange={(e) => onCountChange(e, index)}
          placeholder="Ədəd"
          required
        />
        {/* Price Input */}
        <input
          className="border rounded-l py-2 px-3 w-5/12 text-sm font-medium"
          type="number"
          value={priceObj.price}
          onChange={(e) => onPriceChange(e, index)}
          step="0.01"
          placeholder="20 AZN"
          required
        />
        <button
          type="button"
          onClick={() => removePrice(index)}
          className="border shadow-md bg-gray-300 hover:bg-gray-100 text-center w-2/12 rounded-r py-2 px-3 cursor-pointer">
          <FaTrash className="text-red-500" />
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={addPrice}
      className="border mr-4 mb-2 hover:bg-sky-500 rounded py-2 px-4 bg-sky-600 text-white text-sm font-medium mt-2">
      Çoxlu qiymət və say əlave et
    </button>
  </>
);

function AddStok({ setAddStok }) {
  const [formData, setFormData] = useState({
    name: "",
    price: null, // Backend null bekliyorsa başlangıç değeri null olmalı
    stocks: [], // additionalPrices yerine doğru isimlendirme
  });
  const [selectedStocks, setSelectedStocks] = useState([{ id: "", quantity: 1 }]);
  console.log("selectedStocks", selectedStocks);

  const [stockSets, setStockSets] = useState([]);
  console.log(formData, "formdata");
  const [groups, setGroups] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [image, setImage] = useState(null);

  const [selectedRawMaterials, setSelectedRawMaterials] = useState([{ id: "", quantity: 1 }]);

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

  console.log("rawMaterials", rawMaterials);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await axios.get(`${base_url}/stock-groups`, getAuthHeaders());
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("price", formData.price || "");

    console.log("bbbb", typeof formData.price);

    if (image) {
      formDataToSend.append("image", image);
    }

    // ✅ FormData içində stocks array-i düzgün şəkildə əlavə et
    selectedStocks
      .filter((stock) => stock.id)
      .forEach((stock, index) => {
        formDataToSend.append(`stocks[${index}][id]`, stock.id);
        formDataToSend.append(`stocks[${index}][quantity]`, stock.quantity);
        formDataToSend.append(`stocks[${index}][price]`, stock.price);

        console.log("aaa");
      });

    try {
      const response = await axios.post(`${base_url}/stock-sets`, formDataToSend, {
        headers: {
          ...getAuthHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("response", response);
      setAddStok(false);
    } catch (error) {
      console.error("Error creating stock set:", error.response?.data || error.message);
      alert(`Hata: ${error.response?.data?.message || "Şəkil və ya məlumat göndərilmədi"}`);
    }
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

      setRawMaterials(response.data.data);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
        <div className="bg-gray-50 rounded border p-3 w-full md:w-1/2">
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">Şəkil əlavə et</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setImage(file);
                }
              }}
              className="border rounded py-2 px-3 w-full"
            />

            {image && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          {/* Other Form Fields */}
          <div className="border rounded flex items-center py-2 px-5 w-full bg-white mb-5">
            <input
              className="mr-3 h-6"
              type="checkbox"
              name="show_on_qr"
              checked={formData.show_on_qr}
              onChange={handleChange}
            />
            <label className="text-sm font-semibold">QR menüde göster</label>
          </div>

          <label className="text-sm font-semibold mb-2">Adı</label>
          <input
            className="border rounded py-2 px-3 w-full text-sm font-medium mb-5"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <button type="submit" className="bg-sky-600 font-medium py-2 px-4 rounded text-white">
            Saxla
          </button>
        </div>

        <div className="flex flex-col rounded border p-3 w-full md:w-1/2">
          {/* Main Price */}
          <h3 className="mb-2">Satış qiyməti</h3>
          <div className="flex mb-3 gap-2">
            <input
              className="border rounded py-2 px-3 w-10/12 text-sm font-medium"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              // required özelliğini kaldırıyoruz
            />
            <div className="border border-l-0 bg-gray-50 text-center w-2/12 rounded-r py-2 px-3">
              ₼
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2">Stoklar</h3>

            {selectedStocks.map((stock, index) => {
              // Seçilmiş stock id-yə uyğun stok məlumatını tapırıq
              const selectedItem = stockSets.find((item) => item.id === Number(stock.id));
              // == istifadə olunur ki, tip fərqi problem yaratmasın

              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 mb-2 bg-yellow-100 p-3 rounded">
                  {/* 1. Select: sadəcə adı seçirik */}
                  <select
                    value={stock.id}
                    onChange={(e) => handleStockChange(index, "id", e.target.value)}
                    className="border rounded py-2 px-3 w-1/2"
                    required>
                    <option value="">Stok seçin</option>
                    {stockSets.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {/* 2. Qiymət: AYRI input-da readOnly şəkildə göstərilir */}
                  <input
                    type="number"
                    value={stock.price || ""}
                    onChange={(e) => handleStockChange(index, "price", e.target.value)}
                    className="border rounded py-2 px-3 w-28 bg-gray-100 text-gray-700 text-sm"
                    placeholder={selectedItem ? `${selectedItem.price} ₼` : ""}
                  />

                  {/* 3. Miqdar daxil etmək üçün */}
                  <input
                    type="number"
                    value={stock.quantity}
                    onChange={(e) => handleStockChange(index, "quantity", e.target.value)}
                    className="border rounded py-2 px-3 w-20"
                    min="1"
                    required
                  />

                  {/* 4. Silmək üçün */}
                  <button
                    type="button"
                    onClick={() => removeStockField(index)}
                    className="bg-red-500 text-white px-3 rounded">
                    ✕
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addStockField}
              className="bg-blue-500 text-white px-3 py-1 rounded">
              + Stok Ekle
            </button>
          </div>
        </div>
      </form>
      {/* <UpdateStockSetForm /> */}
    </>
  );
}

export default AddStok;
