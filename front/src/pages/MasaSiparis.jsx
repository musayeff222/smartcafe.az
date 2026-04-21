import React, { useState, useEffect } from "react";
import axios from "axios";
// import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate, useParams } from "react-router-dom";
import OncedenOde from "../components/OncedenOde";
import AccessDenied from "../components/AccessDenied";
import { base_url, img_url } from "../api/index";
import { Helmet } from "react-helmet";
import HesabKesAll from "../components/masasiparis/HesabKesAll";
import TableRow from "../components/ui/TableRow";
import Error from "../components/Error";
import TotalPriceHesab from "../components/masasiparis/TotalPriceHesab";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchTableOrderStocks } from "../redux/stocksSlice";
import { decreaseQuantity } from "../redux/basketSlice";
import PasswordScreenFour from "../components/ScreenPassword4";
import {
  X,
  Minus,
  Plus,
  Clock,
  ArrowLeft,
  Search,
  Printer,
  ChefHat,
  Trash2,
  Banknote,
  CreditCard,
  ShoppingBag,
  Utensils,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import PsModal from "../components/PsModal";
import PaymentSummary from '../components/masasiparis/PaymentSummary';
import OrderTable from "../components/masasiparis/OrderTable";
// Helper function to get headers
const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function MasaSiparis() {
  const { id } = useParams(); // Get the table ID from URL parameters
  const [urunType, setUrunType] = useState(0); // Default to "Hamısı"
  const [stockGroups, setStockGroups] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [isStocksLoading, setIsStocksLoading] = useState(false);

  const [tableName, setTableName] = useState(""); // Default table name
  const [totalPrice, setTotalPrice] = useState({}); // Default total price as a number
  const [orderDetails, setOrderDetails] = useState([]); // Details of the table's orders
  const [odersIdMassa, setOrdersIdMassa] = useState({});
  const [refreshFetch, setRefreshFetch] = useState(false);
  const [oncedenodePopop, setOncedenodePopop] = useState(false);
  const [HesabKes, setHesabKes] = useState(false);
  const navigate = useNavigate();
  const [accessDenied, setAccessDenied] = useState(false);
  const [role, setrole] = useState(localStorage.getItem("role"));
  const fis = localStorage.getItem("fisYazisi");
  const restoranName = localStorage.getItem("restoran_name");
  const [orderModal, setNoOrderModal] = useState(false);
  const [ActiveUser, setActiveUser] = useState(false);
  const [oneProduct, setOneProduct] = useState(0);
  const [modalId, setModalId] = useState(null);
  const [handleModalMetbex, setHandleModal] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [stockSets, setStockSets] = useState([]);
  const [showSets, setShowSets] = useState(false);
  const [openRows, setOpenRows] = useState({});
  const [isPsClub, setIsPsClub] = useState(0);
const [isPsModalOpen, setIsPsModalOpen] = useState(false);

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Expired timer məlumatı üçün state
  const [expiredTimerInfo, setExpiredTimerInfo] = useState(null);
  // Expired timer data qoruması - fetchTimeCharges-ın psPrice-ı silməsinin qarşısını alır
  const hasExpiredTimerRef = React.useRef(localStorage.getItem(`table_${id}_isExpired`) === "true");

  const [showPasswordScreen, setShowPasswordScreen] = React.useState(false);
  const [pendingRemoveData, setPendingRemoveData] = React.useState(null);
  const [pendingRemoveStock, setPendingRemoveStock] = React.useState(null);

  const [orderId, setOrderId] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [mobileView, setMobileView] = useState("menu");
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(() => {
    try {
      return localStorage.getItem("masa_siparis_groups_expanded") === "1";
    } catch (e) {
      return false;
    }
  });

  const toggleGroupsExpanded = () => {
    setIsGroupsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          "masa_siparis_groups_expanded",
          next ? "1" : "0"
        );
      } catch (e) {}
      return next;
    });
  };

const toCents = (amount) => Math.round(parseFloat(amount) * 100);

const fromCents = (cents) => (cents / 100).toFixed(2);

const calculatePsTotalInCents = (prices) => {
  if (!prices || prices.length === 0) return 0;
    return prices.reduce(
    (sum, charge) => sum + toCents(charge.amount || 0),
    0
  );
};
const calculatePsTotal = () => {
    if (isPsClub !== 1) return 0; 
    const totalCents = calculatePsTotalInCents(psPrice);
    return totalCents / 100; 
};

// psPrice başlanğıc dəyəri - expired timer varsa localStorage-dan oxu
const [psPrice, setPsPrice] = useState(() => {
  const savedIsExpired = localStorage.getItem(`table_${id}_isExpired`);
  if (savedIsExpired === "true") {
    const savedPresetPrice = localStorage.getItem(`table_${id}_presetPrice`);
    const savedPriceTimer = localStorage.getItem(`table_${id}_priceTimer`);
    const price = savedPresetPrice || savedPriceTimer || "0.00";
    const savedActiveIndex = localStorage.getItem(`table_${id}_activeIndex`);
    const presetName = savedActiveIndex ? `PS vaxtı (Preset ${Number(savedActiveIndex) + 1})` : "PS vaxtı";
    console.log("Initial psPrice from localStorage:", price);
    return [{
      id: `expired_${id}`,
      title: presetName,
      amount: Number(price).toFixed(2),
      count: 1
    }];
  }
  return [];
});

const initialTotalCents = calculatePsTotalInCents(psPrice);
const [inputValue, setInputValue] = useState(() => fromCents(initialTotalCents));

useEffect(() => {
    if (id) {
      const openPsModalFlag = localStorage.getItem(`masa_siparis_${id}_openPsModal`);
      
      if (openPsModalFlag === "true") {
        setIsPsModalOpen(true);
        // Flag-ı dərhal silirik ki, yeniləndikdə təkrar açılmasın
        localStorage.removeItem(`masa_siparis_${id}_openPsModal`);
      }
      
      // Expired timer məlumatını localStorage-dan yüklə
      const savedIsExpired = localStorage.getItem(`table_${id}_isExpired`);
      const savedPresetPrice = localStorage.getItem(`table_${id}_presetPrice`);
      const savedPriceTimer = localStorage.getItem(`table_${id}_priceTimer`);
      const savedEndTime = localStorage.getItem(`table_${id}_endTime`);
      
      if (savedIsExpired === "true") {
        const price = savedPresetPrice || savedPriceTimer || "0.00";
        const endTime = savedEndTime ? new Date(parseInt(savedEndTime)).toLocaleTimeString("az-AZ", {
          hour: "2-digit",
          minute: "2-digit",
        }) : "";
        
        setExpiredTimerInfo({
          price: Number(price).toFixed(2),
          endTime: endTime,
          isExpired: true
        });
        // REF-i set et ki, fetchTimeCharges psPrice-ı silməsin
        hasExpiredTimerRef.current = true;
        
        // Expired timer məlumatını psPrice-a əlavə et ki, cədvəldə görünsün
        const savedActiveIndex = localStorage.getItem(`table_${id}_activeIndex`);
        const presetName = savedActiveIndex ? `PS vaxtı (Preset ${Number(savedActiveIndex) + 1})` : "PS vaxtı";
        setPsPrice([{
          id: `expired_${id}`,
          title: presetName,
          amount: Number(price).toFixed(2),
          count: 1
        }]);
      } else {
        setExpiredTimerInfo(null);
        hasExpiredTimerRef.current = false;
      }
    }
  }, [id]);

  // PsModal-ın bağlanma funksiyası
  const handlePsModalClose = () => {
    setIsPsModalOpen(false);
    // Əgər PsModal bağlanırsa, Settings flag-ını da silirik
    localStorage.removeItem(`masa_siparis_${id}_openPsSettings`);
  };



