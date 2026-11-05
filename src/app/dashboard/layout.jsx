"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import api from "@/utils/api";
import { ThemeProvider } from "@/context/ThemeProvider";

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await api.get("/auth/me");

        if (!response.data.success) {
          throw new Error("Unauthorized");
        }

        if (active) {
          setUser(response.data.user);
        }
      } catch (error) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        if (active) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <ThemeProvider>
      {loading ? (
        <div className="min-h-screen app-bg flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />

            <p className="app-muted text-sm">Loading your workspace...</p>
          </div>
        </div>
      ) : !user ? null : (
        <div className="min-h-screen app-bg app-text theme-transition">
          {/* Sidebar */}
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

          {/* Main Content */}
          <div className="lg:ml-[265px] min-h-screen flex flex-col">
            {/* Header */}
            <Header user={user} setSidebarOpen={setSidebarOpen} />

            {/* Dynamic Pages */}
            <main className="flex-1 p-4 md:p-8">{children}</main>

            {/* Footer */}
            <footer className="border-t app-border px-4 md:px-8 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs app-muted">
              <p>© CodeAgiles AfterSale AI</p>
              <p>Built for modern commerce</p>
            </footer>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
