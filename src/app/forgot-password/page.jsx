"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/utils/api";

import {
  ArrowLeft,
  Mail,
  LoaderCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || "Unable to process your request.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            CodeAgiles <span className="text-cyan-400">AfterSale AI</span>
          </h1>

          <p className="text-slate-400 mt-3">Secure password recovery</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle2 size={55} className="text-green-400 mx-auto mb-5" />

              <h2 className="text-2xl font-semibold text-white">
                Check your email
              </h2>

              <p className="text-slate-400 text-sm mt-4 leading-6">
                If an account exists for{" "}
                <span className="text-cyan-400">{email}</span>, you will receive
                a password reset link.
              </p>

              <p className="text-slate-500 text-xs mt-4">
                Please also check your spam folder.
              </p>

              <Link
                href="/login"
                className="mt-7 flex items-center justify-center gap-2 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg"
              >
                <ArrowLeft size={18} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5">
                <Mail size={27} className="text-cyan-400" />
              </div>

              <h2 className="text-2xl font-semibold text-white">
                Forgot password?
              </h2>

              <p className="text-slate-400 text-sm mt-3 mb-7 leading-6">
                Enter your registered email address. We'll send you a secure
                link to reset your password.
              </p>

              {error && (
                <div
                  role="alert"
                  className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-5 text-sm"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-slate-300 mb-2"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      size={19}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle size={20} className="animate-spin" />
                  ) : (
                    <Send size={19} />
                  )}

                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-400 hover:text-cyan-400"
              >
                <ArrowLeft size={17} />
                Back to login
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © CodeAgiles AfterSale AI
        </p>
      </div>
    </main>
  );
}
