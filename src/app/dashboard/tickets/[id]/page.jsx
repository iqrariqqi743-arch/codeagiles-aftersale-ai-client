"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import {
  ArrowLeft,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  ShoppingBag,
  MessageSquare,
  RefreshCcw,
  Loader2,
  ShieldCheck,
  Bot,
  X,
  BrainCircuit,
  Activity,
  ClipboardList,
  Lightbulb,
  Tag,
  Gauge,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const statuses = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_customer", label: "Waiting Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorities = {
  low: "bg-slate-500/10 text-slate-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

const sentimentStyles = {
  positive: "bg-emerald-500/10 text-emerald-500",
  neutral: "bg-blue-500/10 text-blue-500",
  negative: "bg-red-500/10 text-red-500",
};

const urgencyStyles = {
  low: "bg-slate-500/10 text-slate-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

export default function TicketDetailsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [kbReplyLoading, setKbReplyLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const [approving, setApproving] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const [applyingSuggestions, setApplyingSuggestions] = useState(false);
  const [analysisApplied, setAnalysisApplied] = useState(false);

  const [reply, setReply] = useState("");
  const [approved, setApproved] = useState(false);

  const [replySources, setReplySources] = useState([]);
  const [replyInformationStatus, setReplyInformationStatus] = useState("");

  const [notice, setNotice] = useState({
    type: "",
    text: "",
  });

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return localStorage.getItem("accessToken") || localStorage.getItem("token");
  };

  // --------------------------------------------------
  // API REQUEST
  // --------------------------------------------------

  const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Something went wrong.");
    }

    return result;
  };

  const showNotice = (type, text) => {
    setNotice({ type, text });
  };

  // --------------------------------------------------
  // FETCH TICKET
  // --------------------------------------------------

  const fetchTicket = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const result = await apiRequest(`/tickets/${ticketId}`);

        setTicket(result.ticket || null);
        setMessages(Array.isArray(result.messages) ? result.messages : []);
      } catch (error) {
        showNotice("error", error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    if (ticketId) {
      setAnalysis(null);
      setAnalysisError("");
      setAnalysisApplied(false);

      setReply("");
      setApproved(false);
      setReplySources([]);
      setReplyInformationStatus("");

      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  // --------------------------------------------------
  // AUTO REFRESH CONVERSATION (EVERY 5 SECONDS)
  // --------------------------------------------------

  useEffect(() => {
    if (!ticketId) return;

    let stopped = false;
    let inFlight = false;

    const syncMessages = async () => {
      if (stopped || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;

      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) return;

        const result = await response.json();
        if (stopped || result.success === false) return;

        if (Array.isArray(result.messages)) {
          setMessages((previous) => {
            const incoming = result.messages;
            const same =
              previous.length === incoming.length &&
              previous.every(
                (item, index) =>
                  item.id === incoming[index].id &&
                  item.message === incoming[index].message &&
                  item.created_at === incoming[index].created_at,
              );
            return same ? previous : incoming;
          });
        }

        if (result.ticket) {
          setTicket((previous) => {
            if (!previous) return result.ticket;
            // Keep the existing page state if the ticket has not changed.
            return previous.updated_at === result.ticket.updated_at &&
              previous.status === result.ticket.status
              ? previous
              : { ...previous, ...result.ticket };
          });
        }
      } catch (error) {
        // A temporary network failure should not interrupt editing a reply.
        console.debug("Background ticket refresh failed:", error);
      } finally {
        inFlight = false;
      }
    };

    const intervalId = window.setInterval(syncMessages, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") syncMessages();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ticketId]);

  // --------------------------------------------------
  // AI TICKET ANALYSIS
  // --------------------------------------------------

  const handleAnalyzeTicket = async () => {
    if (!ticketId || analysisLoading) return;

    try {
      setAnalysisLoading(true);
      setAnalysisError("");
      setAnalysis(null);
      setAnalysisApplied(false);

      const result = await apiRequest(`/ai/tickets/${ticketId}/analyze`, {
        method: "POST",
      });

      if (!result.analysis) {
        throw new Error(result.message || "AI analysis was not returned.");
      }

      setAnalysis(result.analysis);

      showNotice("success", "AI ticket analysis completed successfully.");
    } catch (error) {
      setAnalysisError(error.message);
      showNotice("error", error.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // --------------------------------------------------
  // APPLY AI TICKET SUGGESTIONS
  // --------------------------------------------------

  const handleApplySuggestions = async () => {
    if (!analysis || applyingSuggestions) return;

    const categoryMap = {
      general: "general",
      delivery: "delivery",
      "damaged product": "damaged_product",
      "wrong product": "wrong_product",
      return: "return",
      refund: "refund",
      other: "other",
    };

    const suggestedCategory = String(analysis.suggested_category || "")
      .trim()
      .toLowerCase()
      .replaceAll("_", " ");

    const suggestedPriority = String(analysis.suggested_priority || "")
      .trim()
      .toLowerCase();

    const category = categoryMap[suggestedCategory];
    const priority = suggestedPriority;

    if (!category || !Object.keys(priorities).includes(priority)) {
      showNotice(
        "error",
        "AI returned an invalid category or priority. Please analyze the ticket again.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Apply these AI suggestions to this ticket?\n\nCategory: ${formatLabel(category)}\nPriority: ${formatLabel(priority)}\n\nYour current ticket category and priority will be updated.`,
    );

    if (!confirmed) return;

    try {
      setApplyingSuggestions(true);

      const result = await apiRequest(
        `/tickets/${ticketId}/apply-ai-suggestions`,
        {
          method: "PATCH",
          body: JSON.stringify({
            category,
            priority,
          }),
        },
      );

      if (result.ticket) {
        setTicket((previous) => ({
          ...previous,
          ...result.ticket,
        }));
      } else {
        setTicket((previous) => ({
          ...previous,
          category,
          priority,
        }));
      }

      setAnalysisApplied(true);

      showNotice(
        "success",
        "AI suggestions applied successfully. Ticket category and priority have been updated.",
      );
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setApplyingSuggestions(false);
    }
  };

  // --------------------------------------------------
  // TICKET STATUS
  // --------------------------------------------------

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    try {
      setStatusLoading(true);

      await apiRequest(`/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      setTicket((previous) => ({
        ...previous,
        status: newStatus,
      }));

      showNotice("success", "Ticket status updated successfully.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setStatusLoading(false);
    }
  };

  // --------------------------------------------------
  // CLEAR REPLY METADATA
  // --------------------------------------------------

  const clearReplyMetadata = () => {
    setReplySources([]);
    setReplyInformationStatus("");
  };

  // --------------------------------------------------
  // EXISTING AI SUGGESTION API
  // --------------------------------------------------

  const handleGenerateAI = async () => {
    if (!ticketId || aiLoading || kbReplyLoading) return;

    try {
      setAiLoading(true);
      setApproved(false);
      setReply("");
      clearReplyMetadata();

      const result = await apiRequest(`/ai/tickets/${ticketId}/suggest`, {
        method: "POST",
      });

      const suggestion =
        result.suggestion ||
        result.reply ||
        result.draft ||
        result.data?.suggestion ||
        "";

      if (!suggestion || !suggestion.trim()) {
        throw new Error("AI response did not contain a reply suggestion.");
      }

      setReply(suggestion);

      showNotice("success", "AI reply suggestion generated successfully.");
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // --------------------------------------------------
  // NEW KNOWLEDGE BASE REPLY API
  // --------------------------------------------------

  const handleGenerateKnowledgeBaseReply = async () => {
    if (!ticketId || kbReplyLoading || aiLoading) return;

    try {
      setKbReplyLoading(true);
      setApproved(false);
      setReply("");
      clearReplyMetadata();

      const result = await apiRequest(
        `/ai/tickets/${ticketId}/generate-reply`,
        {
          method: "POST",
        },
      );

      if (!result.reply || !result.reply.trim()) {
        throw new Error("AI response did not contain a reply draft.");
      }

      setReply(result.reply);

      setReplySources(Array.isArray(result.sources) ? result.sources : []);

      setReplyInformationStatus(result.information_status || "not_available");

      showNotice(
        "success",
        "Knowledge Base reply generated successfully. Please review before approving.",
      );
    } catch (error) {
      showNotice("error", error.message);
    } finally {
      setKbReplyLoading(false);
    }
  };

  // --------------------------------------------------
  // APPROVE REPLY
  // --------------------------------------------------

  const handleApprove = async () => {
    if (!reply.trim()) {
      showNotice("error", "Please write a reply before approving.");
      return;
    }

    try {
      setApproving(true);

      await apiRequest(`/tickets/${ticketId}/approve-reply`, {
        method: "POST",
        body: JSON.stringify({
          message: reply.trim(),
        }),
      });

      setApproved(true);

      showNotice(
        "success",
        "Reply approved. You can now send it to the customer.",
      );
    } catch (error) {
      setApproved(false);
      showNotice("error", error.message);
    } finally {
      setApproving(false);
    }
  };

  // --------------------------------------------------
  // SEND REPLY
  // --------------------------------------------------

  const handleSendReply = async () => {
    if (!approved) {
      showNotice("error", "Approve the reply before sending.");
      return;
    }

    if (!reply.trim()) {
      showNotice("error", "Please enter a reply.");
      return;
    }

    try {
      setSending(true);

      const result = await apiRequest(`/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: reply.trim(),
        }),
      });

      if (result.ticket_message) {
        setMessages((previous) => [...previous, result.ticket_message]);
      } else {
        await fetchTicket(true);
      }

      setReply("");
      setApproved(false);
      clearReplyMetadata();

      const emailStatus = result.email_notification?.status;

      const emailSent =
        result.email_notification?.sent === true || emailStatus === "sent";

      const approvalStatusUpdated = result.approval_status_updated === true;

      if (emailSent && approvalStatusUpdated) {
        showNotice(
          "success",
          "Reply saved and email notification sent successfully.",
        );
      } else if (emailSent && !approvalStatusUpdated) {
        showNotice(
          "error",
          "Email was accepted by SMTP, but approval status needs verification. Do not resend.",
        );
      } else {
        showNotice(
          "error",
          result.message || "Reply saved, but email notification was not sent.",
        );
      }
    } catch (error) {
      const errorMessage = error.message || "";

      if (
        errorMessage.includes("Please approve this reply before sending it") ||
        errorMessage.includes("already been used")
      ) {
        setApproved(false);

        showNotice(
          "error",
          "This reply has already been sent or its approval has been used. Duplicate sending is blocked.",
        );

        await fetchTicket(true).catch(() => {});
        return;
      }

      showNotice("error", errorMessage || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // REPLY EDIT
  // --------------------------------------------------

  const handleReplyChange = (value) => {
    setReply(value);
    setApproved(false);
  };

  // --------------------------------------------------
  // STYLING
  // --------------------------------------------------

  const cardClass = isDark
    ? "border-white/10 bg-[#111c2e]"
    : "border-slate-200 bg-white";

  const headingClass = isDark ? "text-white" : "text-slate-900";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = `
    w-full rounded-xl border px-4 py-3 text-sm outline-none transition
    ${
      isDark
        ? "border-white/10 bg-[#0b1220] text-white placeholder:text-slate-600 focus:border-cyan-500"
        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-500"
    }
  `;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString();
  };

  const getSenderLabel = (sender) => {
    if (sender === "customer") return "Customer";
    if (sender === "owner") return "You";

    return sender || "Unknown";
  };

  const formatLabel = (value = "") =>
    String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={36} />

        <p className={`mt-4 text-sm ${mutedClass}`}>
          Loading ticket details...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // TICKET NOT FOUND
  // --------------------------------------------------

  if (!ticket) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <AlertCircle size={42} className="text-red-500" />

        <h2 className={`mt-4 text-xl font-bold ${headingClass}`}>
          Ticket not found
        </h2>

        <p className={`mt-2 text-sm ${mutedClass}`}>
          {notice.text || "This ticket could not be loaded."}
        </p>

        <button
          onClick={() => router.back()}
          className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-screen space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className={`mb-4 inline-flex items-center gap-2 text-sm ${mutedClass} transition hover:text-cyan-500`}
          >
            <ArrowLeft size={17} />
            Back to Tickets
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`text-2xl font-bold sm:text-3xl ${headingClass}`}>
              {ticket.subject}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                priorities[ticket.priority] || priorities.medium
              }`}
            >
              {formatLabel(ticket.priority)}
            </span>
          </div>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Ticket #{ticket.ticket_number || ticket.id}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTicket(true)}
          disabled={refreshing}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
            isDark
              ? "border-white/10 text-slate-300 hover:bg-white/5"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <RefreshCcw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* NOTIFICATION */}
      {notice.text && (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
              : "border-red-500/20 bg-red-500/10 text-red-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{notice.text}</span>

          <button
            type="button"
            onClick={() => setNotice({ type: "", text: "" })}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* LEFT CONTENT */}
        <div className="space-y-6">
          {/* CONVERSATION */}
          <section
            className={`overflow-hidden rounded-2xl border ${cardClass}`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <MessageSquare size={20} />
                </div>

                <div>
                  <h2 className={`font-semibold ${headingClass}`}>
                    Conversation
                  </h2>

                  <p className={`text-xs ${mutedClass}`}>
                    {messages.length} messages
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[600px] space-y-5 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <p className={`py-10 text-center text-sm ${mutedClass}`}>
                  No messages found.
                </p>
              ) : (
                messages.map((item, index) => {
                  const isCustomer = item.sender_type === "customer";

                  return (
                    <div
                      key={`item.id-${index}`}
                      className={`flex gap-3 ${
                        isCustomer ? "justify-start" : "justify-end"
                      }`}
                    >
                      {isCustomer && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                          <User size={18} />
                        </div>
                      )}

                      <div className="max-w-[85%]">
                        <div
                          className={`mb-1 flex items-center gap-2 ${
                            isCustomer ? "" : "justify-end"
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold ${mutedClass}`}
                          >
                            {getSenderLabel(item.sender_type)}
                          </span>

                          <span className={`text-[10px] ${mutedClass}`}>
                            {formatDate(item.created_at)}
                          </span>
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isCustomer
                              ? isDark
                                ? "rounded-tl-sm bg-[#1c2b41] text-slate-200"
                                : "rounded-tl-sm bg-slate-100 text-slate-800"
                              : "rounded-tr-sm bg-gradient-to-br from-cyan-600 to-blue-600 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      {!isCustomer && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                          <User size={18} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* REPLY EDITOR */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <Bot size={21} />
                </div>

                <div>
                  <h2 className={`font-semibold ${headingClass}`}>
                    Reply Assistant
                  </h2>

                  <p className={`text-xs ${mutedClass}`}>
                    Generate, review and approve before sending.
                  </p>
                </div>
              </div>

              {/* GENERATION BUTTONS */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading || kbReplyLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiLoading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Sparkles size={17} />
                  )}

                  {aiLoading ? "Generating..." : "Generate AI Reply"}
                </button>

                <button
                  type="button"
                  onClick={handleGenerateKnowledgeBaseReply}
                  disabled={kbReplyLoading || aiLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {kbReplyLoading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <BrainCircuit size={17} />
                  )}

                  {kbReplyLoading
                    ? "Generating KB Reply..."
                    : "Generate KB Reply"}
                </button>
              </div>
            </div>

            {/* REPLY TEXTAREA */}
            <textarea
              value={reply}
              onChange={(event) => handleReplyChange(event.target.value)}
              placeholder="Generate an AI reply or write your own response here..."
              rows={8}
              maxLength={10000}
              disabled={sending || approving || aiLoading || kbReplyLoading}
              className={`${inputClass} resize-y leading-relaxed`}
            />

            {/* KNOWLEDGE BASE INFORMATION */}
            {replyInformationStatus && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${mutedClass}`}>
                    Knowledge Base Information Status
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      replyInformationStatus === "available"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : replyInformationStatus === "partially_available"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {formatLabel(replyInformationStatus)}
                  </span>
                </div>

                {replySources.length > 0 && (
                  <div
                    className={`rounded-xl border p-4 ${
                      isDark
                        ? "border-white/10 bg-[#0b1220]"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className={`mb-3 text-xs font-semibold ${headingClass}`}>
                      Knowledge Base Sources
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {replySources.map((source) => (
                        <span
                          key={source.id}
                          className="rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-500"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className={`text-xs ${mutedClass}`}>
                  AI-generated draft. Review and edit it before approval.
                </p>
              </div>
            )}

            {/* CHARACTER COUNT AND APPROVAL STATUS */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedClass}`}>
                {reply.length} / 10000 characters
              </p>

              {approved && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
                  <ShieldCheck size={14} />
                  Approved
                </span>
              )}
            </div>

            {/* APPROVE AND SEND */}
            <div
              className={`mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={handleApprove}
                disabled={
                  !reply.trim() ||
                  approved ||
                  approving ||
                  sending ||
                  aiLoading ||
                  kbReplyLoading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}

                {approved ? "Reply Approved" : "Approve Reply"}
              </button>

              <button
                type="button"
                onClick={handleSendReply}
                disabled={!approved || !reply.trim() || sending || approving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}

                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>

            <div
              className={`mt-4 flex items-start gap-2 text-xs ${mutedClass}`}
            >
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0 text-emerald-500"
              />

              <p>
                AI never sends messages automatically. Review and approve the
                exact reply before sending it to the customer.
              </p>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* AI TICKET ANALYSIS */}
          <section
            className={`overflow-hidden rounded-2xl border ${cardClass}`}
          >
            <div className="border-b border-slate-500/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                  <BrainCircuit size={23} />
                </div>

                <div>
                  <h3 className={`font-semibold ${headingClass}`}>
                    AI Ticket Analysis
                  </h3>

                  <p className={`mt-1 text-xs ${mutedClass}`}>
                    Understand the customer's issue
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeTicket}
                disabled={analysisLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analysisLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}

                {analysisLoading
                  ? "Analyzing Ticket..."
                  : analysis
                    ? "Analyze Again"
                    : "Analyze Ticket"}
              </button>
            </div>

            <div className="space-y-4 p-5">
              {analysisLoading && (
                <div className="py-5 text-center">
                  <Loader2
                    size={28}
                    className="mx-auto animate-spin text-purple-500"
                  />

                  <p className={`mt-3 text-xs ${mutedClass}`}>
                    Gemini is analyzing the ticket and conversation...
                  </p>
                </div>
              )}

              {analysisError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <AlertCircle size={15} />
                    Analysis Failed
                  </div>

                  {analysisError}
                </div>
              )}

              {!analysis && !analysisLoading && !analysisError && (
                <div className="py-5 text-center">
                  <Activity size={30} className={`mx-auto ${mutedClass}`} />

                  <p className={`mt-3 text-sm font-medium ${headingClass}`}>
                    No analysis yet
                  </p>

                  <p className={`mt-1 text-xs leading-5 ${mutedClass}`}>
                    Click Analyze Ticket to get sentiment, urgency, summary and
                    recommended action.
                  </p>
                </div>
              )}

              {analysis && !analysisLoading && (
                <>
                  {/* SENTIMENT */}
                  <div>
                    <p className={`mb-2 text-xs font-medium ${mutedClass}`}>
                      Customer Sentiment
                    </p>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                        sentimentStyles[
                          String(analysis.sentiment || "neutral").toLowerCase()
                        ] || sentimentStyles.neutral
                      }`}
                    >
                      {formatLabel(analysis.sentiment || "neutral")}
                    </span>
                  </div>

                  {/* URGENCY */}
                  <div>
                    <p className={`mb-2 text-xs font-medium ${mutedClass}`}>
                      Urgency Level
                    </p>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                        urgencyStyles[
                          String(analysis.urgency || "medium").toLowerCase()
                        ] || urgencyStyles.medium
                      }`}
                    >
                      <Gauge size={14} className="mr-1.5" />
                      {formatLabel(analysis.urgency || "medium")}
                    </span>
                  </div>

                  {/* SUMMARY */}
                  <div className="border-t border-slate-500/10 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ClipboardList size={16} className="text-purple-500" />

                      <p className={`text-xs font-semibold ${headingClass}`}>
                        AI Summary
                      </p>
                    </div>

                    <p className={`text-sm leading-6 ${mutedClass}`}>
                      {analysis.summary || "No summary provided."}
                    </p>
                  </div>

                  {/* SUGGESTED CATEGORY */}
                  <div className="border-t border-slate-500/10 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Tag size={16} className="text-cyan-500" />

                      <p className={`text-xs font-semibold ${headingClass}`}>
                        Suggested Category
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                        isDark
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-cyan-50 text-cyan-700"
                      }`}
                    >
                      {formatLabel(analysis.suggested_category || "general")}
                    </span>
                  </div>

                  {/* SUGGESTED PRIORITY */}
                  <div className="border-t border-slate-500/10 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Activity size={16} className="text-orange-500" />

                      <p className={`text-xs font-semibold ${headingClass}`}>
                        Suggested Priority
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                        priorities[
                          String(
                            analysis.suggested_priority || "medium",
                          ).toLowerCase()
                        ] || priorities.medium
                      }`}
                    >
                      {formatLabel(analysis.suggested_priority || "medium")}
                    </span>
                  </div>

                  {/* RECOMMENDED ACTION */}
                  <div className="border-t border-slate-500/10 pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500" />

                      <p className={`text-xs font-semibold ${headingClass}`}>
                        Recommended Action
                      </p>
                    </div>

                    <p className={`text-sm leading-6 ${mutedClass}`}>
                      {analysis.recommended_action ||
                        "No recommended action provided."}
                    </p>
                  </div>

                  {/* APPLY AI SUGGESTIONS */}
                  <div className="border-t border-slate-500/10 pt-4">
                    {analysisApplied ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-500">
                        <CheckCircle2 size={18} />
                        AI Suggestions Applied
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplySuggestions}
                        disabled={applyingSuggestions || analysisLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {applyingSuggestions ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}

                        {applyingSuggestions
                          ? "Applying Suggestions..."
                          : "Apply Suggestions"}
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={16}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />

                      <p className="text-xs leading-5 text-amber-600 dark:text-amber-400">
                        {analysisApplied
                          ? "AI suggestions have been applied. Ticket category and priority are now updated. You can review the changes in Ticket Details."
                          : "AI recommendations only. Ticket category and priority have not been changed automatically. Review the suggestions before taking action."}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* CUSTOMER */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <h3 className={`mb-5 font-semibold ${headingClass}`}>
              Customer Information
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                <User size={23} />
              </div>

              <div className="min-w-0">
                <h4 className={`truncate font-semibold ${headingClass}`}>
                  {ticket.customer_name}
                </h4>

                <p className={`truncate text-xs ${mutedClass}`}>
                  {ticket.customer_email || "No email provided"}
                </p>
              </div>
            </div>

            <div
              className={`mt-5 border-t pt-4 ${
                isDark ? "border-white/10" : "border-slate-200"
              }`}
            >
              <p className={`text-xs ${mutedClass}`}>Store</p>

              <p className={`mt-1 text-sm font-medium ${headingClass}`}>
                {ticket.store_name || "N/A"}
              </p>
            </div>
          </section>

          {/* ORDER */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag size={19} className="text-cyan-500" />

              <h3 className={`font-semibold ${headingClass}`}>
                Order Information
              </h3>
            </div>

            <p className={`text-xs ${mutedClass}`}>Order Number</p>

            <p className={`mt-1 font-semibold ${headingClass}`}>
              {ticket.order_number || "No linked order"}
            </p>

            {/* ORDER VERIFICATION */}
            <div className="mt-5 border-t border-slate-500/10 pt-4">
              <p className={`mb-2 text-xs ${mutedClass}`}>Order Verification</p>

              {(() => {
                const verificationStatus =
                  ticket.order_verification?.status || "unknown";

                const verificationStyles = {
                  verified: "bg-emerald-500/10 text-emerald-500",
                  customer_mismatch: "bg-red-500/10 text-red-500",
                  no_products: "bg-amber-500/10 text-amber-500",
                  no_linked_order: "bg-slate-500/10 text-slate-500",
                  unknown: "bg-slate-500/10 text-slate-500",
                };

                return (
                  <>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        verificationStyles[verificationStatus] ||
                        verificationStyles.unknown
                      }`}
                    >
                      {verificationStatus === "verified" ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}

                      {formatLabel(verificationStatus)}
                    </span>

                    <p className={`mt-3 text-xs leading-5 ${mutedClass}`}>
                      {ticket.order_verification?.message ||
                        "Order verification information is not available."}
                    </p>
                  </>
                );
              })()}
            </div>

            {/* LINKED ORDER DETAILS */}
            {ticket.linked_order && (
              <div className="mt-4 space-y-3 border-t border-slate-500/10 pt-4">
                <div>
                  <p className={`text-xs ${mutedClass}`}>Order Customer</p>
                  <p className={`mt-1 text-sm font-medium ${headingClass}`}>
                    {ticket.linked_order.customer_name || "N/A"}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${mutedClass}`}>Order Email</p>
                  <p className={`mt-1 break-all text-sm ${headingClass}`}>
                    {ticket.linked_order.customer_email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className={`text-xs ${mutedClass}`}>Products</p>
                  <p className={`mt-1 text-sm ${headingClass}`}>
                    {ticket.linked_order.items?.length || 0} products
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* TICKET DETAILS */}
          <section className={`rounded-2xl border p-5 ${cardClass}`}>
            <h3 className={`mb-5 font-semibold ${headingClass}`}>
              Ticket Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`mb-2 block text-xs ${mutedClass}`}>
                  Ticket Status
                </label>

                <select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  disabled={statusLoading}
                  className={inputClass}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                {statusLoading && (
                  <p className="mt-2 text-xs text-cyan-500">
                    Updating status...
                  </p>
                )}
              </div>

              <div>
                <p className={`text-xs ${mutedClass}`}>Priority</p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                    priorities[ticket.priority] || priorities.medium
                  }`}
                >
                  {formatLabel(ticket.priority)}
                </span>
              </div>

              <div>
                <p className={`text-xs ${mutedClass}`}>Category</p>

                <p
                  className={`mt-1 text-sm font-medium capitalize ${headingClass}`}
                >
                  {(ticket.category || "general").replaceAll("_", " ")}
                </p>
              </div>

              <div>
                <p className={`text-xs ${mutedClass}`}>Created At</p>

                <p className={`mt-1 text-sm ${headingClass}`}>
                  {formatDate(ticket.created_at)}
                </p>
              </div>

              <div>
                <p className={`text-xs ${mutedClass}`}>Last Updated</p>

                <p className={`mt-1 text-sm ${headingClass}`}>
                  {formatDate(ticket.updated_at)}
                </p>
              </div>
            </div>
          </section>

          {/* AI INFO */}
          <section className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-5">
            <div className="flex items-center gap-2 text-purple-500">
              <Sparkles size={19} />

              <h3 className="font-semibold">AI Powered Support</h3>
            </div>

            <p className={`mt-3 text-xs leading-relaxed ${mutedClass}`}>
              Gemini uses ticket information, conversation history and active
              Knowledge Base articles to prepare a relevant customer reply.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
