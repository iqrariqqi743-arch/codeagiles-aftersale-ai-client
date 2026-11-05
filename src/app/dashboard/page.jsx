"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  ShoppingBag,
  RotateCcw,
  MessageSquareText,
  ArrowUpRight,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock3,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

const upcomingModules = [
  {
    name: "Order Management",
    desc: "Track and manage customer orders from one workspace.",
    icon: ShoppingBag,
  },
  {
    name: "Returns & Refunds",
    desc: "Simplify returns and improve post-purchase experiences.",
    icon: RotateCcw,
  },
  {
    name: "Support Tickets",
    desc: "Manage customer conversations and support requests.",
    icon: MessageSquareText,
  },
];

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, storesResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/stores"),
        ]);

        if (!active) return;

        if (!profileResponse.data?.success || !storesResponse.data?.success) {
          throw new Error("Unable to load workspace data");
        }

        setUser(profileResponse.data.user);
        setStores(storesResponse.data.stores || []);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load dashboard data",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const connectedStores = stores.filter(
    (store) => store.status === "connected",
  ).length;

  const disconnectedStores = stores.filter(
    (store) => store.status !== "connected",
  ).length;

  const stats = [
    {
      title: "Total Stores",
      value: stores.length,
      icon: Store,
      iconColor: isDark ? "text-cyan-400" : "text-cyan-700",
      iconBg: isDark ? "bg-cyan-500/10" : "bg-cyan-50",
    },
    {
      title: "Connected Stores",
      value: connectedStores,
      icon: CheckCircle2,
      iconColor: isDark ? "text-emerald-400" : "text-emerald-700",
      iconBg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
    },
    {
      title: "Disconnected Stores",
      value: disconnectedStores,
      icon: Clock3,
      iconColor: isDark ? "text-amber-400" : "text-amber-700",
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-50",
    },
  ];

  const cardClass = isDark
    ? "bg-[#172235] border-white/10 hover:border-white/20"
    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-600";

  const subtleClass = isDark ? "text-slate-500" : "text-slate-500";

  const rowClass = isDark
    ? "bg-white/[0.03] border-white/5"
    : "bg-slate-50 border-slate-200";

  const accentClass = isDark
    ? "text-cyan-400 hover:text-cyan-300"
    : "text-cyan-700 hover:text-cyan-800";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-6">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <p
              className={`text-xs font-bold tracking-[0.16em] ${
                isDark ? "text-cyan-400" : "text-cyan-700"
              }`}
            >
              YOUR WORKSPACE
            </p>
          </div>

          <h2
            className={`text-2xl md:text-3xl font-bold tracking-tight ${titleClass}`}
          >
            Welcome back
            {user?.name ? `, ${user.name}` : ""} 👋
          </h2>

          <p className={`${mutedClass} mt-2 text-sm md:text-base`}>
            Here's what's happening with your AfterSale AI workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition disabled:opacity-50 ${
              isDark
                ? "border-white/10 text-slate-300 hover:bg-white/5"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            href="/dashboard/stores"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-cyan-500/10"
          >
            <Plus size={19} />
            Manage Stores
          </Link>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            isDark
              ? "bg-red-500/10 border-red-500/20 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <AlertCircle size={19} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Statistics */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`border rounded-2xl p-6 transition-all duration-200 ${cardClass}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-xl ${stat.iconBg}`}
                >
                  <Icon size={23} className={stat.iconColor} />
                </div>

                <Activity size={17} className={subtleClass} />
              </div>

              <p className={`text-sm mt-6 ${mutedClass}`}>{stat.title}</p>

              <h3 className={`text-3xl font-bold mt-2 ${titleClass}`}>
                {loading ? "..." : error ? "—" : stat.value}
              </h3>

              <p className={`text-xs mt-3 ${subtleClass}`}>
                Based on your registered stores
              </p>
            </div>
          );
        })}
      </section>

      {/* Stores and AI Section */}
      <section className="grid xl:grid-cols-3 gap-6">
        {/* Your Stores */}
        <div
          className={`xl:col-span-2 border rounded-2xl p-5 md:p-6 transition-colors ${cardClass}`}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${titleClass}`}>
                Your Stores
              </h3>

              <p className={`text-sm mt-1 ${mutedClass}`}>
                Recently added stores
              </p>
            </div>

            <Link
              href="/dashboard/stores"
              className={`text-sm font-medium flex items-center gap-1 ${accentClass}`}
            >
              View all
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3" aria-label="Loading stores">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`h-19 rounded-xl animate-pulse ${
                    isDark ? "bg-white/5" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertCircle size={34} className="text-red-400 mx-auto" />
              <p className={`text-sm mt-3 ${mutedClass}`}>
                Stores could not be loaded.
              </p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                  isDark ? "bg-white/5" : "bg-slate-100"
                }`}
              >
                <Store size={30} className={mutedClass} />
              </div>

              <h4 className={`font-semibold mt-4 ${titleClass}`}>
                No stores yet
              </h4>

              <p className={`text-sm mt-2 ${mutedClass}`}>
                Add a store to start setting up your workspace.
              </p>

              <Link
                href="/dashboard/stores"
                className={`inline-flex mt-5 text-sm font-medium ${accentClass}`}
              >
                Add your first store
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.slice(0, 5).map((store) => (
                <div
                  key={store.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${rowClass}`}
                >
                  <div
                    className={`p-3 rounded-xl ${
                      isDark ? "bg-cyan-500/10" : "bg-cyan-100"
                    }`}
                  >
                    <Store
                      size={19}
                      className={isDark ? "text-cyan-400" : "text-cyan-700"}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${titleClass}`}
                    >
                      {store.store_name}
                    </p>

                    <p className={`text-xs truncate mt-1 ${mutedClass}`}>
                      {store.store_url}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full capitalize font-medium ${
                      store.status === "connected"
                        ? isDark
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-emerald-100 text-emerald-700"
                        : isDark
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {store.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Information Card */}
        <div
          className={`border rounded-2xl p-6 flex flex-col justify-between transition-colors ${
            isDark
              ? "bg-gradient-to-br from-[#173b52] to-[#172235] border-cyan-500/20"
              : "bg-gradient-to-br from-cyan-50 via-white to-blue-50 border-cyan-200 shadow-sm"
          }`}
        >
          <div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                isDark ? "bg-cyan-400/10" : "bg-cyan-100"
              }`}
            >
              <Sparkles
                className={isDark ? "text-cyan-400" : "text-cyan-700"}
                size={25}
              />
            </div>

            <h3 className={`text-xl font-semibold ${titleClass}`}>
              AI-Powered After-Sales
            </h3>

            <p className={`text-sm leading-relaxed mt-4 ${mutedClass}`}>
              We're building a smarter way to manage orders, returns and
              customer support — all in one workspace.
            </p>
          </div>

          <div
            className={`mt-8 p-4 rounded-xl border ${
              isDark
                ? "bg-white/5 border-white/10"
                : "bg-white/80 border-cyan-100"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-cyan-300" : "text-cyan-700"
              }`}
            >
              Development Status
            </p>

            <p className={`text-sm mt-2 ${titleClass}`}>
              Workspace and store management
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className={`text-xs ${mutedClass}`}>
                AI automation coming soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Modules */}
      <section>
        <div className="mb-5">
          <h3 className={`text-xl font-semibold ${titleClass}`}>Coming Next</h3>

          <p className={`text-sm mt-1 ${mutedClass}`}>
            Modules planned for your workspace
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {upcomingModules.map((module) => {
            const Icon = module.icon;

            return (
              <div
                key={module.name}
                className={`border rounded-2xl p-6 transition-all duration-200 ${cardClass}`}
              >
                <div
                  className={`p-3 rounded-xl w-fit ${
                    isDark ? "bg-white/5" : "bg-slate-100"
                  }`}
                >
                  <Icon
                    size={23}
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  />
                </div>

                <h4 className={`font-semibold mt-5 ${titleClass}`}>
                  {module.name}
                </h4>

                <p className={`text-sm mt-2 ${mutedClass}`}>{module.desc}</p>

                <div
                  className={`flex items-center gap-2 text-xs mt-5 ${subtleClass}`}
                >
                  <Clock3 size={14} />
                  Coming soon
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
