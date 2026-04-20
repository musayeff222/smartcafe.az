import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import DateTimeDisplay from "./DateTimeDisplay";
import { connect } from "react-redux";
import { logOut } from "../action/MainAction";
import NewOrders from "./NewOrders";
import { base_url, img_url } from "../api/index";
import {
  Menu,
  X,
  LayoutGrid,
  Receipt,
  Users,
  Wallet,
  Settings,
  ChevronDown,
  LogOut,
  Package,
  Truck,
  Table2,
  UserCog,
  SlidersHorizontal,
  Boxes,
  Banknote,
  Layers,
} from "lucide-react";

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

const Header = ({ token, logOut }) => {
  const [tanimDropShow, setTanimDropShow] = useState(false);
  const [profDropShow, setProfDropShow] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTanimOpen, setMobileTanimOpen] = useState(false);
  const [meData, setMeData] = useState({});
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [formData, setFormData] = useState({ logo: null, name: "" });

  const tanimRef = useRef(null);
  const profRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("restoran_name", formData?.name || "");
  }, [formData]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileTanimOpen(false);
    setProfDropShow(false);
    setTanimDropShow(false);
  }, [location.pathname]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `${base_url}/own-restaurants`,
        getAuthHeaders()
      );
      setFormData({
        logo: response.data.logo || null,
        name: response.data.name || "",
      });
    } catch (error) {
      console.error("Error fetching settings", error);
    }
  };

  const fetchMe = async () => {
    try {
      const response = await axios.get(`${base_url}/me`, getAuthHeaders());
      setMeData(response.data);
      const userRole = response.data.roles?.[0]?.name || "";
      setRole(userRole);
      localStorage.setItem("role", userRole);
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchMe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tanimRef.current && !tanimRef.current.contains(event.target))
        setTanimDropShow(false);
      if (profRef.current && !profRef.current.contains(event.target))
        setProfDropShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const replaceImage = (url) => (url ? `${img_url}/${url}` : "");

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  if (!token) return null;

  const mainLinks = [
    { to: "/masalar", label: "Masalar", icon: <LayoutGrid size={17} /> },
  ];
  if (role !== "waiter") {
    mainLinks.push(
      { to: "/siparisler", label: "Sifarişlər", icon: <Receipt size={17} /> },
      { to: "/musteriler", label: "Müştərilər", icon: <Users size={17} /> },
      { to: "/gunluk-kasa", label: "Kassa", icon: <Wallet size={17} /> }
    );
  }

  const tanimItems = [
    { to: "/stok", label: "Anbara Məhsul", icon: <Package size={15} /> },
    { to: "/couriers", label: "Kuryer Qeydiyyatı", icon: <Truck size={15} /> },
    { to: "/masa-tanimlari", label: "Masa Nizamlamaları", icon: <Table2 size={15} /> },
    { to: "/personel-tanimlari", label: "İşçi Qeydiyyatı", icon: <UserCog size={15} /> },
    { to: "/genel-ayarlar", label: "Nizamlamalar", icon: <SlidersHorizontal size={15} /> },
    { to: "/material", label: "Xammal", icon: <Boxes size={15} /> },
    { to: "/expenses", label: "Xərclər", icon: <Banknote size={15} /> },
    { to: "/stocksadd", label: "Setlər", icon: <Layers size={15} /> },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-3 sm:px-5 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/masalar" className="flex items-center gap-2 shrink-0">
            {formData.logo ? (
              <img
                src={replaceImage(formData.logo)}
                alt="Logo"
                className="w-9 h-9 rounded-lg object-cover bg-slate-100 border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold shadow">
                {(formData.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-800 max-w-[10rem] truncate">
                {formData.name || "Smartcafe"}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                POS System
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 ml-3">
            {mainLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(l.to)
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            ))}

            {role !== "waiter" && (
              <div className="relative" ref={tanimRef}>
                <button
                  onClick={() => setTanimDropShow((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    tanimItems.some((i) => isActive(i.to))
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Settings size={17} />
                  <span>Tənimlər</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      tanimDropShow ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {tanimDropShow && (
                  <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                    {tanimItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setTanimDropShow(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition ${
                          isActive(item.to)
                            ? "text-indigo-700 bg-indigo-50/60"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="text-slate-400">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-slate-600">
              <NewOrders />
              <div className="hidden lg:block">
                <DateTimeDisplay />
              </div>
            </div>

            <div className="relative" ref={profRef}>
              <button
                onClick={() => setProfDropShow((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center text-xs font-semibold uppercase shadow">
                  {(meData.name || "U").charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-slate-800 max-w-[7rem] truncate">
                    {meData.name || "İstifadəçi"}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {role || "user"}
                  </span>
                </div>
                <ChevronDown size={14} className="hidden sm:block text-slate-400" />
              </button>
              {profDropShow && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-3 pb-2 mb-1 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {meData.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {meData.email}
                    </div>
                  </div>
                  <Link
                    to="/genel-ayarlar"
                    onClick={() => setProfDropShow(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <SlidersHorizontal size={15} /> Nizamlamalar
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={15} /> Çıxış
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 h-14 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                {formData.logo ? (
                  <img
                    src={replaceImage(formData.logo)}
                    alt="Logo"
                    className="w-9 h-9 rounded-lg object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white font-bold">
                    {(formData.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-sm font-bold text-slate-800 truncate max-w-[10rem]">
                    {formData.name || "Smartcafe"}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">POS</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white grid place-items-center font-semibold uppercase">
                {(meData.name || "U").charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {meData.name}
                </div>
                <div className="text-xs text-slate-500 capitalize truncate">
                  {role || "user"}
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-slate-100 space-y-1.5">
              <NewOrders />
              <DateTimeDisplay />
            </div>

            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {mainLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive(l.to)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {l.icon}
                  <span>{l.label}</span>
                </Link>
              ))}

              {role !== "waiter" && (
                <div>
                  <button
                    onClick={() => setMobileTanimOpen((v) => !v)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings size={17} />
                    <span>Tənimlər</span>
                    <ChevronDown
                      size={14}
                      className={`ml-auto transition-transform ${
                        mobileTanimOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileTanimOpen && (
                    <div className="mt-1 ml-2 border-l-2 border-slate-100 pl-2 space-y-0.5">
                      {tanimItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                            isActive(item.to)
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-slate-400">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                <LogOut size={16} />
                Çıxış
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  token: state.Data.token,
});

const mapDispatchToProps = { logOut };

export default connect(mapStateToProps, mapDispatchToProps)(Header);
