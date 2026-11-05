"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import { LoaderCircle, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem("accessToken", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
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
          <p className="text-slate-400 mt-3">
            Start automating your post-purchase support
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5"
        >
          <h2 className="text-2xl font-semibold text-white">
            Create your account
          </h2>

          {error && (
            <div
              role="alert"
              className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {[
            { name: "name", label: "Full name", type: "text" },
            { name: "email", label: "Email address", type: "email" },
            { name: "password", label: "Password", type: "password" },
            {
              name: "confirmPassword",
              label: "Confirm password",
              type: "password",
            },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm text-slate-300 mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                required
                minLength={field.type === "password" ? 8 : undefined}
                value={form[field.name]}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-400"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <UserPlus size={20} />
            )}
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
