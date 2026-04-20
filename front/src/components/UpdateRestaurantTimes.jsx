import React, { useState } from "react";
import axios from "axios";
import { base_url } from "../api";

function UpdateRestaurantTimes() {
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [message, setMessage] = useState("");

  // 15 dakikalık aralıklarla zaman seçenekleri oluşturma
  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        options.push(`${hour}:${minute}`);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Token ve diğer başlıkları almak için fonksiyon
  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const updateTimes = async () => {
    const url = `${base_url}/restaurant/times`;

    const data = {
      open_time: openTime,
      close_time: closeTime,
    };

    try {
      const response = await axios.put(url, data, { headers: getHeaders() });
      console.log("API Response",response.data);
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message || "Hata oluştu: Güncelleme başarısız."
      );
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Restoran İş Saatlarını Güncelle
      </h1>

      <label className="block mb-4">
        <span className="text-gray-700">Açılış Saati:</span>
        <select
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        >
          {timeOptions.map((time, index) => (
            <option key={index} value={time}>
              {time}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-4">
        <span className="text-gray-700">Kapanış Saati:</span>
        <select
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        >
          {timeOptions.map((time, index) => (
            <option key={index} value={time}>
              {time}
            </option>
          ))}
        </select>
      </label>

      <button
        onClick={updateTimes}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300"
      >
        Güncelle
      </button>

      {message && (
        <p className="mt-4 text-center text-green-600 font-medium">{message}</p>
      )}
    </div>
  );
}

export default UpdateRestaurantTimes;
