import React, { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "../components/AccessDenied";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import DontActiveAcount from "../components/DontActiveAcount";
import UpdateRestaurantTimes from "../components/UpdateRestaurantTimes";
import PasswordScreen from "../components/ScreenPassword";
import ScreenPasswordPc from "../components/ScreenPasswordPc";
import SecurityPasswordSettings from "../components/SecurityPasswordSettings";
import { Settings, ShieldCheck, ChevronRight, Image, Printer, Palette } from "lucide-react";
import { toast } from "react-toastify";
// Get auth headers from local storage
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

const GenelAyarlar = () => {
  const [isOn, setIsOn] = useState(false);
  const [activeGroup, setActiveGroup] = useState(() => {
    try {
      return localStorage.getItem("genel_ayarlar_group") || "ayarlar";
    } catch (e) {
      return "ayarlar";
    }
  });

  const selectGroup = (key) => {
    setActiveGroup(key);
    try {
      localStorage.setItem("genel_ayarlar_group", key);
    } catch (e) {}
  };

  const [formData, setFormData] = useState({
    logo: null,
    name: "",
    custom_message: "",
    is_qr_active: false,
    get_qr_order: false,
    main_printer: "",
    kitchen_printer: "",
    bar_printer: "",
    empty_table_color: "",
    booked_table_color: "",
    restoranName: "",
    is_psclub: false,
  });

  useEffect(() => {
    localStorage.setItem("fisYazisi", formData.custom_message);
  }, [formData]);
  useEffect(() => {
    try {
      localStorage.setItem("restoran_name", formData.name || "");
    } catch (e) {}
  }, [formData.name]);

  // localStorage.setItem("restoran_adı", formData.custom_message);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  // Fetch settings from server
  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${base_url}/own-restaurants`,
        getAuthHeaders()
      );
      const data = response.data;
      setFormData({
        logo: null,
        name: data.name || "",
        custom_message: data.custom_message || "",
        is_qr_active: data.is_qr_active || false,
        get_qr_order: data.get_qr_order || false,
        is_psclub: data.is_psclub || false,
        main_printer: data.main_printer || "",
        kitchen_printer: data.kitchen_printer || "",
        bar_printer: data.bar_printer || "",
        empty_table_color: data.empty_table_color || "",
        booked_table_color: data.booked_table_color || "",
      });
      setPhoto(data.logo);
      setIsOn(data.is_psclub || false); 
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      } else {
        console.error("Error loading customers:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    formDataToSend.append("name", formData.name);
    formDataToSend.append("custom_message", formData.custom_message);
    if (formData.logo) {
      formDataToSend.append("logo", formData.logo);
    }
    formDataToSend.append("main_printer", formData.main_printer);
    formDataToSend.append("kitchen_printer", formData.kitchen_printer);
    formDataToSend.append("bar_printer", formData.bar_printer);
    formDataToSend.append("is_qr_active", formData.is_qr_active ? "1" : "0");
    formDataToSend.append("get_qr_order", formData.get_qr_order ? "1" : "0");
    formDataToSend.append("is_psclub", formData.is_psclub ? "1" : "0");
    formDataToSend.append("empty_table_color", formData.empty_table_color);
    formDataToSend.append("booked_table_color", formData.booked_table_color);

    try {
      await axios.post(
        `${base_url}/own-restaurants?_method=PUT`,
        formDataToSend,
        {
          headers: {
            ...getAuthHeaders().headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Parametrlər uğurla yeniləndi", {
        position: "top-center",
        autoClose: 1400,
      });
      window.location.reload();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true); // Set access denied if response status is 403
      }
      // {"message":"User does not belong to any  active restaurant."}
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      }
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Error updating settings", error);
      }
    }
  };

 

  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;
  if (ActiveUser) return <DontActiveAcount onClose={setActiveUser} />;
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-medium">Yüklənir…</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelClass = "block text-sm font-medium text-slate-700";

  const replaceImage = (url) => {
    return url ? `${img_url}/${url}` : ""; // Ensure URL is valid
  };
  return (
    <>
      <PasswordScreen />
      <Helmet>
        <title> Genəl Ayarlar | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <section className="p-3 sm:p-4 max-w-[1400px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
            {/* Sol: Qrup siyahısı */}
            <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60">
              <div className="px-4 py-4 border-b border-slate-200/70">
                <h3 className="text-base font-bold text-slate-800">
                  Ümumi Nizamlamalar
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kateqoriya seçin
                </p>
              </div>
              <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
                {[
                  {
                    key: "ayarlar",
                    label: "Ayarlar",
                    desc: "Restoran, loqo, printer, rənglər",
                    icon: Settings,
                  },
                  {
                    key: "sifre",
                    label: "Şifrə Nizamlaması",
                    desc: "Bölmə-əsaslı şifrələr",
                    icon: ShieldCheck,
                  },
                ].map((g) => {
                  const Icon = g.icon;
                  const isActive = activeGroup === g.key;
                  return (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => selectGroup(g.key)}
                      className={`group shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${
                        isActive
                          ? "bg-white border-indigo-200 shadow-sm"
                          : "border-transparent hover:bg-white/80 hover:border-slate-200"
                      }`}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <div
                        className={`w-10 h-10 shrink-0 rounded-lg grid place-items-center transition ${
                          isActive
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow"
                            : "bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isActive ? "text-indigo-700" : "text-slate-800"
                          }`}
                        >
                          {g.label}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {g.desc}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`hidden md:block shrink-0 transition ${
                          isActive
                            ? "text-indigo-500 translate-x-0.5"
                            : "text-slate-300 group-hover:text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Sağ: Seçilmiş qrup məzmunu */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {activeGroup === "sifre" ? (
                <div className="p-4 sm:p-6">
                  <SecurityPasswordSettings />
                </div>
              ) : (
                <div className="p-4 sm:p-6 space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                      Ayarlar
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
                      Restoran profili, printerlər, masa rəngləri və iş saatları —
                      mobil və masaüstü üçün uyğunlaşdırılmış tərtibat.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                            <Image size={16} className="text-indigo-600" />
                          </span>
                          Profil və loqo
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex justify-center sm:justify-start shrink-0">
                            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                              <img
                                src={replaceImage(photo)}
                                alt="Logo"
                                className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 space-y-4">
                            <div>
                              <label className={labelClass}>
                                Logo (.jpg, .png) — istəyə bağlı
                              </label>
                              <input
                                className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700`}
                                type="file"
                                name="logo"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={handleChange}
                              />
                              {errors.logo && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.logo}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className={labelClass}>
                                Kafe / restoran adı
                              </label>
                              <input
                                className={inputClass}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                              />
                              {errors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className={labelClass}>
                                Fiş altı mesajı
                              </label>
                              <textarea
                                className={`${inputClass} min-h-[88px] resize-y`}
                                name="custom_message"
                                value={formData.custom_message}
                                onChange={handleChange}
                                rows={3}
                              />
                              {errors.custom_message && (
                                <p className="text-red-500 text-sm mt-1">
                                  {errors.custom_message}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-white/80 px-3 py-3">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  id="is_qr_active"
                                  type="checkbox"
                                  name="is_qr_active"
                                  checked={formData.is_qr_active}
                                  onChange={handleChange}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">
                                  QR menyunu aktiv et
                                </span>
                              </label>
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                  id="get_qr_order"
                                  type="checkbox"
                                  name="get_qr_order"
                                  checked={formData.get_qr_order}
                                  onChange={handleChange}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">
                                  QR menyudan sifariş qəbul et
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                            <Printer size={16} className="text-indigo-600" />
                          </span>
                          Printerlər
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className={labelClass}>Ana / hesab yazıcı</label>
                            <input
                              className={inputClass}
                              type="text"
                              name="main_printer"
                              value={formData.main_printer}
                              onChange={handleChange}
                            />
                            {errors.main_printer && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.main_printer}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Mətbəx yazıcı</label>
                            <input
                              className={inputClass}
                              type="text"
                              name="kitchen_printer"
                              value={formData.kitchen_printer}
                              onChange={handleChange}
                            />
                            {errors.kitchen_printer && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.kitchen_printer}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Bar yazıcı</label>
                            <input
                              className={inputClass}
                              type="text"
                              name="bar_printer"
                              value={formData.bar_printer}
                              onChange={handleChange}
                            />
                            {errors.bar_printer && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.bar_printer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
                            <Palette size={16} className="text-indigo-600" />
                          </span>
                          Masa rəngləri və PS Club
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Boş masa</label>
                            <div className="mt-1.5 flex items-center gap-3">
                              <input
                                className="h-11 w-full max-w-[120px] cursor-pointer rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                                type="color"
                                name="empty_table_color"
                                value={formData.empty_table_color || "#000000"}
                                onChange={handleChange}
                              />
                              <span className="text-xs font-mono text-slate-500 truncate">
                                {formData.empty_table_color || "—"}
                              </span>
                            </div>
                            {errors.empty_table_color && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.empty_table_color}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Dolu masa</label>
                            <div className="mt-1.5 flex items-center gap-3">
                              <input
                                className="h-11 w-full max-w-[120px] cursor-pointer rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                                type="color"
                                name="booked_table_color"
                                value={formData.booked_table_color || "#000000"}
                                onChange={handleChange}
                              />
                              <span className="text-xs font-mono text-slate-500 truncate">
                                {formData.booked_table_color || "—"}
                              </span>
                            </div>
                            {errors.booked_table_color && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.booked_table_color}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className={labelClass}>PS Club</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOn((prev) => {
                                const newValue = !prev;
                                setFormData((prevForm) => ({
                                  ...prevForm,
                                  is_psclub: newValue,
                                }));
                                return newValue;
                              });
                            }}
                            className="mt-2 flex items-center gap-3 cursor-pointer select-none text-left w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50/80 transition"
                          >
                            <div
                              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                                isOn ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <div
                                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                                  isOn ? "translate-x-6" : "translate-x-0"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isOn ? "text-emerald-700" : "text-slate-500"
                              }`}
                            >
                              {isOn ? "Aktiv" : "Söndürülüb"}
                            </span>
                          </button>
                        </div>
                      </div>

                      <UpdateRestaurantTimes embedded />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto min-h-[44px] rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                      >
                        Dəyişiklikləri saxla
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GenelAyarlar;
