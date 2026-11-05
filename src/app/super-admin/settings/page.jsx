"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import {
  Settings,
  Building2,
  Mail,
  CreditCard,
  Brain,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Globe,
  Server,
  Sparkles,
  Clock,
  Info,
} from "lucide-react";

// ==========================================
// CONSTANTS
// ==========================================

const API_URL = "/super-admin/settings";

const DEFAULT_SETTINGS = {
  general: {
    platform_name: "",
    company_name: "",
    support_email: "",
    timezone: "Asia/Karachi",
    maintenance_mode: false,
  },
  email: {
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_secure: false,
  },
  subscription: {
    default_currency: "USD",
    trial_days: 0,
  },
  ai: {
    ai_provider: "",
    ai_model: "",
    ai_enabled: false,
  },
};

const TABS = [
  {
    id: "general",
    label: "General Settings",
    icon: Building2,
    description: "Manage your platform identity and preferences.",
  },
  {
    id: "email",
    label: "Email Settings",
    icon: Mail,
    description: "Configure your outgoing email server.",
  },
  {
    id: "subscription",
    label: "Subscription Settings",
    icon: CreditCard,
    description: "Manage default billing preferences.",
  },
  {
    id: "ai",
    label: "AI Settings",
    icon: Brain,
    description: "Configure platform-wide AI preferences.",
  },
];

// ==========================================
// HELPERS
// ==========================================

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

const getAuthHeaders = () => {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("accessToken");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

const mergeSettings = (data = {}) => ({
  general: {
    ...DEFAULT_SETTINGS.general,
    ...(data.general || {}),
  },
  email: {
    ...DEFAULT_SETTINGS.email,
    ...(data.email || {}),
  },
  subscription: {
    ...DEFAULT_SETTINGS.subscription,
    ...(data.subscription || {}),
  },
  ai: {
    ...DEFAULT_SETTINGS.ai,
    ...(data.ai || {}),
  },
});

// ==========================================
// INPUT COMPONENT
// ==========================================

function SettingInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  description = "",
  min,
  max,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold app-text">{label}</label>

      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className="
          w-full rounded-xl border app-border
          app-bg app-text
          px-4 py-3 text-sm
          outline-none transition
          focus:border-blue-500
          focus:ring-2 focus:ring-blue-500/10
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      />

      {description && <p className="text-xs app-muted">{description}</p>}
    </div>
  );
}

// ==========================================
// SELECT COMPONENT
// ==========================================

function SettingSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  description = "",
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold app-text">{label}</label>

      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="
          w-full rounded-xl border app-border
          app-bg app-text
          px-4 py-3 text-sm
          outline-none transition
          focus:border-blue-500
          focus:ring-2 focus:ring-blue-500/10
        "
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {description && <p className="text-xs app-muted">{description}</p>}
    </div>
  );
}

// ==========================================
// TOGGLE COMPONENT
// ==========================================

