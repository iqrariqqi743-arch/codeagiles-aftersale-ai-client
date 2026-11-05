"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

import {
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

// ==========================================
// RESET PASSWORD FORM
// ==========================================

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });

      if (response.data.success) {
        setSuccess(true);

        setForm({
          newPassword: "",
          confirmPassword: "",
        });

        // Clear existing authentication details
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      } else {
        setError(response.data.message || "Unable to reset your password.");
      }
    } catch (err) {
      console.error("Reset Password Error:", err);

      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================

  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={42} className="text-green-400" />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Password Reset Successful!
            </h1>

            <p className="text-slate-400 mt-4 text-sm leading-6">
              Your password has been updated successfully. You can now sign in
              using your new password.
            </p>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full mt-8 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // INVALID RESET LINK
  // ==========================================

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <AlertCircle size={52} className="text-red-400 mx-auto mb-5" />

            <h1 className="text-2xl font-bold text-white">
              Invalid Reset Link
            </h1>

            <p className="text-slate-400 text-sm mt-4 leading-6">
              Your password reset link is missing or invalid. Please request a
              new password reset link.
            </p>

            <Link
              href="/forgot-password"
              className="mt-7 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-xl"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // RESET PASSWORD PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldCheck size={29} className="text-cyan-400" />

            <h1 className="text-3xl font-bold text-white">
              CodeAgiles <span className="text-cyan-400">AfterSale AI</span>
            </h1>
          </div>

          <p className="text-slate-400 text-sm">Secure password recovery</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-5">
            <LockKeyhole size={27} className="text-cyan-400" />
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Create New Password
          </h2>

          <p className="text-slate-400 text-sm mt-3 mb-7 leading-6">
            Enter your new password below to secure your CodeAgiles AfterSale AI
            account.
          </p>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0" />

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm text-slate-300 mb-2"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white outline-none focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Minimum 8 characters required.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm text-slate-300 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white outline-none focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <LockKeyhole size={19} />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-7 text-sm text-slate-400 hover:text-cyan-400"
          >
            <ArrowLeft size={17} />
            Back to Login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          © CodeAgiles AfterSale AI
        </p>
      </div>
    </main>
  );
}

// ==========================================
// PAGE EXPORT
// ==========================================

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <LoaderCircle size={36} className="text-cyan-400 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
