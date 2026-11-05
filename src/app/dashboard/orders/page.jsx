"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Search,
  RefreshCw,
  Plus,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Clock3,
  Truck,
  AlertCircle,
  CheckCircle2,
  Store,
  Mail,
  Phone,
  CalendarDays,
  CreditCard,
  MapPin,
  FlaskConical,
  Package,
  Hash,
  Palette,
  Ruler,
  Layers3,
  CloudDownload,
} from "lucide-react";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  "all",
  "pending",
  "processing",
  "completed",
  "on-hold",
  "cancelled",
  "refunded",
  "failed",
];

const ORDER_TYPE_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "real", label: "Real Orders" },
  { value: "demo", label: "Demo Orders" },
];

const statusStyles = {
  pending: "bg-amber-500/10 text-amber-500",
  processing: "bg-blue-500/10 text-blue-500",
  completed: "bg-emerald-500/10 text-emerald-500",
  "on-hold": "bg-orange-500/10 text-orange-500",
  cancelled: "bg-red-500/10 text-red-500",
  refunded: "bg-purple-500/10 text-purple-500",
  failed: "bg-rose-500/10 text-rose-500",
};

const formatStatus = (status) =>
  String(status || "pending")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${currency || "USD"} ${value.toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const extractOrders = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  if (Array.isArray(data?.data)) return data.data;

  throw new Error("Unexpected orders API response");
};

const isDemoOrder = (order) =>
  order?.is_demo === true || order?.is_demo === "true";

