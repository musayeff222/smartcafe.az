import React, { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Banknote,
  Calendar,
  LayoutGrid,
  Moon,
  RefreshCw,
  ShoppingCart,
  Sun,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  ChefHat,
  BarChart3,
} from "lucide-react";
import { pageTitle } from "../config/branding";
import { dashboardApi } from "../api/dashboardApi";
import { useTheme } from "../context/ThemeContext";
import { dashboardShell } from "../components/dashboard/dashboardTheme";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import StatCard from "../components/dashboard/StatCard";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import ChartsSection from "../components/dashboard/ChartsSection";
import LiveStatusSection from "../components/dashboard/LiveStatusSection";
import RecentOrdersSection from "../components/dashboard/RecentOrdersSection";
import TopProductsSection from "../components/dashboard/TopProductsSection";
import StaffSection from "../components/dashboard/StaffSection";
import FinanceSection from "../components/dashboard/FinanceSection";
import AlertsSection from "../components/dashboard/AlertsSection";

const REFRESH_MS = 45000;

export default function RestaurantDashboard() {
  const { isDark, toggle } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = { filter };
      if (filter === "custom" && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      }
      const res = await dashboardApi.fetch(params);
      setData(res.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, customFrom, customTo]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const cards = data?.cards || {};

  if (loading && !data) {
    return (
      <div className={dashboardShell(isDark)}>
        <DashboardSkeleton isDark={isDark} />
      </div>
    );
  }

  return (
    <div className={dashboardShell(isDark)}>
      <Helmet>
        <title>{pageTitle("Ana Panel")}</title>
      </Helmet>

      <div className="max-w-[1600px] mx-auto p-3 sm:p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {lastRefresh && (
            <span className={`text-xs mr-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Son yenilənmə: {lastRefresh.toLocaleTimeString("az-AZ")}
            </span>
          )}
          <button
            type="button"
            onClick={() => load()}
            className={`p-2 rounded-xl border transition ${
              isDark
                ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            title="Yenilə">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={toggle}
            className={`p-2 rounded-xl border transition ${
              isDark
                ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            aria-label="Tema">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <DashboardFilters
          filter={filter}
          setFilter={setFilter}
          customFrom={customFrom}
          setCustomFrom={setCustomFrom}
          customTo={customTo}
          setCustomTo={setCustomTo}
          onApply={load}
          isDark={isDark}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          <StatCard title="Günlük satış" icon={TrendingUp} card={cards.daily_sales} isDark={isDark} />
          <StatCard title="Həftəlik satış" icon={BarChart3} card={cards.weekly_sales} isDark={isDark} />
          <StatCard title="Aylıq satış" icon={Calendar} card={cards.monthly_sales} isDark={isDark} />
          <StatCard title="Bugünkü sifariş" icon={ShoppingCart} card={cards.today_orders} isDark={isDark} format="count" suffix="" />
          <StatCard title="Aktiv masalar" icon={LayoutGrid} card={cards.active_tables} isDark={isDark} format="count" suffix="" />
          <StatCard title="Boş masalar" icon={UtensilsCrossed} card={cards.empty_tables} isDark={isDark} format="count" suffix="" />
          <StatCard title="Mətbəx gözləyən" icon={ChefHat} card={cards.kitchen_pending} isDark={isDark} format="count" suffix="" />
          <StatCard title="Günlük qazanc" icon={Wallet} card={cards.daily_profit} isDark={isDark} />
          <StatCard title="Günlük xərc" icon={Banknote} card={cards.daily_expense} isDark={isDark} />
          <StatCard title="Xalis qazanc" icon={TrendingUp} card={cards.net_profit} isDark={isDark} />
          <StatCard title="Aylıq gəlir" icon={BarChart3} card={cards.monthly_revenue} isDark={isDark} />
          <StatCard title="Müştərilər" icon={Users} card={cards.total_customers} isDark={isDark} format="count" suffix="" />
        </div>

        <ChartsSection charts={data?.charts} isDark={isDark} />

        <div className="grid xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <LiveStatusSection live={data?.live} delivery={data?.delivery} isDark={isDark} />
          </div>
          <AlertsSection alerts={data?.alerts} isDark={isDark} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <RecentOrdersSection orders={data?.recent_orders} isDark={isDark} />
          <TopProductsSection products={data?.charts?.top_products} isDark={isDark} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <StaffSection staff={data?.staff} isDark={isDark} />
          <FinanceSection finance={data?.finance} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
