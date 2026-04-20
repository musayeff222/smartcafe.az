import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { base_url } from "../api/index";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const ExpiredTablesAlert = ({ tables, onTableClick, soundFile }) => {
  const [expiredTables, setExpiredTables] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPsClub, setIsPsClub] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${base_url}/own-restaurants`, getHeaders());
        setIsPsClub(response.data.is_psclub);
      } catch (error) {
        console.error("Restoran məlumatı yüklənmədi:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (soundFile && !audioRef.current) {
      const audio = new Audio(soundFile);
      audio.preload = "auto";
      audio.volume = 1.0;
      audio.loop = true;
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [soundFile]);

  const playAlertSound = () => {
    if (audioRef.current && !isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  useEffect(() => {
    const checkExpiredTables = () => {
      const expired = [];

      if (!tables || tables.length === 0) {
        setExpiredTables([]);
        if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      tables.forEach((table) => {
        const savedEndTime = localStorage.getItem(`table_${table.id}_endTime`);
        const savedIsRunning = localStorage.getItem(`table_${table.id}_isRunning`);
        const savedIsExpired = localStorage.getItem(`table_${table.id}_isExpired`);

        // Timer bitmiş olub-olmadığını yoxla: ya isExpired=true, ya da endTime keçib
        const endTime = savedEndTime ? parseInt(savedEndTime) : null;
        const currentTime = Date.now();
        const isTimerExpired = savedIsExpired === "true" || 
          (endTime && currentTime > endTime && savedIsRunning === "true");

        if (endTime && isTimerExpired) {
          const expiredMinutes = Math.floor((currentTime - endTime) / 60000);
          // Əvvəlcə presetPrice-ı yoxla, sonra priceTimer-ı
          const savedPresetPrice = localStorage.getItem(`table_${table.id}_presetPrice`);
          const storedPrice = localStorage.getItem(`table_${table.id}_priceTimer`);
          const finalPrice = savedPresetPrice ? parseFloat(savedPresetPrice) : 
                            (storedPrice ? parseFloat(storedPrice) : null);
          
          expired.push({
            ...table,
            expiredMinutes: Math.max(0, expiredMinutes),
            expiredTime: new Date(endTime).toLocaleTimeString("az-AZ", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            total_price: finalPrice
          });
        }
      });

      if (expired.length > 0 && expired.length > expiredTables.length) playAlertSound();
      if (expired.length === 0 && isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setExpiredTables(expired);
    };

    checkExpiredTables();
    const interval = setInterval(checkExpiredTables, 5000);
    return () => clearInterval(interval);
  }, [tables, expiredTables.length, isPlaying]);

  const handleTableClick = (tableId) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    onTableClick?.(tableId);
  };

  const handleClose = () => {
    setIsVisible(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (isPsClub !== 1 || !isVisible) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-red-100 to-red-200 border-l-4 border-red-500 rounded-xl shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-red-300">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-red-800">
            Vaxtı Bitmiş Masalar{" "}
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-sm ml-1">
              {expiredTables.length}
            </span>
          </h3>
          {expiredTables.length > 0 && (
            <button
              onClick={playAlertSound}
              className="ml-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
              title="Səsi təkrar çal"
            >
              🔊
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-red-600 hover:text-red-800 text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Table List */}
      {expiredTables.length > 0 ? (
        <div className="p-3 sm:p-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-red-200 text-sm sm:text-base">
            <thead className="bg-red-50">
              <tr>
                <th className="text-left py-2 px-2 sm:px-4 font-semibold text-red-800">
                  Masa
                </th>
                <th className="text-left py-2 px-2 sm:px-4 font-semibold text-red-800">
                  Bitdiyi Vaxt
                </th>
                <th className="text-center py-2 px-2 sm:px-4 font-semibold text-red-800">
                  Gecikmə
                </th>
                <th className="text-center py-2 px-2 sm:px-4 font-semibold text-red-800">
                  Məbləğ
                </th>
                <th className="text-center py-2 px-2 sm:px-4 font-semibold text-red-800">
                  Əməliyyat
                </th>
              </tr>
            </thead>
            <tbody>
              {expiredTables.map((table) => (
                <tr
                  key={table.id}
                  className="border-b border-red-100 hover:bg-red-50 transition-colors"
                >
                  <td className="py-3 px-2 sm:px-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      {table.name || `Masa #${table.id}`}
                    </div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-gray-700 whitespace-nowrap">
                    🕒 {table.expiredTime}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        table.expiredMinutes > 30
                          ? "bg-red-200 text-red-800"
                          : table.expiredMinutes > 15
                          ? "bg-orange-200 text-orange-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {table.expiredMinutes} dəq
                    </span>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center text-red-700 font-semibold">
                    {table.total_price !== null && table.total_price !== undefined 
                      ? `₼ ${Number(table.total_price).toFixed(2)}` 
                      : "Boşdur"}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableClick(table.id);
                      }}
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition text-xs sm:text-sm font-medium shadow-md"
                    >
                      Masaya Keç →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5 text-center text-red-600 font-medium">
          Hal-hazırda vaxtı bitmiş masa yoxdur
        </div>
      )}
    </div>
  );
};

export default ExpiredTablesAlert;