export default function OrdersPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");

  const [syncStoreId, setSyncStoreId] = useState("");

  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStoreId, setDemoStoreId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cardClass = isDark
    ? "bg-[#172235] border-white/10"
    : "bg-white border-slate-200 shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = isDark
    ? "bg-[#0f1726] border-white/10 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  const secondaryClass = isDark
    ? "border-white/10 text-slate-300 hover:bg-white/5"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  const connectedWooStores = useMemo(
    () =>
      stores.filter(
        (store) =>
          store.status === "connected" &&
          store.platform?.toLowerCase() === "woocommerce",
      ),
    [stores],
  );

  const demoStores = useMemo(
    () => stores.filter((store) => store.status !== "connected"),
    [stores],
  );

  const handleApiError = useCallback(
    (err, fallback) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      setError(err.response?.data?.message || err.message || fallback);
    },
    [router],
  );

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to fetch orders");
      }

      setOrders(extractOrders(response.data));
    } catch (err) {
      handleApiError(err, "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await api.get("/stores");

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to load stores");
      }

      const list = Array.isArray(response.data?.stores)
        ? response.data.stores
        : Array.isArray(response.data?.data?.stores)
          ? response.data.data.stores
          : [];

      setStores(list);

      const connected = list.filter(
        (store) =>
          store.status === "connected" &&
          store.platform?.toLowerCase() === "woocommerce",
      );

      setSyncStoreId((current) => {
        if (
          current &&
          connected.some((store) => String(store.id) === current)
        ) {
          return current;
        }

        return connected.length ? String(connected[0].id) : "";
      });
    } catch (err) {
      handleApiError(err, "Failed to load stores");
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchOrders();
    fetchStores();
  }, [fetchOrders, fetchStores]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, storeFilter, orderTypeFilter]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !generating && !syncing) {
        setSelectedOrder(null);
        setShowDemoModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [generating, syncing]);

  // Sync real WooCommerce orders.
  const handleSyncWooCommerce = async () => {
    if (!syncStoreId) {
      setError("Please select a connected WooCommerce store.");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      const response = await api.post("/orders/sync-woocommerce", {
        store_id: Number(syncStoreId),
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "WooCommerce sync failed");
      }

      const summary = response.data?.summary || {};

      setSuccess(
        `WooCommerce sync completed! ${summary.totalFetched ?? 0} orders fetched, ${summary.insertedOrders ?? 0} new orders added, and ${summary.updatedOrders ?? 0} existing orders updated.`,
      );

      await fetchOrders();
    } catch (err) {
      handleApiError(err, "Failed to sync WooCommerce orders");
    } finally {
      setSyncing(false);
    }
  };

  const openDemoModal = () => {
    setError("");
    setDemoStoreId(demoStores.length ? String(demoStores[0].id) : "");
    setShowDemoModal(true);
  };

  const handleGenerateDemo = async (e) => {
    e.preventDefault();

    if (!demoStoreId) {
      setError("Please select a disconnected store.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const response = await api.post("/orders/demo", {
        store_id: demoStoreId,
      });

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Failed to generate demo orders",
        );
      }

      setShowDemoModal(false);

      setSuccess(
        response.data?.message || "Demo orders generated successfully",
      );

      await fetchOrders();
    } catch (err) {
      handleApiError(err, "Failed to generate demo orders");
    } finally {
      setGenerating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesSearch = [
        order.order_number,
        order.customer_name,
        order.customer_email,
        order.store_name,
        order.customer_phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword),
      );

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesStore =
        storeFilter === "all" || String(order.store_id) === storeFilter;

      const demo = isDemoOrder(order);

      const matchesOrderType =
        orderTypeFilter === "all" ||
        (orderTypeFilter === "demo" && demo) ||
        (orderTypeFilter === "real" && !demo);

      return matchesSearch && matchesStatus && matchesStore && matchesOrderType;
    });
  }, [orders, search, statusFilter, storeFilter, orderTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const demoOrdersCount = orders.filter(isDemoOrder).length;
  const realOrdersCount = orders.length - demoOrdersCount;

  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "processing",
  ).length;

  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingBag,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Completed",
      value: completedOrders,
      icon: PackageCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Processing",
      value: processingOrders,
      icon: Truck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Pending",
      value: pendingOrders,
      icon: Clock3,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const selectedOrderItems = Array.isArray(selectedOrder?.items)
    ? selectedOrder.items
    : [];

  const formatVariation = (variation) => {
    if (!variation) return [];

    if (typeof variation === "string") {
      try {
        variation = JSON.parse(variation);
      } catch {
        return [];
      }
    }

    if (typeof variation !== "object" || Array.isArray(variation)) {
      return [];
    }

    return Object.entries(variation).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-sm ${mutedClass}`}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-semibold tracking-widest text-cyan-500 mb-2">
            ORDER MANAGEMENT
          </p>

          <h1 className={`text-3xl font-bold ${titleClass}`}>Orders</h1>

          <p className={`text-sm mt-2 ${mutedClass}`}>
            Monitor real and demo customer orders across your stores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* WooCommerce Store Selector */}
          <select
            value={syncStoreId}
            onChange={(e) => setSyncStoreId(e.target.value)}
            disabled={syncing || connectedWooStores.length === 0}
            aria-label="Select WooCommerce store to sync"
            className={`border rounded-xl px-4 py-3 text-sm outline-none min-w-[190px] ${inputClass}`}
          >
            <option value="">Select WooCommerce Store</option>

            {connectedWooStores.map((store) => (
              <option key={store.id} value={String(store.id)}>
                {store.store_name}
              </option>
            ))}
          </select>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncWooCommerce}
            disabled={syncing || loading || !syncStoreId}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <CloudDownload size={17} />
            )}

            {syncing ? "Syncing..." : "Sync WooCommerce"}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading || syncing}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm disabled:opacity-50 ${secondaryClass}`}
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Generate Demo */}
          <button
            type="button"
            onClick={openDemoModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm"
          >
            <Plus size={18} />
            Generate Demo Orders
          </button>
        </div>
      </div>

      {/* Connected Store Information */}
      {connectedWooStores.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <AlertCircle size={19} className="shrink-0 mt-0.5" />

          <div>
            <p className="text-sm font-semibold">
              No connected WooCommerce store
            </p>

            <p className="text-xs mt-1">
              Connect your WooCommerce store before syncing real orders.
            </p>

            <Link
              href="/dashboard/stores"
              className="inline-flex items-center gap-1 mt-2 text-sm font-semibold underline"
            >
              <Store size={15} />
              Connect Store
            </Link>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-400"
        >
          <AlertCircle size={19} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Real and Demo Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`rounded-2xl border p-5 flex items-center justify-between ${cardClass}`}
        >
          <div>
            <p className={`text-sm ${mutedClass}`}>Real WooCommerce Orders</p>
            <h3 className={`text-3xl font-bold mt-2 ${titleClass}`}>
              {loading && orders.length === 0 ? "..." : realOrdersCount}
            </h3>
            <p className="text-xs text-emerald-500 mt-2">
              Imported from connected stores
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10">
            <Store size={25} className="text-emerald-500" />
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 flex items-center justify-between ${cardClass}`}
        >
          <div>
            <p className={`text-sm ${mutedClass}`}>Demo Orders</p>
            <h3 className={`text-3xl font-bold mt-2 ${titleClass}`}>
              {loading && orders.length === 0 ? "..." : demoOrdersCount}
            </h3>
            <p className="text-xs text-violet-500 mt-2">
              Sample orders for testing
            </p>
          </div>

          <div className="p-4 rounded-xl bg-violet-500/10">
            <FlaskConical size={25} className="text-violet-500" />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`rounded-2xl border p-5 ${cardClass}`}
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.bg}`}>
                <Icon size={21} className={stat.color} />
              </div>

              <p className={`text-sm mt-4 ${mutedClass}`}>{stat.title}</p>

              <h3 className={`text-3xl font-bold mt-1 ${titleClass}`}>
                {loading && orders.length === 0 ? "..." : stat.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-5 ${cardClass}`}>
        <div className="mb-4">
          <h2 className={`text-base font-semibold ${titleClass}`}>
            Filter Orders
          </h2>

          <p className={`text-xs mt-1 ${mutedClass}`}>
            Search and filter real or demo orders.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div
            className={`flex items-center gap-3 border rounded-xl px-4 flex-1 ${inputClass}`}
          >
            <Search size={18} className={mutedClass} />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, customer, email..."
              aria-label="Search orders"
              className="w-full bg-transparent outline-none py-3 text-sm"
            />
          </div>

          {/* Order Type Filter */}
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            aria-label="Filter by order type"
            className={`border rounded-xl px-4 py-3 text-sm outline-none ${inputClass}`}
          >
            {ORDER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Store Filter */}
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            aria-label="Filter by store"
            className={`border rounded-xl px-4 py-3 text-sm outline-none ${inputClass}`}
          >
            <option value="all">All Stores</option>

            {stores.map((store) => (
              <option key={store.id} value={String(store.id)}>
                {store.store_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className={`border rounded-xl px-4 py-3 text-sm outline-none ${inputClass}`}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Statuses" : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-2xl border overflow-hidden ${cardClass}`}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${titleClass}`}>
              {orderTypeFilter === "all"
                ? "All Orders"
                : orderTypeFilter === "real"
                  ? "Real WooCommerce Orders"
                  : "Demo Orders"}
            </h2>

            <p className={`text-xs mt-1 ${mutedClass}`}>
              {filteredOrders.length} matching orders
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-emerald-500/10 text-emerald-500">
              <Store size={13} />
              {realOrdersCount} Real
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-violet-500/10 text-violet-500">
              <FlaskConical size={13} />
              {demoOrdersCount} Demo
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[950px]">
            <thead
              className={
                isDark
                  ? "bg-white/5 text-slate-400"
                  : "bg-slate-50 text-slate-500"
              }
            >
              <tr className="text-xs uppercase tracking-wide">
                <th className="px-5 py-4 font-medium">Order</th>
                <th className="px-5 py-4 font-medium">Type</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Store</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`text-center py-16 ${mutedClass}`}>
                    <RefreshCw
                      size={25}
                      className="animate-spin mx-auto mb-3 text-cyan-500"
                    />
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <ShoppingBag
                      size={38}
                      className="text-cyan-500 mx-auto mb-3"
                    />

                    <p className={`font-semibold ${titleClass}`}>
                      No orders found
                    </p>

                    <p className={`text-sm mt-2 ${mutedClass}`}>
                      Try changing your filters or sync your WooCommerce orders.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const demo = isDemoOrder(order);

                  return (
                    <tr
                      key={order.id}
                      className={`border-t ${
                        isDark
                          ? "border-white/5 hover:bg-white/[0.03]"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className={`text-sm font-semibold ${titleClass}`}>
                          #{order.order_number}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {demo ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1.5 bg-violet-500/10 text-violet-500">
                            <FlaskConical size={13} />
                            DEMO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-3 py-1.5 bg-emerald-500/10 text-emerald-500">
                            <Store size={13} />
                            REAL
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className={`text-sm font-medium ${titleClass}`}>
                          {order.customer_name || "—"}
                        </p>

                        <p className={`text-xs mt-1 ${mutedClass}`}>
                          {order.customer_email || "—"}
                        </p>
                      </td>

                      <td className={`px-5 py-4 text-sm ${mutedClass}`}>
                        {order.store_name || "—"}
                      </td>

                      <td
                        className={`px-5 py-4 text-sm font-semibold ${titleClass}`}
                      >
                        {formatMoney(order.total_amount, order.currency)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
                            statusStyles[order.status] ||
                            "bg-slate-500/10 text-slate-500"
                          }`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>

                      <td className={`px-5 py-4 text-sm ${mutedClass}`}>
                        {formatDate(order.order_date)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 text-cyan-500 hover:text-cyan-400 text-sm font-medium"
                        >
                          <Eye size={17} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className={`flex flex-col sm:flex-row justify-between items-center gap-4 border-t p-5 ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <p className={`text-sm ${mutedClass}`}>
            {filteredOrders.length === 0
              ? "Showing 0 orders"
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safePage * PAGE_SIZE,
                  filteredOrders.length,
                )} of ${filteredOrders.length}`}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              aria-label="Previous page"
              className={`p-2 border rounded-lg disabled:opacity-40 ${secondaryClass}`}
            >
              <ChevronLeft size={18} />
            </button>

            <span className={`text-sm ${titleClass}`}>
              {safePage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              aria-label="Next page"
              className={`p-2 border rounded-lg disabled:opacity-40 ${secondaryClass}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Generate Demo Modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !generating) {
              setShowDemoModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${cardClass}`}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                id="demo-modal-title"
                className={`text-xl font-semibold ${titleClass}`}
              >
                Generate Demo Orders
              </h2>

              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                disabled={generating}
                aria-label="Close"
                className={mutedClass}
              >
                <X size={21} />
              </button>
            </div>

            <p className={`text-sm mb-5 ${mutedClass}`}>
              Select a disconnected store to generate 12 sample orders for
              testing.
            </p>

            {demoStores.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-500">
                  No disconnected stores available.
                </p>

                <Link
                  href="/dashboard/stores"
                  className="inline-flex items-center gap-2 text-cyan-500 text-sm font-medium"
                >
                  <Store size={17} />
                  Go to Stores
                </Link>
              </div>
            ) : (
              <form onSubmit={handleGenerateDemo} className="space-y-5">
                <div>
                  <label
                    htmlFor="demo-store"
                    className={`block text-sm mb-2 ${titleClass}`}
                  >
                    Select Store
                  </label>

                  <select
                    id="demo-store"
                    required
                    value={demoStoreId}
                    onChange={(e) => setDemoStoreId(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 outline-none ${inputClass}`}
                  >
                    {demoStores.map((store) => (
                      <option key={store.id} value={String(store.id)}>
                        {store.store_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/10 text-violet-500 text-xs">
                  <FlaskConical size={17} className="shrink-0" />
                  These are sample orders, not real WooCommerce purchases.
                  Existing demo orders will not be duplicated.
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl disabled:opacity-50"
                >
                  {generating ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}

                  {generating ? "Generating..." : "Generate 12 Demo Orders"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-details-title"
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${cardClass}`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <p className="text-xs text-cyan-500 font-semibold mb-2">
                  ORDER DETAILS
                </p>

                <h2
                  id="order-details-title"
                  className={`text-xl font-bold ${titleClass}`}
                >
                  Order #{selectedOrder.order_number}
                </h2>

                {isDemoOrder(selectedOrder) ? (
                  <span className="inline-flex items-center gap-1 text-xs text-violet-500 mt-2">
                    <FlaskSinchIcon />
                    Demo Order
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-500 mt-2">
                    <Store size={14} />
                    Real WooCommerce Order
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close"
                className={mutedClass}
              >
                <X size={22} />
              </button>
            </div>

            {/* Order Information */}
            <div className="space-y-4">
              {[
                {
                  icon: Store,
                  label: "Store",
                  value: selectedOrder.store_name,
                },
                {
                  icon: ShoppingBag,
                  label: "Order Status",
                  value: formatStatus(selectedOrder.status),
                },
                {
                  icon: Mail,
                  label: "Customer",
                  value: `${selectedOrder.customer_name || "—"} ${
                    selectedOrder.customer_email
                      ? `(${selectedOrder.customer_email})`
                      : ""
                  }`,
                },
                {
                  icon: Phone,
                  label: "Phone",
                  value: selectedOrder.customer_phone,
                },
                {
                  icon: CreditCard,
                  label: "Payment Method",
                  value: selectedOrder.payment_method,
                },
                {
                  icon: MapPin,
                  label: "Shipping Address",
                  value: selectedOrder.shipping_address,
                },
                {
                  icon: CalendarDays,
                  label: "Order Date",
                  value: formatDate(selectedOrder.order_date),
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`flex items-start gap-3 border-b pb-3 ${
                      isDark ? "border-white/10" : "border-slate-100"
                    }`}
                  >
                    <Icon size={18} className="text-cyan-500 mt-1 shrink-0" />

                    <div className="min-w-0">
                      <p className={`text-xs ${mutedClass}`}>{item.label}</p>

                      <p
                        className={`text-sm font-medium mt-1 break-words ${titleClass}`}
                      >
                        {item.value || "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Products */}
            <div className="mt-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-base font-bold ${titleClass}`}>
                    Order Products
                  </h3>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Products included in this order
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-500 text-xs font-semibold">
                  {selectedOrderItems.length}{" "}
                  {selectedOrderItems.length === 1 ? "Product" : "Products"}
                </span>
              </div>

              {selectedOrderItems.length === 0 ? (
                <div
                  className={`rounded-xl border border-dashed p-7 text-center ${
                    isDark ? "border-white/10" : "border-slate-200"
                  }`}
                >
                  <Package size={32} className="mx-auto mb-3 text-slate-400" />

                  <p className={`text-sm font-medium ${titleClass}`}>
                    No product details available
                  </p>

                  <p className={`text-xs mt-1 ${mutedClass}`}>
                    Product information has not been added to this order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedOrderItems.map((product, index) => {
                    const variationEntries = formatVariation(product.variation);

                    return (
                      <div
                        key={product.id || `${product.product_sku}-${index}`}
                        className={`rounded-xl border p-3 sm:p-4 ${
                          isDark
                            ? "border-white/10 bg-[#0f1726]/70"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Product Image */}
                          <div
                            className={`w-full sm:w-24 h-40 sm:h-24 rounded-xl shrink-0 overflow-hidden flex items-center justify-center ${
                              isDark ? "bg-white/5" : "bg-slate-200/70"
                            }`}
                          >
                            {product.product_image ? (
                              <img
                                src={product.product_image}
                                alt={product.product_name || "Product"}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.parentElement
                                    ?.querySelector(".image-fallback")
                                    ?.classList.remove("hidden");
                                }}
                              />
                            ) : null}

                            <div
                              className={`image-fallback ${
                                product.product_image ? "hidden" : ""
                              } flex flex-col items-center justify-center gap-2 text-slate-400`}
                            >
                              <Package size={28} />
                              <span className="text-[10px]">No Image</span>
                            </div>
                          </div>

                          {/* Product Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="min-w-0">
                                <h4
                                  className={`text-sm font-bold break-words ${titleClass}`}
                                >
                                  {product.product_name || "Unnamed Product"}
                                </h4>

                                <p
                                  className={`text-xs mt-1 flex items-center gap-1 ${mutedClass}`}
                                >
                                  <Hash size={12} />
                                  SKU: {product.product_sku || "—"}
                                </p>
                              </div>

                              <p className="text-sm font-bold text-cyan-500 shrink-0">
                                {formatMoney(
                                  product.unit_price,
                                  selectedOrder.currency,
                                )}
                              </p>
                            </div>

                            {/* Quantity, Color, Size */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                                  isDark
                                    ? "bg-white/5 text-slate-300"
                                    : "bg-white text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Package size={13} />
                                Qty: {product.quantity ?? 1}
                              </span>

                              {product.color && (
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                                    isDark
                                      ? "bg-white/5 text-slate-300"
                                      : "bg-white text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  <Palette size={13} />
                                  {product.color}
                                </span>
                              )}

                              {product.size && (
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                                    isDark
                                      ? "bg-white/5 text-slate-300"
                                      : "bg-white text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  <Ruler size={13} />
                                  Size: {product.size}
                                </span>
                              )}
                            </div>

                            {/* Additional Variation Details */}
                            {variationEntries.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-500/10">
                                <p
                                  className={`text-[11px] font-semibold mb-2 flex items-center gap-1 ${mutedClass}`}
                                >
                                  <Layers3 size={12} />
                                  Additional Details
                                </p>

                                <div className="flex flex-wrap gap-2">
                                  {variationEntries.map(([key, value]) => (
                                    <span
                                      key={key}
                                      className={`text-[11px] rounded-md px-2 py-1 ${
                                        isDark
                                          ? "bg-white/5 text-slate-400"
                                          : "bg-white text-slate-500 border border-slate-200"
                                      }`}
                                    >
                                      {formatStatus(key)}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Total */}
            <div
              className={`rounded-xl p-4 mt-5 flex justify-between items-center ${
                isDark ? "bg-white/5" : "bg-slate-50"
              }`}
            >
              <div>
                <p className={`text-sm ${mutedClass}`}>Total Amount</p>
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  {selectedOrderItems.length}{" "}
                  {selectedOrderItems.length === 1 ? "product" : "products"} in
                  this order
                </p>
              </div>

              <span className={`text-xl font-bold ${titleClass}`}>
                {formatMoney(
                  selectedOrder.total_amount,
                  selectedOrder.currency,
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlaskSinchIcon() {
  return <FlaskConical size={14} />;
}
