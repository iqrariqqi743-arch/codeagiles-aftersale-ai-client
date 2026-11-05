"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";

import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  Shield,
  CheckCircle2,
  Ban,
  LoaderCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

// ==========================================
// DEFAULT FORM
// ==========================================

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "owner",
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

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function SuperAdminUsersPage() {
  const router = useRouter();

  // ========================================
  // STATES
  // ========================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);

  const [deleteUser, setDeleteUser] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  // ========================================
  // AUTH HEADERS
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
  // GET ALL USERS
  // ========================================

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = {
          page,
          limit,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        if (roleFilter) {
          params.role = roleFilter;
        }

        if (statusFilter) {
          params.status = statusFilter;
        }

        const response = await api.get("/super-admin/users", {
          headers: getAuthHeaders(),
          params,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch users.");
        }

        setUsers(response.data.users || []);

        setPagination(
          response.data.pagination || {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        );
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, roleFilter, statusFilter, getAuthHeaders],
  );

  // ========================================
  // CHECK AUTHENTICATION
  // ========================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const savedUser = JSON.parse(localStorage.getItem("user") || "null");

      if (savedUser?.id) {
        setCurrentUserId(String(savedUser.id));
      }
    } catch {
      // Backend middleware remains responsible
      // for enforcing Super Admin authorization.
    }
  }, [router]);

  // ========================================
  // FETCH USERS
  // ========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ========================================
  // RESET PAGE ON FILTER CHANGE
  // ========================================

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

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
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setEditingUser(null);
    setForm(initialForm);
    setShowPassword(false);
    setError("");
    setShowModal(true);
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "owner",
    });

    setShowPassword(false);
    setError("");
    setShowModal(true);
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setForm(initialForm);
    setShowPassword(false);
  };

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========================================
  // CREATE / UPDATE USER
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!editingUser && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (editingUser && form.password && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
      }

      let response;

      if (editingUser) {
        response = await api.put(
          `/super-admin/users/${editingUser.id}`,
          payload,
          {
            headers: getAuthHeaders(),
          },
        );
      } else {
        response = await api.post("/super-admin/users", payload, {
          headers: getAuthHeaders(),
        });
      }

      if (!response.data.success) {
        throw new Error(response.data.message || "Unable to save user.");
      }

      setShowModal(false);
      setEditingUser(null);
      setForm(initialForm);

      showSuccessMessage(
        editingUser
          ? "User updated successfully."
          : "User created successfully.",
      );

      await fetchUsers(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // ACTIVATE / DEACTIVATE USER
  // ========================================

  const handleStatusChange = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";

    if (currentUserId === String(user.id) && newStatus === "inactive") {
      setError("You cannot deactivate your own account.");
      return;
    }

    try {
      setActionLoading(user.id);
      setError("");

      const response = await api.patch(
        `/super-admin/users/${user.id}/status`,
        {
          status: newStatus,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update status.");
      }

      showSuccessMessage(
        newStatus === "active"
          ? "User activated successfully."
          : "User deactivated successfully.",
      );

      await fetchUsers(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // DELETE USER
  // ========================================

  const handleDelete = async () => {
    if (!deleteUser) return;

    if (currentUserId === String(deleteUser.id)) {
      setError("You cannot delete your own account.");
      setDeleteUser(null);
      return;
    }

    try {
      setActionLoading(deleteUser.id);
      setError("");

      const response = await api.delete(`/super-admin/users/${deleteUser.id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete user.");
      }

      setDeleteUser(null);

      showSuccessMessage("User deleted successfully.");

      if (users.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchUsers(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteUser(null);
    } finally {
      setActionLoading(null);
    }
  };

  // ========================================
  // STATS
  // ========================================

  const totalUsers = pagination.total;

  const activeOnPage = users.filter((user) => user.status === "active").length;

  const inactiveOnPage = users.filter(
    (user) => user.status === "inactive",
  ).length;

  // ========================================
  // STYLES
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
              <span>Users Management</span>
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
              <Users className="text-cyan-500" size={30} />
              Users Management
            </h1>

            <p className="mt-2 text-sm app-muted">
              Manage platform users, roles and account access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
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
              <UserPlus size={18} />
              Add User
            </button>
          </div>
        </div>

        {/* ==================================
            SUCCESS MESSAGE
        ================================== */}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-500">
            <CheckCircle2 size={20} />
            {success}
          </div>
        )}

        {/* ==================================
            ERROR MESSAGE
        ================================== */}

        {error && !showModal && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            <AlertCircle size={20} />
            <span>{error}</span>
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
          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Total Matching Users</p>
              <Users size={22} className="text-cyan-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : totalUsers}
            </h2>
          </div>

          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Active on This Page</p>
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : activeOnPage}
            </h2>
          </div>

          <div className="rounded-2xl border app-border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm app-muted">Inactive on This Page</p>
              <Ban size={22} className="text-red-500" />
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {loading ? "..." : inactiveOnPage}
            </h2>
          </div>
        </div>

        {/* ==================================
            SEARCH AND FILTERS
        ================================== */}

        <div className="mb-6 rounded-2xl border app-border p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 app-muted" />

              <input
                type="text"
                placeholder="Search name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All Roles</option>
              <option value="owner">Merchant / Owner</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ==================================
            USERS TABLE
        ================================== */}

        <div className="overflow-hidden rounded-2xl border app-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b app-border px-5 py-5">
            <div>
              <h3 className="text-lg font-bold">Registered Users</h3>

              <p className="mt-1 text-sm app-muted">
                View and manage registered accounts.
              </p>
            </div>

            <span className="rounded-full border app-border px-3 py-1 text-xs app-muted">
              {pagination.total} Users
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 app-muted">
              <LoaderCircle size={24} className="animate-spin text-cyan-500" />
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={45} className="mx-auto mb-4 app-muted" />

              <p className="font-medium">No users found</p>

              <p className="mt-2 text-sm app-muted">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b app-border">
                  <tr className="text-xs uppercase tracking-wider app-muted">
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => {
                    const isSelf = currentUserId === String(user.id);

                    const isActive = user.status === "active";

                    return (
                      <tr
                        key={user.id}
                        className="border-b app-border transition last:border-b-0 hover:bg-cyan-500/5"
                      >
                        {/* USER */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 font-bold text-cyan-500">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{user.name}</p>

                                {isSelf && (
                                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-500">
                                    YOU
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs app-muted">
                                {user.email}
                              </p>

                              <p className="mt-1 text-xs app-muted">
                                ID: #{user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              user.role === "super_admin"
                                ? "bg-purple-500/10 text-purple-500"
                                : "bg-cyan-500/10 text-cyan-500"
                            }`}
                          >
                            {user.role === "super_admin" ? (
                              <ShieldCheck size={14} />
                            ) : (
                              <Shield size={14} />
                            )}

                            {user.role === "super_admin"
                              ? "Super Admin"
                              : "Owner"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />

                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* CREATED AT */}

                        <td className="px-5 py-4 text-sm app-muted">
                          {formatDate(user.created_at)}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              title="Edit User"
                              className="rounded-lg p-2 text-cyan-500 transition hover:bg-cyan-500/10"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(user)}
                              disabled={
                                actionLoading === user.id ||
                                (isSelf && isActive)
                              }
                              title={
                                isActive ? "Deactivate User" : "Activate User"
                              }
                              className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                isActive
                                  ? "text-orange-500 hover:bg-orange-500/10"
                                  : "text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              {actionLoading === user.id ? (
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

                            <button
                              type="button"
                              onClick={() => setDeleteUser(user)}
                              disabled={isSelf}
                              title="Delete User"
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
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

          {/* ==================================
              PAGINATION
          ================================== */}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t app-border px-5 py-4">
            <p className="text-sm app-muted">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              {" • "}
              {pagination.total} total users
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => prev - 1)}
                className={`${buttonClass} border app-border`}
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((prev) => prev + 1)}
                className={`${buttonClass} border app-border`}
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          ADD / EDIT USER MODAL
      ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingUser ? "Edit User" : "Add New User"}
            className="app-bg app-text w-full max-w-lg overflow-hidden rounded-2xl border app-border shadow-2xl"
          >
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b app-border p-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>

                <p className="mt-1 text-sm app-muted">
                  {editingUser
                    ? "Update account information."
                    : "Create a new platform account."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 app-muted hover:bg-cyan-500/10"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}

            <form onSubmit={handleSubmit}>
              <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    className={inputClass}
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                    className={inputClass}
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password
                    {editingUser && (
                      <span className="ml-2 text-xs app-muted">
                        (Leave blank to keep current)
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        editingUser
                          ? "Optional new password"
                          : "Minimum 8 characters"
                      }
                      required={!editingUser}
                      minLength={8}
                      className={`${inputClass} pr-12`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 app-muted"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* ROLE */}

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    User Role
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={
                      editingUser && currentUserId === String(editingUser.id)
                    }
                    className={inputClass}
                  >
                    <option value="owner">Merchant / Owner</option>

                    <option value="super_admin">Super Admin</option>
                  </select>

                  {editingUser && currentUserId === String(editingUser.id) && (
                    <p className="mt-2 text-xs app-muted">
                      You cannot change your own role.
                    </p>
                  )}
                </div>
              </div>

              {/* MODAL FOOTER */}

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
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingUser ? "Update User" : "Create User"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete User Confirmation"
            className="app-bg app-text w-full max-w-md rounded-2xl border app-border p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <Trash2 size={26} className="text-red-500" />
            </div>

            <h2 className="text-xl font-bold">Delete User?</h2>

            <p className="mt-3 text-sm leading-6 app-muted">
              Are you sure you want to permanently delete{" "}
              <strong className="app-text">{deleteUser.name}</strong>?
            </p>

            <p className="mt-2 text-sm text-red-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                disabled={actionLoading === deleteUser.id}
                className={`${buttonClass} border app-border`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading === deleteUser.id}
                className={`${buttonClass} bg-red-600 text-white hover:bg-red-500`}
              >
                {actionLoading === deleteUser.id ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
