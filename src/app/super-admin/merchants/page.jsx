"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

import {
  ArrowLeft,
  Users,
  Store,
  Mail,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  ShieldCheck,
  Search,
} from "lucide-react";

// ==========================================
// SUPER ADMIN MERCHANTS PAGE
// ==========================================

export default function SuperAdminMerchantsPage() {
  const router = useRouter();

  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ==========================================
  // FETCH MERCHANTS
  // ==========================================

  const fetchMerchants = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await api.get("/super-admin/merchants", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          const data = response.data;

          const merchantList =
            data.merchants ??
            data.data?.merchants ??
            (Array.isArray(data.data) ? data.data : []);

          if (!Array.isArray(merchantList)) {
            throw new Error("Invalid merchants response format");
          }

          setMerchants(merchantList);
        } else {
          setError(response.data.message || "Failed to load merchants.");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");

          router.replace("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to fetch merchants.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    // Super Admin role verification is handled
    // by the parent Super Admin layout.

    fetchMerchants();
  }, [router, fetchMerchants]);

  // ==========================================
  // SEARCH MERCHANTS
  // ==========================================

  const filteredMerchants = merchants.filter((merchant) => {
    const keyword = search.trim().toLowerCase();

    return (
      String(merchant.name || "")
        .toLowerCase()
        .includes(keyword) ||
      String(merchant.email || "")
        .toLowerCase()
        .includes(keyword) ||
      String(merchant.id || "").includes(keyword)
    );
  });

  // ==========================================
  // TOTAL MERCHANT STORES
  // ==========================================

  const totalStores = merchants.reduce((total, merchant) => {
    return total + Number(merchant.total_stores ?? merchant.store_count ?? 0);
  }, 0);

  // ==========================================
  // MERCHANTS PAGE UI
  // ==========================================

  return (
    <div className="w-full app-bg app-text theme-transition">
      {/* ======================================
          PAGE HEADING
      ====================================== */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* BACK TO DASHBOARD */}

          <Link
            href="/super-admin"
            className="
              mb-4
              inline-flex items-center gap-2
              text-sm app-muted
              hover:text-cyan-500
              transition-colors
            "
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="
                rounded-xl
                bg-cyan-500/10
                p-3
              "
            >
              <Users size={26} className="text-cyan-500" />
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-bold app-text">
                Merchants Management
              </h2>

              <p className="mt-2 text-sm app-muted">
                Manage and monitor registered merchants on your platform.
              </p>
            </div>
          </div>
        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={() => fetchMerchants(true)}
          disabled={loading || refreshing}
          className="
            flex items-center gap-2
            rounded-xl
            bg-cyan-500
            px-5 py-3
            font-semibold text-white
            transition-all duration-200
            hover:bg-cyan-600
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ======================================
          STATISTICS CARDS
      ====================================== */}

      <div
        className="
          mb-8
          grid grid-cols-1
          gap-5
          sm:grid-cols-2
        "
      >
        {/* TOTAL MERCHANTS */}

        <div
          className="
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium app-muted">Total Merchants</p>

            <div className="rounded-xl bg-cyan-500/10 p-3">
              <Users size={22} className="text-cyan-500" />
            </div>
          </div>

          <h3 className="mt-5 text-3xl font-bold app-text">
            {loading ? "..." : merchants.length}
          </h3>
        </div>

        {/* TOTAL MERCHANT STORES */}

        <div
          className="
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
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium app-muted">Merchant Stores</p>

            <div className="rounded-xl bg-purple-500/10 p-3">
              <Store size={22} className="text-purple-500" />
            </div>
          </div>

          <h3 className="mt-5 text-3xl font-bold app-text">
            {loading ? "..." : totalStores}
          </h3>
        </div>
      </div>

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div
          role="alert"
          className="
            mb-6
            flex items-center gap-3
            rounded-xl
            border border-red-500/30
            bg-red-500/10
            p-4
            text-red-500
          "
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================
          MERCHANTS TABLE CONTAINER
      ====================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border app-border
          app-bg app-text
          shadow-sm
          theme-transition
        "
      >
        {/* ==================================
            TABLE HEADER
        ================================== */}

        <div
          className="
            flex flex-wrap
            items-center justify-between
            gap-4
            border-b app-border
            px-6 py-5
          "
        >
          <div>
            <h3 className="text-lg font-semibold app-text">
              Registered Merchants
            </h3>

            <p className="mt-1 text-sm app-muted">
              All merchant accounts on CodeAgiles AfterSale AI
            </p>
          </div>

          {/* SEARCH INPUT */}

          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="
                absolute
                left-3 top-1/2
                -translate-y-1/2
                app-muted
              "
            />

            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full
                rounded-xl
                border app-border
                app-bg app-text
                py-2.5
                pl-10 pr-4
                text-sm
                outline-none
                placeholder:opacity-60
                focus:border-cyan-500
                focus:ring-1
                focus:ring-cyan-500/20
                transition-all
              "
            />
          </div>
        </div>

        {/* ==================================
            LOADING STATE
        ================================== */}

        {loading ? (
          <div
            className="
              flex items-center justify-center
              gap-3 py-20
              app-muted
            "
          >
            <LoaderCircle size={24} className="animate-spin text-cyan-500" />

            <span>Loading merchants...</span>
          </div>
        ) : filteredMerchants.length === 0 ? (
          /* ==================================
              EMPTY STATE
          ================================== */

          <div className="py-20 text-center">
            <Users size={42} className="mx-auto mb-4 app-muted" />

            <p className="app-muted">
              {search
                ? "No matching merchants found."
                : error
                  ? "Unable to display merchants."
                  : "No merchants found."}
            </p>
          </div>
        ) : (
          /* ==================================
              MERCHANTS TABLE
          ================================== */

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              {/* TABLE HEAD */}

              <thead
                className="
                  border-b app-border
                  bg-cyan-500/5
                "
              >
                <tr className="text-sm app-muted">
                  <th className="px-6 py-4 font-medium">ID</th>

                  <th className="px-6 py-4 font-medium">Merchant</th>

                  <th className="px-6 py-4 font-medium">Email</th>

                  <th className="px-6 py-4 font-medium">Stores</th>

                  <th className="px-6 py-4 font-medium">Role</th>
                </tr>
              </thead>

              {/* TABLE BODY */}

              <tbody>
                {filteredMerchants.map((merchant) => (
                  <tr
                    key={merchant.id}
                    className="
                      border-b app-border
                      transition-colors duration-200
                      hover:bg-cyan-500/5
                      last:border-b-0
                    "
                  >
                    {/* MERCHANT ID */}

                    <td className="px-6 py-4 app-muted">#{merchant.id}</td>

                    {/* MERCHANT NAME */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-full
                            bg-cyan-500/10
                          "
                        >
                          <Users size={18} className="text-cyan-500" />
                        </div>

                        <span className="font-medium app-text">
                          {merchant.name || "Unnamed Merchant"}
                        </span>
                      </div>
                    </td>

                    {/* MERCHANT EMAIL */}

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 app-muted">
                        <Mail size={16} className="text-cyan-500" />

                        <span>{merchant.email || "—"}</span>
                      </div>
                    </td>

                    {/* MERCHANT STORES */}

                    <td className="px-6 py-4">
                      <span
                        className="
                          inline-flex
                          rounded-lg
                          border app-border
                          bg-cyan-500/5
                          px-3 py-1
                          text-sm app-text
                        "
                      >
                        {merchant.total_stores ?? merchant.store_count ?? 0}
                      </span>
                    </td>

                    {/* MERCHANT ROLE */}

                    <td className="px-6 py-4">
                      <span
                        className="
                          inline-flex
                          items-center gap-2
                          rounded-full
                          bg-emerald-500/10
                          px-3 py-1
                          text-xs
                          text-emerald-500
                        "
                      >
                        <ShieldCheck size={14} />

                        {typeof merchant.role === "string"
                          ? merchant.role
                          : merchant.role?.name || "owner"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================================
            TABLE FOOTER
        ================================== */}

        <div
          className="
            border-t app-border
            px-6 py-4
          "
        >
          <p className="text-sm app-muted">
            Showing {filteredMerchants.length} of {merchants.length} merchants
          </p>
        </div>
      </div>
    </div>
  );
}
