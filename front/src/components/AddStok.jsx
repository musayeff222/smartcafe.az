import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AccessDenied from "./AccessDenied";
import { base_url } from "../api/index";
import { StockAdditionalPrices } from "./StockAdditionalPrices";
import { FaTrash } from "react-icons/fa";

const buildValidRawMaterials = (rows) =>
  rows
    .filter((mat) => mat.id != null && String(mat.id).trim() !== "")
    .map((mat) => ({
      id: parseInt(mat.id, 10),
      quantity: parseFloat(mat.quantity) || 1,
    }))
    .filter((mat) => !Number.isNaN(mat.id));

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
function AddStok({ setAddStok }) {
  const [formData, setFormData] = useState({
    name: "",
    stock_group_id: "",
    image: null,
    show_on_qr: false,
    price: 0,
    cost_price: "",
    amount: 0,
    alert_critical: false,
    critical_amount: 1,
    item_type: "sayilan",
    additionalPrices: [],
    description: "",
  });
  console.log(formData, "formdata");
  const [groups, setGroups] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);

  const [selectedRawMaterials, setSelectedRawMaterials] = useState([{ id: "", quantity: 1 }]);

  const handleRawMaterialChange = (index, field, value) => {
    const updated = [...selectedRawMaterials];
    updated[index][field] = value;
    setSelectedRawMaterials(updated);
  };

  const addRawMaterialField = () => {
    setSelectedRawMaterials([...selectedRawMaterials, { id: "", quantity: 1 }]);
  };

  const removeRawMaterialField = (index) => {
    const updated = selectedRawMaterials.filter((_, i) => i !== index);
    setSelectedRawMaterials(updated);
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        image: file,
      }));
    }
  };

  const handleAdditionalPriceChange = (e, index) => {
    const newPrices = [...formData.additionalPrices];
    newPrices[index] = { ...newPrices[index], price: e.target.value };
    setFormData((prevData) => ({
      ...prevData,
      additionalPrices: newPrices,
    }));
  };
  const handleAdditionalNumberChange = (e, index) => {
    const newPrices = [...formData.additionalPrices];
    newPrices[index] = { ...newPrices[index], count: e.target.value };
    setFormData((prevData) => ({
      ...prevData,
      additionalPrices: newPrices,
    }));
  };

  const handleCountChange = (e, index) => {
    const newPrices = [...formData.additionalPrices];
    newPrices[index] = { ...newPrices[index], unit: e.target.value };
    setFormData((prevData) => ({
      ...prevData,
      additionalPrices: newPrices,
    }));
  };

  const addPriceInput = () => {
    setFormData((prevData) => ({
      ...prevData,
      additionalPrices: [...prevData.additionalPrices, { price: "", count: "" }],
    }));
  };
  const handleDescriptionProduct = (e) => {
    setFormData((prev) => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    // Append main form data and additional prices
    formDataToSend.append("name", formData.name);
    formDataToSend.append("stock_group_id", formData.stock_group_id);
    if (formData.image) formDataToSend.append("image", formData.image);
    formDataToSend.append("show_on_qr", formData.show_on_qr ? "1" : "0");
    formDataToSend.append("price", formData.price);
    if (formData.cost_price !== "" && formData.cost_price != null) {
      formDataToSend.append("cost_price", formData.cost_price);
    }
    formDataToSend.append("amount", formData.amount); // Miqdar burada təyin olunur
    formDataToSend.append("description", formData.description);
    formDataToSend.append("alert_critical", formData.alert_critical ? "1" : "0");
    formDataToSend.append("critical_amount", formData.critical_amount);
    formDataToSend.append("item_type", formData.item_type);

    const validAdditionalPrices = formData.additionalPrices.filter(
      (p) => p.price !== "" && p.unit !== "" && p.count !== ""
    );
    validAdditionalPrices.forEach((priceObj, index) => {
      formDataToSend.append(`additionalPrices[${index}][price]`, priceObj.price);
      formDataToSend.append(`additionalPrices[${index}][unit]`, priceObj.unit);
      formDataToSend.append(`additionalPrices[${index}][count]`, priceObj.count);
    });

    const validRawMaterials = buildValidRawMaterials(selectedRawMaterials);

    try {
      const stockResponse = await axios.post(`${base_url}/stocks`, formDataToSend, {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      const stockId = stockResponse.data?.id;

      if (stockId && validRawMaterials.length > 0) {
        try {
          await axios.post(
            `${base_url}/stocks/${stockId}/attach-raw-material`,
            { raw_materials: validRawMaterials },
            getAuthHeaders()
          );
        } catch (attachErr) {
          console.warn("Raw material attach failed:", attachErr);
          toast.warning("Məhsul yaradıldı, amma xammallar bağlanmadı.");
          setAddStok(false);
          return;
        }
      }

      toast.success("Məhsul əlavə olundu.");
      setAddStok(false);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error adding stock:", error);
        const apiMsg = error.response?.data?.message;
        const validation =
          error.response?.data?.errors &&
          Object.values(error.response.data.errors).flat().join(" ");
        alert(
          validation ||
            apiMsg ||
            "Məhsul əlavə edilərkən xəta baş verdi. Yenidən cəhd edin."
        );
      }
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

      setRawMaterials(response.data);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  const removePrice = (index) => {
    setFormData((prevData) => {
      const newPrices = prevData.additionalPrices.filter((_, i) => i !== index);
      return { ...prevData, additionalPrices: newPrices };
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 w-full md:w-1/2">
        {/* Image Upload */}
        <h3 className="mb-2">Şəkil (istəyə bağlı — .jpg, .png, max 2048 KB)</h3>
        <input
          className="border rounded py-2 px-3 w-full text-sm font-medium mb-5"
          type="file"
          name="image"
          onChange={handleFileChange}
          accept=".jpg,.png,.jpeg,.webp"
        />

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

        <label className="text-sm font-semibold mb-2">Grup</label>
        <select
          className="border rounded py-2 px-3 w-full text-sm font-medium mb-5"
          name="stock_group_id"
          value={formData.stock_group_id}
          onChange={handleChange}
          required>
          <option value="">Seçiniz</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <label className="text-sm font-semibold mb-2">Ürün Tipi</label>
        <select
          className="border rounded py-2 px-3 w-full text-sm font-medium mb-5"
          name="item_type"
          value={formData.item_type}
          onChange={handleChange}
          required>
          <option value="sayilan">Sayilan</option>
          <option value="sayilmiyan">Sayilmiyan</option>
        </select>

        <button type="submit" className="w-full rounded-xl bg-indigo-600 font-semibold py-2.5 px-4 text-white hover:bg-indigo-700 transition">
          Saxla
        </button>
      </div>

      <div className="bg-slate-50/80 flex flex-col rounded-xl border border-slate-200 p-4 w-full md:w-1/2">
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
            min="0"
            required
          />
          <div className="border border-l-0 bg-gray-50 text-center w-2/12 rounded-r py-2 px-3">
            ₼
          </div>
        </div>

        <label className="text-sm font-semibold mb-2">Maya dəyəri (istəyə bağlı)</label>
        <div className="flex mb-3 gap-2">
          <input
            className="border rounded py-2 px-3 w-10/12 text-sm font-medium"
            type="number"
            name="cost_price"
            value={formData.cost_price}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="Boş buraxa bilərsiniz"
          />
          <div className="border border-l-0 bg-gray-50 text-center w-2/12 rounded-r py-2 px-3">
            ₼
          </div>
        </div>
        <label className="text-sm font-semibold mb-2">Malın təsviri</label>
        <input
          className="border rounded mb-2 py-2 px-3 max-w-full w-full text-sm font-medium"
          type="text"
          value={formData.description}
          onChange={handleDescriptionProduct}
          placeholder="Məhsulun təsviri"
        />

        <StockAdditionalPrices
          prices={formData.additionalPrices}
          onNumberChange={handleAdditionalNumberChange}
          onPriceChange={handleAdditionalPriceChange}
          onCountChange={handleCountChange}
          addPrice={addPriceInput}
          removePrice={removePrice}
        />

        {/* Additional Fields for Item Type "sayilan" */}
        {formData.item_type === "sayilan" && (
          <>
            <label className="text-sm font-semibold mb-2">Miqtar</label>
            <input
              className="border rounded py-2 px-3 w-full text-sm font-medium mb-5"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />

            <label className="text-sm font-semibold mb-2">
              Kritik say (kritik sayi altına düştüğünde xəbərdarliq edəcek.)
            </label>
            <div className="flex mb-3">
              <input
                className="mr-3 h-6"
                type="checkbox"
                name="alert_critical"
                checked={formData.alert_critical}
                onChange={handleChange}
              />
              <input
                className="border rounded py-2 px-3 w-full text-sm font-medium"
                type="number"
                name="critical_amount"
                value={formData.critical_amount}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Xammallar</h3>
              {selectedRawMaterials.map((material, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    className="border rounded py-2 px-3 w-full text-sm font-medium"
                    value={material.id}
                    onChange={(e) => handleRawMaterialChange(index, "id", e.target.value)}
                  >
                    <option value="">Seç</option>
                    {rawMaterials.map((raw) => (
                      <option key={raw.id} value={raw.id}>
                        {raw.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="border rounded py-2 px-3 w-full text-sm font-medium"
                    type="number"
                    step="0.01"
                    value={material.quantity}
                    onChange={(e) => handleRawMaterialChange(index, "quantity", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeRawMaterialField(index)}
                    className="text-red-500">
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRawMaterialField}
                className="border hover:bg-sky-500 rounded py-1 px-2 bg-sky-600 text-white text-sm font-medium">
                Xammal əlavə et
              </button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}

export default AddStok;
