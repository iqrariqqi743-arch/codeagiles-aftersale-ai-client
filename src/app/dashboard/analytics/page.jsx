"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Ticket,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

const COLORS = ["#06b6d4", "#3b82f6", "#f59e0b", "#10b981", "#a855f7"];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  cardClass,
  titleClass,
  mutedClass,
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition hover:-translate-y-1 hover:border-cyan-500/30 ${cardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${mutedClass}`}>{title}</p>

          <h3
            className={`mt-3 text-3xl font-bold tracking-tight ${titleClass}`}
          >
            {value ?? 0}
          </h3>

          <p className={`mt-2 text-xs ${mutedClass}`}>{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  cardClass,
  titleClass,
  mutedClass,
}) {
  return (
    <div className={`rounded-2xl border p-5 ${cardClass}`}>
      <div className="mb-6">
        <h3 className={`font-semibold ${titleClass}`}>{title}</h3>
        <p className={`mt-1 text-sm ${mutedClass}`}>{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardClass = isDark
    ? "bg-[#172235] border-white/10"
    : "bg-white border-slate-200 shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const secondaryClass = isDark
    ? "border-white/10 text-slate-300 hover:bg-white/5"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  const chartTextColor = isDark ? "#94a3b8" : "#64748b";
  const chartGridColor = isDark ? "#ffffff12" : "#e2e8f0";
  const tooltipBackground = isDark ? "#172235" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  // ==========================================
  // API ERROR HANDLER
  // ==========================================

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

  // ==========================================
  // FETCH ANALYTICS
  // ==========================================

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/analytics/overview");

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to fetch analytics");
      }

      setOverview(response.data.overview);
    } catch (err) {
      console.error("Analytics Error:", err);
      handleApiError(err, "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ==========================================
  // ANALYTICS DATA
  // ==========================================

  const tickets = overview?.tickets || {};
  const messages = overview?.messages || {};
  const replies = overview?.replies || {};
  const verification = overview?.verification || {};

  const ticketChartData = [
    { name: "Open", value: tickets.open || 0 },
    { name: "In Progress", value: tickets.in_progress || 0 },
    { name: "Waiting", value: tickets.waiting_customer || 0 },
    { name: "Resolved", value: tickets.resolved || 0 },
    { name: "Closed", value: tickets.closed || 0 },
  ];

  const messageChartData = [
    { name: "Customer", value: messages.customer || 0 },
    { name: "Owner", value: messages.owner || 0 },
  ];

  const approvalChartData = [
    { name: "Approved", value: replies.approved || 0 },
    { name: "Sending", value: replies.sending || 0 },
    { name: "Sent", value: replies.sent || 0 },
    { name: "Cancelled", value: replies.cancelled || 0 },
  ];

  const chartTooltipStyle = {
    backgroundColor: tooltipBackground,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: "12px",
    color: isDark ? "#ffffff" : "#0f172a",
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading && !overview) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw size={36} className="mx-auto animate-spin text-cyan-500" />

          <p className={`mt-4 text-sm font-medium ${mutedClass}`}>
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error && !overview) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div
          className={`w-full max-w-md rounded-2xl border p-8 text-center ${cardClass}`}
        >
          <AlertCircle size={42} className="mx-auto text-red-500" />

          <h2 className={`mt-4 text-lg font-semibold ${titleClass}`}>
            Analytics unavailable
          </h2>

          <p className={`mt-2 text-sm ${mutedClass}`}>{error}</p>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-8">
      {/* BACK */}
      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-sm ${mutedClass}`}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-cyan-500 mb-2">
            BUSINESS INTELLIGENCE
          </p>

          <h1 className={`text-3xl font-bold ${titleClass}`}>
            Analytics Overview
          </h1>

          <p className={`text-sm mt-2 ${mutedClass}`}>
            Monitor your tickets, customer conversations and AI reply activity.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm disabled:opacity-50 ${secondaryClass}`}
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle size={19} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* TICKET STATISTICS */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Ticket size={19} className="text-cyan-500" />

          <h2 className={`font-semibold ${titleClass}`}>Ticket Statistics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Tickets"
            value={tickets.total}
            subtitle="All registered tickets"
            icon={Ticket}
            color="bg-cyan-500/10 text-cyan-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Open Tickets"
            value={tickets.open}
            subtitle="Waiting for attention"
            icon={AlertCircle}
            color="bg-amber-500/10 text-amber-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="In Progress"
            value={tickets.in_progress}
            subtitle="Currently being handled"
            icon={Activity}
            color="bg-blue-500/10 text-blue-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Resolved Tickets"
            value={tickets.resolved}
            subtitle="Successfully resolved"
            icon={CheckCircle2}
            color="bg-emerald-500/10 text-emerald-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />
        </div>
      </section>

      {/* MORE TICKET STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Waiting Customer"
          value={tickets.waiting_customer}
          subtitle="Waiting for customer response"
          icon={Clock3}
          color="bg-orange-500/10 text-orange-500"
          cardClass={cardClass}
          titleClass={titleClass}
          mutedClass={mutedClass}
        />

        <StatCard
          title="Closed Tickets"
          value={tickets.closed}
          subtitle="Closed conversations"
          icon={XCircle}
          color="bg-rose-500/10 text-rose-500"
          cardClass={cardClass}
          titleClass={titleClass}
          mutedClass={mutedClass}
        />

        <StatCard
          title="Real Tickets"
          value={tickets.real}
          subtitle={`${tickets.demo || 0} demo tickets`}
          icon={TrendingUp}
          color="bg-violet-500/10 text-violet-500"
          cardClass={cardClass}
          titleClass={titleClass}
          mutedClass={mutedClass}
        />
      </div>

      {/* MESSAGE STATISTICS */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={19} className="text-cyan-500" />

          <h2 className={`font-semibold ${titleClass}`}>
            Customer Conversations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Messages"
            value={messages.total}
            subtitle="All ticket messages"
            icon={MessageSquare}
            color="bg-cyan-500/10 text-cyan-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Customer Messages"
            value={messages.customer}
            subtitle="Messages received from customers"
            icon={Mail}
            color="bg-blue-500/10 text-blue-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Owner Messages"
            value={messages.owner}
            subtitle="Messages sent by store owners"
            icon={Activity}
            color="bg-purple-500/10 text-purple-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />
        </div>
      </section>

      {/* AI REPLY AND VERIFICATION */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={19} className="text-cyan-500" />

          <h2 className={`font-semibold ${titleClass}`}>
            AI Reply & Verification
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Approvals"
            value={replies.total_approvals}
            subtitle="Reply approval records"
            icon={CheckCircle2}
            color="bg-cyan-500/10 text-cyan-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Emails Sent"
            value={replies.sent}
            subtitle="Successfully sent replies"
            icon={Mail}
            color="bg-emerald-500/10 text-emerald-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Verified"
            value={verification.verified}
            subtitle="Customer verification passed"
            icon={ShieldCheck}
            color="bg-green-500/10 text-green-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />

          <StatCard
            title="Customer Mismatch"
            value={verification.customer_mismatch}
            subtitle="Verification mismatch records"
            icon={AlertCircle}
            color="bg-red-500/10 text-red-500"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          />
        </div>
      </section>

      {/* CHARTS */}
      <section>
        <div className="mb-4">
          <h2 className={`font-semibold ${titleClass}`}>Analytics Reports</h2>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Visual breakdown of your current records.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* TICKET CHART */}
          <ChartCard
            title="Tickets by Status"
            subtitle="Number of tickets in each status"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ticketChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={chartGridColor}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTextColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={chartTooltipStyle} />

                  <Bar
                    dataKey="value"
                    name="Tickets"
                    fill="#06b6d4"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* MESSAGE CHART */}
          <ChartCard
            title="Message Distribution"
            subtitle="Customer and owner message comparison"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          >
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={messageChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {messageChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index]} />
                    ))}
                  </Pie>

                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-5">
              {messageChartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />

                  <span className={`text-sm ${mutedClass}`}>
                    {item.name}:{" "}
                    <strong className={titleClass}>{item.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* APPROVAL CHART */}
          <ChartCard
            title="Reply Approval Status"
            subtitle="Current status of reply approvals"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          >
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={approvalChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={chartGridColor}
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: chartTextColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={75}
                    tick={{ fill: chartTextColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip contentStyle={chartTooltipStyle} />

                  <Bar
                    dataKey="value"
                    name="Approvals"
                    fill="#06b6d4"
                    radius={[0, 7, 7, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* APPROVAL CATEGORIES */}
          <ChartCard
            title="Reply Categories"
            subtitle="Breakdown by approval type"
            cardClass={cardClass}
            titleClass={titleClass}
            mutedClass={mutedClass}
          >
            <div className="space-y-6 pt-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${mutedClass}`}>
                    Order Specific
                  </span>

                  <strong className={titleClass}>
                    {replies.order_specific || 0}
                  </strong>
                </div>

                <div
                  className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                >
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{
                      width: `${
                        replies.total_approvals
                          ? (replies.order_specific / replies.total_approvals) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${mutedClass}`}>
                    Verification Requests
                  </span>

                  <strong className={titleClass}>
                    {replies.verification_request || 0}
                  </strong>
                </div>

                <div
                  className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                >
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${
                        replies.total_approvals
                          ? (replies.verification_request /
                              replies.total_approvals) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div
                className={`rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}
              >
                <p className={`text-sm ${mutedClass}`}>Total reply approvals</p>

                <p className={`mt-1 text-2xl font-bold ${titleClass}`}>
                  {replies.total_approvals || 0}
                </p>
              </div>
            </div>
          </ChartCard>
        </div>
      </section>

      {/* SUMMARY */}
      <div
        className={`rounded-2xl border p-5 ${
          isDark
            ? "border-cyan-500/20 bg-cyan-500/5"
            : "border-cyan-100 bg-cyan-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 shrink-0 text-cyan-500" size={20} />

          <div>
            <h3 className={`font-semibold ${titleClass}`}>Analytics Summary</h3>

            <p className={`mt-1 text-sm leading-6 ${mutedClass}`}>
              These statistics are based on your current tickets, messages,
              reply approvals and verification records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
