import React, { useState, useEffect } from "react";
import axios from "axios";
import AccessDenied from "../components/AccessDenied";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import DontActiveAcount from "../components/DontActiveAcount";
import UpdateRestaurantTimes from "../components/UpdateRestaurantTimes";
import PasswordScreen from "../components/ScreenPassword";
import ScreenPasswordPc from "../components/ScreenPasswordPc";
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

  console.log(formData, "cus");
  useEffect(() => {
    localStorage.setItem("fisYazisi", formData.custom_message);
  }, [formData]);
  localStorage.setItem("restoran_name", formData.name);

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

    console.log([...formDataToSend.entries()]);

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
      alert("Parametrlər uğurla yeniləndi");
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
    return <div>Loading...</div>;
  }

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
      <section className="p-4">
        <div className="rounded-t border flex items-center justify-between bg-[#fafbfc] py-2 px-3">
          <h4 className="text-lg font-semibold">Ayarlar</h4>
        </div>
        <div className="border border-t-0  bg-white py-4 w-full flex justify-around">
          <form
            className="flex lg:flex-row flex-col gap-6 w-full "
            onSubmit={handleSubmit}
          >
            <div className="bg-gray-50 rounded border p-4 md:w-1/2 lg:w-1/3">
              <div className="mb-5">
                <div className="flex items-center justify-center mb-3">
                  <img
                    src={replaceImage(photo)}
                    alt="Logo"
                    className="h-24 w-24 object-cover"
                  />
                </div>
                <label className="block mb-2 text-sm font-medium">
                  Logo (.jpg, .png) (isteğe bağlıdır)
                </label>
                <input
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
                  type="file"
                  name="logo"
                  onChange={handleChange}
                />
                {errors.logo && (
                  <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
                )}
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Cafe / Restaurant adı
                </label>
                <input
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Sipariş (yazıcı) fiş altı mesajı
                </label>
                <textarea
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
                  name="custom_message"
                  value={formData.custom_message}
                  onChange={handleChange}
                ></textarea>
                {errors.custom_message && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.custom_message}
                  </p>
                )}
              </div>
              <div className="mb-5 flex items-center gap-2">
                <input
                  id="is_qr_active"
                  type="checkbox"
                  name="is_qr_active"
                  checked={formData.is_qr_active}
                  onChange={handleChange}
                />
                <label htmlFor="is_qr_active" className="text-sm">
                  Qr menüyü aktif hale getir
                </label>
              </div>
              <div className="mb-5 flex items-center gap-2">
                <input
                  id="get_qr_order"
                  type="checkbox"
                  name="get_qr_order"
                  checked={formData.get_qr_order}
                  onChange={handleChange}
                />
                <label htmlFor="get_qr_order" className="text-sm">
                  Qr menüden sipariş al
                </label>
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Ana/Hesap yazıcı
                </label>
                <input
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
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
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Mutfak yazıcı
                </label>
                <input
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
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
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Bar yazıcı
                </label>
                <input
                  className="border rounded py-2 px-3 w-full outline-none text-sm"
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
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Boş masa renk
                </label>
                <input
                  style={{ width: "100px" }}
                  className="border rounded py-1 px-2 outline-none text-sm"
                  type="color"
                  name="empty_table_color"
                  value={formData.empty_table_color}
                  onChange={handleChange}
                />
                {errors.empty_table_color && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.empty_table_color}
                  </p>
                )}
              </div>
              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                  Dolu masa renk
                </label>
                <input
                  style={{ width: "100px" }}
                  className="border rounded py-1 px-2 outline-none text-sm"
                  type="color"
                  name="booked_table_color"
                  value={formData.booked_table_color}
                  onChange={handleChange}
                />
                {errors.booked_table_color && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.booked_table_color}
                  </p>
                )}
              </div>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium mb-2">
                  Ps Club
                </label>

                <div
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
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  {/* Toggle button */}
                  <div
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors 
        ${isOn ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 
          ${isOn ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </div>

                  {/* ON / OFF text */}
                  <span
                    className={`text-sm font-medium ${
                      isOn ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {isOn ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="bg-sky-600 text-white font-medium py-2 px-4 rounded mt-4 hover:bg-sky-700 transition"
              >
                Kaydet
              </button>
            </div>
          </form>
          <UpdateRestaurantTimes />
        </div>
      </section>
    </>
  );
};

export default GenelAyarlar;
