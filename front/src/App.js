import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Header from "./components/Header";
import Couriers from "./pages/Couriers";
import GunlukKasa from "./pages/GunlukKasa";
import Masalar from "./pages/Masalar";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import Stok from "./pages/Stok";
import MasaTanimlari from "./pages/MasaTanimlari";
import PersonelTanimlari from "./pages/PersonelTanimlari";
import Siparisler from "./pages/Siparisler";
import Musteriler from "./pages/Musteriler";
import MasaSiparis from "./pages/MasaSiparis";
import MasaHesabKes from "./pages/MasaHesabKes";
import MusteriSiparisEkle from "./pages/MusteriSiparisEkle";
import GenelAyarlar from "./pages/GenelAyarlar";
import OrderDetailsQrcod from "./pages/OrderDetailsQrcod";
import WebMenuPage, { WebMenuResolver } from "./pages/WebMenuPage";
import WebMenuHome, { isWebMenuCustomHost } from "./pages/WebMenuHome";
import MasaTanimlariId from "./pages/MasaTanimlariId";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPassword from "./pages/admin/AdminPassword";
import AdminAccount from "./pages/admin/AdminAccount";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminWebsite from "./pages/admin/AdminWebsite";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminBackup from "./pages/admin/AdminBackup";
import AdminCrmHome from "./pages/admin/AdminCrmHome";
import RestaurantsList from "./pages/admin/restaurants/RestaurantsList";
import RestaurantDetail from "./pages/admin/restaurants/RestaurantDetail";
import NotFoundPage from "./pages/NotFoundPage";
import axios from "axios";
import DontActiveAcount from "./components/DontActiveAcount";
import { base_url, getAuthHeaders } from "./api/index";
import Material from "./pages/Material.jsx";
import Expenses from "./pages/expenses.jsx";
// import StocksAdd from './components/stocksSetAdd.jsx';
import StockSetGenel from "./pages/StockSetGenel.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { prefetchSecuritySettings } from "./utils/securityPasswords";
import PosScreenLock from "./components/PosScreenLock";
import { useLanguage } from "./i18n/LanguageContext";
import { useTheme } from "./context/ThemeContext";
import { useSelector, useDispatch } from "react-redux";
import { tick } from "./redux/timerSlice.js";

const App = () => {
  const location = useLocation();
  const { locale } = useLanguage();
  const { isDark } = useTheme();
  const [ActiveUser, setActiveUser] = useState(false);


   const dispatch = useDispatch();
  const sessions = useSelector((state) => state.timer.sessions);

  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(sessions).forEach((id) => {
        dispatch(tick({ tableId: id }));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch, sessions]);
  // Determine if the header should be shown
  const showHeader = !(
    location.pathname.startsWith("/adminPage") ||
    location.pathname.startsWith("/order-details") ||
    location.pathname.startsWith("/menu") ||
    location.pathname.includes("/hesab-kes") ||
    location.pathname.startsWith("/forgot-password") ||
    location.pathname.startsWith("/reset-password") ||
    isWebMenuCustomHost()
  );
  const [role, setrole] = useState(localStorage.getItem("role"));
  useEffect(() => {
    if (localStorage.getItem("token")) {
      prefetchSecuritySettings().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        await axios.get(`${base_url}/own-restaurants`, getAuthHeaders());
        // Dil: ilk acilis DEFAULT_LOCALE (az); istifadechi secimi localStorage-da qalir.
      } catch (error) {
        // if (error.response && error.response.status === 401 && error.response.data.message === "Unauthenticated" ) {
        //     setActiveUser(true); // Set access denied if response status is 403
        // }
        if (
          error.response &&
          error.response.status === 403 &&
          error.response.data.message === "User does not belong to any  active restaurant."
        ) {
          setActiveUser(true); // Set access denied if response status is 403
        } else {
          console.error("Error fetching orders:", error);
        }
      }
    };
    fetchRestaurant();
  }, []);

  if (ActiveUser) return <DontActiveAcount sil={setActiveUser} />;
  return (
    <div
      key={locale}
      className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <ToastContainer theme={isDark ? "dark" : "light"} />
      <PosScreenLock />
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<WebMenuHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/panel" element={<RestaurantDashboard />} />
        <Route path="/masalar" element={<Masalar />} />
        <Route path="/masa-siparis/:id" element={<MasaSiparis />} />
        <Route path="/masa-siparis/:id/hesab-kes" element={<MasaHesabKes />} />
        <Route path="/order-details/:token" element={<OrderDetailsQrcod />} />
        <Route path="/menu" element={<WebMenuResolver />} />
        <Route path="/menu/:slug" element={<WebMenuPage />} />
        {role !== "waiter" && (
          <>
            <Route path="/siparisler" element={<Siparisler />} />
            <Route path="/musteriler" element={<Musteriler />} />
            <Route path="/gunluk-kasa" element={<GunlukKasa />} />
            <Route path="/stok" element={<Stok />} />
            <Route path="/couriers" element={<Couriers />} />
            <Route path="/masa-tanimlari" element={<MasaTanimlari />} />
            <Route path="/masa-tanimlari/id" element={<MasaTanimlariId />} />
            <Route path="/personel-tanimlari" element={<PersonelTanimlari />} />
            <Route path="/muster-siparis-ekle/:id" element={<MusteriSiparisEkle />} />
            <Route path="/genel-ayarlar" element={<GenelAyarlar />} />
            <Route path="/material" element={<Material />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/stocksadd" element={<StockSetGenel />} />
          </>
        )}

        <Route path="/adminPage" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/adminPage/home" element={<AdminCrmHome />} />
          <Route path="/adminPage/dashboard" element={<RestaurantsList />} />
          <Route path="/adminPage/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/adminPage/notifications" element={<AdminNotifications />} />
          <Route path="/adminPage/password" element={<AdminPassword />} />
          <Route path="/adminPage/account" element={<AdminAccount />} />
          <Route path="/adminPage/website" element={<AdminWebsite />} />
          <Route path="/adminPage/packages" element={<AdminPackages />} />
          <Route path="/adminPage/backups" element={<AdminBackup />} />
          <Route path="/adminPage/audit" element={<AdminAudit />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

const AppWithRouter = () => (
  <BrowserRouter>
  
    <App />
    
  </BrowserRouter>
);

export default AppWithRouter;
