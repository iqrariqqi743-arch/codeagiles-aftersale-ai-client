"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import {
  Users,
  Store,
  ShoppingCart,
  Ticket,
  RotateCcw,
  Link2,
  LoaderCircle,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// SUPER ADMIN DASHBOARD
// ==========================================

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // ==========================================
  // AUTHENTICATION & DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        // Get authenticated user
        const authResponse = await api.get("/auth/me");

        if (!authResponse.data.success) {
          throw new Error("Unauthorized");
        }

        const currentUser = authResponse.data.user;

        const role = String(currentUser?.role?.name || currentUser?.role || "")
          .toLowerCase()
          .replace(/[\s-]/g, "_");

        if (role !== "super_admin" && role !== "superadmin") {
          router.replace("/dashboard");
          return;
        }

        if (active) {
          setUser(currentUser);
        }

        // Fetch dashboard statistics
        const response = await api.get("/super-admin/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!active) return;

        if (response.data.success) {
          const dashboardStats =
            response.data.stats ??
            response.data.data?.stats ??
            response.data.data;

          if (dashboardStats && typeof dashboardStats === "object") {
            setStats(dashboardStats);
          } else {
            setError("Dashboard statistics missing from API response.");
          }
        } else {
          setError(response.data.message || "Failed to load dashboard.");
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to fetch dashboard statistics.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  // ==========================================
  // DASHBOARD STATISTICS CARDS
  // ==========================================

  const cards = [
    {
      title: "Total Merchants",
      value: stats?.total_merchants,
      icon: Users,
    },
    {
      title: "Total Stores",
      value: stats?.total_stores,
      icon: Store,
    },
    {
      title: "Connected Stores",
      value: stats?.connected_stores,
      icon: Link2,
    },
    {
      title: "Total Orders",
      value: stats?.total_orders,
      icon: ShoppingCart,
    },
    {
      title: "Total Tickets",
      value: stats?.total_tickets,
      icon: Ticket,
    },
    {
      title: "Open Tickets",
      value: stats?.open_tickets,
      icon: Ticket,
    },
    {
      title: "Total Returns",
      value: stats?.total_returns,
      icon: RotateCcw,
    },
    {
      title: "Pending Returns",
      value: stats?.pending_returns,
      icon: RotateCcw,
    },
  ];

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <div className="w-full app-bg app-text theme-transition">
      {/* ======================================
          DASHBOARD HEADING
      ====================================== */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-cyan-500">
            <LayoutDashboard size={20} />

            <span className="text-sm font-medium">Platform Administration</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold app-text">
            Platform Overview
          </h2>

          <p className="mt-2 text-sm app-muted">
            Monitor merchants, stores, orders, tickets and returns.
          </p>
        </div>

        {/* ADMIN INFO */}

        <div
          className="
            flex items-center gap-3
            rounded-xl
            border app-border
            app-bg app-text
            px-4 py-3
            shadow-sm
            theme-transition
          "
        >
          <div
            className="
              w-10 h-10
              rounded-xl
              bg-cyan-500/10
              text-cyan-500
              flex items-center justify-center
            "
          >
            <ShieldCheck size={20} />
          </div>

          <div>
            <p className="text-sm font-semibold app-text">
              {user?.name || "Super Admin"}
            </p>

            <p className="text-xs app-muted">Super Administrator</p>
          </div>
        </div>
      </div>

      {/* ======================================
          LOADING STATE
      ====================================== */}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 app-muted">
          <LoaderCircle size={24} className="animate-spin text-cyan-500" />

          <span>Loading dashboard...</span>
        </div>
      ) : error ? (
        /* ======================================
            ERROR STATE
        ====================================== */

        <div
          role="alert"
          className="
            rounded-xl
            border border-red-500/30
            bg-red-500/10
            p-5
            text-red-500
          "
        >
          {error}
        </div>
      ) : (
        /* ======================================
            STATISTICS GRID
        ====================================== */

        <div
          className="
            grid grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="
                  group
                  rounded-2xl
                  border app-border
                  app-bg app-text
                  p-6
                  shadow-sm
                  transition-all duration-300
                  hover:border-cyan-500/40
                  hover:shadow-lg
                  hover:shadow-cyan-500/5
                "
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium app-muted">{card.title}</p>

                  <div
                    className="
                      rounded-xl
                      bg-cyan-500/10
                      p-3
                      transition-colors
                      group-hover:bg-cyan-500/20
                    "
                  >
                    <Icon size={22} className="text-cyan-500" />
                  </div>
                </div>

                <p className="mt-5 text-3xl font-bold app-text">
                  {card.value ?? "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
