import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import { base_url } from "../api/index";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { FaEdit } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ArrowLeft, ArrowRight } from "lucide-react";

const AddWarehouseProduct = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [logs, setLogs] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalItem, setEditModalItem] = useState(null);
  // const [explanationText, setExplanationText] = useState("");
  // const [selectedItemId, setSelectedItemId] = useState(null);

  const [modalAction, setModalAction] = useState(null);
  const [modalItemId, setModalItemId] = useState(null);
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalText, setModalText] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedMaterialName, setSelectedMaterialName] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(rawMaterials.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = rawMaterials.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(2); // mobil: 5 element
      } else {
        setItemsPerPage(10); // desktop: 10 element
      }
    };

    handleResize(); // ilk açılışda da yoxla
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getPageNumbers = () => {
    const delta = 1; // aktiv səhifənin ətrafında neçə səhifə göstərilsin
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("TOKEN:", token);
      const response = await axios.get(`${base_url}/raw-materials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRawMaterials(response.data);
      console.log("rawMaterialssss length:", response.data);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    // <PasswordScreen />;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${base_url}/raw-materials/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Xammal silindi", {
        position: "top-right",
        autoClose: 1000,
      });

      fetchData();
    } catch (error) {
      console.error("Xammal silinərkən xəta baş verdi:", error);
      toast.error("Xəta baş verdi. Yenidən yoxlayın.", {
        position: "top-right",
        autoClose: 1000,
      });
    }
  };

  const handleEdit = (item) => {
    // setShowModal(true);
    setEditId(item.id);
    setEditedValues({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const item = rawMaterials.find((mat) => mat.id === id);
      const payload = {
        name: editedValues.name || item.name,
        quantity: item.stock?.quantity || 0,
        unit: editedValues.unit || item.unit,
      };

      await axios.put(`${base_url}/raw-materials/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Xammal yeniləndi", {
        position: "top-right",
        autoClose: 1000,
      });

      setEditId(null);
      setEditedValues({});
      fetchData();
    } catch (error) {
      console.error("Xammal yenilənərkən xəta baş verdi:", error);
      toast.error("Xəta baş verdi. Yenidən yoxlayın.", {
        position: "top-right",
        autoClose: 1000,
      });
    }
  };

  const handleModalSave = async () => {
    if (!modalItemId || !modalAction || !modalQuantity) return;

    const token = localStorage.getItem("token");
    const payload = {
      quantity: Number(modalQuantity),
      reason: modalText,
    };

    try {
      await axios.post(`${base_url}/raw-materials/${modalItemId}/${modalAction}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(modalAction === "increase" ? "Miqdar artırıldı" : "Miqdar azaldıldı", {
        position: "top-right",
        autoClose: 1000,
      });

      // Reset & refresh
      setShowModal(false);
      setModalItemId(null);
      setModalAction(null);
      setModalQuantity("");
      setModalText("");
      fetchData();
    } catch (error) {
      console.error("Xəta:", error);
      toast.error("Xəta baş verdi. Yenidən yoxlayın.", {
        position: "top-right",
        autoClose: 1000,
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      unit: "",
    },
    onSubmit: async (values) => {
      try {
        const token = localStorage.getItem("token");
        const payload = {
          name: values.name,
          unit: Number(values.unit),
        };

        await axios.post(`${base_url}/raw-materials`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        toast.info("Xammal əlavə olundu", {
          position: "top-right",
          autoClose: 1000,
        });

        fetchData();
        formik.resetForm();
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Bu ad istifadə edilib. Yenidən yoxlayın.", {
          position: "top-right",
          autoClose: 1000,
        });
      }
    },
  });

  const category = [
    { id: 1, label: "Ədəd" },
    { id: 2, label: "Kq" },
    { id: 3, label: "Qram" },
    { id: 4, label: "Litr" },
  ];

  const [selectedMaterialUnit, setSelectedMaterialUnit] = useState("");

  // 2. handleViewLogs fonksiyonunu güncelleyin
  const handleViewLogs = async (id) => {
    if (id === null) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${base_url}/raw-materials/${id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Malzeme bilgilerini bul
      const material = rawMaterials.find((item) => item.id === id);

      // Hem adı HEM birimi sakla
      setSelectedMaterialName(material?.name || "");
      setSelectedMaterialUnit(material?.unit || ""); // Yeni state

      setSelectedLogs(response.data || []);
      setLogModalOpen(true);
    } catch (error) {
      console.error("Log error:", error);
      toast.error("Loglar yüklənmədi");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${base_url}/raw-materials/${modalItemId}/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (Array.isArray(response.data.data)) {
          setLogs(response.data.data);
        } else {
          setLogs([]); // boş dizi at, hata olmasın
        }
      })
      .catch((err) => {
        console.error("Logları gətirərkən xəta:", err);
        setLogs([]); // hata olursa da boş dizi at
      });
  }, [modalItemId]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      rawMaterials.map((item) => ({
        Adı: item.name,
        Miqdar: item.stock?.quantity || "yoxdur",
        Vahid: category.find((cat) => cat.id === item.unit)?.label || "Naməlum",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xammallar");
    XLSX.writeFile(wb, "xammallar.xlsx");
  };

  const exportToPDF = () => {
    const convert = (text) =>
      text
        .replace(/ə/g, "e")
        .replace(/Ə/g, "E")
        .replace(/ö/g, "o")
        .replace(/Ö/g, "O")
        .replace(/ü/g, "u")
        .replace(/Ü/g, "U")
        .replace(/ç/g, "c")
        .replace(/Ç/g, "C")
        .replace(/ş/g, "s")
        .replace(/Ş/g, "S")
        .replace(/İ/g, "I") // türk İ → ingilis I
        .replace(/I/g, "I") // böyük nöqtəsiz I → olduğu kimi
        .replace(/ğ/g, "g")
        .replace(/Ğ/g, "G");

    const doc = new jsPDF();
    doc.text(convert("Xammal Siyahisi"), 14, 16);

    const tableData = rawMaterials.map((item) => [
      convert(item.name),
      item.stock?.quantity || "yoxdur",
      convert(category.find((cat) => cat.id === item.unit)?.label || "Naməlum"),
    ]);

    doc.autoTable({
      head: [["Adi", "Miqdar", "Vahid"]],
      body: tableData,
      startY: 30,
    });

    doc.save("xammallar.pdf");
  };

  return (
    <div className="">
      {}
      <ToastContainer />

      <div>
        <form
          onSubmit={formik.handleSubmit}
          className="pb-2 mt-4 ml-2 sm:ml-10 max-w-full overflow-hidden">
          <h2 className="text-lg font-semibold">Xammala əlavə et!</h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-x-5 w-full p-4 rounded-lg border bg-white bg-opacity-70 backdrop-blur-lg">
            <div className="flex flex-col md:flex-row gap-4 md:gap-x-5 md:items-center w-full md:w-[600px]">
              <div className="w-full md:w-auto">
                <label className="block mb-1" htmlFor="name">
                  Adı:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  onChange={formik.handleChange}
                  value={formik.values.name}
                  placeholder="Xammal yaz..."
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              <div className="w-full md:w-auto">
                <label className="block mb-1" htmlFor="unit">
                  Vahid:
                </label>
                <select
                  id="unit"
                  name="unit"
                  onChange={formik.handleChange}
                  value={formik.values.unit}
                  className="w-full border px-2 py-1 rounded">
                  <option value="">Vahid seçin</option>
                  {category.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-auto mt-1 md:mt-5">
                <button
                  type="submit"
                  disabled={!formik.values.name || !formik.values.unit} // adı və vahidi yoxla
                  className={`bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto ${
                    !formik.values.name || !formik.values.unit
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}>
                  Saxla
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto mt-1 md:mt-0">
              <div className="flex justify-center md:justify-start gap-4">
                <button
                  className="rounded py-2 px-4 bg-blue-600 text-white w-full md:w-auto"
                  onClick={exportToExcel}>
                  EXCEL
                </button>
                <button
                  className="rounded py-2 px-4 bg-blue-600 text-white w-full md:w-auto"
                  onClick={exportToPDF}>
                  PDF
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Table */}
        <div className="ml-5 sm:ml-10">
          <h3 className="text-lg font-semibold mb-2">Mövcud xammallar</h3>

          {/* Desktop Table */}
          <div className="hidden sm:block border" style={{ maxHeight: "900px" }}>
            <table className="min-w-[600px] w-full text-left border rounded bg-gray-50 table-fixed">
              <thead className="border-b border-gray-300 bg-gray-100">
                <tr>
                  <th className="p-3 font-semibold w-[10%]">№</th>
                  <th className="p-3 font-semibold w-[30%]">Adı</th>
                  <th className="p-3 font-semibold w-[20%]">Miqdar</th>
                  <th className="p-3 font-semibold w-[20%]">Vahid</th>
                  <th className="p-3 font-semibold w-[30%] text-center">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {currentItems?.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="cursor-pointer bg-white border-b border-gray-300">
                    <td className="font-semibold px-3">{indexOfFirstItem + index + 1}</td>
                    {/* Ad (name) - redaktə edilə bilməz */}
                    <td onClick={() => handleViewLogs(item.id)} className="p-3 truncate">
                      {item.name}
                    </td>

                    <td onClick={() => handleViewLogs(item.id)} className="p-3 truncate">
                      {item.stock?.quantity || 0}
                    </td>

                    {/* Ölçü vahidi (unit) - redaktə edilə bilməz */}

                    <td onClick={() => handleViewLogs(item.id)} className="p-3 truncate">
                      {category.find((cat) => cat.id === item.unit)?.label || "Naməlum"}
                    </td>

                    {/* Əməliyyatlar */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                            setEditModalItem(item); // hazırki item-i modal üçün seçirik
                            setEditModalOpen(true);
                          }}
                          className="rounded px-3 py-1 bg-blue-500 text-white text-sm">
                          Düzəliş et
                        </button>

                        <button
                          onClick={() => {
                            setModalItemId(item.id);
                            setModalAction("increase");
                            setShowModal(true);
                          }}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm w-[80px]">
                          Artır
                        </button>

                        <button
                          onClick={() => {
                            if (item.stock?.quantity > 0) {
                              setModalItemId(item.id);
                              setModalAction("decrease");
                              setShowModal(true);
                            } else {
                              toast.warning("Miqdar artıq 0-dır, azalda bilməzsiniz", {
                                position: "top-right",
                                autoClose: 1000,
                              });
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm w-[80px] ${
                            item.stock?.quantity > 0
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={item.stock?.quantity === 0}>
                          Azalt
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded px-3 py-1 bg-red-600 text-white text-sm w-[60px]">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rawMaterials?.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      Heç bir xammal tapılmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination Düymələri - həm mobil, həm desktop üçün ortaq görünəcək */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50">
                  ⬅️ Əvvəlki
                </button>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="px-3 py-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page ? "bg-blue-600 text-white" : "bg-white"
                      }`}>
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50">
                  Sonrakı ➡️
                </button>
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">
                  {modalAction === "increase" ? "Miqdarı artır" : "Miqdarı azalt"}
                </h2>
                <input
                  type="number"
                  placeholder="Miqdar"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(e.target.value)}
                  className="w-full border px-3 py-2 mb-4"
                />
                <textarea
                  placeholder="Qeyd (optional)"
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  className="w-full border px-3 py-2 mb-4"></textarea>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded">
                    Ləğv et
                  </button>
                  <button
                    onClick={handleModalSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded">
                    Yadda saxla
                  </button>
                </div>
              </div>
            </div>
          )}

          {logModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">{selectedMaterialName} üçün loglar</h2>

                {selectedLogs?.length > 0 ? (
                  selectedLogs?.map((log) => {
                    // Birim etiketini bul
                    const unitLabel =
                      category.find((cat) => cat.id === selectedMaterialUnit)?.label || "Naməlum";

                    return (
                      <div key={log.id} className="border-b py-2">
                        <div className="flex justify-between">
                          <span>
                            {new Date(log.created_at).toLocaleDateString()} -
                            {log.type === "in" ? " ARTIRILDI" : " AZALDILDI"}
                          </span>
                          <span className="font-bold">
                            {log.quantity} {unitLabel} {/* Birimi burada göster */}
                          </span>
                        </div>
                        {log.reason && (
                          <div className="text-gray-600 mt-1">Səbəb: {log.reason}</div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>Heç bir log tapılmadı</p>
                )}

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setLogModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 rounded">
                    Bağla
                  </button>
                </div>
              </div>
            </div>
          )}

          {editModalOpen && editModalItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Xammalı Redaktə Et</h2>

                <div className="mb-4">
                  <label className="block mb-1">Adı</label>
                  <input
                    type="text"
                    value={editedValues.name || editModalItem.name}
                    onChange={(e) => setEditedValues({ ...editedValues, name: e.target.value })}
                    className="w-full border px-3 py-2"
                    placeholder="Xammal adı"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1">Miqdar</label>
                  <p className="border px-3 py-2 bg-gray-100">
                    {editModalItem.stock?.quantity || 0}
                  </p>
                </div>

                {/* <div className="mb-4">
                  <label className="block mb-1">Vahid</label>
                  <p className="border px-3 py-2 bg-gray-100">
                    {category.find((cat) => cat.id === editModalItem.unit)?.label || "Naməlum"}
                  </p>
                </div> */}

                <div className="mb-2">
                  <label className="block mb-1">Vahid</label>
                  <select
                    value={editedValues.unit || editModalItem.unit || ""}
                    onChange={(e) =>
                      setEditedValues({ ...editedValues, unit: Number(e.target.value) })
                    }
                    className="w-full border px-2 py-1">
                    <option value="">Vahid seçin</option>
                    {category.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditedValues({});
                    }}
                    className="px-4 py-2 bg-gray-300 rounded">
                    Ləğv et
                  </button>
                  <button
                    onClick={() => {
                      handleUpdate(editModalItem.id);
                      setEditModalOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded">
                    Yadda saxla
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card List */}
          <div className="sm:hidden space-y-2 mt-2">
            {rawMaterials?.length === 0 && (
              <div className="text-center text-gray-500">Heç bir xammal tapılmadı.</div>
            )}
            {currentItems?.map((item, index) => (
              <div
                key={item.id || index}
                className="border rounded-lg p-4 bg-white shadow space-y-2">
                <div className="font-semibold">Sıra N: {index + 1}</div>

                <div onClick={() => handleViewLogs(item.id)} className="cursor-pointer">
                  <span className="font-semibold">Adı: </span>
                  {item.name}
                </div>

                <div onClick={() => handleViewLogs(item.id)} className="cursor-pointer">
                  <span className="font-semibold">Miqdar: </span>
                  {item.stock?.quantity || 0}
                </div>

                <div onClick={() => handleViewLogs(item.id)} className="cursor-pointer">
                  <span className="font-semibold">Vahid: </span>
                  {category.find((cat) => cat.id === item.unit)?.label || "Naməlum"}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleEdit(item);
                      setEditModalItem(item);
                      setEditModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex-1">
                    Düzəliş et
                  </button>

                  <button
                    onClick={() => {
                      setModalItemId(item.id);
                      setModalAction("increase");
                      setShowModal(true);
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm flex-1">
                    Artır
                  </button>

                  <button
                    onClick={() => {
                      if (item.stock?.quantity > 0) {
                        setModalItemId(item.id);
                        setModalAction("decrease");
                        setShowModal(true);
                      } else {
                        toast.warning("Miqdar artıq 0-dır, azalda bilməzsiniz", {
                          position: "top-right",
                          autoClose: 1000,
                        });
                      }
                    }}
                    className={`px-3 py-1 rounded text-sm flex-1 ${
                      item.stock?.quantity > 0
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={item.stock?.quantity === 0}>
                    Azalt
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm flex-1">
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile Pagination */}
          <div className="sm:hidden flex justify-center gap-2 mt-2 mb-5 position-fixed bottom-0">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50">
              <ArrowLeft/>
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={index} className="px-2 py-1 text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`p-2 border text-sm rounded-sm ${
                    currentPage === page ? "bg-blue-900 text-white" : "bg-white"
                  }`}>
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50">
              <ArrowRight/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWarehouseProduct;
