"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { useRouter } from "next/navigation";
import api from "@/utils/api";

import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  CheckCircle2,
  Ban,
  LoaderCircle,
  AlertCircle,
  Save,
  DollarSign,
  CalendarDays,
  Layers3,
  SlidersHorizontal,
} from "lucide-react";

// ==========================================
// CONFIGURATION
// ==========================================

const API_BASE = "/super-admin/subscription-plans";

const initialForm = {
  name: "",
  slug: "",
  price: "",
  currency: "USD",
  billingInterval: "month",
  isActive: true,
};

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

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatPrice = (priceCents, currency = "USD") => {
  const amount = Number(priceCents || 0) / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const makeSlug = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getFeatureId = (feature) => {
  return feature?.id ?? feature?.featureId;
};

const getFeatureName = (feature) => {
  return (
    feature?.name ||
    feature?.featureName ||
    feature?.featureKey ||
    feature?.key ||
    "Unnamed Feature"
  );
};

const normalizeFeature = (feature) => ({
  ...feature,
  isEnabled: Boolean(feature.isEnabled),
  limitValue: feature.limitValue ?? "",
});

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SuperAdminSubscriptionsPage() {
  const router = useRouter();

  // ========================================
  // STATES
  // ========================================

  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const [deletePlan, setDeletePlan] = useState(null);
  const [statusPlan, setStatusPlan] = useState(null);

  // ========================================
  // FEATURES STATES
  // ========================================

  const [featuresPlan, setFeaturesPlan] = useState(null);
  const [features, setFeatures] = useState([]);

  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featureSavingId, setFeatureSavingId] = useState(null);

  const [featuresError, setFeaturesError] = useState("");
  const [featuresNotice, setFeaturesNotice] = useState("");

  // ========================================
  // AUTHENTICATION
  // ========================================

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      throw new Error("Authentication required.");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, [router]);

  // ========================================
  // FETCH SUBSCRIPTION PLANS
  // ========================================

  const fetchPlans = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get(API_BASE, {
          headers: getAuthHeaders(),
        });

        if (response.data.success === false) {
          throw new Error(
            response.data.message || "Failed to fetch subscription plans.",
          );
        }

        setPlans(response.data.plans || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAuthHeaders],
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ========================================
  // SUCCESS MESSAGE
  // ========================================

  const showSuccessMessage = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  // ========================================
  // ADD PLAN MODAL
  // ========================================

  const openAddModal = () => {
    setEditingPlan(null);
    setForm({ ...initialForm });
    setError("");
    setShowModal(true);
  };

  // ========================================
  // EDIT PLAN MODAL
  // ========================================

  const openEditModal = (plan) => {
    setEditingPlan(plan);

    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      price: (Number(plan.priceCents || 0) / 100).toFixed(2),
      currency: plan.currency || "USD",
      billingInterval: plan.billingInterval || "month",
      isActive: Boolean(plan.isActive),
    });

    setError("");
    setShowModal(true);
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm({ ...initialForm });
    setError("");
  };

  // ========================================
  // HANDLE INPUT
  // ========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "name" && !editingPlan) {
        updated.slug = makeSlug(value);
      }

      return updated;
    });
  };

  // ========================================
  // CREATE / UPDATE PLAN
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Plan name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Plan slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      setError("Slug must contain lowercase letters, numbers or hyphens.");
      return;
    }

    const priceText = String(form.price).trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(priceText)) {
      setError("Enter a valid price with up to two decimal places.");
      return;
    }

    const priceCents = Math.round(Number(priceText) * 100);

    if (
      !Number.isSafeInteger(priceCents) ||
      priceCents < 0 ||
      priceCents > 2147483647
    ) {
      setError("Please enter a valid plan price.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      priceCents,
      currency: form.currency,
      billingInterval: form.billingInterval,
    };

    try {
      setSaving(true);
      setError("");

      let response;

      if (editingPlan) {
        response = await api.put(`${API_BASE}/${editingPlan.id}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        response = await api.post(
          API_BASE,
          {
            ...payload,
            isActive: form.isActive,
          },
          {
            headers: getAuthHeaders(),
          },
        );
      }

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Failed to save subscription plan.",
        );
      }

      const wasEditing = Boolean(editingPlan);

      setShowModal(false);
      setEditingPlan(null);
      setForm({ ...initialForm });

      showSuccessMessage(
        wasEditing
          ? "Subscription plan updated successfully."
          : "Subscription plan created successfully.",
      );

      await fetchPlans(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // ACTIVATE / DEACTIVATE PLAN
  // ========================================

  const handleStatusChange = async () => {
    if (!statusPlan) return;

    const plan = statusPlan;
    const newStatus = !Boolean(plan.isActive);

    try {
      setActionLoading(plan.id);
      setError("");

      const response = await api.patch(
        `${API_BASE}/${plan.id}/status`,
        {
          isActive: newStatus,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Failed to update subscription plan status.",
        );
      }

      setStatusPlan(null);

      showSuccessMessage(
        newStatus
          ? "Subscription plan activated successfully."
          : "Subscription plan deactivated successfully.",
      );

      await fetchPlans(true);
    } catch (err) {
      setError(getErrorMessage(err));
      setStatusPlan(null);
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // DELETE SUBSCRIPTION PLAN
  // ========================================

  const handleDelete = async () => {
    if (!deletePlan) return;

    const plan = deletePlan;

    try {
      setActionLoading(plan.id);
      setError("");

      const response = await api.delete(`${API_BASE}/${plan.id}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Failed to delete subscription plan.",
        );
      }

      setDeletePlan(null);

      showSuccessMessage("Subscription plan deleted successfully.");

      await fetchPlans(true);
    } catch (err) {
      setError(getErrorMessage(err));
      setDeletePlan(null);
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // OPEN MANAGE FEATURES
  // ========================================

  const openFeaturesModal = async (plan) => {
    setFeaturesPlan(plan);
    setFeatures([]);
    setFeaturesError("");
    setFeaturesNotice("");
    setFeaturesLoading(true);

    try {
      const response = await api.get(`${API_BASE}/${plan.id}/features`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Failed to fetch subscription features.",
        );
      }

      const data = response.data;

      const items = Array.isArray(data.features)
        ? data.features
        : Array.isArray(data.data)
          ? data.data
          : [];

      setFeatures(items.map(normalizeFeature));
    } catch (err) {
      setFeaturesError(getErrorMessage(err));
    } finally {
      setFeaturesLoading(false);
    }
  };

  // ========================================
  // CLOSE FEATURES MODAL
  // ========================================

  const closeFeaturesModal = () => {
    if (featureSavingId !== null) return;

    setFeaturesPlan(null);
    setFeatures([]);
    setFeaturesError("");
    setFeaturesNotice("");
  };

  // ========================================
  // CHANGE FEATURE VALUES
  // ========================================

  const changeFeature = (featureId, field, value) => {
    setFeatures((previous) =>
      previous.map((feature) =>
        getFeatureId(feature) === featureId
          ? {
              ...feature,
              [field]: value,
            }
          : feature,
      ),
    );
  };

  // ==========================================
  // SAVE SUBSCRIPTION FEATURE
  // ==========================================

  const saveFeature = async (feature) => {
    if (!featuresPlan) return;

    setFeaturesError("");
    setFeaturesNotice("");

    const featureKey = feature.featureKey;

    if (!featureKey) {
      setFeaturesError("Feature key is missing.");
      return;
    }

    let limitValue = null;

    if (feature.featureType === "limit") {
      if (feature.limitValue !== "" && feature.limitValue !== null) {
        const value = Number(feature.limitValue);

        if (
          !Number.isSafeInteger(value) ||
          value < 0 ||
          !/^(0|[1-9]\d*)$/.test(String(feature.limitValue))
        ) {
          setFeaturesError("Please enter a valid limit.");
          return;
        }

        limitValue = value;
      }
    }

    const payload = {
      isEnabled: Boolean(feature.isEnabled),
      limitValue,
    };

    try {
      setFeatureSavingId(feature.id);

      const response = await api.put(
        `/super-admin/subscription-plans/${featuresPlan.id}/features/${encodeURIComponent(featureKey)}`,
        payload,
        {
          headers: getAuthHeaders(),
        },
      );

      if (response.data.success === false) {
        throw new Error(response.data.message || "Failed to save feature.");
      }

      if (response.data.feature) {
        setFeatures((previous) =>
          previous.map((item) =>
            item.featureKey === featureKey
              ? { ...item, ...response.data.feature }
              : item,
          ),
        );
      }

      setFeaturesNotice("Feature updated successfully!");
    } catch (error) {
      setFeaturesError(getErrorMessage(error));
    } finally {
      setFeatureSavingId(null);
    }
  };

  // ========================================
  // FILTER PLANS
  // ========================================

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        String(plan.name || "")
          .toLowerCase()
          .includes(query) ||
        String(plan.slug || "")
          .toLowerCase()
          .includes(query) ||
        String(plan.id).includes(query);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && plan.isActive) ||
        (statusFilter === "inactive" && !plan.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  // ========================================
  // STATISTICS
  // ========================================

  const totalPlans = plans.length;

  const activePlans = plans.filter((plan) => plan.isActive).length;

  const inactivePlans = plans.filter((plan) => !plan.isActive).length;

  // ========================================
  // CSS CLASSES
  // ========================================

  const inputClass =
    "w-full rounded-xl border app-border app-bg app-text px-4 py-3 text-sm outline-none focus:border-cyan-500 theme-transition";

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="app-bg app-text min-h-screen theme-transition">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* ==================================
            PAGE HEADER
        ================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm app-muted">
              <ShieldCheck size={17} />
              <span>Super Admin</span>
              <span>/</span>
              <span>Subscription Management</span>
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <CreditCard className="text-cyan-500" size={30} />
              Subscription Management
            </h1>

            <p className="mt-2 text-sm app-muted">
              Manage subscription plans, pricing, billing intervals, features
              and availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchPlans(true)}
              disabled={refreshing || loading}
              className={`${buttonClass} border app-border`}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className={`${buttonClass} bg-cyan-500 text-slate-950 hover:bg-cyan-400`}
            >
              <Plus size={18} />
              Add Plan
            </button>
          </div>
        </div>

        {/* ==================================
            SUCCESS MESSAGE
        ================================== */}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-500">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* ==================================
            ERROR MESSAGE
        ================================== */}

        {error && !showModal && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            <AlertCircle size={20} />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ==================================
            STATISTICS
        ================================== */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL */}

          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Total Plans</p>

              <Layers3 size={22} className="text-cyan-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : totalPlans}
            </h2>
          </div>

          {/* ACTIVE */}

          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Active Plans</p>

              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : activePlans}
            </h2>
          </div>

          {/* INACTIVE */}

          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Inactive Plans</p>

              <Ban size={22} className="text-orange-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : inactivePlans}
            </h2>
          </div>
        </div>

        {/* ==================================
            SEARCH AND FILTER
        ================================== */}

        <div className="mb-6 flex flex-col gap-4 rounded-2xl border app-border p-5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 app-muted"
            />

            <input
              type="text"
              placeholder="Search subscription plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ==================================
            SUBSCRIPTION TABLE
        ================================== */}

        <div className="overflow-hidden rounded-2xl border app-border">
          <div className="flex items-center justify-between border-b app-border p-5">
            <div>
              <h2 className="text-lg font-bold">Subscription Plans</h2>

              <p className="mt-1 text-sm app-muted">
                {filteredPlans.length} plans found
              </p>
            </div>

            <CreditCard size={22} className="text-cyan-500" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16">
              <LoaderCircle className="animate-spin text-cyan-500" size={25} />
              <span>Loading subscription plans...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="p-16 text-center">
              <Layers3 size={42} className="mx-auto mb-4 app-muted" />

              <h3 className="text-lg font-semibold">
                No subscription plans found
              </h3>

              <p className="mt-2 text-sm app-muted">
                Add a new plan or change your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b app-border">
                  <tr className="app-muted">
                    <th className="px-5 py-4 font-semibold">Plan</th>

                    <th className="px-5 py-4 font-semibold">Price</th>

                    <th className="px-5 py-4 font-semibold">Billing</th>

                    <th className="px-5 py-4 font-semibold">Status</th>

                    <th className="px-5 py-4 font-semibold">Created</th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlans.map((plan) => {
                    const isActive = Boolean(plan.isActive);

                    const isBusy = actionLoading === plan.id;

                    return (
                      <tr
                        key={plan.id}
                        className="border-b app-border last:border-0"
                      >
                        <td className="px-5 py-5">
                          <div className="font-semibold">{plan.name}</div>

                          <div className="mt-1 text-xs app-muted">
                            {plan.slug}
                          </div>

                          <div className="mt-1 text-xs app-muted">
                            ID: {plan.id}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2 font-semibold">
                            <DollarSign
                              size={16}
                              className="text-emerald-500"
                            />

                            {formatPrice(plan.priceCents, plan.currency)}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2 capitalize">
                            <CalendarDays size={16} />
                            {plan.billingInterval}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-5 app-muted">
                          {formatDate(plan.createdAt)}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center justify-end gap-2">
                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() => openEditModal(plan)}
                              disabled={isBusy}
                              title="Edit Plan"
                              className="rounded-lg p-2 text-cyan-500 hover:bg-cyan-500/10 disabled:opacity-40"
                            >
                              <Pencil size={17} />
                            </button>

                            {/* FEATURES */}

                            <button
                              type="button"
                              onClick={() => openFeaturesModal(plan)}
                              disabled={isBusy}
                              title="Manage Features"
                              className="rounded-lg p-2 text-cyan-500 hover:bg-cyan-500/10 disabled:opacity-40"
                            >
                              <SlidersHorizontal size={17} />
                            </button>

                            {/* STATUS */}

                            <button
                              type="button"
                              onClick={() => setStatusPlan(plan)}
                              disabled={isBusy}
                              title={
                                isActive ? "Deactivate Plan" : "Activate Plan"
                              }
                              className={`rounded-lg p-2 disabled:opacity-40 ${
                                isActive
                                  ? "text-orange-500 hover:bg-orange-500/10"
                                  : "text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              {isBusy ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : isActive ? (
                                <Ban size={17} />
                              ) : (
                                <CheckCircle2 size={17} />
                              )}
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() => setDeletePlan(plan)}
                              disabled={isBusy}
                              title="Delete Plan"
                              className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================
          ADD / EDIT MODAL
      ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              editingPlan ? "Edit Subscription Plan" : "Add Subscription Plan"
            }
            className="app-bg app-text w-full max-w-lg overflow-hidden rounded-2xl border app-border shadow-2xl"
          >
            <div className="flex items-center justify-between border-b app-border p-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingPlan
                    ? "Edit Subscription Plan"
                    : "Add New Subscription Plan"}
                </h2>

                <p className="mt-1 text-sm app-muted">
                  {editingPlan
                    ? "Update subscription plan details."
                    : "Create a new subscription plan."}
                </p>
              </div>

              <button type="button" onClick={closeModal} disabled={saving}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Plan Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Starter"
                    className={inputClass}
                    required
                  />
                </div>

                {/* SLUG */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Plan Slug *
                  </label>

                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="e.g. starter"
                    className={inputClass}
                    required
                  />
                </div>

                {/* PRICE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Price *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="29.00"
                    className={inputClass}
                    required
                  />
                </div>

                {/* CURRENCY */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Currency
                  </label>

                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </div>

                {/* BILLING */}

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Billing Interval
                  </label>

                  <select
                    name="billingInterval"
                    value={form.billingInterval}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                {/* ACTIVE */}

                {!editingPlan && (
                  <label className="flex items-center gap-3 rounded-xl border app-border p-4">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 accent-cyan-500"
                    />

                    <span className="text-sm font-semibold">
                      Activate plan immediately
                    </span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t app-border p-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={`${buttonClass} border app-border`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} bg-cyan-500 text-slate-950 hover:bg-cyan-400`}
                >
                  {saving ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingPlan
                      ? "Update Plan"
                      : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          MANAGE FEATURES MODAL
      ====================================== */}

      {featuresPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Manage Subscription Features"
            className="app-bg app-text w-full max-w-3xl overflow-hidden rounded-2xl border app-border shadow-2xl"
          >
            <div className="flex items-center justify-between border-b app-border p-5">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <SlidersHorizontal size={22} className="text-cyan-500" />
                  Manage Features
                </h2>

                <p className="mt-1 text-sm app-muted">
                  Subscription: {featuresPlan.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFeaturesModal}
                disabled={featureSavingId !== null}
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {/* ERROR */}

              {featuresError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
                  <AlertCircle size={18} />
                  {featuresError}
                </div>
              )}

              {/* SUCCESS */}

              {featuresNotice && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-500">
                  <CheckCircle2 size={18} />
                  {featuresNotice}
                </div>
              )}

              {featuresLoading ? (
                <div className="flex items-center justify-center gap-3 py-16">
                  <LoaderCircle
                    size={24}
                    className="animate-spin text-cyan-500"
                  />
                  Loading features...
                </div>
              ) : features.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers3 size={40} className="mx-auto mb-3 app-muted" />

                  <p className="font-semibold">No features found</p>

                  <p className="mt-2 text-sm app-muted">
                    No subscription features were returned by the API.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const featureId = getFeatureId(feature);

                    const busy = featureSavingId === featureId;

                    const isLimit =
                      feature.featureType === "limit" ||
                      feature.type === "limit";

                    return (
                      <div
                        key={featureId ?? index}
                        className="rounded-xl border app-border p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {getFeatureName(feature)}
                            </h3>

                            <p className="mt-1 text-xs app-muted">
                              {feature.description || feature.featureKey || ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            {/* LIMIT */}

                            {isLimit && (
                              <div>
                                <label className="mb-1 block text-xs app-muted">
                                  Limit
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={feature.limitValue}
                                  onChange={(e) =>
                                    changeFeature(
                                      featureId,
                                      "limitValue",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28 rounded-lg border app-border app-bg app-text px-3 py-2 text-sm"
                                />
                              </div>
                            )}

                            {/* ENABLE */}

                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={feature.isEnabled}
                                onChange={(e) =>
                                  changeFeature(
                                    featureId,
                                    "isEnabled",
                                    e.target.checked,
                                  )
                                }
                                className="h-4 w-4 accent-cyan-500"
                              />
                              Enabled
                            </label>

                            {/* SAVE */}

                            <button
                              type="button"
                              onClick={() => saveFeature(feature)}
                              disabled={
                                featureSavingId !== null || featureId == null
                              }
                              className={`${buttonClass} bg-cyan-500 text-slate-950 hover:bg-cyan-400`}
                            >
                              {busy ? (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save size={16} />
                              )}
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t app-border p-5">
              <button
                type="button"
                onClick={closeFeaturesModal}
                disabled={featureSavingId !== null}
                className={`${buttonClass} border app-border`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          STATUS CONFIRMATION MODAL
      ====================================== */}

      {statusPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="app-bg app-text w-full max-w-md rounded-2xl border app-border p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertCircle size={26} className="text-orange-500" />

              <h2 className="text-xl font-bold">Confirm Status Change</h2>
            </div>

            <p className="mb-6 text-sm app-muted">
              Are you sure you want to{" "}
              <strong>{statusPlan.isActive ? "deactivate" : "activate"}</strong>{" "}
              the subscription plan <strong>{statusPlan.name}</strong>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusPlan(null)}
                disabled={actionLoading !== null}
                className={`${buttonClass} border app-border`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStatusChange}
                disabled={actionLoading !== null}
                className={`${buttonClass} bg-orange-500 text-white hover:bg-orange-600`}
              >
                {actionLoading !== null ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {deletePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="app-bg app-text w-full max-w-md rounded-2xl border app-border p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <Trash2 size={26} className="text-red-500" />

              <h2 className="text-xl font-bold">Delete Subscription Plan</h2>
            </div>

            <p className="mb-4 text-sm app-muted">
              Are you sure you want to delete <strong>{deletePlan.name}</strong>
              ?
            </p>

            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
              This action may permanently remove the subscription plan. Please
              confirm before continuing.
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletePlan(null)}
                disabled={actionLoading !== null}
                className={`${buttonClass} border app-border`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading !== null}
                className={`${buttonClass} bg-red-500 text-white hover:bg-red-600`}
              >
                {actionLoading !== null ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
