import { useState, useEffect, useRef, useCallback } from "react";
import { X, Settings, Loader, Trash2, Pause, Play, StopCircle, DollarSign, Clock } from "lucide-react"; 
import soundFile from "../assets/sound.mp3"; // Səs faylının yolu
import { base_url } from "../api/index";
import axios from "axios";
import { toast } from "react-toastify";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default function PsModal({
  tableId, isOpen, onClose, tableName, time, setTime, isRunning, setIsRunning, onFinishOrder, onRefreshTableData
}) {
  // tableId-ni rəqəmə çeviririk
  const parsedTableId = Number(tableId);

  const [activeIndex, setActiveIndex] = useState(null);
  const [price, setPrice] = useState(""); 
  const [pricetimer, setPriceTimer] = useState("0.00");
  const [endTime, setEndTime] = useState(null);
  const [manualsent, setManualSent] = useState(0); 
  const [minuteRateQepik, setMinuteRateQepik] = useState(3); 
  const [applied, setApplied] = useState(false);
  const [backList, setBackList] = useState([]);
const [showSettings, setShowSettings] = useState(() => {
    const shouldOpenSettings = localStorage.getItem(`masa_siparis_${parsedTableId}_openPsSettings`) === "true";
    return shouldOpenSettings;
  });
    const [customMinutes, setCustomMinutes] = useState(0);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [isstop, setIsStop] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Audio setup
  useEffect(() => {
    if (!audioRef.current && soundFile) {
      audioRef.current = new Audio(soundFile);
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.8;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn("Səs xətası:", e));
    }
  }, []);

  // LocalStorage-dan yükləmə
  useEffect(() => {
    if (isNaN(parsedTableId) || !tableId) return;

    const savedTime = localStorage.getItem(`table_${parsedTableId}_time`);
    const savedIsRunning = localStorage.getItem(`table_${parsedTableId}_isRunning`);
    const savedPriceTimer = localStorage.getItem(`table_${parsedTableId}_priceTimer`);
    const savedEndTime = localStorage.getItem(`table_${parsedTableId}_endTime`);
    const savedManualSent = localStorage.getItem(`table_${parsedTableId}_manualsent`);
    const savedMinuteRate = localStorage.getItem(`table_${parsedTableId}_minuteRate`);
    const savedActiveIndex = localStorage.getItem(`table_${parsedTableId}_activeIndex`);
    const savedApplied = localStorage.getItem(`table_${parsedTableId}_applied`);
    const savedStartTime = localStorage.getItem(`table_${parsedTableId}_startTime`);
    const savedIsPaused = localStorage.getItem(`table_${parsedTableId}_isPaused`);
    const savedIsExpired = localStorage.getItem(`table_${parsedTableId}_isExpired`);

    if (savedTime) setTime(parseInt(savedTime));
    if (savedIsRunning) setIsRunning(savedIsRunning === "true");
    if (savedPriceTimer) setPriceTimer(savedPriceTimer);
    if (savedEndTime) setEndTime(parseInt(savedEndTime));
    if (savedManualSent) setManualSent(Number(savedManualSent));
    if (savedMinuteRate) setMinuteRateQepik(Number(savedMinuteRate));
    if (savedActiveIndex) setActiveIndex(Number(savedActiveIndex));
    if (savedApplied) setApplied(savedApplied === "true");
    if (savedStartTime) startTimeRef.current = parseInt(savedStartTime);
    if (savedIsPaused) setIsPaused(savedIsPaused === "true");
    
    if (savedIsExpired) {
        const isExpiredNow = savedIsExpired === "true";
        setIsExpired(isExpiredNow);
        // Settings panelini avtomatik AÇMA - istifadəçi özü açmalıdır
    }

  }, [setIsRunning, setTime, tableId, parsedTableId]);

  // LocalStorage-a yazma
  useEffect(() => {
    if (isNaN(parsedTableId)) return;

    localStorage.setItem(`table_${parsedTableId}_time`, time.toString());
    localStorage.setItem(`table_${parsedTableId}_isRunning`, isRunning.toString());
    localStorage.setItem(`table_${parsedTableId}_priceTimer`, pricetimer);
    localStorage.setItem(`table_${parsedTableId}_manualsent`, manualsent.toString());
    localStorage.setItem(`table_${parsedTableId}_minuteRate`, minuteRateQepik.toString());
    localStorage.setItem(`table_${parsedTableId}_applied`, applied.toString());
    localStorage.setItem(`table_${parsedTableId}_isPaused`, isPaused.toString());
    localStorage.setItem(`table_${parsedTableId}_isExpired`, isExpired.toString());

    if (activeIndex !== null) {
      localStorage.setItem(`table_${parsedTableId}_activeIndex`, activeIndex.toString());
    } else {
      localStorage.removeItem(`table_${parsedTableId}_activeIndex`);
    }

    if (endTime) {
      localStorage.setItem(`table_${parsedTableId}_endTime`, endTime.toString());
    } else {
      localStorage.removeItem(`table_${parsedTableId}_endTime`);
    }

    if (startTimeRef.current) {
      localStorage.setItem(`table_${parsedTableId}_startTime`, startTimeRef.current.toString());
    }
  }, [time, isRunning, pricetimer, endTime, parsedTableId, manualsent, minuteRateQepik, activeIndex, applied, isPaused, isExpired]);
  useEffect(() => {
    if (isOpen && !isNaN(parsedTableId)) {
        fetchBackList();
        fetchActiveSession();
        
        // LocalStorage-da olan 'openPsSettings' flag-ını yoxlayın
        const openSettingsFlag = localStorage.getItem(`masa_siparis_${parsedTableId}_openPsSettings`);

        if (openSettingsFlag === "true") {
            // PsModal açıqdırsa, settings panelini aç
            setShowSettings(true);
            // Bayrağı təmizləyirik, çünki artıq istifadə edildi.
            localStorage.removeItem(`masa_siparis_${parsedTableId}_openPsSettings`);
        }
    }
    
    // Settings panelini avtomatik açma - istifadəçi özü açmalıdır
  }, [tableId, isOpen, parsedTableId]);


  // Masanın sessiya məlumatlarını və presetlərini yüklə
  useEffect(() => {
    if (isOpen && !isNaN(parsedTableId)) {
      fetchBackList();
      fetchActiveSession();
    }
  }, [tableId, isOpen, parsedTableId]);
  
  const fetchActiveSession = async () => {
    if (isNaN(parsedTableId) || parsedTableId <= 0) return { hasActiveSession: false };

    try {
      const res = await axios.get(`${base_url}/time-sessions?table_id=${parsedTableId}&status=running`, getHeaders());
      if (res.data.data.length > 0) {
        setHasActiveSession(true);
        return { hasActiveSession: true };
      } else {
        setHasActiveSession(false);
        return { hasActiveSession: false };
      }
    } catch (err) {
      console.error("Aktiv sessiya xətası:", err);
      return { hasActiveSession: false };
    }
  };


  const fetchBackList = async () => {
    if (isNaN(parsedTableId) || parsedTableId <= 0) {
      console.warn("Masa ID düzgün deyil. Presetlər yüklənmədi.");
      setBackList([]);
      return;
    }

    try {
      const response = await axios.get(`${base_url}/time-presets?table_id=${parsedTableId}`, getHeaders());
      setBackList(response.data);
    } catch (error) {
      console.error("BackList xətası:", error);
      toast.error("Presetlər yüklənmədi! Server problemi.");
    }
  };


  const calculateRealTime = useCallback(() => {
    if (!isRunning || !startTimeRef.current) return time;
    if (endTime) {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      return remaining;
    } else {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      return elapsed;
    }
  }, [isRunning, endTime, time]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const realTime = calculateRealTime();
      setTime(realTime);

      if (endTime) {
        if (realTime <= 0) {
          console.log("⏰ VAXT BİTDİ!");
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsRunning(false);
          setIsExpired(true);
          localStorage.setItem(`table_${parsedTableId}_isRunning`, "false");
          localStorage.setItem(`table_${parsedTableId}_isExpired`, "true");
          
          // FIX: Timer bitəndə tam qiyməti göstər
          const savedPresetPrice = localStorage.getItem(`table_${parsedTableId}_presetPrice`);
          if (savedPresetPrice) {
            const finalPrice = Number(savedPresetPrice).toFixed(2);
            setPriceTimer(finalPrice);
            localStorage.setItem(`table_${parsedTableId}_priceTimer`, finalPrice);
          } else if (activeIndex !== null && backList[activeIndex]) {
            const finalPrice = Number(backList[activeIndex].price).toFixed(2);
            setPriceTimer(finalPrice);
            localStorage.setItem(`table_${parsedTableId}_priceTimer`, finalPrice);
          }
          
          playSound();
          if (onRefreshTableData) {
            onRefreshTableData();
          }
        } else if (activeIndex !== null) {
          const selectedPreset = backList[activeIndex];
          if (selectedPreset) {
            const elapsedMinutes = (selectedPreset.minutes * 60 - realTime) / 60;
            const calculatedPrice = (Number(selectedPreset.price) / selectedPreset.minutes) * elapsedMinutes;
            setPriceTimer(calculatedPrice.toFixed(2));
          }
        }
      } else {
        if (activeIndex === null && minuteRateQepik > 0) {
          const elapsedMinutes = realTime / 60;
          const calculatedPrice = (minuteRateQepik / 100) * elapsedMinutes;
          setPriceTimer(calculatedPrice.toFixed(2));
        } else {
          setPriceTimer("0.00");
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, endTime, calculateRealTime, setTime, setIsRunning, playSound, onRefreshTableData, parsedTableId, activeIndex, backList, minuteRateQepik]);

  useEffect(() => {
    if (isOpen && isRunning) {
      const realTime = calculateRealTime();
      setTime(realTime);
      if (!endTime) setPriceTimer("0.00");
    }
  }, [isOpen, parsedTableId, isRunning, calculateRealTime, endTime, setTime]);

  useEffect(() => { endTimeRef.current = endTime; }, [endTime]);

  /** ▶️ Başlat */
  const startTimer = async () => {
    if (isRunning || hasActiveSession) return toast.warning("Əvvəlki sessiya aktivdir!");
    setIsStop(true);
    try {
      if (activeIndex !== null) {
        const preset = backList[activeIndex];
        await axios.post(`${base_url}/tables-time/${parsedTableId}/start-preset`, { preset_id: preset.id }, getHeaders());
        setEndTime(Date.now() + preset.minutes * 60 * 1000);
        startTimeRef.current = Date.now();
        setTime(preset.minutes * 60);
        // Preset qiymətini saxla - timer bitəndə istifadə olunacaq
        localStorage.setItem(`table_${parsedTableId}_presetPrice`, preset.price.toString());
      } else {
        await axios.post(`${base_url}/tables-time/${parsedTableId}/start-per-minute`, { minute_rate_qepik: minuteRateQepik }, getHeaders());
        startTimeRef.current = Date.now();
        setTime(0);
        setEndTime(null);
      }
      setIsRunning(true);
      setHasActiveSession(true);
      setIsExpired(false);
      setShowSettings(false);
      toast.success("Vaxt başladı!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Başlama xətası!");
    } finally {
      setIsStop(false);
    }
  };

  const pauseTimer = async () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsRunning(false); setIsPaused(true); localStorage.setItem(`table_${parsedTableId}_isPaused`, "true");
    if (endTime) {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      localStorage.setItem(`table_${parsedTableId}_remainingTime`, remaining.toString()); setTime(remaining); 
    } else {
      localStorage.setItem(`table_${parsedTableId}_elapsedTime`, time.toString());
    }
    setIsStop(true);
    try { await axios.post(`${base_url}/tables-time/${parsedTableId}/pause`, {}, getHeaders()); toast.success("Timer dayandırıldı"); }
    catch (error) { console.error("Pause xətası:", error); toast.error("Timer dayandırılmadı"); }
    finally { setIsStop(false); }
  };

  const resumeTimer = async () => {
    setIsStop(true);
    try {
      const statusRes = await axios.get(`${base_url}/tables-time/${parsedTableId}/status`, getHeaders());
      if (statusRes.data.status !== "paused") { toast.warning("Timer paused deyil"); setIsStop(false); return; }
      await axios.post(`${base_url}/tables-time/${parsedTableId}/resume`, {}, getHeaders());
      if (endTime) {
        const savedRemaining = localStorage.getItem(`table_${parsedTableId}_remainingTime`);
        if (savedRemaining) {
          const remainingSeconds = parseInt(savedRemaining);
          const newEndTime = Date.now() + remainingSeconds * 1000;
          setEndTime(newEndTime); setTime(remainingSeconds); localStorage.removeItem(`table_${parsedTableId}_remainingTime`);
        }
      } else {
        const savedElapsed = localStorage.getItem(`table_${parsedTableId}_elapsedTime`);
        if (savedElapsed) {
          const elapsedSeconds = parseInt(savedElapsed);
          setTime(elapsedSeconds); startTimeRef.current = Date.now() - elapsedSeconds * 1000; 
          localStorage.removeItem(`table_${parsedTableId}_elapsedTime`);
        }
      }
      setIsRunning(true); setIsPaused(false); setIsExpired(false);
      localStorage.setItem(`table_${parsedTableId}_isPaused`, "false"); localStorage.setItem(`table_${parsedTableId}_isExpired`, "false");
      toast.success("Timer davam edir");
    } catch (error) { console.error("Resume xətası:", error); toast.error("Timer davam etmədi"); }
    finally { setIsStop(false); }
  };

  const stopTimer = async () => {
    setIsStop(true);
    try {
      await axios.post(`${base_url}/tables-time/${parsedTableId}/finish`, {
        total_price: Number(pricetimer),
        end_time: new Date().toISOString()
      }, getHeaders());
      setIsRunning(false);
      setIsPaused(false);
      setHasActiveSession(false);
      setIsExpired(false);
      setTime(0);
      setPriceTimer("0.00");
      startTimeRef.current = null;
      setApplied(false);
      localStorage.removeItem(`table_${parsedTableId}_time`);
      localStorage.removeItem(`table_${parsedTableId}_isRunning`);
      localStorage.removeItem(`table_${parsedTableId}_priceTimer`);
      localStorage.removeItem(`table_${parsedTableId}_endTime`);
      localStorage.removeItem(`table_${parsedTableId}_activeIndex`);
      localStorage.removeItem(`table_${parsedTableId}_startTime`);
      localStorage.removeItem(`table_${parsedTableId}_isPaused`);
      localStorage.removeItem(`table_${parsedTableId}_isExpired`);
      localStorage.removeItem(`table_${parsedTableId}_remainingTime`);
      localStorage.removeItem(`table_${parsedTableId}_elapsedTime`);
      localStorage.removeItem(`table_${parsedTableId}_presetPrice`);
      toast.success("Sessiya bitdi!");
      onRefreshTableData?.();
    } finally {
      setIsStop(false);
    }
  };

  const handleSelect = (index) => {
    if (isRunning || hasActiveSession) { toast.warning("Əvvəl timer-i dayandırın!"); return; }
    const item = backList[index];
    setActiveIndex(index); setTime(item.minutes * 60); setPriceTimer(Number(item.price).toFixed(2));
    setIsRunning(false); setIsPaused(false); setIsExpired(false);
    setApplied(true); startTimeRef.current = null;
    setEndTime(null);
    // Preset qiymətini dərhal saxla - timer bitəndə istifadə olunacaq
    localStorage.setItem(`table_${parsedTableId}_presetPrice`, item.price.toString());
    toast.success("Preset seçildi");
  };

  const applyCustomSent = () => {
    if (manualsent > 0) {
      setMinuteRateQepik(manualsent); setApplied(true); setActiveIndex(null); setEndTime(null); setTime(0);
      setPriceTimer("0.00"); setIsPaused(false); setIsExpired(false);
      localStorage.setItem(`table_${parsedTableId}_manualsent`, manualsent.toString());
      localStorage.setItem(`table_${parsedTableId}_minuteRate`, manualsent.toString());
      toast.success(`${manualsent} qəpik/dəq tətbiq edildi`);
    } else { toast.warning("Qiymət 0-dan böyük olmalıdır!"); }
  };

  const handleAddExtraTime = async () => {
    if (activeIndex !== null && extraMinutes > 0) {
      setIsStop(true);
      try {
        const selectedPreset = backList[activeIndex];
        await axios.post(`${base_url}/tables-time/${parsedTableId}/extend`, {
            mode: "preset", preset_id: selectedPreset.id, start_immediately: true, minutes: extraMinutes,
          }, getHeaders());
        
        const newEndTime = endTime + extraMinutes * 60 * 1000;
        setEndTime(newEndTime); 
        setTime((prev) => prev + extraMinutes * 60);

        const newPriceTimer = Number(pricetimer) + (Number(selectedPreset.price) / selectedPreset.minutes) * extraMinutes;
        setPriceTimer(newPriceTimer.toFixed(2));

        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if (!isRunning) { setIsRunning(true); setIsPaused(false); if (!startTimeRef.current) startTimeRef.current = Date.now(); }
        setIsExpired(false);
        toast.success(`${extraMinutes} dəqiqə əlavə edildi`); 
        setExtraMinutes(0);
        setShowSettings(false); 
      } catch (error) { 
        console.error("Extra time xətası:", error); 
        toast.error("Əlavə vaxt əlavə edilmədi"); 
      } finally { setIsStop(false); }
    } else { toast.warning("Preset seçin və dəqiqə daxil edin"); }
  };

  const addBack = async () => {
    const finalPrice = Number(String(price).replace(',', '.')); 
    if (customMinutes > 0 && finalPrice > 0) { 
      if (backList.length >= 10) { toast.warning("Maksimum 10 preset!"); return; }
      setIsStop(true);
      try {
        const pricePerMinuteCalculated = (finalPrice / customMinutes).toFixed(4);
        await axios.post(`${base_url}/time-presets`, {
            name: `${customMinutes} dəq`, minutes: customMinutes, price: finalPrice.toFixed(2), 
            price_per_minute: pricePerMinuteCalculated, is_active: 1, table_id: parsedTableId,
          }, getHeaders());
        toast.success("Preset əlavə olundu"); await fetchBackList();
        setCustomMinutes(0); setPrice("");
      } catch (error) {
        if (error.response?.data?.message?.includes("Duplicate") || error.response?.status === 409) {
          toast.warning("Bu preset mövcuddur!");
        } else { toast.error("Preset əlavə edilmədi"); }
      } finally { setIsStop(false); }
    } else { toast.warning("Dəqiqə və qiymət 0-dan böyük olmalıdır!"); }
  };
  
  const handleConfirmedDelete = async (presetId, index) => {
    setIsStop(true);
    try {
        await axios.delete(`${base_url}/time-presets/${presetId}`, getHeaders());
        toast.success("Preset silindi!");
        if (activeIndex === index) {
            setActiveIndex(null); setTime(0); setPriceTimer("0.00"); setEndTime(null); setApplied(false);
        }
        await fetchBackList();
    } catch (error) {
        console.error("Delete xətası:", error);
        let errorMessage = "Preset silinmədi!";
        if (error.response?.data?.message?.includes("1451")) {
             errorMessage = "Bu preset aktiv sessiyalarda istifadə edilir.";
             toast.warn(errorMessage, { autoClose: 7000 }); 
        } else { toast.error(errorMessage); }
    } finally { setIsStop(false); }
  };

  const deletePreset = (presetId, index, event) => {
    event.stopPropagation();
    if (isRunning || hasActiveSession) { toast.warning("Aktiv timer işləyərkən preset silinə bilməz!"); return; }
    if (isstop) return;
    toast.warn(
      ({ closeToast }) => (
        <div className="p-2">
          <p className="text-lg font-bold text-center mb-3"><span className="text-red-500 mr-2">⚠️</span> Silməyi Təsdiqləyin</p>
          <p className="text-sm text-center mb-4">Preset silinsin?</p>
          <div className="flex justify-center gap-3">
            <button className="bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg" onClick={closeToast}>Ləğv Et</button>
            <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
              onClick={() => { handleConfirmedDelete(presetId, index); closeToast(); }}>BƏLİ, Sil</button>
          </div>
        </div>
      ), { autoClose: false, closeButton: false }
    );
  };
  
  const hours = String(Math.floor(time / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, "0");
  const seconds = String(time % 60).padStart(2, "0");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70  p-4"> 
      <div className="w-full max-w-xl h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl relative flex flex-col transform transition-all duration-300 ease-in-out">
      {isstop && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20 rounded-2xl">
          <Loader className="animate-spin text-blu-600" size={40} />
        </div>
      )}

      {/* Başlıq və Düymələr */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl shadow-sm">
        <h2 className="text-2xl font-extrabold text-gray-800">{tableName}</h2>
        <div className="flex items-center gap-2">
          <button
            className="p-3 rounded-full hover:bg-gray-100 transition"
            onClick={() => setShowSettings((prev) => !prev)}
            disabled={isstop}
            title="Parametrlər"
          >
            <Settings className="text-indigo-600" size={20} />
          </button>
          <button
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-md"
            onClick={onClose}
            disabled={isstop}
            title="Bağla"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* ƏSAS MƏZMUN (Scrollable hissə) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8">

        {/* ❌ İSTƏK ÜZRƏ LƏĞV EDİLİB: Vaxt bitdi alerti */}

        {/* Sürətli Seçimlər (Presetlər) */}
        {backList.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">
              Sürətli Seçimlər
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {backList.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(index)}
                  className={`
                    px-4 py-3 w-[150px] rounded-xl flex flex-col items-center justify-center shadow-lg cursor-pointer transition transform hover:scale-[1.03] relative
                    ${
                      activeIndex === index
                        ? "bg-blue-600 text-white font-bold border-2 border-blue-300 shadow-blue-400/50"
                        : "bg-white text-gray-800 hover:bg-blue-50 border border-gray-200"
                    }
                    ${(isstop || isRunning) && activeIndex !== index ? "opacity-60 cursor-not-allowed" : ""}
                  `}
                >
                  <span className="text-xl font-extrabold flex items-center">
                     <Clock size={16} className="mr-1" /> {item.minutes} dəq
                  </span>
                  <span className="text-sm opacity-90 mt-1 flex items-center">
                    <DollarSign size={16} className="mr-0.5" /> {Number(item.price).toFixed(2)} ₼
                  </span>

                  {/* SİLME DÜYMƏSİ */}
                  {showSettings && ( 
                    <button
                      onClick={(e) => deletePreset(item.id, index, e)}
                      disabled={isstop || isRunning || hasActiveSession}
                      className={`absolute top-1 right-1 p-1 rounded-full transition-all 
                        ${ activeIndex === index ? "bg-white/50 hover:bg-white/30 text-white" : "bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600" } 
                        ${(isstop || isRunning || hasActiveSession) ? "opacity-60 cursor-not-allowed" : ""}`
                      }
                      title="Preset-i sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Qiymət Daxil Etmə */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-blue-700 mb-3 border-b border-blue-200 pb-2">
            Manual Tarif Ayarları
          </h3>
          <label className="block font-medium text-blue-800 mb-2 text-sm">
            Dəqiqəlik Tarif (Qəpik) - Hazırda: {minuteRateQepik} qəpik
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="number"
              value={manualsent === 0 ? "" : manualsent}
              min={1}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : Number(e.target.value);
                setManualSent(val);
                if (val === minuteRateQepik && !isRunning) {
                  setApplied(true);
                } else {
                  setApplied(false);
                }
              }}
              className="border border-blue-300 px-4 py-2.5 rounded-xl flex-1 text-lg font-semibold focus:border-blue-500 focus:ring focus:ring-blue-100 transition"
              placeholder="Qəpik daxil edin (Məs: 3)"
              disabled={isstop || isRunning}
            />

            <button
              onClick={applyCustomSent}
              disabled={manualsent <= 0 || applied || isstop || isRunning}
              className={`px-5 py-2.5 rounded-xl text-white transition transform hover:scale-[1.01] ${
                manualsent <= 0 || applied || isstop || isRunning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 font-semibold shadow-md shadow-blue-400/50"
              }`}
            >
              Tətbiq et
            </button>
          </div>
        </div>

        {/* Timer Və İdarəetmə Paneli */}
        {/* Yalnız showSettings TRUE olduqda gizlət - isExpired olduqda da göstər */}
        {(!showSettings) && (
          <div className="p-6 bg-blue-500 rounded-2xl shadow-2xl flex flex-col space-y-5">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div className="text-left">
                    <p className="font-medium text-black-400 text-sm">
                        {endTime ? "Qalan Vaxt" : "Keçən Vaxt"}
                    </p>
                    <div className="text-6xl font-extrabold tracking-tight text-white mt-1">
                        {hours}:{minutes}:{seconds}
                    </div>
                </div>
                
                <div className="text-right">
                    <label className="block font-medium text-black-400 mb-2 text-sm">Ümumi Qiymət</label>
                    <div className="border-2 border-green-500 px-5 py-3 rounded-xl bg-white text-gray-900 shadow-lg  text-2xl">
                        {pricetimer} ₼
                    </div>
                </div>
            </div>
            
            {/* İdarəetmə Düymələri */}
            <div className="flex justify-between items-center gap-3">
                {/* Sol Düymələr (Start/Pause/Resume) */}
                <div className="flex gap-3">
                    {/* Start Button */}
                    <button
                      onClick={startTimer}
                      disabled={!applied || isstop || isRunning || isPaused || (activeIndex === null && minuteRateQepik <= 0)}
                      className={`flex items-center gap-1 bg-green-500 px-4 py-2 rounded-xl text-white font-semibold transition hover:bg-green-600 shadow-md ${
                        !applied || isstop || isRunning || isPaused || (activeIndex === null && minuteRateQepik <= 0)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Play size={18} /> Başlat
                    </button>

                    {/* Pause/Resume Buttons */}
                    {isRunning && (
                      <button
                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition shadow-md"
                        onClick={pauseTimer}
                        disabled={isstop}
                      >
                        <Pause size={18} /> Dayandır
                      </button>
                    )}

                    {!isRunning && isPaused && (
                      <button
                        className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold transition shadow-md"
                        onClick={resumeTimer}
                        disabled={isstop}
                      >
                        <Play size={18} /> Davam et
                      </button>
                    )}
                </div>

                {/* Bitir Button */}
                <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl transition font-semibold shadow-md ${
                        isRunning || hasActiveSession
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={stopTimer}
                    disabled={(!isRunning && !hasActiveSession) || isstop}
                >
                    <StopCircle size={18} /> Bitir
                </button>
            </div>
          </div>
        )}
        
        {/* Sürətli Seçim Parametrləri (Settings) */}
        {(showSettings) && (
          <div className="p-6 bg-white border-2 border-blue-100 rounded-2xl shadow-2xl transition-all duration-300">
            
            <h3 className="text-center text-xl font-extrabold text-blue-700 mb-6 border-b-2 border-blue-500 pb-3">
              Yeni Preset Yaratma Paneli
            </h3>
            
            {/* Dəqiqə Daxil Etmə Bloku */}
            <div className="mb-5 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                Vaxt (Dəqiqə)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full border border-blue-300 bg-white px-4 py-3 rounded-xl shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-lg font-medium"
                  value={customMinutes === 0 ? "" : customMinutes} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomMinutes(val === "" ? 0 : Number(val));
                  }}
                  placeholder="Məsələn: 60" 
                  min={1}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 font-bold pointer-events-none text-sm">
                  dəq
                </span>
              </div>
            </div>
            
            {/* Qiymət Daxil Etmə Bloku - Düzgün onluq rəqəm dəstəyi */}
            <div className="mb-6 p-3 bg-red-50/50 rounded-xl border border-red-200">
              <label className="block text-sm font-semibold text-red-700 mb-2">
                Ümumi Qiymət (AZN)
              </label>
              <div className="relative">
                <input
                  type="text" 
                  inputMode="decimal" 
                  className="w-full border border-red-300 bg-white px-4 py-3 rounded-xl shadow-inner focus:border-red-500 focus:ring-2 focus:ring-red-200 transition text-lg font-medium text-red-700"
                  
                  value={String(price)}
                  
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.'); 
                    const regex = /^\d*(\.\d{0,2})?$/; 

                    if (val === "" || regex.test(val)) {
                        if (val.endsWith('.')) {
                             setPrice(val);
                        } else {
                            const numericValue = val === "" ? 0.00 : parseFloat(val);
                            if (!isNaN(numericValue)) {
                                setPrice(val);
                            }
                        }
                    }
                  }}
                  placeholder="Məsələn: 1.80, 0.03"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 font-bold pointer-events-none text-sm">
                  ₼
                </span>
              </div>
            </div>
            
            {/* Əlavə Et Düyməsi */}
            <button
              className={`
                text-white px-4 py-3 rounded-xl w-full text-lg font-bold shadow-xl
                transition duration-200 ease-in-out transform hover:scale-[1.005]
                ${isstop 
                  ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-400/50'
                }
              `}
              onClick={addBack}
              disabled={isstop || customMinutes <= 0 || Number(String(price).replace(',', '.')) <= 0}
            >
              Əlavə et (Yeni Preset Yarat)
            </button>

          </div>
        )}
      
      </div> 
      
     
    </div>
  </div>
  );
}