import React, { useState } from "react";
import axios from "axios";
import { base_url } from "../api";

function UpdateRestaurantTimes({ embedded = false }) {
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [message, setMessage] = useState("");

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
      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Yeniləmə alınmadı."
      );
    }
  };

  const fieldClass =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  const inner = (
    <>
      <h2
        className={`font-bold text-slate-800 ${
          embedded ? "text-base sm:text-lg" : "text-2xl text-center mb-6"
        }`}
      >
        İş saatları
      </h2>

      <label className="block text-sm font-medium text-slate-700">
        Açılış
        <select
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className={fieldClass}
        >
          {timeOptions.map((time, index) => (
            <option key={index} value={time}>
              {time}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700 mt-4">
        Bağlanış
        <select
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className={fieldClass}
        >
          {timeOptions.map((time, index) => (
            <option key={index} value={time}>
              {time}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={updateTimes}
        className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
      >
        Saatları yenilə
      </button>

      {message && (
        <p className="mt-3 text-center text-sm font-medium text-emerald-600">
          {message}
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 h-full">
        {inner}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {inner}
    </div>
  );
}

export default UpdateRestaurantTimes;
