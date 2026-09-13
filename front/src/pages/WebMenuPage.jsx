import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { base_url } from "../api/index";
import { pageTitle } from "../config/branding";
import { getTemplateDefaults } from "../components/webMenu/themes";
import {
  WebMenuClassicLayout,
  WebMenuFlameLayout,
  WebMenuModernLayout,
} from "../components/webMenu/WebMenuLayouts";
import { WebMenuItemModal, WebMenuCheckoutModal, WebMenuLocationPrompt } from "../components/webMenu/WebMenuModals";
import { requestBrowserLocation } from "../utils/webMenuGeolocation";

const LOCATION_PROMPT_DELAY_MS = 7000;

const WebMenuPage = ({ initialData = null }) => {
  const { slug: paramSlug } = useParams();
  const navigate = useNavigate();
  const slug = paramSlug || initialData?.settings?.slug;

  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [menuData, setMenuData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [locStatus, setLocStatus] = useState("idle");
  const [locError, setLocError] = useState("");
  const [locPromptVisible, setLocPromptVisible] = useState(false);
  const [locPromptDismissed, setLocPromptDismissed] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", note: "",
    latitude: null, longitude: null, location_maps_url: "",
  });
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    if (initialData || !slug) return;
    const load = async () => {
      try {
        const res = await axios.get(`${base_url}/web-menu/${slug}`);
        setMenuData(res.data);
        setSelectedCategory(res.data.stockGroups?.[0]?.id ?? null);
      } catch (e) {
        setError(e.response?.data?.error || "Menyu tapılmadı.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, initialData]);

  useEffect(() => {
    if (menuData?.stockGroups?.length && !selectedCategory) {
      setSelectedCategory(menuData.stockGroups[0].id);
    }
  }, [menuData, selectedCategory]);

  const captureLocation = async (fresh = false) => {
    setLocStatus("loading");
    setLocError("");
    try {
      const loc = await requestBrowserLocation({ fresh });
      setForm((f) => ({ ...f, ...loc }));
      setLocStatus("granted");
    } catch (err) {
      setLocStatus(err.code || "failed");
      setLocError(err.message || "Konum alına bilmədi.");
    }
  };

  // Menyu yüklənəndən 7 saniyə sonra konum icazəsi bildirişi
  useEffect(() => {
    if (loading || error || !menuData || locPromptDismissed) return;
    if (locStatus === "granted" || locStatus === "loading") return;

    const timer = window.setTimeout(() => {
      if (locStatus === "idle" && !locPromptDismissed) {
        setLocPromptVisible(true);
      }
    }, LOCATION_PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [loading, error, menuData, locPromptDismissed, locStatus]);

  const handleLocationAllow = async () => {
    setLocPromptVisible(false);
    await captureLocation(true);
  };

  const handleLocationDismiss = () => {
    setLocPromptVisible(false);
    setLocPromptDismissed(true);
  };

  // Səbət açılanda konum yoxdursa bir də cəhd et
  useEffect(() => {
    if (!checkoutOpen || locStatus === "granted" || locStatus === "loading") return;
    captureLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);

  const settings = menuData?.settings || {};
  const restaurant = menuData?.restaurant || {};
  const template = settings.theme_template || "classic";
  const defaults = getTemplateDefaults(template);
  const theme = settings.theme_color || defaults.theme;
  const bg = settings.bg_color || defaults.bg;

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const promoDiscount = appliedPromo?.discount ? Number(appliedPromo.discount) : 0;
  const orderTotal = useMemo(
    () => Math.max(0, cartTotal - promoDiscount),
    [cartTotal, promoDiscount]
  );

  const cartPayload = useMemo(
    () => cart.map((c) => ({ stock_id: c.stock_id, quantity: c.quantity, detail_id: c.detail_id })),
    [cart]
  );

  useEffect(() => {
    setAppliedPromo(null);
    setPromoError("");
  }, [cart]);

  const applyPromoCode = async () => {
    const code = promoInput.trim();
    if (!code || !cart.length) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await axios.post(`${base_url}/web-menu/${slug}/promo/validate`, {
        promo_code: code,
        stocks: cartPayload,
      });
      setAppliedPromo(res.data);
      setPromoInput(res.data.code || code.toUpperCase());
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(
        err.response?.data?.message || err.response?.data?.error || "Promo kod tətbiq olunmadı."
      );
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const onItemClick = (item) => {
    setSelectedItem(item);
    setSelectedDetail(item.details?.length === 1 ? item.details[0] : null);
    setItemQty(1);
  };

  const addToCart = () => {
    if (!selectedItem) return;
    const price = selectedDetail ? Number(selectedDetail.price) : Number(selectedItem.price);
    const key = `${selectedItem.id}-${selectedDetail?.id || "base"}`;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + itemQty };
        return next;
      }
      return [...prev, {
        key, stock_id: selectedItem.id, detail_id: selectedDetail?.id || null,
        name: selectedItem.name, detailLabel: selectedDetail ? `${selectedDetail.count} ${selectedDetail.unit}` : null,
        price, quantity: itemQty, image: selectedItem.image || null,
      }];
    });
    setSelectedItem(null);
    setSelectedDetail(null);
    setItemQty(1);
  };

  const updateCartQty = (key, delta) => {
    setCart((prev) => prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + delta } : c)).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!cart.length || !settings.accept_orders) return;
    const minRequired = settings.min_order_amount ? Number(settings.min_order_amount) : 0;
    if (minRequired > 0 && cartTotal < minRequired) {
      alert(`Minimum sifariş məbləği: ${minRequired.toFixed(2)} ₼`);
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${base_url}/web-menu/${slug}/order`, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note,
        latitude: form.latitude,
        longitude: form.longitude,
        promo_code: appliedPromo?.code || null,
        stocks: cartPayload,
      });
      setOrderDone(true);
      setCheckoutOpen(false);
      setCart([]);
      setAppliedPromo(null);
      setPromoInput("");
      setPromoError("");
    } catch (err) {
      const validationMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().find(Boolean)
        : null;
      alert(
        err.response?.data?.error ||
          validationMsg ||
          err.response?.data?.message ||
          "Sifariş göndərilmədi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const layoutProps = {
    menuData, settings, restaurant,
    title: settings.web_title || restaurant.name,
    theme, bg,
    selectedCategory, setSelectedCategory,
    onItemClick,
    cartCount, cartTotal,
    onCheckout: () => settings.accept_orders && setCheckoutOpen(true),
  };

  const Layout = template === "flame" ? WebMenuFlameLayout : template === "modern" ? WebMenuModernLayout : WebMenuClassicLayout;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{ background: bg || "#f8fafc" }}>
        <p className="text-slate-500">Menyu yüklənir...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: bg }}>
        <p className="text-slate-700 text-center">{error}</p>
        <button type="button" onClick={() => navigate("/")} className="mt-4 text-sm underline">Geri</button>
      </div>
    );
  }

  if (orderDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: bg }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-bold text-slate-800">Sifariş qəbul edildi!</h1>
          <p className="text-sm text-slate-500 mt-2">Tezliklə sizinlə əlaqə saxlanılacaq.</p>
          <button type="button" onClick={() => setOrderDone(false)} className="mt-6 w-full py-3 rounded-xl text-white font-medium" style={{ background: theme }}>Menyuya qayıt</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{pageTitle(settings.web_title || restaurant.name)}</title></Helmet>
      <Layout {...layoutProps} />
      <WebMenuLocationPrompt
        visible={locPromptVisible && locStatus !== "granted"}
        theme={theme}
        loading={locStatus === "loading"}
        onAllow={handleLocationAllow}
        onDismiss={handleLocationDismiss}
      />
      <WebMenuItemModal
        selectedItem={selectedItem}
        selectedDetail={selectedDetail}
        setSelectedDetail={setSelectedDetail}
        itemQty={itemQty}
        setItemQty={setItemQty}
        theme={theme}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
      />
      <WebMenuCheckoutModal
        checkoutOpen={checkoutOpen}
        setCheckoutOpen={setCheckoutOpen}
        cart={cart}
        cartTotal={cartTotal}
        orderTotal={orderTotal}
        promoDiscount={promoDiscount}
        promoInput={promoInput}
        setPromoInput={setPromoInput}
        appliedPromo={appliedPromo}
        promoLoading={promoLoading}
        promoError={promoError}
        onApplyPromo={applyPromoCode}
        onRemovePromo={removePromoCode}
        theme={theme}
        form={form}
        setForm={setForm}
        locStatus={locStatus}
        locError={locError}
        onRequestLocation={() => captureLocation(true)}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        submitOrder={submitOrder}
        submitting={submitting}
        minOrderAmount={settings.min_order_amount}
        restaurantName={settings.web_title || restaurant.name}
      />
    </>
  );
};

export const WebMenuResolver = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const host = window.location.hostname.toLowerCase().replace(/^www\./, "");
    axios
      .get(`${base_url}/web-menu/resolve`, { params: { host } })
      .then((res) => {
        const path = window.location.pathname;
        if (res.data.slug && (path === "/menu" || path === "/menu/")) {
          navigate(`/menu/${res.data.slug}`, { replace: true });
        } else {
          setData(res.data);
        }
      })
      .catch((err) => {
        setFailed(true);
        setErrorMsg(
          err.response?.data?.error ||
            "Bu domain üçün aktiv web menyu tapılmadı. DNS qeydlərini yoxlayın və SmartCafe panelindən domaini aktiv edin."
        );
      });
  }, [navigate]);

  if (failed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <p className="text-slate-700">{errorMsg}</p>
        <p className="text-xs text-slate-500 mt-3">
          Standart link: login.smartcafe.az/menu/restoran-slug
        </p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Menyu yüklənir...</p>
      </div>
    );
  }
  return <WebMenuPage initialData={data} />;
};

export default WebMenuPage;
