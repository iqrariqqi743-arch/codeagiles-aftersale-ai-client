"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTheme } from "@/context/ThemeProvider";
import {
  RotateCcw,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  Wallet,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Store,
  User,
  Mail,
  CalendarDays,
  FileText,
  Filter,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

const RETURN_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "received",
  "completed",
  "cancelled",
];

const REFUND_STATUSES = [
  "not_started",
  "pending",
  "processing",
  "completed",
  "failed",
];

const REQUEST_TYPES = ["return", "exchange", "refund"];

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const formatMoney = (amount, currency = "USD") => {
  const number = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(number);
  } catch {
    return `${currency} ${number.toFixed(2)}`;
  }
};

const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const EMPTY_FORM = {
  store_id: "",
  order_id: "",
  ticket_id: "",
  customer_name: "",
  customer_email: "",
  reason: "",
  description: "",
  request_type: "return",
  refund_amount: "0",
};

const RETURN_TRANSITIONS = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["received", "completed", "cancelled"],
  received: ["completed"],
  rejected: [],
  completed: [],
  cancelled: [],
};

const REFUND_TRANSITIONS = {
  not_started: ["pending"],
  pending: ["processing", "failed"],
  processing: ["completed", "failed"],
  failed: ["pending"],
  completed: [],
};

