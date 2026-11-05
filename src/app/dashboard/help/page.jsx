"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Plus,
  Ticket,
  MessageSquare,
  Send,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Search,
  ChevronRight,
  Headphones,
} from "lucide-react";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

const API_BASE = "/help-support";

const categories = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical Support" },
  { value: "billing", label: "Billing" },
  { value: "subscription", label: "Subscription" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

const priorities = ["low", "medium", "high", "urgent"];

const initialForm = {
  subject: "",
  description: "",
  category: "general",
  priority: "medium",
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function HelpSupportPage() {
  const router = useRouter();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [notice, setNotice] = useState(null);

  const cardClass = isDark
    ? "border-white/10 bg-[#172235]"
    : "border-slate-200 bg-white shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = isDark
    ? "border-white/10 bg-[#101a2b] text-white placeholder:text-slate-500"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";

  const secondaryClass = isDark
    ? "border-white/10 text-slate-300 hover:bg-white/5"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10";

  const handleUnauthorized = useCallback(
    (error) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/login");
        return true;
      }

      return false;
    },
    [router],
  );

  // ==============================
  // FETCH MY TICKETS
  // ==============================

  const fetchTickets = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(`${API_BASE}/tickets/my`);

        if (response.data?.success === false) {
          throw new Error(response.data.message);
        }

        setTickets(response.data?.tickets || []);
      } catch (error) {
        if (handleUnauthorized(error)) return;

        setNotice({
          type: "error",
          text: getErrorMessage(error, "Failed to load support tickets"),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized],
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ==============================
  // CREATE TICKET
  // ==============================

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.description.trim()) {
      setNotice({
        type: "error",
        text: "Subject and description are required.",
      });
      return;
    }

    try {
      setCreating(true);
      setNotice(null);

      const response = await api.post(`${API_BASE}/tickets`, {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      setForm(initialForm);
      setShowCreateForm(false);

      setNotice({
        type: "success",
        text: "Support ticket created successfully.",
      });

      await fetchTickets(true);
    } catch (error) {
      if (handleUnauthorized(error)) return;

      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to create ticket"),
      });
    } finally {
      setCreating(false);
    }
  };

  // ==============================
  // OPEN CONVERSATION
  // ==============================

  const openConversation = async (ticketId) => {
    try {
      setLoadingConversation(true);
      setNotice(null);
      setSelectedTicket(null);
      setMessages([]);

      const response = await api.get(`${API_BASE}/tickets/${ticketId}`);

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      setSelectedTicket(response.data.ticket);
      setMessages(response.data.messages || []);
    } catch (error) {
      if (handleUnauthorized(error)) return;

      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to load conversation"),
      });
    } finally {
      setLoadingConversation(false);
    }
  };

  // ==============================
  // SEND MESSAGE
  // ==============================

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedTicket || !reply.trim()) return;

    try {
      setSending(true);
      setNotice(null);

      const response = await api.post(
        `${API_BASE}/tickets/${selectedTicket.id}/messages`,
        {
          message: reply.trim(),
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message);
      }

      setReply("");

      await openConversation(selectedTicket.id);
      await fetchTickets(true);
    } catch (error) {
      if (handleUnauthorized(error)) return;

      setNotice({
        type: "error",
        text: getErrorMessage(error, "Failed to send message"),
      });
    } finally {
      setSending(false);
    }
  };

  // ==============================
  // FILTERS
  // ==============================

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.toLowerCase();

    const matchesSearch =
      ticket.subject?.toLowerCase().includes(query) ||
      ticket.ticket_number?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "open",
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "in_progress",
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  const statusClass = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";

      case "in_progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";

      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

      case "closed":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const priorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-500";

      case "high":
        return "text-orange-500";

      case "medium":
        return "text-amber-500";

      default:
        return "text-emerald-500";
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      {/* BACK */}

      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-sm transition hover:text-cyan-500 ${mutedClass}`}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-cyan-500">
            CODEAGILES SUPPORT CENTER
          </p>

          <h1 className={`text-3xl font-bold ${titleClass}`}>Help & Support</h1>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Need assistance? Create a support ticket and connect with our team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNotice(null);
            setShowCreateForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={18} />
          New Support Ticket
        </button>
      </div>

      {/* NOTIFICATION */}

      {notice && (
        <div
          role="alert"
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
            notice.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              : "border-red-500/20 bg-red-500/10 text-red-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}

          <span className="flex-1">{notice.text}</span>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Tickets",
            value: totalTickets,
            icon: Ticket,
            color: "text-cyan-500",
          },
          {
            label: "Open Tickets",
            value: openTickets,
            icon: AlertCircle,
            color: "text-blue-500",
          },
          {
            label: "In Progress",
            value: inProgressTickets,
            icon: Clock3,
            color: "text-amber-500",
          },
          {
            label: "Resolved",
            value: resolvedTickets,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`rounded-2xl border p-5 ${cardClass}`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 ${item.color}`}
              >
                <Icon size={22} />
              </div>

              <p className={`text-sm ${mutedClass}`}>{item.label}</p>

              <h3 className={`mt-2 text-3xl font-bold ${titleClass}`}>
                {item.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT */}

      <div className={`rounded-2xl border ${cardClass}`}>
        <div className="flex flex-col gap-4 border-b border-slate-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${titleClass}`}>
              My Support Tickets
            </h2>

            <p className={`mt-1 text-sm ${mutedClass}`}>
              Track your requests and conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${secondaryClass}`}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* SEARCH */}

        <div className="grid gap-3 p-5 sm:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by subject or ticket number..."
              className={`${inputBase} ${inputClass} pl-11`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputBase} ${inputClass}`}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* TICKET LIST */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <RefreshCw size={30} className="animate-spin text-cyan-500" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <Headphones size={42} className="text-cyan-500" />

            <h3 className={`mt-4 font-semibold ${titleClass}`}>
              No support tickets found
            </h3>

            <p className={`mt-2 text-sm ${mutedClass}`}>
              Create your first support ticket or change your filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-500/10">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openConversation(ticket.id)}
                className={`flex w-full flex-col gap-4 p-5 text-left transition sm:flex-row sm:items-center sm:justify-between ${
                  isDark ? "hover:bg-white/5" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold text-cyan-500">
                    {ticket.ticket_number}
                  </p>

                  <h3 className={`font-semibold ${titleClass}`}>
                    {ticket.subject}
                  </h3>

                  <p className={`mt-2 text-xs ${mutedClass}`}>
                    Created {formatDate(ticket.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusClass(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status?.replaceAll("_", " ")}
                  </span>

                  <span
                    className={`text-xs font-semibold capitalize ${priorityClass(
                      ticket.priority,
                    )}`}
                  >
                    {ticket.priority}
                  </span>

                  <ChevronRight size={18} className={mutedClass} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create support ticket"
            className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-6 ${cardClass}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className={`text-xl font-bold ${titleClass}`}>
                Create Support Ticket
              </h2>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close"
                className={mutedClass}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-5">
              <div>
                <label className={`mb-2 block text-sm ${titleClass}`}>
                  Subject
                </label>

                <input
                  required
                  maxLength={255}
                  value={form.subject}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subject: event.target.value,
                    })
                  }
                  placeholder="Enter ticket subject"
                  className={`${inputBase} ${inputClass}`}
                />
              </div>

              <div>
                <label className={`mb-2 block text-sm ${titleClass}`}>
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                  className={`${inputBase} ${inputClass}`}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-2 block text-sm ${titleClass}`}>
                  Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value,
                    })
                  }
                  className={`${inputBase} ${inputClass}`}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-2 block text-sm ${titleClass}`}>
                  Description
                </label>

                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe your issue in detail..."
                  className={`${inputBase} ${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {creating ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}

                {creating ? "Creating..." : "Create Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONVERSATION MODAL */}

      {(selectedTicket || loadingConversation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Support conversation"
            className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border ${cardClass}`}
          >
            {loadingConversation && !selectedTicket ? (
              <div className="flex min-h-80 items-center justify-center">
                <RefreshCw size={30} className="animate-spin text-cyan-500" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-500/10 p-5">
                  <div className="min-w-0">
                    <p className="text-xs text-cyan-500">
                      {selectedTicket.ticket_number}
                    </p>

                    <h2 className={`mt-1 font-bold ${titleClass}`}>
                      {selectedTicket.subject}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTicket(null);
                      setMessages([]);
                      setReply("");
                    }}
                    aria-label="Close conversation"
                    className={mutedClass}
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto p-5">
                  {/* ORIGINAL TICKET DESCRIPTION */}

                  <div className={`rounded-xl border p-4 ${secondaryClass}`}>
                    <p className={`mb-2 text-xs ${mutedClass}`}>
                      Original Support Request
                    </p>

                    <p className={`whitespace-pre-wrap text-sm ${titleClass}`}>
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* CHAT MESSAGES */}

                  {messages.map((message) => {
                    const fromAdmin = message.sender_type === "admin";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          fromAdmin ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 ${
                            fromAdmin
                              ? isDark
                                ? "bg-[#101a2b] text-white"
                                : "bg-slate-100 text-slate-900"
                              : "bg-cyan-500 text-slate-950"
                          }`}
                        >
                          <p className="mb-2 text-xs font-semibold">
                            {fromAdmin ? "CodeAgiles Support" : "You"}
                          </p>

                          <p className="whitespace-pre-wrap break-words text-sm">
                            {message.message}
                          </p>

                          <p className="mt-2 text-right text-[11px] opacity-70">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <p className={`py-6 text-center text-sm ${mutedClass}`}>
                      No conversation messages yet.
                    </p>
                  )}
                </div>

                {/* REPLY FORM */}

                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-500/10 p-5"
                >
                  {selectedTicket.status === "closed" ? (
                    <p className={`text-center text-sm ${mutedClass}`}>
                      This ticket is closed. New messages cannot be sent.
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        placeholder="Write your message..."
                        className={`${inputBase} ${inputClass}`}
                      />

                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        aria-label="Send message"
                        className="flex shrink-0 items-center justify-center rounded-xl bg-cyan-500 px-5 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {sending ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${cardClass}`}
      >
        <MessageSquare size={21} className="mt-0.5 shrink-0 text-cyan-500" />

        <div>
          <h3 className={`font-semibold ${titleClass}`}>
            Need help with AfterSale AI?
          </h3>

          <p className={`mt-1 text-sm ${mutedClass}`}>
            Our CodeAgiles Support Team is here to assist you. Create a ticket
            and track the conversation from this page.
          </p>
        </div>
      </div>
    </div>
  );
}
