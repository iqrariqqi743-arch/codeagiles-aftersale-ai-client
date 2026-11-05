"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useTheme } from "@/context/ThemeProvider";
import {
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Send,
  Loader2,
  Store,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
  Mail,
  ShoppingBag,
  CalendarDays,
  Filter,
  Sparkles,
  Bot,
  ShieldCheck,
  Pencil,
  BrainCircuit,
  Activity,
  ClipboardList,
  Lightbulb,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_customer", label: "Waiting Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "delivery", label: "Delivery" },
  { value: "damaged_product", label: "Damaged Product" },
  { value: "wrong_product", label: "Wrong Product" },
  { value: "return", label: "Return" },
  { value: "refund", label: "Refund" },
  { value: "other", label: "Other" },
];

const formatLabel = (value = "") =>
  String(value)
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

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const initialForm = {
  store_id: "",
  order_id: "",
  customer_name: "",
  customer_email: "",
  subject: "",
  description: "",
  category: "general",
  priority: "medium",
};

export default function TicketsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [tickets, setTickets] = useState([]);
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  const [isReplyApproved, setIsReplyApproved] = useState(false);

  // Gemini AI Reply states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiError, setAiError] = useState("");

  const aiRequestId = useRef(0);

  // AI Ticket Analysis states
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const analysisRequestId = useRef(0);

  const panel = isDark
    ? "bg-[#111827] border-white/10"
    : "bg-white border-slate-200";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${
    isDark
      ? "border-white/10 bg-[#0b1220] text-white placeholder:text-slate-500"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
  }`;

  const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";

  const handleApiError = useCallback(
    (err, fallback) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        router.push("/login");
        return;
      }

      setError(getErrorMessage(err, fallback));
    },
    [router],
  );

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tickets");

      setTickets(
        Array.isArray(response.data?.tickets) ? response.data.tickets : [],
      );
    } catch (err) {
      handleApiError(err, "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await api.get("/stores");

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data?.stores || data?.data || [];

      setStores(Array.isArray(list) ? list : []);
    } catch (err) {
      handleApiError(err, "Unable to load stores");
    }
  }, [handleApiError]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get("/orders");

      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data?.orders || data?.data || [];

      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStores();
    fetchOrders();
  }, [fetchTickets, fetchStores, fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, storeFilter]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter(
        (t) => t.status === "resolved" || t.status === "closed",
      ).length,
    }),
    [tickets],
  );

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const searchText = [
        ticket.ticket_number,
        ticket.customer_name,
        ticket.customer_email,
        ticket.subject,
        ticket.order_number,
        ticket.store_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchText.includes(keyword);
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesStore =
        storeFilter === "all" || String(ticket.store_id) === storeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesStore;
    });
  }, [tickets, search, statusFilter, priorityFilter, storeFilter]);

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const availableOrders = useMemo(
    () =>
      orders.filter(
        (order) => String(order.store_id) === String(form.store_id),
      ),
    [orders, form.store_id],
  );

  const statusBadge = (status) => {
    const styles = {
      open: "bg-blue-500/10 text-blue-500",
      in_progress: "bg-amber-500/10 text-amber-500",
      waiting_customer: "bg-purple-500/10 text-purple-500",
      resolved: "bg-emerald-500/10 text-emerald-500",
      closed: "bg-slate-500/10 text-slate-400",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          styles[status] || styles.open
        }`}
      >
        {formatLabel(status)}
      </span>
    );
  };

  const priorityBadge = (priority) => {
    const styles = {
      low: "bg-slate-500/10 text-slate-400",
      medium: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          styles[priority] || styles.medium
        }`}
      >
        {formatLabel(priority)}
      </span>
    );
  };

  // Reset Gemini reply states
  const resetAIReply = () => {
    aiRequestId.current += 1;
    setAiLoading(false);
    setAiSuggestion("");
    setAiError("");
  };

  // Reset AI analysis states
  const resetTicketAnalysis = () => {
    analysisRequestId.current += 1;
    setAnalysisLoading(false);
    setAnalysis(null);
    setAnalysisError("");
  };

  // Analyze ticket with Gemini AI
  const handleAnalyzeTicket = async () => {
    if (!selectedTicket?.id || analysisLoading) return;

    const ticketId = selectedTicket.id;
    const requestId = ++analysisRequestId.current;

    try {
      setAnalysisLoading(true);
      setAnalysisError("");
      setAnalysis(null);

      // Backend endpoint for AI ticket analysis
      const response = await api.post(`/ai/tickets/${ticketId}/analyze`);

      // Ignore old responses if another ticket has been opened
      if (requestId !== analysisRequestId.current) return;

      if (!response.data?.success || !response.data?.analysis) {
        throw new Error(
          response.data?.message || "AI could not analyze this ticket",
        );
      }

      setAnalysis(response.data.analysis);
    } catch (err) {
      if (requestId !== analysisRequestId.current) return;

      if (err?.response?.status === 401) {
        handleApiError(err, "Your session has expired");
      } else {
        setAnalysisError(getErrorMessage(err, "Failed to analyze ticket"));
      }
    } finally {
      if (requestId === analysisRequestId.current) {
        setAnalysisLoading(false);
      }
    }
  };

  // Generate AI reply
  const handleGenerateAIReply = async () => {
    if (!selectedTicket?.id || aiLoading) return;

    const ticketId = selectedTicket.id;
    const requestId = ++aiRequestId.current;

    try {
      setAiLoading(true);
      setAiError("");
      setAiSuggestion("");

      const response = await api.post(`/ai/tickets/${ticketId}/suggest`);

      if (requestId !== aiRequestId.current) return;

      const suggestion = response.data?.suggestion?.trim();

      if (!response.data?.success || !suggestion) {
        throw new Error(
          response.data?.message || "AI did not generate a reply",
        );
      }

      setAiSuggestion(suggestion);
    } catch (err) {
      if (requestId !== aiRequestId.current) return;

      if (err?.response?.status === 401) {
        handleApiError(err, "Your session has expired");
      } else {
        setAiError(getErrorMessage(err, "Failed to generate AI reply"));
      }
    } finally {
      if (requestId === aiRequestId.current) {
        setAiLoading(false);
      }
    }
  };

  const openTicketDetails = async (ticketId) => {
    try {
      setShowDetails(true);
      setDetailsLoading(true);
      setSelectedTicket(null);
      setMessages([]);
      setReply("");
      setIsReplyApproved(false);
      setApprovalLoading(false);
      setEmailStatus(null);
      setError("");
      setNotice("");

      resetAIReply();
      resetTicketAnalysis();

      const response = await api.get(`/tickets/${ticketId}`);

      setSelectedTicket(response.data?.ticket || null);
      setMessages(response.data?.messages || []);
    } catch (err) {
      handleApiError(err, "Unable to load ticket details");
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    if (
      !form.store_id ||
      !form.customer_name.trim() ||
      !form.subject.trim() ||
      !form.description.trim()
    ) {
      setError("Please complete all required fields");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const payload = {
        store_id: form.store_id,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      };

      if (form.order_id) {
        payload.order_id = form.order_id;
      }

      const response = await api.post("/tickets", payload);

      if (response.data?.success) {
        setNotice("Ticket created successfully");
        setShowCreate(false);
        setForm(initialForm);
        await fetchTickets();
      }
    } catch (err) {
      handleApiError(err, "Failed to create ticket");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket || status === selectedTicket.status) return;

    try {
      setStatusLoading(true);
      setError("");

      const response = await api.patch(`/tickets/${selectedTicket.id}/status`, {
        status,
      });

      if (response.data?.success) {
        setSelectedTicket(response.data.ticket);
        setNotice("Ticket status updated");
        await fetchTickets();
      }
    } catch (err) {
      handleApiError(err, "Failed to update ticket status");
    } finally {
      setStatusLoading(false);
    }
  };

  // Save approval in the backend, not only in React state.
  const handleApproveReply = async () => {
    const message = reply.trim();

    if (!selectedTicket?.id || !message) {
      setError("Please write or use an AI draft before approving.");
      return;
    }

    if (approvalLoading || replyLoading || isReplyApproved) {
      return;
    }

    try {
      setApprovalLoading(true);
      setError("");
      setNotice("");

      const response = await api.post(
        `/tickets/${selectedTicket.id}/approve-reply`,
        { message },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to approve reply");
      }

      setIsReplyApproved(true);
      setNotice("Reply approved successfully. You can now send it.");
    } catch (error) {
      setIsReplyApproved(false);

      if (error?.response?.status === 401) {
        handleApiError(error, "Your session has expired");
      } else {
        setError(getErrorMessage(error, "Failed to approve reply"));
      }
    } finally {
      setApprovalLoading(false);
    }
  };

  // Any edit invalidates the previous approval.
  const handleReplyChange = (value) => {
    setReply(value);
    setIsReplyApproved(false);
    setError("");
    setNotice("");
  };

  const handleUseAIDraft = () => {
    if (!aiSuggestion.trim()) return;

    setReply(aiSuggestion);
    setIsReplyApproved(false);
    setAiSuggestion("");
    setAiError("");
    setError("");
    setNotice(
      "AI draft added to reply box. Review and approve it before sending.",
    );
  };

  const handleSendReply = async (event) => {
    event.preventDefault();

    if (!selectedTicket || !reply.trim() || replyLoading) return;

    if (!isReplyApproved) {
      setError("Please approve the reply before sending.");
      return;
    }

    try {
      setReplyLoading(true);
      setError("");
      setNotice("");
      setEmailStatus(null);

      const response = await api.post(
        `/tickets/${selectedTicket.id}/messages`,
        { message: reply.trim() },
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to send reply");
      }

      if (response.data.ticket_message) {
        setMessages((previous) => [...previous, response.data.ticket_message]);
      }

      const email = response.data.email_notification;

      if (email?.status === "sent" || email?.sent === true) {
        setEmailStatus({
          status: "sent",
          message:
            "Reply saved successfully. The email notification was accepted by the email provider.",
        });
      } else if (email?.status === "failed") {
        setEmailStatus({
          status: "failed",
          message:
            "Reply was saved, but the email notification failed to send. Do not resend the reply just to retry the email.",
        });
      } else if (email?.status === "skipped") {
        setEmailStatus({
          status: "skipped",
          message:
            "Reply was saved, but the email notification was skipped. Check the customer email and email settings.",
        });
      } else {
        setEmailStatus({
          status: "unknown",
          message:
            "Reply was saved, but the backend did not return a clear email notification status.",
        });
      }

      setReply("");
      setIsReplyApproved(false);
      setAiSuggestion("");
      setAiError("");

      fetchTickets().catch((refreshError) => {
        console.error("Unable to refresh tickets:", refreshError);
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        handleApiError(err, "Your session has expired");
      } else {
        setError(
          getErrorMessage(
            err,
            "Unable to confirm the reply result. Check the conversation before retrying to avoid a duplicate reply.",
          ),
        );
      }
    } finally {
      setReplyLoading(false);
    }
  };

  // Sentiment badge
  const sentimentBadge = (sentiment) => {
    const styles = {
      positive: "bg-emerald-500/10 text-emerald-500",
      neutral: "bg-blue-500/10 text-blue-500",
      negative: "bg-red-500/10 text-red-500",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
          styles[String(sentiment || "").toLowerCase()] ||
          "bg-slate-500/10 text-slate-500"
        }`}
      >
        {formatLabel(sentiment || "Unknown")}
      </span>
    );
  };

  // Urgency badge
  const urgencyBadge = (urgency) => {
    const styles = {
      low: "bg-slate-500/10 text-slate-400",
      medium: "bg-blue-500/10 text-blue-500",
      high: "bg-orange-500/10 text-orange-500",
      urgent: "bg-red-500/10 text-red-500",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
          styles[String(urgency || "").toLowerCase()] ||
          "bg-slate-500/10 text-slate-500"
        }`}
      >
        {formatLabel(urgency || "Unknown")}
      </span>
    );
  };

  const statCards = [
    {
      label: "Total Tickets",
      value: stats.total,
      icon: Ticket,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Open Tickets",
      value: stats.open,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock3,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Resolved / Closed",
      value: stats.resolved,
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
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-500">
            <MessageSquare size={15} />
            AFTER-SALES SUPPORT
          </div>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Support Tickets
          </h1>

          <p className={`mt-1 text-sm ${textMuted}`}>
            Manage customer complaints, conversations and resolutions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              fetchTickets();
              fetchStores();
              fetchOrders();
            }}
            className={secondaryButton}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setError("");
              setShowCreate(true);
            }}
            className={primaryButton}
          >
            <Plus size={17} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className={`rounded-2xl border p-5 ${panel}`}>
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${item.bg}`}>
                  <Icon size={21} className={item.color} />
                </div>

                <span className={`text-xs ${textMuted}`}>Live overview</span>
              </div>

              <p className={`mt-5 text-sm ${textMuted}`}>{item.label}</p>

              <h2 className={`mt-1 text-3xl font-bold ${textPrimary}`}>
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Tickets Table */}
      <div className={`overflow-hidden rounded-2xl border ${panel}`}>
        <div className="border-b border-slate-500/10 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={17} className="text-indigo-500" />
            <h2 className="font-semibold">All Support Tickets</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search
                size={17}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
              />

              <input
                className={`${inputClass} pl-10`}
                placeholder="Search tickets..."
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
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
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

        {error && !showCreate && !showDetails && (
          <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        {notice && (
          <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">
            <CheckCircle2 size={17} />
            {notice}
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-auto"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead
              className={
                isDark
                  ? "bg-white/[0.03] text-slate-400"
                  : "bg-slate-50 text-slate-500"
              }
            >
              <tr>
                {[
                  "Ticket",
                  "Customer",
                  "Store / Order",
                  "Priority",
                  "Status",
                  "Created",
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
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-indigo-500"
                    />
                    <p className={`mt-3 text-sm ${textMuted}`}>
                      Loading tickets...
                    </p>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Inbox size={35} className={`mx-auto ${textMuted}`} />
                    <p className="mt-3 font-semibold">No tickets found</p>
                    <p className={`mt-1 text-sm ${textMuted}`}>
                      Create a ticket or adjust your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`border-t transition ${
                      isDark
                        ? "border-white/5 hover:bg-white/[0.03]"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="max-w-[200px] truncate font-semibold">
                        {ticket.subject}
                      </p>
                      <p className={`mt-1 text-xs ${textMuted}`}>
                        {ticket.ticket_number}
                      </p>

                      {ticket.is_demo && (
                        <span className="mt-2 inline-flex rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-500">
                          DEMO
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">{ticket.customer_name}</p>
                      <p className={`mt-1 text-xs ${textMuted}`}>
                        {ticket.customer_email || "No email"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p>{ticket.store_name || `Store #${ticket.store_id}`}</p>
                      <p className={`mt-1 text-xs ${textMuted}`}>
                        {ticket.order_number
                          ? `Order #${ticket.order_number}`
                          : "No linked order"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {priorityBadge(ticket.priority)}
                    </td>

                    <td className="px-5 py-4">{statusBadge(ticket.status)}</td>

                    <td className={`px-5 py-4 ${textMuted}`}>
                      {formatDate(ticket.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openTicketDetails(ticket.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20"
                      >
                        <Eye size={15} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/dashboard/tickets/${ticket.id}`)
                        }
                        className="mx-2 inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20"
                      >
                        <Eye size={15} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-500/10 px-5 py-4 sm:flex-row">
          <p className={`text-xs ${textMuted}`}>
            Showing{" "}
            {filteredTickets.length ? (currentPage - 1) * perPage + 1 : 0}
            {" - "}
            {Math.min(currentPage * perPage, filteredTickets.length)} of{" "}
            {filteredTickets.length} tickets
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`${secondaryButton} disabled:opacity-40`}
            >
              <ChevronLeft size={16} />
            </button>

            <span className={`px-2 text-xs ${textMuted}`}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className={`${secondaryButton} disabled:opacity-40`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-5 shadow-2xl md:p-7 ${panel}`}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Create Support Ticket</h2>
                <p className={`mt-1 text-sm ${textMuted}`}>
                  Add a customer complaint for testing or manual support.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className={secondaryButton}
              >
                <X size={17} />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </p>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Store *
                  </label>

                  <select
                    required
                    className={inputClass}
                    value={form.store_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        store_id: e.target.value,
                        order_id: "",
                      }))
                    }
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name || store.name || `Store #${store.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Order (Optional)
                  </label>

                  <select
                    className={inputClass}
                    value={form.order_id}
                    disabled={!form.store_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        order_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">No linked order</option>
                    {availableOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        #{order.order_number} — {order.customer_name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    placeholder="Ali Khan"
                  />
                </div>

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
                    placeholder="ali@example.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Category
                  </label>

                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {CATEGORY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>

                  <select
                    className={inputClass}
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                  >
                    {PRIORITY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Subject *
                </label>

                <input
                  required
                  maxLength={255}
                  className={inputClass}
                  value={form.subject}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Wrong product received"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description *
                </label>

                <textarea
                  required
                  maxLength={10000}
                  rows={4}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the customer's issue..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-3 lg:p-4">
          <div
            className={`flex h-[96dvh] max-h-[96dvh] w-full max-w-7xl min-h-0 flex-col overflow-hidden rounded-2xl border shadow-2xl ${panel}`}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-500/10 p-4 sm:p-5">
              <div>
                <h2 className="text-xl font-bold">Ticket Details</h2>
                <p className={`mt-1 text-xs ${textMuted}`}>
                  {selectedTicket?.ticket_number || "Loading..."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedTicket(null);
                  setMessages([]);
                  setReply("");
                  setIsReplyApproved(false);
                  setApprovalLoading(false);
                  setEmailStatus(null);
                  setError("");
                  setNotice("");
                  resetAIReply();
                  resetTicketAnalysis();
                }}
                className={secondaryButton}
              >
                <X size={17} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <Loader2 size={30} className="animate-spin text-indigo-500" />
              </div>
            ) : selectedTicket ? (
              <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,auto)_minmax(0,1fr)] overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)] lg:grid-rows-1">
                {/* Ticket Info */}
                <div
                  className={`min-h-0 overflow-y-auto overscroll-contain space-y-5 border-b border-slate-500/10 p-5 lg:border-b-0 lg:border-r ${
                    isDark ? "bg-white/[0.02]" : "bg-slate-50/60"
                  }`}
                >
                  <div>
                    <p className={`mb-2 text-xs ${textMuted}`}>
                      Ticket Subject
                    </p>

                    <h3 className="text-lg font-semibold">
                      {selectedTicket.subject}
                    </h3>

                    {selectedTicket.is_demo && (
                      <span className="mt-2 inline-block rounded-lg bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-500">
                        Demo Ticket
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {priorityBadge(selectedTicket.priority)}
                    {statusBadge(selectedTicket.status)}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Update Status
                    </label>

                    <select
                      value={selectedTicket.status}
                      disabled={statusLoading}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={inputClass}
                    >
                      {STATUS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4 border-t border-slate-500/10 pt-5">
                    {[
                      {
                        icon: User,
                        label: "Customer",
                        value: selectedTicket.customer_name,
                      },
                      {
                        icon: Mail,
                        label: "Email",
                        value: selectedTicket.customer_email || "—",
                      },
                      {
                        icon: Store,
                        label: "Store",
                        value:
                          selectedTicket.store_name ||
                          `Store #${selectedTicket.store_id}`,
                      },
                      {
                        icon: ShoppingBag,
                        label: "Order",
                        value: selectedTicket.order_number
                          ? `#${selectedTicket.order_number}`
                          : "Not linked",
                      },
                      {
                        icon: CalendarDays,
                        label: "Created",
                        value: formatDate(selectedTicket.created_at),
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="flex gap-3">
                          <Icon
                            size={17}
                            className="mt-0.5 shrink-0 text-indigo-500"
                          />

                          <div className="min-w-0">
                            <p className={`text-xs ${textMuted}`}>
                              {item.label}
                            </p>

                            <p className="mt-1 break-words text-sm font-medium">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
                  {/* Conversation Header */}
                  <div className="shrink-0 border-b border-slate-500/10 p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <MessageSquare size={18} className="text-indigo-500" />
                      Conversation
                    </h3>

                    <p className={`mt-1 text-xs ${textMuted}`}>
                      Customer complaint and store owner replies
                    </p>
                  </div>

                  {/* Messages - Independent Scroll */}
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
                    {messages.length === 0 ? (
                      <p className={`py-10 text-center text-sm ${textMuted}`}>
                        No messages yet.
                      </p>
                    ) : (
                      messages.map((message) => {
                        const isOwner = message.sender_type === "owner";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isOwner ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl p-4 ${
                                isOwner
                                  ? "bg-indigo-600 text-white"
                                  : isDark
                                    ? "bg-white/10 text-slate-100"
                                    : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              <p
                                className={`mb-2 text-xs font-semibold ${
                                  isOwner ? "text-indigo-100" : textMuted
                                }`}
                              >
                                {isOwner ? "Store Owner" : "Customer"}
                              </p>

                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.message}
                              </p>

                              <p
                                className={`mt-2 text-[11px] ${
                                  isOwner ? "text-indigo-200" : textMuted
                                }`}
                              >
                                {formatDate(message.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply Form - Independent Scroll */}
                  <form
                    onSubmit={handleSendReply}
                    className="max-h-[55%] shrink-0 space-y-1 overflow-y-auto overscroll-contain border-t border-slate-500/10 p-5"
                  >
                    {/* Email Notification Status */}
                    {emailStatus && (
                      <div
                        role="status"
                        className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${
                          emailStatus.status === "sent"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : emailStatus.status === "failed"
                              ? "border-red-500/20 bg-red-500/10 text-red-500"
                              : emailStatus.status === "skipped"
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                                : isDark
                                  ? "border-white/10 bg-white/5 text-slate-300"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {emailStatus.status === "sent" ? (
                          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle
                            size={20}
                            className="mt-0.5 shrink-0"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {emailStatus.status === "sent"
                              ? "Email Notification Sent"
                              : emailStatus.status === "failed"
                                ? "Email Notification Failed"
                                : emailStatus.status === "skipped"
                                  ? "Email Notification Skipped"
                                  : "Email Status Unknown"}
                          </p>

                          <p className="mt-1 text-xs leading-5">
                            {emailStatus.message}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEmailStatus(null)}
                          className="shrink-0 opacity-70 transition hover:opacity-100"
                          aria-label="Dismiss email status"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {error && (
                      <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-500">
                        {error}
                      </p>
                    )}

                    {/* AI Ticket Analysis */}
                    <div
                      className={`mb-4 rounded-xl border p-4 ${
                        isDark
                          ? "border-purple-500/20 bg-purple-500/5"
                          : "border-purple-200 bg-purple-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BrainCircuit size={20} className="text-purple-500" />

                          <div>
                            <p className="text-sm font-semibold">
                              AI Ticket Analysis
                            </p>

                            <p className={`text-xs ${textMuted}`}>
                              Understand customer sentiment, urgency and next
                              action.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAnalyzeTicket}
                          disabled={
                            analysisLoading ||
                            aiLoading ||
                            replyLoading ||
                            !selectedTicket?.id
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {analysisLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Activity size={16} />
                          )}

                          {analysisLoading
                            ? "Analyzing..."
                            : analysis
                              ? "Analyze Again"
                              : "Analyze Ticket"}
                        </button>
                      </div>

                      {analysisError && (
                        <div
                          role="alert"
                          className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-500"
                        >
                          {analysisError}
                        </div>
                      )}

                      {analysisLoading && (
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
                          <Loader2
                            size={20}
                            className="animate-spin text-purple-500"
                          />

                          <div>
                            <p className="text-sm font-semibold">
                              Gemini is analyzing this ticket
                            </p>

                            <p className={`mt-1 text-xs ${textMuted}`}>
                              Reviewing the customer conversation and
                              identifying the recommended next action.
                            </p>
                          </div>
                        </div>
                      )}

                      {analysis && !analysisLoading && (
                        <div className="mt-4 space-y-4">
                          {/* Sentiment and Urgency */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div
                              className={`rounded-xl border p-3 ${
                                isDark
                                  ? "border-white/10 bg-white/[0.03]"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <Activity
                                  size={15}
                                  className="text-indigo-500"
                                />

                                <p className={`text-xs ${textMuted}`}>
                                  Customer Sentiment
                                </p>
                              </div>

                              {sentimentBadge(analysis.sentiment)}
                            </div>

                            <div
                              className={`rounded-xl border p-3 ${
                                isDark
                                  ? "border-white/10 bg-white/[0.03]"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <AlertTriangle
                                  size={15}
                                  className="text-orange-500"
                                />

                                <p className={`text-xs ${textMuted}`}>
                                  Ticket Urgency
                                </p>
                              </div>

                              {urgencyBadge(analysis.urgency)}
                            </div>
                          </div>

                          {/* Summary */}
                          <div
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-white/10 bg-white/[0.03]"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <ClipboardList
                                size={16}
                                className="text-indigo-500"
                              />

                              <p className="text-sm font-semibold">
                                AI Summary
                              </p>
                            </div>

                            <p className={`text-sm leading-6 ${textMuted}`}>
                              {analysis.summary || "No summary available."}
                            </p>
                          </div>

                          {/* Suggested Category and Priority */}
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div
                              className={`rounded-xl border p-3 ${
                                isDark
                                  ? "border-white/10 bg-white/[0.03]"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <p className={`mb-2 text-xs ${textMuted}`}>
                                Suggested Category
                              </p>

                              <p className="text-sm font-semibold">
                                {formatLabel(
                                  analysis.suggested_category || "Not provided",
                                )}
                              </p>
                            </div>

                            <div
                              className={`rounded-xl border p-3 ${
                                isDark
                                  ? "border-white/10 bg-white/[0.03]"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <p className={`mb-2 text-xs ${textMuted}`}>
                                Suggested Priority
                              </p>

                              {analysis.suggested_priority ? (
                                priorityBadge(analysis.suggested_priority)
                              ) : (
                                <p className="text-sm font-semibold">
                                  Not provided
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Recommended Action */}
                          <div
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-emerald-200 bg-emerald-50/60"
                            }`}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Lightbulb
                                size={17}
                                className="text-emerald-500"
                              />

                              <p className="text-sm font-semibold">
                                Recommended Action
                              </p>
                            </div>

                            <p className={`text-sm leading-6 ${textMuted}`}>
                              {analysis.recommended_action ||
                                "No recommended action available."}
                            </p>
                          </div>

                          <p className={`text-[11px] leading-5 ${textMuted}`}>
                            AI suggestions are advisory only. Your ticket
                            category and priority will not change automatically.
                            Please review the analysis before taking action.
                          </p>
                        </div>
                      )}

                      {!analysis && !analysisLoading && !analysisError && (
                        <div
                          className={`mt-4 rounded-xl border border-dashed p-4 text-center ${
                            isDark ? "border-white/10" : "border-slate-200"
                          }`}
                        >
                          <BrainCircuit
                            size={25}
                            className="mx-auto text-purple-500"
                          />

                          <p className="mt-2 text-sm font-medium">
                            No analysis yet
                          </p>

                          <p className={`mt-1 text-xs ${textMuted}`}>
                            Click Analyze Ticket to get AI-powered insights
                            about this customer issue.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Gemini AI Reply Suggestion */}
                    <div
                      className={`mb-4 rounded-xl border p-4 ${
                        isDark
                          ? "border-indigo-500/20 bg-indigo-500/5"
                          : "border-indigo-200 bg-indigo-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Bot size={19} className="text-indigo-500" />

                          <div>
                            <p className="text-sm font-semibold">
                              Gemini AI Assistant
                            </p>

                            <p className={`text-xs ${textMuted}`}>
                              Generates a draft for your review. Never
                              auto-sends.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGenerateAIReply}
                          disabled={
                            aiLoading ||
                            replyLoading ||
                            approvalLoading ||
                            !selectedTicket?.id
                          }
                          className={`${primaryButton} text-xs`}
                        >
                          {aiLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Sparkles size={16} />
                          )}

                          {aiLoading
                            ? "Generating..."
                            : aiSuggestion
                              ? "Regenerate Reply"
                              : "Generate AI Reply"}
                        </button>
                      </div>

                      {aiError && (
                        <p
                          role="alert"
                          className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-500"
                        >
                          {aiError}
                        </p>
                      )}

                      {aiSuggestion && (
                        <div className="mt-4 space-y-3">
                          <label
                            htmlFor="ai-ticket-suggestion"
                            className="block text-xs font-semibold"
                          >
                            Suggested Reply — edit before using
                          </label>

                          <textarea
                            id="ai-ticket-suggestion"
                            rows={5}
                            maxLength={10000}
                            value={aiSuggestion}
                            onChange={(event) =>
                              setAiSuggestion(event.target.value)
                            }
                            className={inputClass}
                          />

                          <button
                            type="button"
                            disabled={
                              !aiSuggestion.trim() ||
                              replyLoading ||
                              approvalLoading
                            }
                            onClick={handleUseAIDraft}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            Use This Reply
                          </button>

                          <p className={`text-xs ${textMuted}`}>
                            Copies the draft into the reply box below. Review
                            it, approve it, then send it.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reply Editor */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-sm font-semibold">
                          Your Reply
                        </label>

                        {isReplyApproved ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                            <ShieldCheck size={14} />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                            <AlertTriangle size={14} />
                            Approval Required
                          </span>
                        )}
                      </div>

                      <textarea
                        rows={4}
                        maxLength={10000}
                        className={inputClass}
                        placeholder="Write a reply to this ticket..."
                        value={reply}
                        disabled={approvalLoading || replyLoading}
                        onChange={(e) => handleReplyChange(e.target.value)}
                      />

                      <div
                        className={`rounded-xl border p-3 ${
                          isReplyApproved
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : isDark
                              ? "border-amber-500/20 bg-amber-500/5"
                              : "border-amber-200 bg-amber-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isReplyApproved ? (
                            <ShieldCheck
                              size={18}
                              className="mt-0.5 shrink-0 text-emerald-500"
                            />
                          ) : (
                            <AlertTriangle
                              size={18}
                              className="mt-0.5 shrink-0 text-amber-500"
                            />
                          )}

                          <div>
                            <p className="text-xs font-semibold">
                              {isReplyApproved
                                ? "Reply approved"
                                : "Review required"}
                            </p>

                            <p
                              className={`mt-1 text-xs leading-5 ${textMuted}`}
                            >
                              {isReplyApproved
                                ? "This exact version is approved. Editing the text will require approval again."
                                : "Review the reply carefully. Click Approve Reply before sending it to the customer."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleApproveReply}
                          disabled={
                            !reply.trim() ||
                            replyLoading ||
                            approvalLoading ||
                            isReplyApproved
                          }
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isReplyApproved
                              ? "bg-emerald-600"
                              : "bg-amber-500 hover:bg-amber-600"
                          }`}
                        >
                          {approvalLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Approving...
                            </>
                          ) : isReplyApproved ? (
                            <>
                              <ShieldCheck size={16} />
                              Approved
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={16} />
                              Approve Reply
                            </>
                          )}
                        </button>

                        <button
                          type="submit"
                          disabled={
                            replyLoading ||
                            approvalLoading ||
                            !reply.trim() ||
                            !isReplyApproved
                          }
                          className={primaryButton}
                        >
                          {replyLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}

                          {replyLoading ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className={`p-10 text-center ${textMuted}`}>
                Ticket not found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