export default function ReturnsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [returns, setReturns] = useState([]);
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [notes, setNotes] = useState("");

  const panel = isDark
    ? "border-white/10 bg-[#111827]"
    : "border-slate-200 bg-white";

  const muted = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${
    isDark
      ? "border-white/10 bg-[#0b1220] text-white placeholder:text-slate-500"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
  }`;

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:opacity-40 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;

  const handleError = useCallback(
    (err, fallback) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      setError(getMessage(err, fallback));
    },
    [router],
  );

  // Fetch all return requests
  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/returns");

      setReturns(
        Array.isArray(response.data?.returns) ? response.data.returns : [],
      );
    } catch (err) {
      handleError(err, "Failed to fetch returns");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Fetch stores, orders and tickets
  const fetchDependencies = useCallback(async () => {
    const requests = await Promise.allSettled([
      api.get("/stores"),
      api.get("/orders"),
      api.get("/tickets"),
    ]);

    const readList = (result, key) => {
      if (result.status !== "fulfilled") return [];

      const data = result.value.data;

      const list = Array.isArray(data) ? data : data?.[key] || data?.data || [];

      return Array.isArray(list) ? list : [];
    };

    setStores(readList(requests[0], "stores"));
    setOrders(readList(requests[1], "orders"));
    setTickets(readList(requests[2], "tickets"));

    const unauthorized = requests.find(
      (result) =>
        result.status === "rejected" && result.reason?.response?.status === 401,
    );

    if (unauthorized) {
      handleError(unauthorized.reason, "Session expired");
    }
  }, [handleError]);

  useEffect(() => {
    fetchReturns();
    fetchDependencies();
  }, [fetchReturns, fetchDependencies]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, storeFilter]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: returns.length,

      pending: returns.filter((r) => r.status === "pending").length,

      approved: returns.filter(
        (r) => r.status === "approved" || r.status === "received",
      ).length,

      completed: returns.filter((r) => r.status === "completed").length,
    }),
    [returns],
  );

  // Search and filters
  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return returns.filter((item) => {
      const content = [
        item.return_number,
        item.customer_name,
        item.customer_email,
        item.order_number,
        item.ticket_number,
        item.store_name,
        item.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || content.includes(keyword)) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (typeFilter === "all" || item.request_type === typeFilter) &&
        (storeFilter === "all" || String(item.store_id) === storeFilter)
      );
    });
  }, [returns, search, statusFilter, typeFilter, storeFilter]);

  // Pagination
  const perPage = 8;

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const currentPage = Math.min(page, totalPages);

  const visibleReturns = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // Available orders according to selected store
  const availableOrders = useMemo(
    () =>
      orders.filter(
        (order) => String(order.store_id) === String(form.store_id),
      ),
    [orders, form.store_id],
  );

  // Available tickets according to selected store and order
  const availableTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          String(ticket.store_id) === String(form.store_id) &&
          String(ticket.order_id) === String(form.order_id),
      ),
    [tickets, form.store_id, form.order_id],
  );

  const selectedOrder = availableOrders.find(
    (order) => String(order.id) === String(form.order_id),
  );

  // Status badge
  const statusBadge = (status) => {
    const styles = {
      pending: "bg-amber-500/10 text-amber-500",
      approved: "bg-blue-500/10 text-blue-500",
      rejected: "bg-red-500/10 text-red-500",
      received: "bg-violet-500/10 text-violet-500",
      completed: "bg-emerald-500/10 text-emerald-500",
      cancelled: "bg-slate-500/10 text-slate-400",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          styles[status] || styles.pending
        }`}
      >
        {formatLabel(status)}
      </span>
    );
  };

  // Refund badge
  const refundBadge = (status) => {
    const styles = {
      not_started: "bg-slate-500/10 text-slate-400",
      pending: "bg-amber-500/10 text-amber-500",
      processing: "bg-blue-500/10 text-blue-500",
      completed: "bg-emerald-500/10 text-emerald-500",
      failed: "bg-red-500/10 text-red-500",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          styles[status] || styles.not_started
        }`}
      >
        {formatLabel(status)}
      </span>
    );
  };

  // FIX: Fetch full joined return details
  const fetchReturnDetails = async (id) => {
    const response = await api.get(`/returns/${id}`);

    const item = response.data?.return_request;

    if (!item) {
      throw new Error("Return request details not found");
    }

    setSelectedReturn(item);
    setNotes(item.admin_notes || "");

    return item;
  };

  // Open return details
  const openDetails = async (id) => {
    try {
      setShowDetails(true);
      setDetailsLoading(true);
      setSelectedReturn(null);
      setError("");

      await fetchReturnDetails(id);
    } catch (err) {
      handleError(err, "Failed to load return details");
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Create return request
  const createReturn = async (event) => {
    event.preventDefault();

    if (
      !form.store_id ||
      !form.order_id ||
      !form.customer_name.trim() ||
      !form.reason.trim()
    ) {
      setError("Please complete all required fields");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = {
        ...form,
        store_id: form.store_id,
        order_id: form.order_id,
        ticket_id: form.ticket_id || null,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        reason: form.reason.trim(),
        description: form.description.trim(),
        refund_amount:
          form.request_type === "exchange" ? 0 : Number(form.refund_amount),
      };

      const response = await api.post("/returns", payload);

      if (response.data?.success) {
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setNotice("Return request created successfully");

        await fetchReturns();
      }
    } catch (err) {
      handleError(err, "Failed to create return");
    } finally {
      setSaving(false);
    }
  };

  // Update return status
  const updateStatus = async (status) => {
    if (!selectedReturn) return;

    const returnId = selectedReturn.id;

    try {
      setUpdating(true);
      setError("");
      setNotice("");

      const response = await api.patch(`/returns/${returnId}/status`, {
        status,
        admin_notes: notes,
      });

      if (response.data?.success) {
        // FIX: Fetch full joined details instead of using raw RETURNING *
        await Promise.all([fetchReturnDetails(returnId), fetchReturns()]);

        setNotice("Return status updated successfully");
      }
    } catch (err) {
      handleError(err, "Failed to update return status");
    } finally {
      setUpdating(false);
    }
  };

  // Save internal notes
  const saveNotes = async () => {
    if (!selectedReturn) return;

    await updateStatus(selectedReturn.status);
  };

  // Update refund tracking
  const updateRefund = async (refund_status) => {
    if (!selectedReturn) return;

    const returnId = selectedReturn.id;

    try {
      setUpdating(true);
      setError("");
      setNotice("");

      const response = await api.patch(`/returns/${returnId}/refund`, {
        refund_status,
      });

      if (response.data?.success) {
        // FIX: Fetch full joined details instead of using raw RETURNING *
        await Promise.all([fetchReturnDetails(returnId), fetchReturns()]);

        setNotice("Refund tracking updated. No actual payment was executed.");
      }
    } catch (err) {
      handleError(err, "Failed to update refund tracking");
    } finally {
      setUpdating(false);
    }
  };

  // Statistics cards
  const cards = [
    {
      label: "Total Requests",
      value: stats.total,
      icon: RotateCcw,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: Clock3,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Approved / Received",
      value: stats.approved,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div
      className={`min-h-screen space-y-6 p-4 md:p-6 ${
        isDark ? "text-white" : "text-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-indigo-500">
            <RotateCcw size={15} />
            AFTER-SALES OPERATIONS
          </p>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Returns & Refunds
          </h1>

          <p className={`mt-1 text-sm ${muted}`}>
            Review returns, manage approvals and track refund progress.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              fetchReturns();
              fetchDependencies();
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              setForm(EMPTY_FORM);
              setError("");
              setShowCreate(true);
            }}
          >
            <Plus size={17} />
            New Return
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className={`rounded-2xl border p-5 ${panel}`}>
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${card.bg}`}>
                  <Icon size={21} className={card.color} />
                </div>

                <span className={`text-xs ${muted}`}>Overview</span>
              </div>

              <p className={`mt-5 text-sm ${muted}`}>{card.label}</p>

              <h2 className="mt-1 text-3xl font-bold">{card.value}</h2>
            </div>
          );
        })}
      </div>

      {/* Returns Table */}
      <div className={`overflow-hidden rounded-2xl border ${panel}`}>
        <div className="border-b border-slate-500/10 p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Filter size={17} className="text-indigo-500" />
            All Return Requests
          </h2>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={17}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
              />

              <input
                className={`${inputClass} pl-10`}
                placeholder="Search returns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className={inputClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>

              {RETURN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Request Types</option>

              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="all">All Stores</option>

              {stores.map((store) => (
                <option key={store.id} value={String(store.id)}>
                  {store.store_name || store.name || `Store #${store.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div className="mx-5 mt-5 flex items-center justify-between rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">
            <span>{notice}</span>

            <button type="button" onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && !showCreate && !showDetails && (
          <div className="mx-5 mt-5 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead
              className={
                isDark
                  ? "bg-white/[0.03] text-slate-400"
                  : "bg-slate-50 text-slate-500"
              }
            >
              <tr>
                {[
                  "Return",
                  "Customer",
                  "Store / Order",
                  "Type",
                  "Amount",
                  "Status",
                  "Refund",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-semibold uppercase tracking-wider"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-indigo-500"
                    />

                    <p className={`mt-3 text-sm ${muted}`}>
                      Loading returns...
                    </p>
                  </td>
                </tr>
              ) : visibleReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <RotateCcw size={35} className={`mx-auto ${muted}`} />

                    <p className="mt-3 font-semibold">
                      No return requests found
                    </p>

                    <p className={`mt-1 text-sm ${muted}`}>
                      Create a return or adjust your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                visibleReturns.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t ${
                      isDark
                        ? "border-white/5 hover:bg-white/[0.03]"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold">{item.return_number}</p>

                      <p className={`mt-1 text-xs ${muted}`}>
                        {formatDate(item.created_at)}
                      </p>

                      {item.is_demo && (
                        <span className="mt-2 inline-flex rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-500">
                          DEMO
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">{item.customer_name}</p>

                      <p className={`mt-1 text-xs ${muted}`}>
                        {item.customer_email || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p>{item.store_name}</p>

                      <p className={`mt-1 text-xs ${muted}`}>
                        Order #{item.order_number}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {formatLabel(item.request_type)}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {formatMoney(item.refund_amount, item.currency)}
                    </td>

                    <td className="px-5 py-4">{statusBadge(item.status)}</td>

                    <td className="px-5 py-4">
                      {refundBadge(item.refund_status)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openDetails(item.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-500/10 px-5 py-4 sm:flex-row">
          <p className={`text-xs ${muted}`}>
            Showing {filtered.length ? (currentPage - 1) * perPage + 1 : 0}
            {" - "}
            {Math.min(currentPage * perPage, filtered.length)} of{" "}
            {filtered.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={secondaryButton}
            >
              <ChevronLeft size={16} />
            </button>

            <span className={`px-2 text-xs ${muted}`}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={secondaryButton}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Return Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl md:p-7 ${panel}`}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Create Return Request</h2>

                <p className={`mt-1 text-sm ${muted}`}>
                  Link a customer return to an existing order.
                </p>
              </div>

              <button
                type="button"
                className={secondaryButton}
                onClick={() => setShowCreate(false)}
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={createReturn} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Store */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Store *
                  </label>

                  <select
                    required
                    className={inputClass}
                    value={form.store_id}
                    onChange={(e) =>
                      setForm({
                        ...EMPTY_FORM,
                        store_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Store</option>

                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name || store.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Order *
                  </label>

                  <select
                    required
                    disabled={!form.store_id}
                    className={inputClass}
                    value={form.order_id}
                    onChange={(e) => {
                      const order = availableOrders.find(
                        (item) => String(item.id) === e.target.value,
                      );

                      setForm((prev) => ({
                        ...prev,
                        order_id: e.target.value,
                        ticket_id: "",
                        customer_name: order?.customer_name || "",
                        customer_email: order?.customer_email || "",
                      }));
                    }}
                  >
                    <option value="">Select Order</option>

                    {availableOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.order_number} — {order.customer_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ticket */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Support Ticket (Optional)
                  </label>

                  <select
                    className={inputClass}
                    disabled={!form.order_id}
                    value={form.ticket_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ticket_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">No linked ticket</option>

                    {availableTickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.ticket_number} — {ticket.subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Request Type
                  </label>

                  <select
                    className={inputClass}
                    value={form.request_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        request_type: e.target.value,
                        refund_amount:
                          e.target.value === "exchange"
                            ? "0"
                            : prev.refund_amount,
                      }))
                    }
                  >
                    {REQUEST_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Customer Name *
                  </label>

                  <input
                    required
                    maxLength={150}
                    className={inputClass}
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer_name: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Customer Email
                  </label>

                  <input
                    type="email"
                    maxLength={255}
                    className={inputClass}
                    value={form.customer_email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer_email: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Reason */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Reason *
                  </label>

                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Wrong product received"
                    value={form.reason}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    maxLength={10000}
                    className={inputClass}
                    placeholder="Describe the return request..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Refund Amount */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Refund Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={form.request_type === "exchange"}
                    max={selectedOrder?.total_amount || undefined}
                    className={inputClass}
                    value={form.refund_amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        refund_amount: e.target.value,
                      }))
                    }
                  />

                  {selectedOrder && (
                    <p className={`mt-2 text-xs ${muted}`}>
                      Order total:{" "}
                      {formatMoney(
                        selectedOrder.total_amount,
                        selectedOrder.currency,
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButton}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Create Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 shadow-2xl md:p-7 ${panel}`}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Return Request Details</h2>

                <p className={`mt-1 text-xs ${muted}`}>
                  {selectedReturn?.return_number || "Loading..."}
                </p>
              </div>

              <button
                type="button"
                className={secondaryButton}
                onClick={() => {
                  setShowDetails(false);
                  setSelectedReturn(null);
                  setError("");
                }}
              >
                <X size={17} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 size={30} className="animate-spin text-indigo-500" />
              </div>
            ) : selectedReturn ? (
              <div className="space-y-6">
                {error && (
                  <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                {selectedReturn.is_demo && (
                  <div className="rounded-xl bg-violet-500/10 p-3 text-sm text-violet-500">
                    Demo return — no real refund will be executed.
                  </div>
                )}

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  {statusBadge(selectedReturn.status)}
                  {refundBadge(selectedReturn.refund_status)}
                </div>

                {/* Information cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: User,
                      label: "Customer",
                      value: selectedReturn.customer_name,
                    },
                    {
                      icon: Mail,
                      label: "Email",
                      value: selectedReturn.customer_email || "—",
                    },
                    {
                      icon: Store,
                      label: "Store",
                      value: selectedReturn.store_name || "—",
                    },
                    {
                      icon: Package,
                      label: "Order",
                      value: `#${selectedReturn.order_number || "—"}`,
                    },
                    {
                      icon: FileText,
                      label: "Support Ticket",
                      value: selectedReturn.ticket_number || "Not linked",
                    },
                    {
                      icon: CalendarDays,
                      label: "Created",
                      value: formatDate(selectedReturn.created_at),
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className={`rounded-xl border p-4 ${panel}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-indigo-500" />

                          <span className={`text-xs ${muted}`}>
                            {item.label}
                          </span>
                        </div>

                        <p className="mt-2 break-words text-sm font-semibold">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Reason and description */}
                <div>
                  <p className={`mb-2 text-xs ${muted}`}>Reason</p>

                  <h3 className="font-semibold">{selectedReturn.reason}</h3>

                  <p className={`mt-2 text-sm ${muted}`}>
                    {selectedReturn.description || "No description"}
                  </p>
                </div>

                {/* Refund amount */}
                <div className={`rounded-xl border p-4 ${panel}`}>
                  <p className={`text-xs ${muted}`}>Requested Refund Amount</p>

                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(
                      selectedReturn.refund_amount,
                      selectedReturn.currency,
                    )}
                  </p>

                  <p className={`mt-1 text-xs ${muted}`}>
                    Request Type: {formatLabel(selectedReturn.request_type)}
                  </p>
                </div>

                {/* Return Workflow */}
                <div className="border-t border-slate-500/10 pt-5">
                  <h3 className="mb-3 font-semibold">Return Workflow</h3>

                  <div className="flex flex-wrap gap-2">
                    {(RETURN_TRANSITIONS[selectedReturn.status] || []).map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={updating}
                          onClick={() => updateStatus(nextStatus)}
                          className={
                            nextStatus === "rejected" ||
                            nextStatus === "cancelled"
                              ? "rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                              : primaryButton
                          }
                        >
                          {nextStatus === "approved" && (
                            <CheckCircle2 size={16} />
                          )}

                          {nextStatus === "rejected" && <XCircle size={16} />}

                          {updating ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            formatLabel(nextStatus)
                          )}
                        </button>
                      ),
                    )}

                    {(RETURN_TRANSITIONS[selectedReturn.status] || [])
                      .length === 0 && (
                      <p className={`text-sm ${muted}`}>
                        No further return status transitions available.
                      </p>
                    )}
                  </div>
                </div>

                {/* Store Owner Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Store Owner Notes
                  </label>

                  <textarea
                    rows={3}
                    maxLength={10000}
                    className={inputClass}
                    placeholder="Add internal notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <button
                    type="button"
                    disabled={updating}
                    onClick={saveNotes}
                    className={`mt-3 ${secondaryButton}`}
                  >
                    {updating && <Loader2 size={15} className="animate-spin" />}
                    Save Notes
                  </button>
                </div>

                {/* Refund Tracking */}
                <div className="border-t border-slate-500/10 pt-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <Wallet size={18} className="text-indigo-500" />
                    Refund Tracking
                  </h3>

                  <p className={`mb-4 text-xs ${muted}`}>
                    Manual status tracking only. This does not transfer money to
                    the customer.
                  </p>

                  {["approved", "received", "completed"].includes(
                    selectedReturn.status,
                  ) &&
                  selectedReturn.request_type !== "exchange" &&
                  Number(selectedReturn.refund_amount) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(
                        REFUND_TRANSITIONS[selectedReturn.refund_status] || []
                      ).map((nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={updating}
                          onClick={() => updateRefund(nextStatus)}
                          className={secondaryButton}
                        >
                          {updating ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Wallet size={15} />
                          )}
                          Mark {formatLabel(nextStatus)}
                        </button>
                      ))}

                      {selectedReturn.refund_status === "completed" && (
                        <p className="text-sm text-emerald-500">
                          Refund marked completed in tracking.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${muted}`}>
                      Refund tracking becomes available after approval for
                      eligible requests with a positive refund amount.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`py-12 text-center ${muted}`}>
                Return request not found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
