"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Globe,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  X,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Search,
  Plug,
  PlugZap,
  Unplug,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

const extractStores = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.stores)) return data.stores;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.stores)) return data.data.stores;
  if (Array.isArray(data?.result?.stores)) return data.result.stores;

  throw new Error("Unexpected stores API response format");
};

export default function StoresPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const [selectedStore, setSelectedStore] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState(null);

  const [showSecret, setShowSecret] = useState(false);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    store_name: "",
    store_url: "",
  });

  const [credentials, setCredentials] = useState({
    consumer_key: "",
    consumer_secret: "",
  });

  const cardClass = isDark
    ? "bg-[#172235] border-white/10"
    : "bg-white border-slate-200 shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-600";

  const inputClass = isDark
    ? "bg-[#0f1726] border-white/10 text-white placeholder:text-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400";

  const secondaryClass = isDark
    ? "border-white/10 text-slate-300 hover:bg-white/5"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  const getStores = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/stores");

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to load stores");
      }

      setStores(extractStores(response.data));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      setError(
        err.response?.data?.message || err.message || "Failed to load stores",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    getStores();
  }, [getStores]);

  const closeModals = () => {
    if (saving || connecting) return;

    setShowAddModal(false);
    setShowConnectModal(false);
    setSelectedStore(null);
    setCredentials({
      consumer_key: "",
      consumer_secret: "",
    });
    setShowSecret(false);
    setModalError("");
  };

  useEffect(() => {
    if (!showAddModal && !showConnectModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModals();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  });

  const openAddModal = () => {
    setForm({
      store_name: "",
      store_url: "",
    });
    setModalError("");
    setShowAddModal(true);
  };

  const openConnectModal = (store) => {
    setSelectedStore(store);
    setCredentials({
      consumer_key: "",
      consumer_secret: "",
    });
    setShowSecret(false);
    setModalError("");
    setShowConnectModal(true);
  };

  const handleAddStore = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setModalError("");
      setError("");
      setSuccess("");

      const response = await api.post("/stores", {
        store_name: form.store_name.trim(),
        store_url: form.store_url.trim(),
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to add store");
      }

      const newStore = response.data?.store || response.data?.data?.store;

      if (newStore?.id != null) {
        setStores((prev) => [
          newStore,
          ...prev.filter((store) => String(store.id) !== String(newStore.id)),
        ]);
      }

      setSearch("");
      setShowAddModal(false);
      setForm({
        store_name: "",
        store_url: "",
      });
      setSuccess("Store added successfully.");

      await getStores();
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || "Failed to add store",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();

    if (!selectedStore) return;

    const consumerKey = credentials.consumer_key.trim();
    const consumerSecret = credentials.consumer_secret.trim();

    if (!consumerKey || !consumerSecret) {
      setModalError("Both API credentials are required.");
      return;
    }

    try {
      setConnecting(true);
      setModalError("");
      setError("");
      setSuccess("");

      const response = await api.post(`/stores/${selectedStore.id}/connect`, {
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Connection failed");
      }

      const updatedStore = response.data?.store;

      if (updatedStore?.id != null) {
        setStores((prev) =>
          prev.map((store) =>
            String(store.id) === String(updatedStore.id) ? updatedStore : store,
          ),
        );
      }

      setCredentials({
        consumer_key: "",
        consumer_secret: "",
      });
      setSelectedStore(null);
      setShowConnectModal(false);
      setShowSecret(false);

      setSuccess("WooCommerce connected successfully!");

      await getStores();
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
          err.message ||
          "Unable to connect WooCommerce",
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (store) => {
    if (!window.confirm(`Disconnect "${store.store_name}" from WooCommerce?`)) {
      return;
    }

    try {
      setDisconnectingId(store.id);
      setError("");
      setSuccess("");

      const response = await api.post(`/stores/${store.id}/disconnect`);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Disconnect failed");
      }

      const updatedStore = response.data?.store;

      setStores((prev) =>
        prev.map((item) =>
          String(item.id) === String(store.id)
            ? updatedStore || {
                ...item,
                status: "disconnected",
                connected_at: null,
              }
            : item,
        ),
      );

      setSuccess("WooCommerce disconnected successfully.");
      await getStores();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to disconnect WooCommerce",
      );
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/stores/${id}`);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to delete store");
      }

      setStores((prev) =>
        prev.filter((store) => String(store.id) !== String(id)),
      );

      setSuccess("Store deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete store",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStores = stores.filter((store) => {
    const keyword = search.toLowerCase().trim();

    return [
      store.store_name,
      store.store_url,
      store.platform,
      store.status,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword),
    );
  });

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
      color: isDark ? "text-cyan-400" : "text-cyan-700",
      bg: isDark ? "bg-cyan-500/10" : "bg-cyan-50",
    },
    {
      title: "Connected",
      value: connectedStores,
      icon: CheckCircle2,
      color: isDark ? "text-emerald-400" : "text-emerald-700",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
    },
    {
      title: "Disconnected",
      value: disconnectedStores,
      icon: Clock3,
      color: isDark ? "text-amber-400" : "text-amber-700",
      bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-sm ${mutedClass}`}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <p
            className={`text-xs font-semibold tracking-widest mb-2 ${
              isDark ? "text-cyan-400" : "text-cyan-700"
            }`}
          >
            STORE MANAGEMENT
          </p>

          <h1 className={`text-3xl font-bold ${titleClass}`}>My Stores</h1>

          <p className={`text-sm mt-2 ${mutedClass}`}>
            Manage and connect your WooCommerce stores.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-3 rounded-xl"
        >
          <Plus size={19} />
          Add Store
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div
          role="alert"
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            isDark
              ? "bg-red-500/10 border-red-500/20 text-red-300"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <AlertCircle size={19} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            isDark
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <CheckCircle2 size={19} className="shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`border rounded-2xl p-5 ${cardClass}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon size={22} className={stat.color} />
                </div>

                <div>
                  <p className={`text-xs ${mutedClass}`}>{stat.title}</p>

                  <h3 className={`text-2xl font-bold mt-1 ${titleClass}`}>
                    {loading && stores.length === 0 ? "..." : stat.value}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div
          className={`flex items-center gap-3 border rounded-xl px-4 py-3 w-full sm:max-w-md ${inputClass}`}
        >
          <Search size={18} className={mutedClass} />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
            aria-label="Search stores"
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        <button
          type="button"
          onClick={getStores}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 border rounded-xl px-4 py-3 text-sm disabled:opacity-50 ${secondaryClass}`}
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Stores
        </button>
      </div>

      {/* Store List */}
      {loading && stores.length === 0 ? (
        <div className={`border rounded-2xl p-12 text-center ${cardClass}`}>
          <RefreshCw
            size={26}
            className="animate-spin text-cyan-500 mx-auto mb-4"
          />
          <p className={mutedClass}>Loading stores...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className={`border rounded-2xl p-12 text-center ${cardClass}`}>
          <Store size={42} className="text-cyan-500 mx-auto mb-4" />

          <h2 className={`text-xl font-semibold ${titleClass}`}>
            {search ? "No matching stores" : "No stores found"}
          </h2>

          <p className={`text-sm mt-2 ${mutedClass}`}>
            {error
              ? "Could not verify the store list."
              : search
                ? "Try a different search keyword."
                : "Add your first WooCommerce store to get started."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStores.map((store) => {
            const isConnected = store.status === "connected";
            const isDeleting = deletingId === store.id;
            const isDisconnecting = disconnectingId === store.id;

            return (
              <div
                key={store.id}
                className={`border rounded-2xl p-6 transition ${cardClass}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isDark ? "bg-cyan-500/10" : "bg-cyan-50"
                    }`}
                  >
                    <Store
                      size={24}
                      className={isDark ? "text-cyan-400" : "text-cyan-700"}
                    />
                  </div>

                  <span
                    className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${
                      isConnected
                        ? isDark
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-emerald-100 text-emerald-700"
                        : isDark
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {store.status || "disconnected"}
                  </span>
                </div>

                <h3
                  className={`text-xl font-semibold mt-5 break-words ${titleClass}`}
                >
                  {store.store_name}
                </h3>

                <div className={`flex items-start gap-2 mt-2 ${mutedClass}`}>
                  <Globe size={16} className="shrink-0 mt-0.5" />

                  <p className="text-sm break-all">{store.store_url}</p>
                </div>

                <div
                  className={`flex items-center gap-2 mt-5 text-xs ${mutedClass}`}
                >
                  <ShieldCheck size={15} />

                  {isConnected
                    ? "WooCommerce API connected"
                    : "WooCommerce API not connected"}
                </div>

                {/* Connection Actions */}
                <div className="mt-5">
                  {isConnected ? (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(store)}
                      disabled={isDisconnecting || isDeleting}
                      className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
                        isDark
                          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          : "border-red-200 text-red-600 hover:bg-red-50"
                      }`}
                    >
                      {isDisconnecting ? (
                        <RefreshCw size={17} className="animate-spin" />
                      ) : (
                        <Unplug size={17} />
                      )}

                      {isDisconnecting
                        ? "Disconnecting..."
                        : "Disconnect WooCommerce"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConnectModal(store)}
                      disabled={isDeleting}
                      className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
                    >
                      <PlugZap size={18} />
                      Connect WooCommerce
                    </button>
                  )}
                </div>

                {/* Footer */}
                <div
                  className={`flex items-center justify-between border-t mt-6 pt-5 ${
                    isDark ? "border-white/10" : "border-slate-200"
                  }`}
                >
                  <span className={`text-sm capitalize ${mutedClass}`}>
                    {store.platform || "woocommerce"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(store.id)}
                    disabled={isDeleting || isDisconnecting}
                    className="text-red-500 hover:text-red-400 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={17} />

                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModals();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-store-title"
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${cardClass}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                id="add-store-title"
                className={`text-xl font-semibold ${titleClass}`}
              >
                Add WooCommerce Store
              </h2>

              <button
                type="button"
                onClick={closeModals}
                disabled={saving}
                aria-label="Close"
                className={mutedClass}
              >
                <X size={22} />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddStore} className="space-y-5">
              <div>
                <label
                  htmlFor="store-name"
                  className={`block text-sm mb-2 ${titleClass}`}
                >
                  Store Name
                </label>

                <input
                  id="store-name"
                  required
                  maxLength={150}
                  value={form.store_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      store_name: e.target.value,
                    }))
                  }
                  placeholder="My Online Store"
                  className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-cyan-500 ${inputClass}`}
                />
              </div>

              <div>
                <label
                  htmlFor="store-url"
                  className={`block text-sm mb-2 ${titleClass}`}
                >
                  Store URL
                </label>

                <input
                  id="store-url"
                  type="url"
                  required
                  value={form.store_url}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      store_url: e.target.value,
                    }))
                  }
                  placeholder="https://example.com"
                  className={`w-full border rounded-xl px-4 py-3 outline-none focus:border-cyan-500 ${inputClass}`}
                />
              </div>

              <p className={`text-xs ${mutedClass}`}>
                Stores remain disconnected until WooCommerce API credentials are
                verified.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Store"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Connect WooCommerce Modal */}
      {showConnectModal && selectedStore && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModals();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-store-title"
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${cardClass}`}
          >
            <div className="flex justify-between items-start gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Plug size={20} className="text-cyan-500" />
                  <span className="text-xs font-semibold text-cyan-500">
                    WOOCOMMERCE INTEGRATION
                  </span>
                </div>

                <h2
                  id="connect-store-title"
                  className={`text-xl font-semibold ${titleClass}`}
                >
                  Connect {selectedStore.store_name}
                </h2>

                <p className={`text-sm mt-2 break-all ${mutedClass}`}>
                  {selectedStore.store_url}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModals}
                disabled={connecting}
                aria-label="Close"
                className={mutedClass}
              >
                <X size={22} />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm"
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-5">
              <div>
                <label
                  htmlFor="consumer-key"
                  className={`block text-sm font-medium mb-2 ${titleClass}`}
                >
                  WooCommerce Consumer Key
                </label>

                <div
                  className={`flex items-center gap-3 border rounded-xl px-4 ${inputClass}`}
                >
                  <KeyRound size={18} className={mutedClass} />

                  <input
                    id="consumer-key"
                    type="text"
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={credentials.consumer_key}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        consumer_key: e.target.value,
                      }))
                    }
                    placeholder="ck_..."
                    className="w-full py-3 bg-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="consumer-secret"
                  className={`block text-sm font-medium mb-2 ${titleClass}`}
                >
                  WooCommerce Consumer Secret
                </label>

                <div
                  className={`flex items-center gap-3 border rounded-xl px-4 ${inputClass}`}
                >
                  <KeyRound size={18} className={mutedClass} />

                  <input
                    id="consumer-secret"
                    type={showSecret ? "text" : "password"}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    value={credentials.consumer_secret}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        consumer_secret: e.target.value,
                      }))
                    }
                    placeholder="cs_..."
                    className="w-full py-3 bg-transparent outline-none text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowSecret((prev) => !prev)}
                    aria-label={
                      showSecret
                        ? "Hide consumer secret"
                        : "Show consumer secret"
                    }
                    className={mutedClass}
                  >
                    {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <p className={`text-sm font-semibold mb-2 ${titleClass}`}>
                  How to get API credentials
                </p>

                <ol
                  className={`list-decimal pl-5 space-y-1 text-xs leading-relaxed ${mutedClass}`}
                >
                  <li>Log in to your WordPress admin.</li>
                  <li>Open WooCommerce → Settings → Advanced → REST API.</li>
                  <li>Click Add Key.</li>
                  <li>
                    Select appropriate API permissions and generate the key.
                  </li>
                  <li>Copy the Consumer Key and Consumer Secret here.</li>
                </ol>
              </div>

              <p
                className={`flex items-start gap-2 text-xs leading-relaxed ${mutedClass}`}
              >
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                Credentials are sent to your backend for verification and
                encrypted storage. Never share them publicly.
              </p>

              <button
                type="submit"
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl disabled:opacity-60"
              >
                {connecting ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <PlugZap size={18} />
                )}

                {connecting ? "Verifying Connection..." : "Connect WooCommerce"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
