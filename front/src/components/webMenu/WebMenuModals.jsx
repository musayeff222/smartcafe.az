import React, { useEffect, useState } from "react";
import {
  Minus, Plus, X, User, Phone, MapPin, Navigation, Loader2, Trash2,
  ShoppingBag, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Ticket, Tag,
} from "lucide-react";
import { formatPrice } from "./themes";
import { storageUrl } from "../../utils/storageUrl";

/** Menyu açılandan ~7 saniyə sonra konum icazəsi bildirişi */
export const WebMenuLocationPrompt = ({ visible, theme, loading, onAllow, onDismiss }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-40"
      role="dialog"
      aria-live="polite"
      aria-label="Konum icazəsi"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white"
          style={{ background: theme }}
        >
          <MapPin size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-900">Konum icazəsi</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Sifarişinizə GPS əlavə olunsun — çatdırılma daha dəqiq olsun.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onAllow}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: theme }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              İcazə ver
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={loading}
              className="py-2 px-3 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Sonra
            </button>
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="shrink-0 p-1 text-slate-400 hover:text-slate-600 self-start" aria-label="Bağla">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const WebMenuItemModal = ({ selectedItem, selectedDetail, setSelectedDetail, itemQty, setItemQty, theme, onClose, onAdd }) => {
  if (!selectedItem) return null;
  const composition = selectedItem.description?.trim();
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
        {selectedItem.image && (
          <div className="mb-3 -mx-5 -mt-5 sm:mx-0 sm:mt-0 sm:rounded-t-2xl overflow-hidden h-40">
            <img src={storageUrl(selectedItem.image)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-slate-900 pr-2">{selectedItem.name}</h3>
          <button type="button" onClick={onClose} className="shrink-0 p-1"><X size={20} /></button>
        </div>
        {composition && (
          <div className="mb-4 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Tərkib</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{composition}</p>
          </div>
        )}
        {selectedItem.details?.length > 0 && (
          <div className="space-y-2 mb-4">
            {selectedItem.details.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDetail(d)}
                className={`w-full flex justify-between p-3 rounded-lg border text-sm ${
                  selectedDetail?.id === d.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
                }`}
              >
                <span>{d.count} {d.unit}</span>
                <span>{formatPrice(d.price)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-4 my-4">
          <button type="button" onClick={() => setItemQty((q) => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border"><Minus size={16} className="mx-auto" /></button>
          <span className="text-lg font-medium w-8 text-center">{itemQty}</span>
          <button type="button" onClick={() => setItemQty((q) => q + 1)} className="w-10 h-10 rounded-full text-white" style={{ background: theme }}><Plus size={16} className="mx-auto" /></button>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={selectedItem.details?.length > 0 && !selectedDetail}
          className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50"
          style={{ background: theme }}
        >
          Səbətə əlavə et
        </button>
      </div>
    </div>
  );
};

export const WebMenuCheckoutModal = ({
  checkoutOpen, setCheckoutOpen, cart, cartTotal, orderTotal, promoDiscount = 0,
  promoInput, setPromoInput, appliedPromo, promoLoading, promoError,
  onApplyPromo, onRemovePromo,
  theme, form, setForm,
  locStatus, locError, onRequestLocation,
  updateCartQty, removeFromCart, submitOrder, submitting,
  minOrderAmount = null, restaurantName = "",
}) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (checkoutOpen) {
      setStep(1);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  const locLoading = locStatus === "loading";
  const hasLocation = Boolean(form.latitude && form.longitude);
  const itemCount = cart.reduce((s, c) => s + c.quantity, 0);
  const minRequired = minOrderAmount ? Number(minOrderAmount) : 0;
  const meetsMinOrder = !minRequired || cartTotal >= minRequired;
  const hasContact = Boolean(form.name?.trim() && form.phone?.trim());
  const hasDelivery = Boolean(form.address?.trim() || hasLocation);
  const finalTotal = orderTotal ?? cartTotal;
  const hasPromo = promoDiscount > 0 && appliedPromo?.code;
  const canSubmit = hasContact && hasDelivery && meetsMinOrder && cart.length > 0;

  const clearLocation = () => {
    setForm((f) => ({ ...f, latitude: null, longitude: null, location_maps_url: "" }));
  };

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-200/80 bg-white";

  const steps = [
    { id: 1, label: "Səbət" },
    { id: 2, label: "Əlaqə" },
    { id: 3, label: "Çatdırılma" },
  ];

  const stepTitle = steps.find((s) => s.id === step)?.label || "Səbətiniz";

  const goBack = () => (step === 1 ? setCheckoutOpen(false) : setStep((s) => s - 1));

  const handleStep1Next = () => {
    if (!cart.length || !meetsMinOrder) return;
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!hasContact) return;
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] w-full">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 bg-white safe-top">
        <div className="flex items-center gap-2 px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={goBack}
            className="p-2 -ml-1 rounded-full hover:bg-slate-100 shrink-0"
            aria-label={step === 1 ? "Bağla" : "Geri"}
          >
            {step === 1 ? <X size={22} /> : <ChevronLeft size={24} />}
          </button>
          <div className="flex-1 min-w-0 text-center px-2">
            <h3 className="font-bold text-lg text-slate-900">{step === 1 ? "Səbətiniz" : stepTitle}</h3>
            <p className="text-xs text-slate-500 truncate">
              {step === 1 && `${itemCount} ədəd · ${formatPrice(cartTotal)}`}
              {step === 2 && "Ad və telefon"}
              {step === 3 && "Ünvan və qeyd"}
              {restaurantName && step === 1 ? ` · ${restaurantName}` : ""}
            </p>
          </div>
          <div className="w-10 shrink-0" aria-hidden />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-5 pb-3">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step > s.id ? "text-white" : step === s.id ? "text-white ring-2 ring-offset-2" : "bg-slate-100 text-slate-400"
                  }`}
                  style={step >= s.id ? { background: theme, ...(step === s.id ? { ringColor: theme } : {}) } : undefined}
                >
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <span className={`text-[10px] font-medium truncate w-full text-center ${step === s.id ? "text-slate-800" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-4 rounded ${step > s.id ? "" : "bg-slate-200"}`} style={step > s.id ? { background: theme } : undefined} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {step === 1 && (
          <div className="px-4 sm:px-6 py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
                <p>Səbət boşdur</p>
              </div>
            ) : (
              cart.map((c) => {
                const lineTotal = c.price * c.quantity;
                return (
                  <div key={c.key} className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    {c.image ? (
                      <img src={storageUrl(c.image)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-200 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base text-slate-900 leading-snug">{c.name}</div>
                      {c.detailLabel && <div className="text-sm text-slate-500 mt-0.5">{c.detailLabel}</div>}
                      <div className="text-sm text-slate-500 mt-2">{formatPrice(c.price)} × {c.quantity}</div>
                      <div className="text-base font-bold mt-1" style={{ color: theme }}>{formatPrice(lineTotal)}</div>
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button type="button" onClick={() => removeFromCart(c.key)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <button type="button" onClick={() => updateCartQty(c.key, -1)} className="p-2.5 rounded-l-xl"><Minus size={16} /></button>
                        <span className="text-base font-bold w-7 text-center tabular-nums">{c.quantity}</span>
                        <button type="button" onClick={() => updateCartQty(c.key, 1)} className="p-2.5 rounded-r-xl" style={{ color: theme }}><Plus size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {step === 2 && (
          <div className="px-4 sm:px-6 py-6 space-y-5 max-w-md mx-auto w-full">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3" style={{ color: theme }}>
                <User size={28} />
              </div>
              <p className="text-sm text-slate-600">Sifarişiniz üçün əlaqə məlumatlarını daxil edin</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-2"><User size={16} /> Ad, soyad *</label>
              <input
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Məs: Əli Məmmədov"
                autoComplete="name"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-2"><Phone size={16} /> Telefon *</label>
              <input
                required
                type="tel"
                inputMode="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="050 123 45 67"
                autoComplete="tel"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <form id="web-menu-order-form" onSubmit={submitOrder} className="px-4 sm:px-6 py-6 space-y-5 max-w-md mx-auto w-full">
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {hasLocation ? (
                <div className="flex items-start gap-3 p-4 bg-green-50 border-b border-green-100">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-900">Konum alındı</p>
                    <p className="text-xs text-green-700 mt-0.5">GPS sifarişə əlavə olunacaq</p>
                  </div>
                  <button type="button" onClick={clearLocation} className="text-xs text-red-600 shrink-0">Sil</button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border-b border-amber-100">
                  <p className="text-sm font-medium text-amber-900 mb-2">Konum tövsiyə olunur</p>
                  <button
                    type="button"
                    onClick={onRequestLocation}
                    disabled={locLoading}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                    style={{ background: theme }}
                  >
                    {locLoading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                    Konumumu paylaş
                  </button>
                </div>
              )}
              <div className="p-4 space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5"><MapPin size={16} /> Ünvan</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={hasLocation ? "Mənzil, giriş, zəng zəngi..." : "Küçə, bina, mənzil... (və ya konum paylaşın)"}
                />
                {locError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {locError}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Qeyd (istəyə bağlı)</label>
              <input className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Xüsusi istək..." />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Ticket size={16} className="text-indigo-600" />
                Promo kod
              </div>
              {appliedPromo?.code ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5">
                      <Tag size={14} />
                      {appliedPromo.code}
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Endirim: -{formatPrice(promoDiscount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRemovePromo}
                    className="text-xs font-medium text-red-600 shrink-0"
                  >
                    Sil
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className={inputClass + " flex-1 uppercase"}
                    value={promoInput || ""}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Məs: ENDIRIM10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onApplyPromo();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={onApplyPromo}
                    disabled={promoLoading || !promoInput?.trim()}
                    className="shrink-0 px-4 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                    style={{ background: theme }}
                  >
                    {promoLoading ? <Loader2 size={16} className="animate-spin" /> : "Tətbiq et"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {promoError}
                </p>
              )}
            </div>

            {/* Order summary compact */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-400">Sifariş xülasəsi</p>
              {cart.map((c) => (
                <div key={c.key} className="flex justify-between text-sm text-slate-700">
                  <span className="truncate pr-2">{c.quantity}× {c.name}</span>
                  <span className="font-medium shrink-0">{formatPrice(c.price * c.quantity)}</span>
                </div>
              ))}
              {hasPromo && (
                <>
                  <div className="flex justify-between text-sm text-slate-600 pt-1">
                    <span>Ara cəm</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Promo endirimi</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base" style={{ color: theme }}>
                <span>Cəmi</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
        {step === 1 && (
          <>
            <div className="flex justify-between items-center px-1">
              <span className="text-slate-600">Cəmi</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: theme }}>{formatPrice(cartTotal)}</span>
            </div>
            {!meetsMinOrder && minRequired > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertCircle size={14} /> Min. {formatPrice(minRequired)} (hazırda {formatPrice(cartTotal)})
              </p>
            )}
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={!cart.length || !meetsMinOrder}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-45 flex items-center justify-center gap-2"
              style={{ background: theme }}
            >
              Təsdiq et
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={handleStep2Next}
            disabled={!hasContact}
            className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-45 flex items-center justify-center gap-2"
            style={{ background: theme }}
          >
            Davam et
            <ChevronRight size={20} />
          </button>
        )}

        {step === 3 && (
          <>
            <div className="flex justify-between items-center px-1 text-sm">
              <span className="text-slate-600">Ödəniləcək</span>
              <span className="text-xl font-bold tabular-nums" style={{ color: theme }}>{formatPrice(finalTotal)}</span>
            </div>
            {!hasDelivery && (
              <p className="text-xs text-center text-slate-500">Ünvan və ya konum tələb olunur</p>
            )}
            <button
              type="submit"
              form="web-menu-order-form"
              disabled={submitting || !canSubmit}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-45 flex items-center justify-center gap-2"
              style={{ background: theme }}
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Göndərilir...
                </>
              ) : (
                <>Sifarişi göndər · {formatPrice(cartTotal)}</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
