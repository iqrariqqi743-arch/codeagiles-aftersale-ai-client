"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const passwordRef = useRef(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");

    if (savedEmail) {
      setForm((prev) => ({
        ...prev,
        email: savedEmail,
      }));

      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleRememberMe = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);

    if (!checked) {
      localStorage.removeItem("rememberedEmail");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    // Read the DOM password too, for browser autofill support.
    const email = form.email.trim();
    const password = passwordRef.current?.value || form.password;

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;

      if (!data?.success) {
        setError(data?.message || "Login failed.");
        return;
      }

      if (!data?.token || !data?.user) {
        setError("Invalid login response.");
        return;
      }

      const role = String(data.user?.role?.name || data.user?.role || "")
        .toLowerCase()
        .replace(/[\s-]/g, "_");

      if (role !== "owner" && role !== "super_admin" && role !== "superadmin") {
        setError("Your account does not have dashboard access.");
        return;
      }

      // Remember only the email in localStorage.
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Existing authentication storage.
      localStorage.setItem("accessToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Keep the form fields mounted until navigation.
      // Browser password managers may offer to save credentials.
      if (role === "super_admin" || role === "superadmin") {
        router.replace("/super-admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            CodeAgiles <span className="text-cyan-400">AfterSale AI</span>
          </h1>

          <p className="text-slate-400 mt-3">
            Sign in to manage your customer experience
          </p>
        </div>

        <form
          id="login-form"
          name="login"
          method="post"
          onSubmit={handleSubmit}
          autoComplete="on"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"
        >
          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-slate-300 mb-2"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              name="username"
              required
              autoComplete="username"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="you@company.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm text-slate-300 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                ref={passwordRef}
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
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
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMe}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />

              <span className="text-sm text-slate-300">Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg disabled:opacity-60 transition-colors"
          >
            {loading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <LogIn size={20} />
            )}

            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Register */}
          <p className="text-center text-slate-400 text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-cyan-400 font-medium hover:text-cyan-300"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
