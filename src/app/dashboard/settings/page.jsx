"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCircle2,
} from "lucide-react";

import api from "@/utils/api";
import { useTheme } from "@/context/ThemeProvider";

// Change this prefix if your Express auth router
// is mounted at a different path.
const AUTH_BASE = "/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U"
  );
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function ProfilePage() {
  const router = useRouter();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  // ==============================
  // STATES
  // ==============================

  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [pageError, setPageError] = useState("");

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // ==============================
  // THEME
  // ==============================

  const cardClass = isDark
    ? "bg-[#172235] border-white/10"
    : "bg-white border-slate-200 shadow-sm";

  const titleClass = isDark ? "text-white" : "text-slate-900";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const inputClass = isDark
    ? "bg-[#101a2b] border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500";

  const secondaryClass = isDark
    ? "border-white/10 text-slate-300 hover:bg-white/5"
    : "border-slate-200 text-slate-700 hover:bg-slate-50";

  const labelClass = `mb-2 block text-sm font-medium ${titleClass}`;

  const inputBase =
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-cyan-500/10";

  // ==============================
  // AUTH ERROR HANDLER
  // ==============================

  const handleError = useCallback((error, fallback) => {
    if (error.response?.status === 401) {
      // A 401 can also mean the current password
      // was incorrect, so don't automatically
      // log out for password-change errors.
      return error.response?.data?.message || fallback;
    }

    return error.response?.data?.message || error.message || fallback;
  }, []);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    router.replace("/login");
  }, [router]);

  // ==============================
  // FETCH PROFILE
  // ==============================

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await api.get(`${AUTH_BASE}/me`);

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Failed to fetch profile");
      }

      const currentUser = response.data?.user;

      if (!currentUser) {
        throw new Error("User information not found");
      }

      setUser(currentUser);

      setProfile({
        name: currentUser.name || "",
        email: currentUser.email || "",
      });
    } catch (error) {
      console.error("Profile fetch error:", error);

      if (error.response?.status === 401) {
        redirectToLogin();
        return;
      }

      setPageError(handleError(error, "Failed to load profile"));
    } finally {
      setLoading(false);
    }
  }, [handleError, redirectToLogin]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ==============================
  // UPDATE PROFILE
  // ==============================

  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    setProfileMessage(null);

    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();

    if (!name) {
      setProfileMessage({
        type: "error",
        text: "Please enter your name.",
      });
      return;
    }

    if (!emailRegex.test(email)) {
      setProfileMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setSavingProfile(true);

      const response = await api.put(`${AUTH_BASE}/profile`, { name, email });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Profile update failed");
      }

      const updatedUser = response.data.user;

      setUser(updatedUser);

      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      // Keep locally cached user information updated.
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfileMessage({
        type: "success",
        text: response.data.message || "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);

      setProfileMessage({
        type: "error",
        text: handleError(error, "Failed to update profile"),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // ==============================
  // CHANGE PASSWORD
  // ==============================

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage(null);

    const { currentPassword, newPassword, confirmPassword } = password;

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Please enter your current password.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from your current password.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setSavingPassword(true);

      const response = await api.put(`${AUTH_BASE}/change-password`, {
        currentPassword,
        newPassword,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Password change failed");
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage({
        type: "success",
        text: response.data.message || "Password changed successfully.",
      });
    } catch (error) {
      console.error("Password change error:", error);

      setPasswordMessage({
        type: "error",
        text: handleError(error, "Failed to change password"),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // ==============================
  // PASSWORD VISIBILITY
  // ==============================

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // ==============================
  // MESSAGE COMPONENT
  // ==============================

  const MessageAlert = ({ message }) => {
    if (!message) return null;

    const success = message.type === "success";

    return (
      <div
        role="alert"
        className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          success
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            : "border-red-500/20 bg-red-500/10 text-red-500"
        }`}
      >
        {success ? (
          <CheckCircle2 size={19} className="shrink-0" />
        ) : (
          <AlertCircle size={19} className="shrink-0" />
        )}

        <span>{message.text}</span>
      </div>
    );
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw size={36} className="mx-auto animate-spin text-cyan-500" />

          <p className={`mt-4 text-sm ${mutedClass}`}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (pageError && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div
          className={`w-full max-w-md rounded-2xl border p-8 text-center ${cardClass}`}
        >
          <AlertCircle size={42} className="mx-auto text-red-500" />

          <h2 className={`mt-4 text-lg font-semibold ${titleClass}`}>
            Profile unavailable
          </h2>

          <p className={`mt-2 text-sm ${mutedClass}`}>{pageError}</p>

          <button
            onClick={fetchProfile}
            className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==============================
  // MAIN PAGE
  // ==============================

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      {/* BACK */}

      <Link
        href="/dashboard"
        className={`inline-flex items-center gap-2 text-sm transition hover:text-cyan-500 ${mutedClass}`}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </Link>

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-cyan-500">
            ACCOUNT MANAGEMENT
          </p>

          <h1 className={`text-3xl font-bold ${titleClass}`}>
            Profile Settings
          </h1>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            Manage your personal information and account security.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProfile}
          disabled={loading}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition disabled:opacity-50 ${secondaryClass}`}
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Profile
        </button>
      </div>

      {/* PROFILE BANNER */}

      <div className={`overflow-hidden rounded-2xl border ${cardClass}`}>
        <div className="h-32 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700" />

        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
            {/* AVATAR */}

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-[#172235] bg-gradient-to-br from-cyan-400 to-blue-600 text-3xl font-bold text-white shadow-lg">
              {getInitials(user?.name)}
            </div>

            {/* USER DETAILS */}

            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${titleClass}`}>
                {user?.name || "User"}
              </h2>

              <p className={`mt-1 text-sm ${mutedClass}`}>{user?.email}</p>
            </div>

            {/* ROLE */}

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold capitalize text-cyan-500">
              <ShieldCheck size={15} />
              {user?.role || "User"}
            </span>
          </div>
        </div>
      </div>

      {/* ACCOUNT INFORMATION */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className={`rounded-2xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <UserCircle2 size={22} />
          </div>

          <p className={`text-sm ${mutedClass}`}>Account Name</p>

          <h3 className={`mt-2 font-semibold ${titleClass}`}>{user?.name}</h3>
        </div>

        <div className={`rounded-2xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Mail size={22} />
          </div>

          <p className={`text-sm ${mutedClass}`}>Email Address</p>

          <h3 className={`mt-2 break-all font-semibold ${titleClass}`}>
            {user?.email}
          </h3>
        </div>

        <div className={`rounded-2xl border p-5 ${cardClass}`}>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <CalendarDays size={22} />
          </div>

          <p className={`text-sm ${mutedClass}`}>Member Since</p>

          <h3 className={`mt-2 font-semibold ${titleClass}`}>
            {formatDate(user?.created_at)}
          </h3>
        </div>
      </div>

      {/* SETTINGS FORMS */}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {/* =========================
            UPDATE PROFILE
        ========================= */}

        <section className={`rounded-2xl border p-6 ${cardClass}`}>
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-500">
              <UserRound size={22} />
            </div>

            <div>
              <h2 className={`text-lg font-semibold ${titleClass}`}>
                Personal Information
              </h2>

              <p className={`mt-1 text-sm ${mutedClass}`}>
                Update your name and email address.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* NAME */}

            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full Name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
                />

                <input
                  id="profile-name"
                  type="text"
                  required
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter your full name"
                  className={`${inputBase} ${inputClass} pl-11`}
                />
              </div>
            </div>

            {/* EMAIL */}

            <div>
              <label htmlFor="profile-email" className={labelClass}>
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
                />

                <input
                  id="profile-email"
                  type="email"
                  required
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Enter your email"
                  className={`${inputBase} ${inputClass} pl-11`}
                />
              </div>
            </div>

            {/* ROLE */}

            <div>
              <label className={labelClass}>Account Role</label>

              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  isDark
                    ? "border-white/10 bg-white/5"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <ShieldCheck size={18} className="text-cyan-500" />

                <span className={`text-sm capitalize ${titleClass}`}>
                  {user?.role || "User"}
                </span>

                <span className={`ml-auto text-xs ${mutedClass}`}>
                  Read only
                </span>
              </div>
            </div>

            <MessageAlert message={profileMessage} />

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {savingProfile ? "Saving Changes..." : "Save Profile Changes"}
            </button>
          </form>
        </section>

        {/* =========================
            CHANGE PASSWORD
        ========================= */}

        <section className={`rounded-2xl border p-6 ${cardClass}`}>
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-500">
              <LockKeyhole size={22} />
            </div>

            <div>
              <h2 className={`text-lg font-semibold ${titleClass}`}>
                Change Password
              </h2>

              <p className={`mt-1 text-sm ${mutedClass}`}>
                Keep your account secure with a strong password.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            {[
              {
                key: "currentPassword",
                label: "Current Password",
                placeholder: "Enter current password",
              },
              {
                key: "newPassword",
                label: "New Password",
                placeholder: "Enter new password",
              },
              {
                key: "confirmPassword",
                label: "Confirm New Password",
                placeholder: "Confirm new password",
              },
            ].map((field) => (
              <div key={field.key}>
                <label htmlFor={field.key} className={labelClass}>
                  {field.label}
                </label>

                <div className="relative">
                  <KeyRound
                    size={18}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 ${mutedClass}`}
                  />

                  <input
                    id={field.key}
                    type={showPasswords[field.key] ? "text" : "password"}
                    required
                    minLength={
                      field.key === "newPassword" ||
                      field.key === "confirmPassword"
                        ? 8
                        : undefined
                    }
                    autoComplete={
                      field.key === "currentPassword"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password[field.key]}
                    onChange={(event) =>
                      setPassword((previous) => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className={`${inputBase} ${inputClass} pl-11 pr-12`}
                  />

                  <button
                    type="button"
                    aria-label={
                      showPasswords[field.key]
                        ? `Hide ${field.label}`
                        : `Show ${field.label}`
                    }
                    onClick={() => togglePassword(field.key)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition hover:text-cyan-500 ${mutedClass}`}
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            <p className={`text-xs ${mutedClass}`}>
              Your new password must contain at least 8 characters.
            </p>

            <MessageAlert message={passwordMessage} />

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPassword ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <LockKeyhole size={18} />
              )}

              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </section>
      </div>

      {/* SECURITY NOTE */}

      <div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${cardClass}`}
      >
        <ShieldCheck size={21} className="mt-0.5 shrink-0 text-cyan-500" />

        <div>
          <h3 className={`font-semibold ${titleClass}`}>Account Security</h3>

          <p className={`mt-1 text-sm leading-6 ${mutedClass}`}>
            Your profile information is managed through authenticated API
            requests. Your password is never displayed on this page.
          </p>
        </div>
      </div>
    </div>
  );
}