function SettingToggle({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div
      className="
        flex items-center justify-between gap-4
        rounded-2xl border app-border
        p-4 sm:p-5
      "
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="rounded-xl bg-blue-500/10 p-2.5">
            <Icon className="h-5 w-5 text-blue-500" />
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold app-text">{label}</h4>

          {description && (
            <p className="mt-1 text-xs leading-5 app-muted">{description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={Boolean(checked)}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`
          relative h-7 w-12 shrink-0
          rounded-full transition-colors
          ${checked ? "bg-blue-600" : "bg-gray-400 dark:bg-gray-600"}
        `}
      >
        <span
          className={`
            absolute left-1 top-1
            h-5 w-5 rounded-full bg-white
            shadow-sm transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

// ==========================================
// SECTION HEADER
// ==========================================

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="rounded-2xl bg-blue-500/10 p-3">
        <Icon className="h-6 w-6 text-blue-500" />
      </div>

      <div>
        <h2 className="text-xl font-bold app-text">{title}</h2>
        <p className="mt-1 text-sm app-muted">{description}</p>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function SuperAdminSettingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH SETTINGS
  // ==========================================

  const fetchSettings = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(API_URL, {
        headers: getAuthHeaders(),
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to fetch settings.");
      }

      const receivedSettings = mergeSettings(response.data?.settings || {});

      setSettings(receivedSettings);
      setSavedSettings(receivedSettings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetchSettings();
  }, [fetchSettings, router]);

  // ==========================================
  // UPDATE LOCAL INPUT
  // ==========================================

  const updateSetting = (category, key, value) => {
    setSettings((previous) => ({
      ...previous,
      [category]: {
        ...previous[category],
        [key]: value,
      },
    }));

    setSuccess("");
    setError("");
  };

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleInputChange = (category) => (event) => {
    const { name, value, type } = event.target;

    let finalValue = value;

    if (type === "number") {
      finalValue = value === "" ? "" : Number(value);
    }

    updateSetting(category, name, finalValue);
  };

  // ==========================================
  // CHECK UNSAVED CHANGES
  // ==========================================

  const hasChanges =
    JSON.stringify(settings[activeTab]) !==
    JSON.stringify(savedSettings[activeTab]);

  // ==========================================
  // VALIDATE SETTINGS
  // ==========================================

  const validateSettings = (category, values) => {
    if (category === "general") {
      if (!values.platform_name || values.platform_name.trim().length < 2) {
        return "Platform name must contain at least 2 characters.";
      }

      if (!values.company_name || values.company_name.trim().length < 2) {
        return "Company name must contain at least 2 characters.";
      }

      if (
        values.support_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.support_email)
      ) {
        return "Please enter a valid support email.";
      }

      try {
        new Intl.DateTimeFormat("en-US", {
          timeZone: values.timezone,
        });
      } catch {
        return "Please enter a valid timezone.";
      }
    }

    if (category === "email") {
      if (
        !Number.isInteger(Number(values.smtp_port)) ||
        Number(values.smtp_port) < 1 ||
        Number(values.smtp_port) > 65535
      ) {
        return "SMTP port must be between 1 and 65535.";
      }
    }

    if (category === "subscription") {
      if (
        !Number.isInteger(Number(values.trial_days)) ||
        Number(values.trial_days) < 0 ||
        Number(values.trial_days) > 365
      ) {
        return "Trial days must be between 0 and 365.";
      }

      if (!/^[A-Z]{3}$/.test(values.default_currency)) {
        return "Currency must be a valid three-letter code.";
      }
    }

    return null;
  };

  // ==========================================
  // SAVE SETTINGS
  // ==========================================

  const saveSettings = async () => {
    if (saving || !hasChanges) return;

    setError("");
    setSuccess("");

    const category = activeTab;
    const values = settings[category];

    const validationError = validateSettings(category, values);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...values,
    };

    // Ensure numeric fields are sent as numbers.
    if (category === "email") {
      payload.smtp_port = Number(payload.smtp_port);
    }

    if (category === "subscription") {
      payload.trial_days = Number(payload.trial_days);
    }

    try {
      setSaving(true);

      const response = await api.put(
        API_URL,
        {
          settings: payload,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to save settings.");
      }

      const updatedSettings = mergeSettings(
        response.data?.settings || {
          ...settings,
          [category]: payload,
        },
      );

      setSettings(updatedSettings);
      setSavedSettings(updatedSettings);

      setSuccess(
        `${
          TABS.find((tab) => tab.id === category)?.label || "Settings"
        } updated successfully!`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CHANGE TAB
  // ==========================================

  const changeTab = (tabId) => {
    if (saving) return;

    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them and switch tabs?",
      );

      if (!confirmed) return;

      setSettings((previous) => ({
        ...previous,
        [activeTab]: { ...savedSettings[activeTab] },
      }));
    }

    setActiveTab(tabId);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // RESET ACTIVE TAB
  // ==========================================

  const resetChanges = () => {
    setSettings((previous) => ({
      ...previous,
      [activeTab]: { ...savedSettings[activeTab] },
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // GENERAL SETTINGS
  // ==========================================

  const renderGeneralSettings = () => (
    <div>
      <SectionHeader
        icon={Building2}
        title="General Settings"
        description="Configure your platform identity and general preferences."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SettingInput
          label="Platform Name"
          name="platform_name"
          value={settings.general.platform_name}
          onChange={handleInputChange("general")}
          placeholder="Enter platform name"
          description="Name displayed across your platform."
        />

        <SettingInput
          label="Company Name"
          name="company_name"
          value={settings.general.company_name}
          onChange={handleInputChange("general")}
          placeholder="Enter company name"
        />

        <SettingInput
          label="Support Email"
          name="support_email"
          type="email"
          value={settings.general.support_email}
          onChange={handleInputChange("general")}
          placeholder="support@example.com"
          description="Customer support contact email."
        />

        <SettingSelect
          label="Default Timezone"
          name="timezone"
          value={settings.general.timezone}
          onChange={handleInputChange("general")}
          options={[
            {
              value: "Asia/Karachi",
              label: "Pakistan (Asia/Karachi)",
            },
            {
              value: "UTC",
              label: "UTC",
            },
            {
              value: "Asia/Dubai",
              label: "Dubai (Asia/Dubai)",
            },
            {
              value: "Europe/London",
              label: "London (Europe/London)",
            },
            {
              value: "America/New_York",
              label: "New York (America/New_York)",
            },
            {
              value: "America/Los_Angeles",
              label: "Los Angeles (America/Los_Angeles)",
            },
          ]}
        />
      </div>

      <div className="mt-8">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold app-text">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
          Platform Availability
        </h3>

        <SettingToggle
          icon={Server}
          label="Maintenance Mode"
          description="Save the maintenance-mode preference. Your backend must enforce it separately to restrict platform access."
          checked={settings.general.maintenance_mode}
          onChange={(value) =>
            updateSetting("general", "maintenance_mode", value)
          }
        />
      </div>
    </div>
  );

  // ==========================================
  // EMAIL SETTINGS
  // ==========================================

  const renderEmailSettings = () => (
    <div>
      <SectionHeader
        icon={Mail}
        title="Email Settings"
        description="Configure your outgoing SMTP email preferences."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

        <p className="text-sm leading-6 app-muted">
          These settings store SMTP configuration only. SMTP passwords are not
          managed by this form. Sending emails also requires a configured mail
          service.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SettingInput
          label="SMTP Host"
          name="smtp_host"
          value={settings.email.smtp_host}
          onChange={handleInputChange("email")}
          placeholder="smtp.example.com"
        />

        <SettingInput
          label="SMTP Port"
          name="smtp_port"
          type="number"
          value={settings.email.smtp_port}
          onChange={handleInputChange("email")}
          placeholder="587"
          min={1}
          max={65535}
        />

        <SettingInput
          label="SMTP Username"
          name="smtp_username"
          value={settings.email.smtp_username}
          onChange={handleInputChange("email")}
          placeholder="Enter SMTP username"
        />
      </div>

      <div className="mt-6">
        <SettingToggle
          icon={ShieldCheck}
          label="Use Implicit TLS (SMTP Secure)"
          description="Typically enabled for port 465. Port 587 commonly uses STARTTLS instead."
          checked={settings.email.smtp_secure}
          onChange={(value) => updateSetting("email", "smtp_secure", value)}
        />
      </div>
    </div>
  );

  // ==========================================
  // SUBSCRIPTION SETTINGS
  // ==========================================

  const renderSubscriptionSettings = () => (
    <div>
      <SectionHeader
        icon={CreditCard}
        title="Subscription Settings"
        description="Configure default subscription and billing preferences."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SettingSelect
          label="Default Currency"
          name="default_currency"
          value={settings.subscription.default_currency}
          onChange={handleInputChange("subscription")}
          options={[
            { value: "USD", label: "USD - US Dollar" },
            { value: "PKR", label: "PKR - Pakistani Rupee" },
            { value: "AED", label: "AED - UAE Dirham" },
            { value: "GBP", label: "GBP - British Pound" },
            { value: "EUR", label: "EUR - Euro" },
          ]}
          description="Default currency preference for future billing configuration."
        />

        <SettingInput
          label="Free Trial Days"
          name="trial_days"
          type="number"
          min={0}
          max={365}
          value={settings.subscription.trial_days}
          onChange={handleInputChange("subscription")}
          description="Number of trial days for new subscriptions."
        />
      </div>

      <div className="mt-8 rounded-2xl border app-border p-5">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />

          <h3 className="font-bold app-text">Subscription Plans</h3>
        </div>

        <p className="mb-4 text-sm leading-6 app-muted">
          Starter, Growth and Pro plans are managed separately through
          Subscription Management. Changing the default currency here does not
          automatically update existing plan prices or Stripe billing.
        </p>

        <button
          type="button"
          onClick={() => router.push("/super-admin/subscriptions")}
          className="
            inline-flex items-center gap-2
            rounded-xl bg-blue-600
            px-4 py-2.5 text-sm font-semibold text-white
            transition hover:bg-blue-700
          "
        >
          <CreditCard className="h-4 w-4" />
          Manage Subscription Plans
        </button>
      </div>
    </div>
  );

  // ==========================================
  // AI SETTINGS
  // ==========================================

  const renderAISettings = () => (
    <div>
      <SectionHeader
        icon={Brain}
        title="AI Settings"
        description="Manage your platform-wide AI configuration."
      />

      <div className="mb-6">
        <SettingToggle
          icon={Sparkles}
          label="Enable AI Features"
          description="Store the global AI enabled preference. Your AI backend must check this setting before processing requests."
          checked={settings.ai.ai_enabled}
          onChange={(value) => updateSetting("ai", "ai_enabled", value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SettingInput
          label="AI Provider"
          name="ai_provider"
          value={settings.ai.ai_provider}
          onChange={handleInputChange("ai")}
          placeholder="e.g. openai"
          description="Enter the provider identifier supported by your backend."
        />

        <SettingInput
          label="AI Model"
          name="ai_model"
          value={settings.ai.ai_model}
          onChange={handleInputChange("ai")}
          placeholder="Enter supported model identifier"
          description="The model must be supported by your AI integration."
        />
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

        <div>
          <h4 className="text-sm font-semibold app-text">
            AI API Key Security
          </h4>

          <p className="mt-1 text-sm leading-6 app-muted">
            API keys are not entered or returned on this page. Configure
            sensitive credentials securely on the backend. Saving an AI provider
            or model does not automatically connect an AI service.
          </p>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDER ACTIVE TAB
  // ==========================================

  const renderActiveTab = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();

      case "email":
        return renderEmailSettings();

      case "subscription":
        return renderSubscriptionSettings();

      case "ai":
        return renderAISettings();

      default:
        return renderGeneralSettings();
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center app-bg">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />

          <p className="mt-4 text-sm app-muted">Loading platform settings...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="min-h-screen app-bg app-text">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm app-muted">
              <Settings className="h-4 w-4" />
              Superadmin / Settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight app-text sm:text-3xl">
              Platform Settings
            </h1>

            <p className="mt-2 text-sm app-muted">
              Manage your platform configuration from one place.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing || saving}
            onClick={() => {
              if (hasChanges) {
                const confirmed = window.confirm(
                  "Discard unsaved changes and reload settings?",
                );

                if (!confirmed) return;
              }

              setSuccess("");
              fetchSettings(true);
            }}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl border app-border
              px-4 py-2.5 text-sm font-semibold
              app-text transition
              hover:bg-gray-500/10
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Settings
          </button>
        </div>

        {/* ======================================
            NOTIFICATIONS
        ====================================== */}

        {error && (
          <div
            role="alert"
            className="
              flex items-start gap-3
              rounded-xl border border-red-500/20
              bg-red-500/10 p-4
              text-sm text-red-600 dark:text-red-400
            "
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="
              flex items-center gap-3
              rounded-xl border border-green-500/20
              bg-green-500/10 p-4
              text-sm text-green-600 dark:text-green-400
            "
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {/* ======================================
            SETTINGS LAYOUT
        ====================================== */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ====================================
              SIDEBAR TABS
          ==================================== */}

          <div className="lg:col-span-3">
            <div className="rounded-2xl border app-border p-3 shadow-sm">
              <div className="mb-3 px-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider app-muted">
                  Configuration
                </p>
              </div>

              <div className="space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => changeTab(tab.id)}
                      className={`
                        flex w-full items-center gap-3
                        rounded-xl px-4 py-3
                        text-left text-sm font-semibold
                        transition
                        ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "app-text hover:bg-gray-500/10"
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 shrink-0" />

                      <span className="flex-1">{tab.label}</span>

                      {active && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 border-t app-border px-3 pt-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />

                  <div>
                    <p className="text-xs font-semibold app-text">
                      Superadmin Access
                    </p>

                    <p className="mt-1 text-xs leading-5 app-muted">
                      Settings APIs are protected by Superadmin authentication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================
              SETTINGS CONTENT
          ==================================== */}

          <div className="lg:col-span-9">
            <div
              className="
                overflow-hidden rounded-2xl
                border app-border
                shadow-sm
              "
            >
              <div className="p-5 sm:p-7">{renderActiveTab()}</div>

              {/* =================================
                  SAVE FOOTER
              ================================= */}

              <div
                className="
                  flex flex-col gap-4
                  border-t app-border
                  px-5 py-5
                  sm:flex-row sm:items-center
                  sm:justify-between sm:px-7
                "
              >
                <div className="flex items-center gap-2">
                  {hasChanges ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-500" />

                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        You have unsaved changes
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />

                      <span className="text-xs app-muted">
                        All changes saved
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetChanges}
                    disabled={!hasChanges || saving}
                    className="
                      rounded-xl border app-border
                      px-5 py-2.5
                      text-sm font-semibold app-text
                      transition hover:bg-gray-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={!hasChanges || saving}
                    className="
                      inline-flex items-center justify-center
                      gap-2 rounded-xl
                      bg-blue-600 px-5 py-2.5
                      text-sm font-semibold text-white
                      transition hover:bg-blue-700
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ==================================
                INFO FOOTER
            ================================== */}

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs app-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Superadmin Configuration
              </span>

              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Platform-Wide Preferences
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Saved in PostgreSQL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
