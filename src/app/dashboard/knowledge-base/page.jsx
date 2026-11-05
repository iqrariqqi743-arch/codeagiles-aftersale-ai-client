"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";

import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  FileText,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  CircleHelp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
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

const CATEGORIES = [
  { value: "faq", label: "FAQ", icon: CircleHelp },
  { value: "shipping", label: "Shipping", icon: Truck },
  { value: "return", label: "Returns", icon: RotateCcw },
  { value: "refund", label: "Refunds", icon: CreditCard },
  { value: "product", label: "Products", icon: Package },
  { value: "general", label: "General", icon: FileText },
];

const EMPTY_FORM = {
  title: "",
  content: "",
  category: "faq",
  status: "active",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [storesLoading, setStoresLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // AI PLAYGROUND STATES
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState(null);
  const [testingAI, setTestingAI] = useState(false);

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

  const secondaryButton = `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
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

  // FETCH STORES
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
          : storeList.length
            ? String(storeList[0].id)
            : "";
      });
    } catch (err) {
      handleApiError(err, "Failed to load stores");
    } finally {
      setStoresLoading(false);
    }
  }, [handleApiError]);

  // FETCH ARTICLES
  const fetchArticles = useCallback(
    async (storeId) => {
      if (!storeId) {
        setArticles([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/ai/knowledge/${storeId}`);

        const data = response.data;

        const articleList = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.articles)
            ? data.articles
            : [];

        setArticles(articleList);
      } catch (err) {
        handleApiError(err, "Failed to load knowledge articles");
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchArticles(selectedStoreId);
    } else {
      setArticles([]);
    }
  }, [selectedStoreId, fetchArticles]);

  // OPEN ADD MODAL
  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // OPEN EDIT MODAL
  const openEditModal = (article) => {
    setEditingId(article.id);

    setForm({
      title: article.title || "",
      content: article.content || "",
      category: article.category || "faq",
      status: article.status || "active",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // FORM INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // CREATE / UPDATE ARTICLE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStoreId) {
      setError("Please select a store first.");
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        status: form.status,
      };

      let response;

      if (editingId) {
        response = await api.put(`/ai/knowledge/${editingId}`, payload);
      } else {
        response = await api.post(`/ai/knowledge/${selectedStoreId}`, payload);
      }

      setSuccess(
        response.data?.message ||
          (editingId
            ? "Article updated successfully"
            : "Article created successfully"),
      );

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);

      await fetchArticles(selectedStoreId);
    } catch (err) {
      handleApiError(err, "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  // DELETE ARTICLE
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this knowledge article?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/ai/knowledge/${id}`);

      setSuccess(response.data?.message || "Article deleted successfully");

      setArticles((previous) =>
        previous.filter((article) => String(article.id) !== String(id)),
      );
    } catch (err) {
      handleApiError(err, "Failed to delete article");
    } finally {
      setDeletingId(null);
    }
  };

  // TEST KNOWLEDGE BASE AI
  const handleTestAI = async (e) => {
    e.preventDefault();

    if (!selectedStoreId) {
      setError("Please select a store first.");
      return;
    }

    if (!question.trim()) {
      setError("Please enter your question.");
      return;
    }

    try {
      setTestingAI(true);
      setError("");
      setAiAnswer(null);

      const response = await api.post("/knowledge-base/test", {
        question: question.trim(),
      });

      setAiAnswer(response.data);
    } catch (err) {
      handleApiError(err, "Failed to test AI Knowledge Base");
    } finally {
      setTestingAI(false);
    }
  };

  // FILTER ARTICLES
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title?.toLowerCase().includes(search.toLowerCase()) ||
      article.content?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || article.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const activeCount = articles.filter(
    (article) => article.status === "active",
  ).length;

  const getCategory = (value) =>
    CATEGORIES.find((item) => item.value === value) || CATEGORIES[5];

  return (
    <div className="space-y-7 pb-10">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-500">
            <Sparkles size={16} />
            AI Knowledge Management
          </div>

          <h1
            className={`text-2xl font-bold tracking-tight sm:text-3xl ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Knowledge Base
          </h1>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Manage store FAQs, shipping information, return policies and other
            information used by your AI assistant.
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={!selectedStoreId}
          className={primaryButton}
        >
          <Plus size={18} />
          Add Article
        </button>
      </div>

      {/* ALERTS */}
      {error && !modalOpen && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && !modalOpen && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-500">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* STORE SELECTOR */}
      <div className={`${cardClass} p-5`}>
        <label
          className={`mb-2 block text-sm font-semibold ${
            isDark ? "text-slate-200" : "text-slate-700"
          }`}
        >
          Select Store
        </label>

        <div className="relative max-w-md">
          <select
            value={selectedStoreId}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setSuccess("");
              setError("");
            }}
            disabled={storesLoading || stores.length === 0}
            className={`${inputClass} appearance-none pr-10`}
          >
            {storesLoading && <option value="">Loading stores...</option>}

            {!storesLoading && stores.length === 0 && (
              <option value="">No stores available</option>
            )}

            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name || store.store_name || `Store #${store.id}`}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
          />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedClass}`}>Total Articles</p>
              <h3
                className={`mt-2 text-3xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {articles.length}
              </h3>
            </div>

            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
              <BookOpen size={23} />
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedClass}`}>Active Articles</p>
              <h3 className="mt-2 text-3xl font-bold text-emerald-500">
                {activeCount}
              </h3>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
              <CheckCircle2 size={23} />
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${mutedClass}`}>Inactive Articles</p>
              <h3 className="mt-2 text-3xl font-bold text-amber-500">
                {articles.length - activeCount}
              </h3>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
              <FileText size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* AI PLAYGROUND */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-inherit p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
              <Sparkles size={23} />
            </div>

            <div>
              <h2
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                AI Knowledge Playground
              </h2>

              <p className={`mt-1 text-sm ${mutedClass}`}>
                Test your AI assistant using your saved Knowledge Base articles.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <form onSubmit={handleTestAI} className="space-y-4">
            <div>
              <label
                className={`mb-2 block text-sm font-semibold ${
                  isDark ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Ask your AI assistant
              </label>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: How long does delivery take?"
                rows={3}
                className={inputClass}
                disabled={testingAI || !selectedStoreId}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-xs ${mutedClass}`}>
                This is a private test. No customer message will be sent.
              </p>

              <button
                type="submit"
                disabled={testingAI || !selectedStoreId || !question.trim()}
                className={primaryButton}
              >
                {testingAI ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Sparkles size={17} />
                )}

                {testingAI ? "Testing AI..." : "Test AI"}
              </button>
            </div>
          </form>

          {aiAnswer && (
            <div
              className={`rounded-2xl border p-5 ${
                isDark
                  ? "border-indigo-500/20 bg-indigo-500/5"
                  : "border-indigo-100 bg-indigo-50/50"
              }`}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3
                  className={`font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  AI Response
                </h3>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    aiAnswer.information_status === "available"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : aiAnswer.information_status === "partially_available"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {aiAnswer.information_status === "available"
                    ? "Information Available"
                    : aiAnswer.information_status === "partially_available"
                      ? "Partially Available"
                      : "Information Not Available"}
                </span>
              </div>

              <p
                className={`whitespace-pre-wrap text-sm leading-7 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {aiAnswer.answer}
              </p>

              {aiAnswer.sources?.length > 0 && (
                <div className="mt-5 border-t border-inherit pt-4">
                  <h4
                    className={`mb-3 text-sm font-semibold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Knowledge Base Sources
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {aiAnswer.sources.map((source) => (
                      <span
                        key={source.id}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                          isDark
                            ? "bg-white/5 text-slate-300"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        <FileText size={14} />
                        {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500">
                <CheckCircle2 size={15} />
                Private test completed. No customer reply was sent.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ARTICLE LIST */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col justify-between gap-4 border-b border-inherit p-5 lg:flex-row lg:items-center">
          <div>
            <h2
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Knowledge Articles
            </h2>

            <p className={`mt-1 text-sm ${mutedClass}`}>
              Information available to your AI assistant.
            </p>
          </div>

          <button
            onClick={() => fetchArticles(selectedStoreId)}
            disabled={!selectedStoreId || loading}
            className={secondaryButton}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-3 p-5 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
            />

            <input
              type="text"
              placeholder="Search articles by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`${inputClass} md:w-52`}
          >
            <option value="all">All Categories</option>

            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead
              className={
                isDark
                  ? "bg-white/[0.03] text-slate-400"
                  : "bg-slate-50 text-slate-500"
              }
            >
              <tr className="text-xs uppercase tracking-wider">
                <th className="px-5 py-4 font-semibold">Article</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <Loader2
                      size={28}
                      className="mx-auto animate-spin text-indigo-500"
                    />
                    <p className={`mt-3 text-sm ${mutedClass}`}>
                      Loading knowledge articles...
                    </p>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-16 text-center">
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                        isDark ? "bg-white/5" : "bg-slate-100"
                      }`}
                    >
                      <BookOpen size={25} className={mutedClass} />
                    </div>

                    <h3
                      className={`mt-4 font-semibold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {articles.length === 0
                        ? "No articles yet"
                        : "No matching articles"}
                    </h3>

                    <p className={`mt-2 text-sm ${mutedClass}`}>
                      {articles.length === 0
                        ? "Add your first article to help your AI assistant answer customers."
                        : "Try another search or category."}
                    </p>

                    {articles.length === 0 && (
                      <button
                        onClick={openAddModal}
                        disabled={!selectedStoreId}
                        className={`${primaryButton} mt-5`}
                      >
                        <Plus size={17} />
                        Create First Article
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const category = getCategory(article.category);
                  const CategoryIcon = category.icon;

                  return (
                    <tr
                      key={article.id}
                      className={`border-t transition ${
                        isDark
                          ? "border-white/5 hover:bg-white/[0.025]"
                          : "border-slate-100 hover:bg-slate-50"
                      }`}
                    >
                      <td className="max-w-sm px-5 py-4">
                        <div
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {article.title}
                        </div>

                        <p
                          className={`mt-1 line-clamp-2 text-xs ${mutedClass}`}
                        >
                          {article.content}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                            isDark
                              ? "bg-white/5 text-slate-300"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <CategoryIcon size={14} />
                          {category.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            article.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              article.status === "active"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {article.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className={`px-5 py-4 text-xs ${mutedClass}`}>
                        {article.created_at
                          ? new Date(article.created_at).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(article)}
                            title="Edit article"
                            className={`rounded-lg p-2 transition ${
                              isDark
                                ? "text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400"
                                : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                            }`}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(article.id)}
                            disabled={deletingId === article.id}
                            title="Delete article"
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === article.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          className={`border-t border-inherit px-5 py-4 text-xs ${mutedClass}`}
        >
          Showing {filteredArticles.length} of {articles.length} articles
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className={`${cardClass} my-auto w-full max-w-2xl shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-inherit p-5">
              <div>
                <h2
                  className={`text-xl font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {editingId ? "Edit Article" : "Create Article"}
                </h2>

                <p className={`mt-1 text-sm ${mutedClass}`}>
                  Add information for your AI assistant.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className={`rounded-xl p-2 ${mutedClass} hover:bg-white/5`}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}

              <div>
                <label
                  className={`mb-2 block text-sm font-semibold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Article Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: What is your shipping policy?"
                  maxLength={255}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm font-semibold ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  Article Content *
                </label>

                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="Write the complete answer or information here..."
                  rows={7}
                  required
                  className={`${inputClass} resize-y`}
                />

                <p className={`mt-2 text-xs ${mutedClass}`}>
                  Write clear and accurate information. Your AI assistant will
                  use active articles when generating reply suggestions.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    Category *
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`mb-2 block text-sm font-semibold ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    Status *
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div
                className={`flex flex-col-reverse justify-end gap-3 border-t border-inherit pt-5 sm:flex-row`}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={secondaryButton}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButton}
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Article"
                      : "Create Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