useEffect(() => {
  const newTotalCents = calculatePsTotalInCents(psPrice);
  setInputValue(fromCents(newTotalCents));
}, [psPrice]);

// CRITICAL: expiredTimerInfo set olduqda psPrice-ı da set et - 100ms delay ilə
useEffect(() => {
  if (expiredTimerInfo && expiredTimerInfo.isExpired && id) {
    // Delay ilə set et ki, digər useEffect-lər bitsin
    const timer = setTimeout(() => {
      const savedActiveIndex = localStorage.getItem(`table_${id}_activeIndex`);
      const presetName = savedActiveIndex ? `PS vaxtı (Preset ${Number(savedActiveIndex) + 1})` : "PS vaxtı";
      console.log("Setting psPrice from expiredTimerInfo:", expiredTimerInfo.price);
      setPsPrice([{
        id: `expired_${id}`,
        title: presetName,
        amount: expiredTimerInfo.price,
        count: 1
      }]);
    }, 100);
    return () => clearTimeout(timer);
  }
}, [expiredTimerInfo, id]); 

const handlePsTotalChange = (e) => {
  setInputValue(e.target.value);
};
const handlePsTotalBlur = () => {
  const newTotalCents = toCents(inputValue);
  if (psPrice.length === 1) {
    setPsPrice([{ ...psPrice[0], amount: fromCents(newTotalCents) }]);
  } else if (psPrice.length > 1) {
    const currentTotalCents = calculatePsTotalInCents(psPrice);
    if (currentTotalCents > 0) {
      let updatedPricesInCents = psPrice.map((item) => {
        const itemCents = toCents(item.amount);
        const newAmountCents = Math.round((itemCents * newTotalCents) / currentTotalCents);
        return {
          ...item,
          amount: newAmountCents, // Hələlik qəpiklə
        };
      });
      
      let distributedTotalCents = updatedPricesInCents.reduce((sum, item) => sum + item.amount, 0);
      let difference = newTotalCents - distributedTotalCents; // Qəpik səhvi
      
      if (updatedPricesInCents.length > 0) {
          updatedPricesInCents[0].amount += difference;
      }
      
      setPsPrice(
        updatedPricesInCents.map(item => ({
          ...item,
          amount: fromCents(item.amount) 
        }))
      );
      
    } else {
      const equalAmountCents = Math.floor(newTotalCents / psPrice.length);
      const remainderCents = newTotalCents % psPrice.length; // Qalıq

      let updatedPrices = psPrice.map((item, index) => {
        let amountCents = equalAmountCents;
        if (index < remainderCents) {
          amountCents += 1;
        }

        return {
          ...item,
          amount: fromCents(amountCents), 
        };
      });
      
      setPsPrice(updatedPrices);
    }
  }
};

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          `${base_url}/own-restaurants`,
          getHeaders()
        );
        setIsPsClub(response.data.is_psclub); // 0 veya 1
      } catch (error) {
        console.error(error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const savedOrderId = localStorage.getItem(`table_${id}_orderId`);
    if (savedOrderId) {
      setOrderId(savedOrderId);
    }
  }, [id]);

  useEffect(() => {
    if (orderId) {
      localStorage.setItem(`table_${id}_orderId`, orderId);
    }
  }, [orderId, id]);

  const fetchTimeCharges = async (specificOrderId = null) => {
    const orderIdToUse = specificOrderId || orderId;

    if (!orderIdToUse) {
      console.log("orderId yoxdur, sorgu atılmır");
      // Expired timer varsa psPrice-ı SİLMƏ!
      if (!hasExpiredTimerRef.current) {
        setPsPrice([]);
      }
      return;
    }

    try {
      const response = await axios.get(
        `${base_url}/orders/${orderIdToUse}/time-charges`,
        getHeaders()
      );
      console.log("API cavabı:", response.data);
      // API-dan data gəldikdə - YALNIZ data varsa yenilə
      if (response.data && response.data.length > 0) {
        hasExpiredTimerRef.current = false;
        setPsPrice(response.data);
      } else {
        // API boş qaytardı - expired timer varsa ÜSTÜNƏ YAZMA!
        if (!hasExpiredTimerRef.current) {
          setPsPrice([]);
        }
      }
    } catch (error) {
      console.error("Xəta baş verdi:", error);
      // Expired timer varsa psPrice-ı SİLMƏ!
      if (!hasExpiredTimerRef.current) {
        setPsPrice([]);
      }
    }
  };

  const handleFinishOrder = (orderIdFromChild) => {
    console.log("Uşaqdan gələn order_id:", orderIdFromChild);
    setOrderId(orderIdFromChild);
    fetchTimeCharges(orderIdFromChild); // Həmçinin məlumatları yenilə
  };

  // Komponent yüklənəndə local storage-dan orderId oxu
  useEffect(() => {
    const savedOrderId = localStorage.getItem(`table_${id}_orderId`);
    if (savedOrderId) {
      setOrderId(savedOrderId);
      fetchTimeCharges(savedOrderId); // Həmçinin məlumatları yüklə
    }
  }, [id]);

  // orderId dəyişdikdə local storage-a yaz
  useEffect(() => {
    if (orderId) {
      localStorage.setItem(`table_${id}_orderId`, orderId);
      fetchTimeCharges(); // Yeni orderId üçün məlumatları yüklə
    } else {
      localStorage.removeItem(`table_${id}_orderId`);
      // Expired timer varsa psPrice-ı SİLMƏ!
      if (!hasExpiredTimerRef.current) {
        setPsPrice([]);
      }
    }
  }, [orderId, id]);

  // Masa dəyişdikdə local storage-u təmizlə
  useEffect(() => {
    return () => {
      // Komponent unmount olanda current table üçün orderId-ni təmizlə
      localStorage.removeItem(`table_${id}_orderId`);
    };
  }, [id]);
  const toggleRow = (id) => {
    setOpenRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [modalData, setModalData] = useState({
    name: "",
    desc: "",
    price: "",
  });

  const [selectedProduct, setSelectedProduct] = useState({
    id: null,
    name: "",
    price: 0,
    quantity: 1,
  });

  const fetchStockSets = async () => {
    try {
      const response = await axios.get(`${base_url}/stock-sets`, getHeaders());
      setStockSets(response.data);
    } catch (error) {
      console.error("Error loading stock sets:", error);
    }
  };

  // Fetch stock groups from API
  const fetchStockGroups = async () => {
    try {
      const response = await axios.get(
        `${base_url}/stock-groups`,
        getHeaders()
      );
      setStockGroups(response.data);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
      } else {
        console.error("Error loading customers:", error);
      }
    }
  };
  const dispatch = useDispatch();
  // Fetch stocks from API with optional filter
  const fetchStocks = async (groupId) => {
    try {
      const response = await axios.get(`${base_url}/stocks`, {
        ...getHeaders(),
        params: groupId === 0 ? {} : { stock_group_id: groupId }, // No filter if urunType is 0
      });
      setStocks(response.data);
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true);
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
      } else {
        console.error("Error loading customers:", error);
      }
    }
  };

  useEffect(() => {
    if (orderModal) {
      setSelectedProduct({
        id: null,
        name: "",
        price: 0,
        quantity: 1,
      });
    }
  }, [orderModal]);

  // Fetch table orders
  const fetchTableOrders = async () => {
    try {
      const response = await axios.get(
        `${base_url}/tables/${id}/order`,
        getHeaders()
      );

      const orders = response.data.table.orders;
      setTableName(response.data.table.name);

      if (orders.length > 0 && orders[0].order_id) {
        const newOrderId = orders[0].order_id;
        setOrderId(newOrderId);
        localStorage.setItem(`table_${id}_orderId`, newOrderId);

        // Həmçinin zaman ödənişlərini də burada yüklə
        fetchTimeCharges(newOrderId);
      } else {
        setOrderId(null);
        localStorage.removeItem(`table_${id}_orderId`);
        setPsPrice([]); // Sifariş yoxdursa, psPrice-ni təmizlə
      }

      setOrdersIdMassa({
        id: response.data.table.orders[0].order_id,
        total_price: response.data.table.orders[0].total_price,
        total_prepayment: response.data.table.orders[0].total_prepayment,
      });

      // Stocks və Sets məlumatlarını birləşdir
      const formattedOrders = orders.map((order) => {
        // Stocks məlumatları
        const stockItems = order.stocks.map((stock) => ({
          id: stock.id,
          name: stock.name,
          quantity: stock.quantity,
          price: stock.price,
          pivot_id: stock.pivot_id,
          unit: stock.detail?.unit,
          count: stock.detail?.count,
          detail_id: stock.detail,
          type: "stock", // Tipi qeyd edirik
        }));

        // Sets məlumatları
        const setItems = order.sets.map((set) => ({
          id: set.id,
          name: set.name,
          quantity: set.quantity,
          price: set.price,
          pivot_id: set.pivot.id,
          type: "set", // Tipi qeyd edirik
          items: set.items, // Set içindəki məhsullar
        }));

        return {
          totalPrice: order.total_price,
          total_prepayment: order.total_prepayment,
          items: [...stockItems, ...setItems], // Birləşdirilmiş məlumatlar
        };
      });

      // Bütün maddələri düz array edirik
      const allItems = formattedOrders.flatMap((order) => order.items);
      setOrderDetails(allItems);

      // Ümumi qiyməti hesabla
      const total = formattedOrders.reduce(
        (acc, order) => acc + order.totalPrice,
        0
      );
      const total_prepare = formattedOrders.reduce(
        (acc, order) => acc + order.total_prepayment,
        0
      );
      const kalanMebleg = total - total_prepare;
      setTotalPrice({
        total: total,
        total_prepare: total_prepare,
        kalan: kalanMebleg,
      });
    } catch (error) {
      // Xəta idarəsi
    }
  };

  useEffect(() => {
    dispatch(fetchTableOrderStocks(id));
  }, [id, dispatch]);

  const { allItems, orders, loading, error } = useSelector(
    (state) => state.stocks
  );

  // Delete orders
  const handleDeleteMasa = async () => {
    try {
      await axios.delete(`${base_url}/tables/${id}/cancel-order`, getHeaders());
      setRefreshFetch(!refreshFetch);
      window.location.reload();
      navigate("/masalar");
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true); // Set access denied if response status is 403
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true); // Set access denied if response status is 403
      } else {
        console.error("Error deleting masa:", error);
      }
    }
  };

  const handleCustomModal = (item) => {
    if (item.stocks) {
      // Bu bir set ise - popup aç
      setModalId(item?.id);
      setModalData({
        name: item?.name,
        desc: item?.description || "",
        price: item?.price,
      });
      setSelectedProduct({
        id: null,
        name: "",
        price: item?.price || 0,
        quantity: 1,
      });
      setNoOrderModal(true);
    } else {
      // Normal stok ise
      const selectedStock = stocks.find((stock) => stock.id === item.id);
      if (selectedStock) {
        // Her zaman popup aç
        setModalId(selectedStock?.id);
        setModalData({
          name: selectedStock?.name,
          desc: selectedStock?.description || "",
          price: selectedStock?.price,
        });
        // Eğer details yoksa, varsayılan bir selectedProduct ayarla
        if (!selectedStock.details || selectedStock.details.length === 0) {
          setSelectedProduct({
            id: null,
            name: selectedStock?.name || "",
            price: selectedStock?.price || 0,
            quantity: 1,
          });
        } else {
          setSelectedProduct({
            id: null,
            name: "",
            price: selectedStock?.price || 0,
            quantity: 1,
          });
        }
        setNoOrderModal(true);
      }
    }
  };

  const closeModal = () => {
    setNoOrderModal(false);
  };
  const replaceImage = (url) => {
    return url ? `${img_url}/${url}` : "";
  };

  useEffect(() => {
    const storedUrunType = localStorage.getItem("urunType");
    if (storedUrunType) {
      setUrunType(Number(storedUrunType));
    }
    fetchStockGroups();
    fetchTableOrders();
  }, [id, refreshFetch]);

  useEffect(() => {
    const controller = new AbortController();
    setIsStocksLoading(true);
    (async () => {
      try {
        const response = await axios.get(`${base_url}/stocks`, {
          ...getHeaders(),
          params: urunType === 0 ? {} : { stock_group_id: urunType },
          signal: controller.signal,
        });
        setStocks(response.data);
      } catch (err) {
        if (
          axios.isCancel?.(err) ||
          err?.name === "CanceledError" ||
          err?.name === "AbortError" ||
          err?.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (
          err?.response?.status === 403 &&
          err?.response?.data?.message ===
            "User does not belong to any  active restaurant."
        ) {
          setActiveUser(true);
        } else {
          console.error("Error loading stocks:", err);
        }
      } finally {
        setIsStocksLoading(false);
      }
    })();
    localStorage.setItem("urunType", urunType);
    return () => controller.abort();
  }, [urunType]);

  const handleAddStock = async (stockId, selectedProduct = null) => {
    try {
      await axios.post(
        `${base_url}/tables/${id}/add-stock`,
        {
          stock_id: stockId,
          quantity: selectedProduct?.quantity ? selectedProduct.quantity : 1,
          detail_id: selectedProduct?.id || null,
          price: selectedProduct?.price ?? null,
        },
        getHeaders()
      );
      toast.info("Məhsul əlavə olundu", {
        position: toast.POSITION?.TOP_RIGHT || "top-right",
        autoClose: 1000,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
          width: "70%",
          "@media (max-width: 768px)": {
            width: "70%",
          },
        },
      });
      fetchTableOrders();
      setNoOrderModal(false);
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Naməlum xəta baş verdi";

      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
          width: "70%",
        },
      });
    }
  };

  const handleRemoveStock = async (
    stockId,
    pivot_id,
    quantity,
    increase_boolean
  ) => {
    try {
      await axios.post(
        `${base_url}/tables/${id}/subtract-stock`,
        {
          stock_id: stockId,
          quantity: quantity || 1,
          pivotId: pivot_id,
          increase: increase_boolean,
        },
        getHeaders()
      );
      fetchTableOrders();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true);
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error removing stock from order:", error);
      }
    }
  };
  const handleRemoveStock2 = async (
    stockId,
    pivot_id,
    quantity,
    increase_boolean
  ) => {
    try {
      await axios.post(
        `${base_url}/tables/${id}/subtract-stock`,
        {
          stock_id: stockId,
          quantity: quantity || 1,
          pivotId: pivot_id,
          increase: increase_boolean,
        },
        getHeaders()
      );
      fetchTableOrders();
    } catch (error) {
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message ===
          "User does not belong to any  active restaurant."
      ) {
        setActiveUser(true);
      }
      if (
        error.response &&
        error.response.status === 403 &&
        error.response.data.message === "Forbidden"
      ) {
        setAccessDenied(true);
      } else {
        console.error("Error removing stock from order:", error);
      }
    }
  };

  //     try {
  //       // API-dən masaların siyahısını al
  //       const response = await axios.get(`${base_url}/tables`, {
  //         ...getHeaders(),
  //       });
  //       const tables = response.data.tables;
  //       const now = new Date();
  //       const day = String(now.getDate()).padStart(2, "0");
  //       const month = String(now.getMonth() + 1).padStart(2, "0");
  //       const year = now.getFullYear();

  //       const formattedDate = `${day}-${month}-${year}`;
  //       // const formattedTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  //       // Məsələn seçilmiş masanı tap (adı ilə və ya id ilə)
  //       const currentTable = tables.find((t) => t.name === tableName);

  //       // API-dən gələn açılış vaxtı
  //       const book_time = currentTable?.book_time;

  //       console.log("API book_time:", book_time);

  //       const psTotal = calculatePsTotal();
  //       const overallTotal = calculateOverallTotal();
  //       const printContent = `
  //     <html>
  //       <head>
  //         <title>Print Order</title>
  //         <style>
  //         body {
  //             font-family: Arial, sans-serif;
  //             margin: 0;
  //             padding: 0;
  //         }
  //         .invoice {
  //             width: 100mm; /* Fatura kağıdı genişliği */
  //             margin: 5px auto;
  //             padding: 1px;

  //             box-sizing: border-box;
  //             font-size: 10px;
  //         }
  //         .header {
  //             text-align: center;
  //             margin-bottom: 5px;
  //         }
  //         .header h1 {
  //             margin: 0;
  //             font-size: 18px;
  //         }
  //         .header h1 {
  //           text-transform: uppercase;
  //       }
  //         .table {
  //             width: 100%;
  //             border-collapse: collapse;
  //             margin-bottom: 5px;
  //         }
  //         .table th, .table td {
  //             border: 1px solid #000;
  //             padding: 3px;
  //             text-align: left;
  //         }
  //         .table th {
  //             background-color: #f4f4f4;
  //         }
  //         .total {
  //             text-align: right;
  //             font-size: 17px;
  //             font-weight: bold;
  //             margin-top: 5px;
  //         }
  //         .cem{
  //           font-size: 18px;
  //         }
  //       .mb {
  //   margin-bottom: 20px;
  //   font-size: 12px !important;
  //   font-weight: bold;
  //   display: flex;
  //   justify-content: space-between;
  // }
  //         .print-button {
  //             display: block;
  //             margin: 10px auto;
  //             padding: 5px 15px;
  //             background-color: #28a745;
  //             color: #fff;
  //             border: none;
  //             border-radius: 3px;
  //             font-size: 12px;
  //             cursor: pointer;
  //             text-align: center;
  //         }
  //         .print-button:hover {
  //             background-color: #218838;
  //         }
  //         @media print {
  //             .print-button {
  //                 display: none; /* Yazdırmada buton gizlenir */
  //             }
  //             body {
  //                 margin: 0;
  //             }
  //             .table th, .table td {
  //                 border: 1px solid black; /* Yazdırmada net çerçeve */
  //             }
  //             .table th {
  //                 background-color: #ffffff !important;
  //                 -webkit-print-color-adjust: exact;
  //             }
  //             .invoice {
  //               border: none; /* Yazdırma sırasında gereksiz dış çerçeve kaldırılır */
  //             }

  //         }
  //     </style>
  //       </head>
  //       <body>
  //       <div class="invoice">
  //       <div class="header">
  //       <h1> ${restoranName}</h1>
  //           <h2> ${tableName}</h2>
  //           <div class="mb">
  //           <span>Masanın açılış Tarixi:${formattedDate}</span>
  //           <span>Masanın açılış Vaxtı:${book_time}</span>

  //         </div>

  //       </div>
  //       <table class="table">
  //           <thead>
  //               <tr>
  //                   <th>No</th>
  //                   <th>Sifarişin adı</th>
  //                   <th>Miq.</th>
  //                   <th>Set.</th>
  //                   <th>Qiymət</th>
  //                   <th>Məbləğ</th>
  //               </tr>
  //           </thead>
  //           <tbody>

  //               ${orderDetails
  //                 ?.map(
  //                   (item, index) => `
  //                     <tr key="${item.id}">
  //                     <td>${index + 1}</td>
  //                     <td>
  //   ${item.name}
  //   ${
  //     item.type === "set"
  //       ? `<ul style="margin:0;padding-left:10px;">
  //           ${item.items
  //             .map(
  //               (sub) =>
  //                 `<li style="list-style-type:none;">${sub.stock_name} (${sub.quantity})</li>`
  //             )
  //             .join("")}
  //         </ul>`
  //       : item?.count
  //       ? `<br/>${item.unit || ""}`
  //       : ""
  //   }
  // </td>

  //                       <td>${
  //                         item.count ? item.count * item.quantity : item.quantity
  //                       }</td>
  //                       <td>${item?.count ? item.quantity : 0}</td>
  //                       <td>${(item.price / item.quantity).toFixed(2)} </td>
  //                       <td>${(
  //                         item.quantity *
  //                         (item.price / item.quantity)
  //                       ).toFixed(2)} </td>
  //                     </tr>
  //                   `
  //                 )
  //                 .join("")}
  //           </tbody>
  //       </table>
  //       <div class="total">
  //            <div>
  //             <p class="cem">Masa Sifarişləri: ${totalPrice.total.toFixed(
  //               2
  //             )} Azn</p>
  //             ${
  //               psTotal > 0
  //                 ? `
  //               <p>PS Club Ödənişləri: ${psTotal.toFixed(2)} Azn</p>
  //               <p class="cem" style="font-size: 20px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
  //                 ÜMUMİ CƏM: ${overallTotal.toFixed(2)} Azn
  //               </p>
  //             `
  //                 : ""
  //             }
  //             ${
  //               totalPrice?.total_prepare && totalPrice.total_prepare !== 0
  //                 ? `<p>Artıq ödənilib: ${totalPrice.total_prepare} AZN</p>
  //                    <p>Qalıq: ${calculateRemainingAmount().toFixed(2)} Azn</p>`
  //                 : ""
  //             }
  //             <strong>${fis}</strong>
  //       </div>
  //   </div>

  //       </body>
  //     </html>
  //   `;

  //       const printWindow = window.open("", "", "width=800,height=600");
  //       printWindow.document.open();
  //       printWindow.document.write(printContent);
  //       printWindow.document.close();
  //       printWindow.focus();
  //       printWindow.print();
  //     } catch (error) {
  //       console.error("API error:", error);
  //     }
  //   };

  const handlePrint = async () => {
    try {
      // API-dən masaların siyahısını al
      const response = await axios.get(`${base_url}/tables`, {
        ...getHeaders(),
      });
      const tables = response.data.tables;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();

      const formattedDate = `${day}-${month}-${year}`;
      const currentTable = tables.find((t) => t.name === tableName);
      const book_time = currentTable?.book_time;

      // Məbləğləri hesabla
      const psTotal = calculatePsTotal();
      const overallTotal = calculateOverallTotal();
      const remainingAmount = calculateRemainingAmount();

      const printContent = `
      <html>
        <head>
          <title>Print Order</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .invoice {
              width: 100mm;
              margin: 5px auto;
              padding: 1px;
              box-sizing: border-box;
              font-size: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 5px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              text-transform: uppercase;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 5px;
            }
            .table th, .table td {
              border: 1px solid #000;
              padding: 3px;
              text-align: left;
            }
            .table th {
              background-color: #f4f4f4;
            }
            .total {
              text-align: right;
              font-size: 17px;
              font-weight: bold;
              margin-top: 5px;
            }
            .cem {
              font-size: 18px;
            }
            .mb {
              margin-bottom: 20px;
              font-size: 12px !important;
              font-weight: bold;
              display: flex;
              justify-content: space-between;
            }
            .print-button {
              display: block;
              margin: 10px auto;
              padding: 5px 15px;
              background-color: #28a745;
              color: #fff;
              border: none;
              border-radius: 3px;
              font-size: 12px;
              cursor: pointer;
              text-align: center;
            }
            .print-button:hover {
              background-color: #218838;
            }
            @media print {
              .print-button {
                display: none;
              }
              body {
                margin: 0;
              }
              .table th, .table td {
                border: 1px solid black;
              }
              .table th {
                background-color: #ffffff !important; 
                -webkit-print-color-adjust: exact;
              }
              .invoice {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <h1>${restoranName}</h1>
              <h2>${tableName}</h2>
              <div class="mb">
                <span>Masanın açılış Tarixi: ${formattedDate}</span>
                <span>Masanın açılış Vaxtı: ${book_time}</span>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Sifarişin adı</th>
                  <th>Miq.</th>
                  <th>Set.</th>
                  <th>Qiymət</th>
                  <th>Məbləğ</th>
                </tr>
              </thead>
              <tbody>
                ${orderDetails
                  ?.map(
                    (item, index) => `
                      <tr key="${item.id}">
                        <td>${index + 1}</td>
                        <td>
                          ${item.name}
                          ${
                            item.type === "set"
                              ? `<ul style="margin:0;padding-left:10px;">
                                  ${item.items
                                    .map(
                                      (sub) =>
                                        `<li style="list-style-type:none;">${sub.stock_name} (${sub.quantity})</li>`
                                    )
                                    .join("")}
                                </ul>`
                              : item?.count
                              ? `<br/>${item.unit || ""}`
                              : ""
                          }
                        </td>
                        <td>${
                          item.count
                            ? item.count * item.quantity
                            : item.quantity
                        }</td>
                        <td>${item?.count ? item.quantity : 0}</td>
                        <td>${(item.price / item.quantity).toFixed(2)}</td>
                        <td>${(
                          item.quantity *
                          (item.price / item.quantity)
                        ).toFixed(2)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="total">
              <div>
                <p class="cem">Masa Sifarişləri: ${totalPrice.total.toFixed(
                  2
                )} AZN</p>
                ${
                  psTotal > 0
                    ? `<p>PS Club Ödənişləri: ${psTotal.toFixed(2)} AZN</p>
                       <p class="cem" style="font-size: 20px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
                         ÜMUMİ CƏM: ${overallTotal.toFixed(2)} AZN
                       </p>`
                    : `<p class="cem">ÜMUMİ CƏM: ${totalPrice.total.toFixed(
                        2
                      )} AZN</p>`
                }
                ${
                  totalPrice?.total_prepare && totalPrice.total_prepare !== 0
                    ? `<p>Artıq ödənilib: ${(Number(totalPrice.total_prepare || 0)).toFixed(2)} AZN</p>
                       <p>Qalıq: ${remainingAmount.toFixed(2)} AZN</p>`
                    : ""
                }
                <strong>${fis}</strong>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

      const printWindow = window.open("", "", "width=800,height=600");
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("API error:", error);
    }
  };
  useEffect(() => {
    const storedUrunType = localStorage.getItem("urunType");
    if (storedUrunType) {
      setUrunType(Number(storedUrunType));
    }
    fetchStockGroups();
    fetchTableOrders();
    fetchStockSets(); // Stock setleri yükle
  }, [id, refreshFetch]);

  useEffect(() => {
    // Eğer urunType -1 değilse (yani setler görünmüyorsa)
    if (urunType !== -1) {
      setShowSets(false);
    }
  }, [urunType]);

  // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
  if (accessDenied) return <AccessDenied onClose={setAccessDenied} />;


  // Ümumi məbləği hesabla (yemək + PS)
  const calculateOverallTotal = () => {
    const foodTotal = totalPrice.total || 0;
    const psTotal = calculatePsTotal();
    
    return foodTotal + psTotal;
  };

  // Qalıq məbləği hesabla
  const calculateRemainingAmount = () => {
    const overallTotal = calculateOverallTotal();
    const prepaid = totalPrice.total_prepare || 0;
    return overallTotal - prepaid;
  };
  const normalizeItem = (item) => ({
    id: item.id || item.stock_id,
    name: item.name || item.stock_name,
    quantity: item.quantity || 0,
    price: item.price || 0,
  });

  const handleCheckboxChange = (item, e) => {
  const isChecked = e.target.checked;

  // Bütün məhsul məlumatlarını olduğu kimi saxlayırıq
  const normalizedItem = {
    ...item,
    detail_id: item.detail_id || null,
    count: item.count || (item.detail_id?.count ?? null),
    unit: item.unit || (item.detail_id?.unit ?? ""),
    type: item.type || "stock",
    name: item.name || item.stock_name || "",
  };

  setCheckedItems((prev) => {
    if (isChecked) {
      return [...prev, normalizedItem];
    } else {
      return prev.filter((i) => i.id !== normalizedItem.id);
    }
  });
};

  const handleIngredientChange = (index, value) => {
    setCheckedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, customIngredient: value } : item
      )
    );
  };
