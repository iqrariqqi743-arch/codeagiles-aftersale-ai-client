"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";

import {
  Bot,
  BrainCircuit,
  Save,
  RefreshCw,
  Store,
  ShieldCheck,
  MessageSquareText,
  Globe2,
  CalendarDays,
  FileText,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LockKeyhole,
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

const DEFAULT_SETTINGS = {
  ai_enabled: false,
  reply_tone: "professional",
  reply_language: "English",
  return_window_days: 7,
  return_policy: "",
  refund_policy: "",
  custom_instructions: "",
  auto_reply_enabled: false,
};

const TONES = [
  {
    value: "professional",
    label: "Professional",
    description: "Clear and business-friendly replies",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and approachable communication",
  },
  {
    value: "empathetic",
    label: "Empathetic",
    description: "Understanding and reassuring responses",
  },
  {
    value: "concise",
    label: "Concise",
    description: "Short and direct answers",
  },
];

const LANGUAGES = [
  "English",
  "Urdu",
  "Hindi",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Portuguese",
  "Dutch",
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function AISettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [storesLoading, setStoresLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cardClass = `rounded-2xl border ${
    isDark ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-white"
  }`;

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${
    isDark
      ? "border-white/10 bg-[#0b1220] text-white placeholder:text-slate-500"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
  }`;

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-50 ${
    isDark
      ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;

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

  const fetchStores = useCallback(async () => {
    try {
      setStoresLoading(true);
      setError("");

      const response = await api.get("/stores");

      const data = response.data;

      const storeList = Array.isArray(data)
        ? data
        : Array.isArray(data?.stores)
          ? data.stores
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setStores(storeList);

      setSelectedStoreId((previous) => {
        const exists = storeList.some(
          (store) => String(store.id) === String(previous),
        );

        return exists
          ? previous
          : storeList.length > 0
            ? String(storeList[0].id)
            : "";
      });
    } catch (err) {
      handleApiError(err, "Failed to load stores");
    } finally {
      setStoresLoading(false);
    }
  }, [handleApiError]);

  const fetchSettings = useCallback(
    async (storeId) => {
      if (!storeId) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      try {
        setSettingsLoading(true);
        setError("");
        setSuccess("");

        const response = await api.get(`/ai/settings/${storeId}`);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...(response.data?.settings || {}),
        });
      } catch (err) {
        setSettings(DEFAULT_SETTINGS);
        handleApiError(err, "Failed to load AI settings");
      } finally {
        setSettingsLoading(false);
      }
    },
    [handleApiError],
  );

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchSettings(selectedStoreId);
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [selectedStoreId, fetchSettings]);

  const updateField = (name, value) => {
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    if (!selectedStoreId) {
      setError("Please select a store first");
      return;
    }

    const days = Number(settings.return_window_days);

    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError("Return window must be between 0 and 365 days");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ai_enabled: Boolean(settings.ai_enabled),
        reply_tone: settings.reply_tone,
        reply_language: settings.reply_language,
        return_window_days: days,
        return_policy: settings.return_policy || "",
        refund_policy: settings.refund_policy || "",
        custom_instructions: settings.custom_instructions || "",
      };

      const response = await api.put(
        `/ai/settings/${selectedStoreId}`,
        payload,
      );

      if (response.data?.success) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...response.data.settings,
        });

        setSuccess("AI settings saved successfully!");
      } else {
        setError(response.data?.message || "Unable to save settings");
      }
    } catch (err) {
      handleApiError(err, "Failed to save AI settings");
    } finally {
      setSaving(false);
    }
  };

  const selectedStore = stores.find(
    (store) => String(store.id) === String(selectedStoreId),
  );

  const fieldDisabled = settingsLoading || saving || !selectedStoreId;

  return (
    <div
      className={`min-h-screen space-y-6 p-4 md:p-6 ${
        isDark ? "text-white" : "text-slate-900"
      }`}
    >
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500">
            <Sparkles size={15} />
            CodeAgiles AfterSale AI
          </p>

          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            <BrainCircuit className="text-indigo-500" size={30} />
            AI Assistant Settings
          </h1>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Configure how AI drafts customer support replies for your store.
          </p>
        </div>

        <button
          type="button"
          className={secondaryButton}
          disabled={storesLoading || settingsLoading}
          onClick={() => {
            fetchStores();

            if (selectedStoreId) {
              fetchSettings(selectedStoreId);
            }
          }}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* NOTIFICATIONS */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <AlertCircle size={19} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500">
          <CheckCircle2 size={19} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* STORE SELECTOR */}
      <div className={`${cardClass} p-5 md:p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
            <Store size={22} />
          </div>

          <div>
            <h2 className="font-semibold">Select Store</h2>
            <p className={`text-xs ${mutedClass}`}>
              Each store has its own AI configuration.
            </p>
          </div>
        </div>

        {storesLoading ? (
          <div className={`flex items-center gap-2 text-sm ${mutedClass}`}>
            <Loader2 size={17} className="animate-spin" />
            Loading stores...
          </div>
        ) : stores.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed p-5 text-sm ${mutedClass}`}
          >
            No stores found. Please create a store first.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <select
              className={inputClass}
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
            >
              {stores.map((store) => (
                <option key={store.id} value={String(store.id)}>
                  {store.store_name || store.name || `Store #${store.id}`}
                </option>
              ))}
            </select>

            <div
              className={`flex items-center rounded-xl border px-4 py-3 text-sm ${
                isDark
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Store size={16} className="mr-2 text-indigo-500" />
              {selectedStore?.store_name ||
                selectedStore?.name ||
                "Select a store"}
            </div>
          </div>
        )}
      </div>

      {settingsLoading ? (
        <div
          className={`${cardClass} flex min-h-64 items-center justify-center gap-3`}
        >
          <Loader2 size={25} className="animate-spin text-indigo-500" />
          <span className={mutedClass}>Loading AI settings...</span>
        </div>
      ) : (
        <form onSubmit={saveSettings} className="space-y-6">
          {/* ENABLE AI */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
                  <Bot size={23} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">Enable AI Assistant</h2>

                  <p className={`mt-1 text-sm ${mutedClass}`}>
                    Allow Gemini AI to generate suggested replies for support
                    tickets.
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      settings.ai_enabled
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {settings.ai_enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.ai_enabled)}
                aria-label="Enable AI Assistant"
                disabled={fieldDisabled}
                onClick={() => updateField("ai_enabled", !settings.ai_enabled)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
                  settings.ai_enabled ? "bg-indigo-600" : "bg-slate-500"
                }`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    settings.ai_enabled ? "translate-x-1" : "-translate-x-5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* TONE AND LANGUAGE */}
          <div className="grid gap-6 xl:grid-cols-2">
            <div className={`${cardClass} p-5 md:p-6`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                  <MessageSquareText size={21} />
                </div>

                <div>
                  <h2 className="font-semibold">Reply Tone</h2>
                  <p className={`text-xs ${mutedClass}`}>
                    Choose how your AI communicates.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {TONES.map((tone) => {
                  const active = settings.reply_tone === tone.value;

                  return (
                    <label
                      key={tone.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                        active
                          ? "border-indigo-500 bg-indigo-500/5"
                          : isDark
                            ? "border-white/10 hover:bg-white/5"
                            : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reply_tone"
                        value={tone.value}
                        checked={active}
                        disabled={fieldDisabled}
                        onChange={() => updateField("reply_tone", tone.value)}
                        className="accent-indigo-600"
                      />

                      <span>
                        <span className="block text-sm font-semibold">
                          {tone.label}
                        </span>

                        <span className={`mt-1 block text-xs ${mutedClass}`}>
                          {tone.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={`${cardClass} p-5 md:p-6`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-3 text-violet-500">
                  <Globe2 size={21} />
                </div>

                <div>
                  <h2 className="font-semibold">Language & Returns</h2>
                  <p className={`text-xs ${mutedClass}`}>
                    Configure response language and return window.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Reply Language
                  </label>

                  <select
                    value={settings.reply_language}
                    disabled={fieldDisabled}
                    onChange={(event) =>
                      updateField("reply_language", event.target.value)
                    }
                    className={inputClass}
                  >
                    {!LANGUAGES.includes(settings.reply_language) && (
                      <option value={settings.reply_language}>
                        {settings.reply_language}
                      </option>
                    )}

                    {LANGUAGES.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays size={16} className="text-indigo-500" />
                    Return Window (Days)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="1"
                    disabled={fieldDisabled}
                    className={inputClass}
                    value={settings.return_window_days}
                    onChange={(event) =>
                      updateField(
                        "return_window_days",
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value),
                      )
                    }
                  />

                  <p className={`mt-2 text-xs ${mutedClass}`}>
                    This is policy context for AI replies. It does not
                    automatically approve returns.
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    isDark
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={17} className="text-emerald-500" />
                    <span className="text-sm font-semibold">
                      Human Approval Required
                    </span>
                  </div>

                  <p className={`mt-2 text-xs leading-5 ${mutedClass}`}>
                    Gemini generates drafts only. Store owners review replies
                    before sending them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* POLICIES */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
                <FileText size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Store Policies</h2>
                <p className={`text-xs ${mutedClass}`}>
                  AI uses these policies when drafting customer replies.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Return Policy
                </label>

                <textarea
                  rows={4}
                  maxLength={10000}
                  disabled={fieldDisabled}
                  className={inputClass}
                  placeholder="Example: Customers may request a return within 7 days of delivery..."
                  value={settings.return_policy}
                  onChange={(event) =>
                    updateField("return_policy", event.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Refund Policy
                </label>

                <textarea
                  rows={4}
                  maxLength={10000}
                  disabled={fieldDisabled}
                  className={inputClass}
                  placeholder="Example: Refunds are reviewed after verifying the returned item..."
                  value={settings.refund_policy}
                  onChange={(event) =>
                    updateField("refund_policy", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* CUSTOM INSTRUCTIONS */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
                <Settings2 size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Custom AI Instructions
                </h2>

                <p className={`text-xs ${mutedClass}`}>
                  Add store-specific guidance for customer support drafts.
                </p>
              </div>
            </div>

            <textarea
              rows={5}
              maxLength={10000}
              disabled={fieldDisabled}
              className={inputClass}
              placeholder="Example: Always greet customers politely. For wrong product complaints, request a photo of the delivered item..."
              value={settings.custom_instructions}
              onChange={(event) =>
                updateField("custom_instructions", event.target.value)
              }
            />
          </div>

          {/* AUTO REPLY */}
          <div className={`${cardClass} p-5 md:p-6`}>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-slate-500/10 p-3 text-slate-400">
                <LockKeyhole size={22} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold">Automatic Customer Replies</h2>

                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                    Coming Later
                  </span>
                </div>

                <p className={`mt-2 text-sm ${mutedClass}`}>
                  Automatic sending is disabled. AI-generated messages must be
                  reviewed and sent by the store owner.
                </p>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div
            className={`${cardClass} flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center`}
          >
            <div>
              <p className="font-semibold">Save AI Configuration</p>

              <p className={`mt-1 text-xs ${mutedClass}`}>
                Changes apply only to the selected store.
              </p>
            </div>

            <button
              type="submit"
              disabled={fieldDisabled}
              className={primaryButton}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
