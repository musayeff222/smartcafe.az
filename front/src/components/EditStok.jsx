import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AccessDenied from "./AccessDenied";
import { StockAdditionalPrices } from "./StockAdditionalPrices";
import { base_url, img_url } from "../api/index";
import { X } from "lucide-react";

const Box = "div";
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1";

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

const mapDetailsToPrices = (details) =>
  (details || []).map((d) => ({
    id: d.id,
    price: d.price ?? "",
    unit: d.unit ?? "",
    count: d.count ?? "",
  }));

const EditStok = ({ item, onClose, onUpdate, rawMaterials }) => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    price: "",
    cost_price: "",
    show_on_qr: false,
    stock_group_id: null,
    critical_amount: "",
    alert_critical: false,
  });
  const [additionalPrices, setAdditionalPrices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [rawMaterialss, setRawMaterialss] = useState([]);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([{ id: "", quantity: 1 }]);

  useEffect(() => {
    if (rawMaterials && rawMaterials.length > 0) {
      const formatted = rawMaterials.map((raw) => ({
        id: String(raw.id),
        quantity: parseFloat(raw.pivot?.quantity || "1"),
      }));
      setSelectedRawMaterials(formatted);
    }
  }, [rawMaterials]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        amount: item.amount,
        price: item.price,
        cost_price: item.cost_price ?? "",
        show_on_qr: item.show_on_qr || false,
        stock_group_id: item.stock_group_id,
        critical_amount: item.critical_amount || "",
        alert_critical: item.alert_critical || false,
      });
      setAdditionalPrices(mapDetailsToPrices(item.details));
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${base_url}/raw-materials`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRawMaterialss(response.data);
      } catch (error) {
        console.error("Error fetching raw materials:", error);
      }
    };
    fetchData();
  }, []);

  const handleRawMaterialChange = (index, field, value) => {
    const updated = [...selectedRawMaterials];
    updated[index][field] = value;
    setSelectedRawMaterials(updated);
  };

  const removeMaterialField = (index) => {
    setSelectedRawMaterials(selectedRawMaterials.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAdditionalPriceChange = (e, index) => {
    const newPrices = [...additionalPrices];
    newPrices[index] = { ...newPrices[index], price: e.target.value };
    setAdditionalPrices(newPrices);
  };

  const handleAdditionalNumberChange = (e, index) => {
    const newPrices = [...additionalPrices];
    newPrices[index] = { ...newPrices[index], count: e.target.value };
    setAdditionalPrices(newPrices);
  };

  const handleCountChange = (e, index) => {
    const newPrices = [...additionalPrices];
    newPrices[index] = { ...newPrices[index], unit: e.target.value };
    setAdditionalPrices(newPrices);
  };

  const addPriceInput = () => {
    setAdditionalPrices([...additionalPrices, { price: "", count: "", unit: "Ədəd" }]);
  };

  const removePrice = (index) => {
    setAdditionalPrices(additionalPrices.filter((_, i) => i !== index));
  };

  const buildAdditionalPricesPayload = () =>
    additionalPrices
      .filter((p) => p.price !== "" && p.count !== "" && p.unit !== "")
      .map((p) => {
        const row = {
          price: Number(p.price),
          unit: p.unit,
          count: Number(p.count),
        };
        if (p.id) row.id = p.id;
        return row;
      });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const costPrice =
        formData.cost_price === "" || formData.cost_price == null
          ? null
          : Number(formData.cost_price);

      await axios.put(
        `${base_url}/stocks/${item.id}`,
        {
          ...formData,
          cost_price: costPrice,
          additionalPrices: buildAdditionalPricesPayload(),
        },
        getAuthHeaders()
      );

      const rawMaterials = selectedRawMaterials
        .filter((mat) => mat.id != null && String(mat.id).trim() !== "")
        .map((mat) => ({
          id: Number(mat.id),
          quantity: Number(mat.quantity),
        }))
        .filter((mat) => !Number.isNaN(mat.id) && mat.quantity > 0);

      if (rawMaterials.length > 0) {
        try {
          await axios.put(
            `${base_url}/stocks/${item.id}/raw-materials`,
            { raw_materials: rawMaterials },
            getAuthHeaders()
          );
        } catch (attachErr) {
          console.warn("Raw material update failed:", attachErr);
          toast.warning("Məhsul yeniləndi, amma xammallar yenilənmədi.");
          onUpdate();
          onClose();
          return;
        }
      }

      toast.success("Məhsul saxlanıldı.");
      onUpdate();
      onClose();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error updating item", error);
        const validation =
          error.response?.data?.errors &&
          Object.values(error.response.data.errors).flat().join(" ");
        toast.error(
          validation ||
            error.response?.data?.message ||
            "Məhsul yenilənərkən xəta baş verdi."
        );
      }
    }
  };

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;

  return (
    <Box
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation">
      <Box
        className="bg-white shadow-2xl w-full sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col min-h-0 max-h-[92dvh] sm:max-h-[min(90dvh,42rem)] sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-stok-title">
        <Box className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-5 py-3 sm:py-4 text-white shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-indigo-100 font-semibold">
            Stok yeniləmə
          </p>
          <h3 id="edit-stok-title" className="text-base sm:text-lg font-bold truncate pr-10">
            {formData.name || item?.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            aria-label="Bağla">
            <X size={18} />
          </button>
        </Box>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Box className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 md:items-start">
              <Box className="space-y-4 min-w-0">
                {item?.image && (
                  <Box className="flex justify-center rounded-xl border border-slate-100 bg-slate-50 p-2 sm:p-3">
                    <img
                      src={`${img_url}/${item.image}`}
                      alt=""
                      className="h-20 sm:h-24 max-w-full object-contain"
                    />
                  </Box>
                )}
                <Box>
                  <label className={labelClass} htmlFor="edit-name">
                    Adı
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </Box>
                <Box className="grid grid-cols-2 gap-3">
                  <Box>
                    <label className={labelClass} htmlFor="edit-amount">
                      Stok
                    </label>
                    <input
                      type="number"
                      id="edit-amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </Box>
                  <Box>
                    <label className={labelClass} htmlFor="edit-price">
                      Satış qiyməti
                      {additionalPrices.length > 0 ? " (əsas)" : ""}
                    </label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </Box>
                </Box>
                <Box>
                  <label className={labelClass} htmlFor="edit-cost-price">
                    Maya dəyəri (istəyə bağlı)
                  </label>
                  <input
                    type="number"
                    id="edit-cost-price"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className={inputClass}
                    step="0.01"
                    min="0"
                    placeholder="Boş buraxa bilərsiniz"
                  />
                </Box>
                <Box>
                  <label className={labelClass} htmlFor="edit-critical">
                    Kritik miqdar
                  </label>
                  <input
                    type="number"
                    id="edit-critical"
                    name="critical_amount"
                    value={formData.critical_amount}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </Box>
                <Box>
                  <label className={labelClass} htmlFor="edit-group">
                    Qrup
                  </label>
                  <select
                    id="edit-group"
                    name="stock_group_id"
                    value={formData.stock_group_id || ""}
                    onChange={handleChange}
                    className={inputClass}
                    required>
                    <option value="">Seçin</option>
                    {groups?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="alert_critical"
                      checked={formData.alert_critical}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    Kritik xəbərdarlıq
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_on_qr"
                      checked={formData.show_on_qr}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    QR menyuda göstər
                  </label>
                </Box>
              </Box>

              <Box className="space-y-4 min-w-0">
                <StockAdditionalPrices
                  prices={additionalPrices}
                  onNumberChange={handleAdditionalNumberChange}
                  onPriceChange={handleAdditionalPriceChange}
                  onCountChange={handleCountChange}
                  addPrice={addPriceInput}
                  removePrice={removePrice}
                />
                <Box className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                  <p className={labelClass}>Xammal</p>
                  {selectedRawMaterials.map((material, index) => (
                    <Box
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_5rem_auto] gap-2 items-center">
                      <select
                        className={inputClass}
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
                        className={inputClass}
                        type="number"
                        min="1"
                        max="999"
                        value={material.quantity}
                        onChange={(e) =>
                          handleRawMaterialChange(index, "quantity", e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeMaterialField(index)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 sm:py-2.5">
                        ✕
                      </button>
                    </Box>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRawMaterials([...selectedRawMaterials, { id: "", quantity: 1 }])
                    }
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    + Yeni xammal
                  </button>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="shrink-0 flex flex-col-reverse sm:flex-row gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="sm:order-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Ləğv
            </button>
            <button
              type="submit"
              className="sm:order-2 flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition">
              Saxla
            </button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};



export default EditStok;