const kicthenDataSend = () => {
  const kitchenContent = `
  <html>
    <head>
      <title>Mətbəx Sifarişi</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .invoice {
          width: 100mm;
          margin: 5px auto;
          padding: 3px;
          border: 1px solid #000;
          box-sizing: border-box;
          font-size: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 5px;
        }
        .header h1 {
          margin: 0;
          font-size: 16px;
          text-transform: uppercase;
        }
        .header h2 {
          text-transform: uppercase;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        .table th, .table td {
          border: 1px solid #000;
          padding: 3px;
          text-align: left;
          vertical-align: top;
        }
        .table th {
          background-color: #f4f4f4;
        }
        ul { margin: 0; padding-left: 12px; }
        li { margin-bottom: 2px; list-style-type: "• "; }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <h1>${restoranName}</h1>
          <h2>${tableName} (Mətbəx üçün)</h2>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Məhsul</th>
              <th>Miq.</th>
              <th>Qeyd</th>
            </tr>
          </thead>
          <tbody>
            ${checkedItems
              ?.map((item, index) => {
                if (item.type === "set" && Array.isArray(item.items)) {
                  const setRows = item.items
                    .map(
                      (sub) => `
                        <li>
                          ${sub.stock_name}
                          ${
                            sub.detail_id
                              ? ` (${sub.detail_id.count || ""} ${
                                  sub.detail_id.unit || ""
                                })`
                              : ""
                          }
                          ${
                            sub.customIngredient
                              ? `<div><b>Qeyd:</b> ${sub.customIngredient}</div>`
                              : ""
                          }
                        </li>`
                    )
                    .join("");

                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><b>${item.name}</b> (Set)</td>
                      <td>${item.quantity}</td>
                      <td><ul>${setRows}</ul></td>
                    </tr>`;
                } else {
                  const countText =
                    item.count || item.detail_id?.count
                      ? ` (${item.count || item.detail_id?.count} ${
                          item.unit || item.detail_id?.unit || ""
                        })`
                      : "";

                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.name}${countText}</td>
                      <td>${item.quantity}</td>
                      <td>${item.customIngredient || "Yoxdur"}</td>
                    </tr>`;
                }
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </body>
  </html>`;

  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.open();
  printWindow.document.write(kitchenContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  setHandleModal(false);
};




  const handleManualQuantityChange = (item, newQuantity) => {
    if (newQuantity < item.quantity) {
      // İstənilən azalma üçün şifrə soruş
      setPendingRemoveData({
        stockId: item.id,
        pivot_id: item.pivot_id,
        quantity: item.quantity - newQuantity, // silinəcək miqdar
        increase_boolean: false,
      });
      setShowPasswordScreen(true);
    } else {
      // Miqdarı artırmaqdır, dərhal yenilə
      updateStockQuantity(item, newQuantity);
    }
  };

  const updateStockQuantity = async (item, newQuantity) => {
    const difference = newQuantity - item.quantity;

    try {
      if (difference > 0) {
        // artırma
        await axios.post(
          `${base_url}/tables/${id}/add-stock`,
          {
            stock_id: item.id,
            quantity: difference,
            detail_id: item?.pivot_id || null,
          },
          getHeaders()
        );
      } else if (difference < 0) {
        // azalma (amma şifrə yox, buna burda gəlməməlidir)
        await axios.post(
          `${base_url}/tables/${id}/subtract-stock`,
          {
            stock_id: item.id,
            quantity: Math.abs(difference),
            pivotId: item?.pivot_id || null,
            increase: false,
          },
          getHeaders()
        );
      }
      fetchTableOrders();
    } catch (error) {
      console.error("Miqdar dəyişdirilərkən xəta baş verdi:", error);
    }
  };

  const handleSetIngredientChange = (itemIndex, subIndex, value) => {
    setCheckedItems((prev) =>
      prev.map((item, i) => {
        if (i === itemIndex && item.type === "set") {
          const updatedItems = item.items.map((sub, j) =>
            j === subIndex ? { ...sub, customIngredient: value } : sub
          );
          return { ...item, items: updatedItems };
        }
        return item;
      })
    );
  };

  return (
    <>
      <ToastContainer />
      <Helmet>
        <title>Masaların sifarişi | Smartcafe</title>
        <meta
          name="description"
          content="Restoran proqramı | Kafe - Restoran idarə etmə sistemi "
        />
      </Helmet>
      <section className="h-[calc(100vh-56px)] bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
        <div
          className={`${
            mobileView === "order" ? "flex" : "hidden"
          } lg:flex w-full lg:w-[48%] xl:w-[45%] 2xl:w-[42%] flex-col gap-3 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 pb-24 lg:pb-4 lg:border-r lg:border-slate-200 bg-slate-50`}
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/masalar"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Masalar</span>
              </Link>
              <div className="flex-1 flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-100 min-w-0">
                <Utensils size={16} className="text-indigo-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-none">
                    Aktiv masa
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 truncate leading-tight">
                    {tableName || "—"}
                  </div>
                </div>
              </div>
              {isPsClub === 1 && (
                <button
                  onClick={() => setIsPsModalOpen(true)}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                  title="PS Club taymerı"
                >
                  <Clock size={16} />
                </button>
              )}
            </div>
            {checkedItems.length > 0 && (
              <button
                onClick={() => setHandleModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow hover:shadow-md transition"
              >
                <ChefHat size={16} />
                Mətbəxə yazdır ({checkedItems.length})
              </button>
            )}

            {isPsModalOpen && (
              <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white w-[800px] p-6 rounded shadow-lg relative">
                  <PsModal
                    isOpen={isPsModalOpen}
                    onClose={() => setIsPsModalOpen(false)}
                     isPsClub={isPsClub}
                    tableName={tableName}
                    tableId={id}
                    time={time}
                    setTime={setTime}
                    isRunning={isRunning}
                    setIsRunning={setIsRunning}
                    onFinishOrder={handleFinishOrder}
                    onRefreshTableData={() => {
                      // Timer bitdikdə psPrice VƏ expiredTimerInfo saxlanılır - silinmir!
                      // Yalnız yeni data varsa yenilənir
                      console.log("Timer refreshed - data saxlanılır");
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <OrderTable   
              orderDetails={orderDetails}
              openRows={openRows}
              toggleRow = {toggleRow}
              handleCheckboxChange={handleCheckboxChange}
              handleAddStock={handleAddStock}
              handleRemoveStock2={handleRemoveStock2}
              setPendingRemoveData={setPendingRemoveData}
              setShowPasswordScreen ={setShowPasswordScreen}
              />

      {isPsClub === 1 && psPrice && psPrice.length > 0 && (
    <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        
        {/* Table */}
        <div className="overflow-x-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider w-[10%]">
                            #
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 uppercase tracking-wider w-[60%]">
                            Paket Adı
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-700 uppercase tracking-wider w-[30%]">
                            Qiymət
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {psPrice.map((charge, index) => (
                        <tr
                            key={`ps-${charge.id}-${index}`}
                            className="hover:bg-indigo-50 transition-all duration-150"
                        >
                            {/* № - Daha kiçik nişan */}
                            <td className="px-3 py-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs">
                                    {index + 1}
                                </span>
                            </td>

                            {/* Paket Adı */}
                            <td className="px-3 py-2">
                                <div className="flex flex-col gap-0">
                                    <span className="text-gray-800 font-medium text-sm">
                                        {charge.title}
                                    </span>
                                    {charge.count > 1 && (
                                        <span className="text-xs text-gray-500 italic">
                                            ({charge.count} dəfə təkrarlanıb)
                                        </span>
                                    )}
                                </div>
                            </td>

                            {/* Qiymət Inputu - Daha yığcam və sadə */}
                            <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={charge.amount}
                                        onChange={(e) => {
                                            const newAmount = e.target.value;
                                            setPsPrice(prev => 
                                                prev.map((item, i) => 
                                                    i === index ? { ...item, amount: newAmount } : item
                                                )
                                            );
                                        }}
                                        onBlur={(e) => {
                                            const value = parseFloat(e.target.value);
                                            // Qiymətin ən az 0.00 olmasını təmin edir
                                            const finalValue = (isNaN(value) || value < 0) ? "0.00" : value.toFixed(2);
                                            
                                            setPsPrice(prev => 
                                                prev.map((item, i) => 
                                                    i === index ? { ...item, amount: finalValue } : item
                                                )
                                            );
                                        }}
                                        className="w-24 px-2 py-1.5 text-right font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 transition"
                                    />
                                    <span className="text-gray-600 text-sm min-w-[30px]">₼</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Total Footer - Daha yığcam */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-indigo-200 px-4 py-3">
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-0">
                    <span className="text-gray-700 font-bold text-base">
                        Ümumi PS Məbləği
                    </span>
                    <span className="text-xs text-gray-500">
                        {psPrice.length} xidmət paketi
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-inner border border-indigo-300">
                    <span className="text-2xl font-extrabold text-indigo-700">
                        {calculatePsTotal().toFixed(2)}
                    </span>
                    <span className="text-gray-600 font-semibold text-sm">AZN</span>
                </div>
            </div>
        </div>
    </div>
)}
       
          {showPasswordScreen && pendingRemoveData && (
            <PasswordScreenFour
              pendingRemoveData={pendingRemoveData}
              tableId={id}
              onClose={() => {
                setShowPasswordScreen(false);
                setPendingRemoveData(null);
              }}
              fetchTableOrders={fetchTableOrders}
            />
          )}

         
        <PaymentSummary
            role={role}
            totalPrice={totalPrice}
            calculateOverallTotal={calculateOverallTotal}
            calculateRemainingAmount={calculateRemainingAmount}
            setOncedenodePopop={setOncedenodePopop}
            isPsClub={isPsClub}
            psPrice={psPrice}
            inputValue={inputValue}
            handlePsTotalChange={handlePsTotalChange}
            handlePsTotalBlur={handlePsTotalBlur}
            setHesabKes={setHesabKes}
            handlePrint={handlePrint}
            handleDeleteMasa={handleDeleteMasa}
            TotalPriceHesab={TotalPriceHesab}
            expiredTimerInfo={expiredTimerInfo}
            onOpenPsModal={() => setIsPsModalOpen(true)}
          />
        </div>

        <div
          className={`${
            mobileView === "menu" ? "flex" : "hidden"
          } lg:flex w-full lg:flex-1 flex-col min-w-0 overflow-hidden`}
        >
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 space-y-2.5 z-10">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Məhsul axtar..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div
              className={`gap-1.5 -mx-1 px-1 pb-1 scroll-smooth ${
                isGroupsExpanded
                  ? "flex flex-wrap"
                  : "flex flex-nowrap overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              }`}
              style={!isGroupsExpanded ? { touchAction: "pan-x" } : undefined}
            >
              <button
                onClick={() => {
                  setShowSets(false);
                  setUrunType(0);
                  toggleGroupsExpanded();
                }}
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${
                  urunType === 0 && !showSets
                    ? "bg-indigo-600 border-indigo-600 text-white shadow"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                aria-expanded={isGroupsExpanded}
                aria-label={
                  isGroupsExpanded
                    ? "Kateqoriyaları yığ"
                    : "Bütün kateqoriyaları göstər"
                }
              >
                Hamısı
                {isGroupsExpanded ? (
                  <ChevronUp size={14} className="shrink-0" />
                ) : (
                  <ChevronRight size={14} className="shrink-0" />
                )}
              </button>
              <button
                onClick={() => {
                  setShowSets(true);
                  setUrunType(-1);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${
                  showSets
                    ? "bg-indigo-600 border-indigo-600 text-white shadow"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Setlər
              </button>
              {stockGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setShowSets(false);
                    setUrunType(group.id);
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition border ${
                    urunType === group.id && !showSets
                      ? "bg-indigo-600 border-indigo-600 text-white shadow"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3 pb-24 lg:pb-4 relative">
            {isStocksLoading && (
              <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium shadow-lg flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Yüklənir...
              </div>
            )}
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 transition-opacity duration-150 ${
                isStocksLoading ? "opacity-50" : "opacity-100"
              }`}
            >
            {(() => {
              const q = productSearch.trim().toLowerCase();
              const list = showSets ? stockSets : stocks;
              const filtered = q
                ? list.filter((it) => it.name?.toLowerCase().includes(q))
                : list;

              if (filtered.length === 0) {
                return (
                  <div className="col-span-full bg-white rounded-2xl border border-slate-200 py-10 text-center text-slate-500">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Məhsul tapılmadı</p>
                  </div>
                );
              }

              return filtered.map((item) => {
                const imgSrc = showSets
                  ? `${img_url}/${item.image}`
                  : replaceImage(item.image);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleCustomModal(item)}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden text-left flex flex-col"
                  >
                    <div className="relative w-full aspect-square sm:aspect-[4/3] bg-slate-100 overflow-hidden">
                      {item.image ? (
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-300">
                          <Utensils size={28} />
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg shadow">
                        {Number(item.price).toFixed(2)} ₼
                      </div>
                      {showSets && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Set
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 flex-grow flex items-center">
                      <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-snug">
                        {item.name}
                      </p>
                    </div>
                  </button>
                );
              });
            })()}
            </div>
          </div>
        </div>
      </section>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] grid grid-cols-2 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setMobileView("menu")}
          className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition ${
            mobileView === "menu"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
          aria-pressed={mobileView === "menu"}
        >
          <Utensils size={20} />
          <span>Menyu</span>
          {mobileView === "menu" && (
            <span className="absolute top-0 left-1/4 right-1/2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileView("order")}
          className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition ${
            mobileView === "order"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
          aria-pressed={mobileView === "order"}
        >
          <div className="relative">
            <ShoppingBag size={20} />
            {orderDetails && orderDetails.length > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {orderDetails.length}
              </span>
            )}
          </div>
          <span>Sifariş</span>
          {mobileView === "order" && (
            <span className="absolute top-0 left-1/2 right-1/4 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </nav>

      {oncedenodePopop && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300 relative">
            <div className="bg-white p-4 flex justify-between items-center border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {tableName}
              </h3>
              <button
                onClick={() => setOncedenodePopop(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <OncedenOde
                odersId={odersIdMassa}
                setrefreshfetch={setRefreshFetch}
              />
            </div>
          </div>
        </div>
      )}
      {orderModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-3"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 sm:px-5 sm:py-4 text-white">
              <div className="pr-10">
                <div className="text-[10px] uppercase tracking-wider text-indigo-100 font-semibold">
                  Məhsul əlavə et
                </div>
                <h3 className="text-lg sm:text-xl font-bold truncate">
                  {modalData?.name}
                </h3>
                {modalData?.desc && (
                  <p className="text-xs text-indigo-100 mt-0.5 line-clamp-2">
                    {modalData.desc}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
              {stocks.find((stock) => stock.id === modalId)?.details &&
                stocks.find((stock) => stock.id === modalId)?.details.length >
                  0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                      Variant seçin
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {stocks
                        .find((stock) => stock.id === modalId)
                        ?.details.map((item) => {
                          const isSelected = selectedProduct?.id === item.id;
                          return (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => {
                                const oneProductCount = item.price / item.count;
                                setOneProduct(oneProductCount);
                                setSelectedProduct({
                                  id: item.id,
                                  name: item.name || "",
                                  price: item.price,
                                  quantity: 1,
                                });
                              }}
                              className={`border rounded-xl p-3 text-center transition-all ${
                                isSelected
                                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-md"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                              }`}
                            >
                              <div
                                className={`text-xs font-semibold uppercase tracking-wider ${
                                  isSelected
                                    ? "text-indigo-100"
                                    : "text-slate-400"
                                }`}
                              >
                                {item.count} {item.unit}
                              </div>
                              <div className="text-base font-bold mt-1">
                                {Number(item.price).toFixed(2)} ₼
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

              <div className="bg-slate-50 rounded-xl p-3 sm:p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Miqdar
                </div>
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={() =>
                      setSelectedProduct((prev) => ({
                        ...prev,
                        quantity: Math.max(1, prev.quantity - 1),
                      }))
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 grid place-items-center transition shadow-sm"
                    aria-label="Azalt"
                  >
                    <Minus size={20} />
                  </button>

                  <div className="flex-1 max-w-[7rem] text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight">
                      {selectedProduct?.quantity}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      ədəd
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedProduct((prev) => ({
                        ...prev,
                        quantity: prev.quantity + 1,
                      }))
                    }
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white grid place-items-center transition shadow hover:shadow-md"
                    aria-label="Artır"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-4 py-3 border border-indigo-100">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  Ümumi məbləğ
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {(
                    (selectedProduct?.price || modalData?.price || 0) *
                    selectedProduct.quantity
                  ).toFixed(2)}{" "}
                  <span className="text-base text-slate-500">₼</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white">
              <button
                onClick={() => {
                  const filteredStock = stocks.find(
                    (stock) => stock.id === modalId
                  );
                  const filteredSet = stockSets.find(
                    (set) => set.id === modalId
                  );
                  if (filteredStock) {
                    handleAddStock(filteredStock.id, selectedProduct);
                  } else if (filteredSet) {
                    handleAddStock(filteredSet.id, selectedProduct);
                  } else {
                    console.warn("No valid stock or set found.");
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg text-white font-semibold py-3 sm:py-3.5 rounded-xl text-sm sm:text-base shadow transition"
              >
                <Plus size={18} />
                Masaya əlavə et
              </button>
            </div>
          </div>
        </div>
      )}

     {handleModalMetbex && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white relative rounded-xl shadow-2xl p-6 w-[450px] max-w-full transform transition-all duration-300">
      
      {/* Başlıq və Bağlama Düyməsi */}
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          Xüsusi Tələblər: Metbəx Sifarişi
        </h3>
        <button
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          onClick={() => setHandleModal(false)}
        >
          <X size={18} />
        </button>
      </div>

     {/* Cədvəl konteyneri */}
<div className="overflow-y-auto max-h-[70vh]">
  <table className="w-full text-sm border-separate" style={{ borderSpacing: "0 10px" }}>
    <thead>
      <tr className="bg-gray-100 text-gray-700 uppercase text-xs sticky top-0 z-10 shadow-sm">
        <th className="px-4 py-3 text-left rounded-l-lg w-1/2">Məhsul Adı</th>
        <th className="px-4 py-3 text-left rounded-r-lg w-1/2">Xüsusi Qeyd</th>
      </tr>
    </thead>

    <tbody>
      {checkedItems?.map((item, index) => {
        // 🔹 SET MƏHSULLAR
        if (item?.type === "set" && Array.isArray(item.items)) {
          return (
            <React.Fragment key={`set-${index}`}>
              <tr className="bg-indigo-50 border border-indigo-100">
                <td colSpan={2} className="px-4 py-2 font-semibold text-indigo-700 text-base rounded-lg">
                  🍱 {item.stock_name || item.name} ({item.quantity} əd.) — <span className="text-xs text-indigo-500">SET MƏHSULU</span>
                </td>
              </tr>

              {item.items.map((subItem, subIdx) => (
                <tr key={`subitem-${index}-${subIdx}`} className="bg-white hover:bg-gray-50 border border-gray-100 rounded-lg transition">
                  <td className="px-6 py-3 text-sm text-gray-800">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        • {subItem.stock_name}
                        {subItem.detail_id && (
                          <span className="text-gray-500 text-xs ml-1">
                            (
                            {subItem.detail_id.count || ""}
                            {subItem.detail_id.unit
                              ? " " + subItem.detail_id.unit
                              : ""}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Xüsusi qeyd daxil edin..."
                      value={subItem.customIngredient || ""}
                      onChange={(e) => handleSetIngredientChange(index, subIdx, e.target.value)}
                      className="border border-gray-300 rounded-lg w-full px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </td>
                </tr>
              ))}

              <tr><td colSpan={2} className="h-3"></td></tr>
            </React.Fragment>
          );
        }

        // 🔹 SADƏ MƏHSULLAR
        const countValue = item.detail_id?.count || item.count || "";
        const unitValue = item.detail_id?.unit || item.unit || "";
        const detailText =
          countValue || unitValue
            ? `(${countValue}${unitValue ? " " + unitValue : ""})`
            : "";

        return (
          <tr
            key={`item-${index}`}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition"
          >
            <td className="px-4 py-3">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 flex items-center gap-1">
                  🧾 {item.name || item.stock_name}
                  {detailText && (
                    <span className="text-gray-500 text-xs font-medium">
                      {detailText}
                    </span>
                  )}
                </span>
                <span className="text-xs text-blue-500 mt-1">
                  Miqdar: {item.quantity} {item.detail_id?.unit || ""}
                </span>
              </div>
            </td>

            <td className="px-4 py-2">
              <input
                type="text"
                placeholder="Xüsusi qeyd daxil edin..."
                value={item.customIngredient || ""}
                onChange={(e) => handleIngredientChange(index, e.target.value)}
                className="border border-gray-300 rounded-lg w-full px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

{/* Göndər Düyməsi */}
<button
  onClick={kicthenDataSend}
  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl w-full text-base shadow-md shadow-indigo-400/50 transition-all duration-300"
>
  Mətbəxə Göndər 
</button>

    </div>
  </div>
)}

      {HesabKes && (
        <HesabKesAll
          setHesabKes={setHesabKes}
          tableName={tableName}
          orderId={odersIdMassa}
          totalAmount={calculateOverallTotal()} // Ümumi məbləğ
          foodAmount={totalPrice.total} // Yemək məbləği
          psAmount={calculatePsTotal()} // PS məbləği
          prepaidAmount={totalPrice.total_prepare} // Ön ödəniş
          remainingAmount={calculateRemainingAmount()} // Qalıq
        />
      )}
    </>
  );
}

export default MasaSiparis;
