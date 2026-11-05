"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Bell,
  Sun,
  Moon,
} from "lucide-react";

import api from "@/utils/api";

import { ThemeProvider, useTheme } from "@/context/ThemeProvider";

// ==========================================
// SUPER ADMIN MENU ITEMS
// ==========================================

const menuItems = [
  {
    name: "Dashboard",
    href: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    name: "Merchants",
    href: "/super-admin/merchants",
    icon: Store,
  },
  {
    name: "Users",
    href: "/super-admin/users",
    icon: Users,
  },
  {
    name: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
  },
  {
    name: "Settings",
    href: "/super-admin/settings",
    icon: Settings,
  },
];

// ==========================================
// THEME TOGGLE COMPONENT
// ==========================================

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
      }
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      className="
        w-10 h-10
        rounded-xl
        flex items-center justify-center
        app-muted
        hover:bg-cyan-500/10
        hover:text-cyan-500
        transition-all duration-200
      "
    >
      {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
    </button>
  );
}

// ==========================================
// SUPER ADMIN LAYOUT
// ==========================================

export default function SuperAdminLayout({ children }) {
  return (
    <ThemeProvider>
      <SuperAdminContent>{children}</SuperAdminContent>
    </ThemeProvider>
  );
}

// ==========================================
// SUPER ADMIN CONTENT
// ==========================================

function SuperAdminContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==========================================
  // AUTHENTICATION
  // ==========================================

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

        const currentUser = response.data.user;

        const role = String(currentUser?.role?.name || currentUser?.role || "")
          .toLowerCase()
          .replace(/[\s-]/g, "_");

        if (role !== "super_admin" && role !== "superadmin") {
          router.replace("/dashboard");
          return;
        }

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Super Admin Auth Error:", error);

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

  // ==========================================
  // CLOSE SIDEBAR ON ROUTE CHANGE
  // ==========================================

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  // ==========================================
  // ACTIVE MENU
  // ==========================================

  const isActive = (href) => {
    if (href === "/super-admin") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen app-bg app-text flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="
              w-12 h-12
              border-4
              border-cyan-500/20
              border-t-cyan-400
              rounded-full
              animate-spin
            "
          />

          <p className="app-muted text-sm">Loading Super Admin Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // ==========================================
  // MAIN LAYOUT
  // ==========================================

  return (
    <div className="min-h-screen app-bg app-text theme-transition">
      {/* ======================================
          MOBILE OVERLAY
      ====================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-[265px]
          app-bg app-text
          border-r app-border
          flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* ==================================
            SIDEBAR LOGO
        ================================== */}

        <div className="h-[80px] px-6 flex items-center justify-between border-b app-border">
          <Link href="/super-admin" className="flex items-center gap-3">
            <div
              className="
                w-11 h-11
                rounded-xl
                bg-cyan-500
                flex items-center justify-center
                text-white
              "
            >
              <ShieldCheck size={25} />
            </div>

            <div>
              <h2 className="text-lg font-bold">CodeAgiles</h2>

              <p className="text-xs app-muted">Super Admin Panel</p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="lg:hidden app-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        {/* ==================================
            SIDEBAR NAVIGATION
        ================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <p className="text-xs uppercase tracking-widest app-muted px-3 mb-4">
            Main Menu
          </p>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between
                    px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${
                      active
                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                        : "app-muted hover:bg-cyan-500/10 hover:text-cyan-500"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} />

                    <span className="text-sm font-medium">{item.name}</span>
                  </div>

                  {active && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ==================================
            SIDEBAR FOOTER
        ================================== */}

        <div className="p-4 border-t app-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-3">
            <div
              className="
                w-10 h-10
                rounded-full
                bg-cyan-500/15
                text-cyan-500
                flex items-center justify-center
                font-bold
              "
            >
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.name || "Super Admin"}
              </p>

              <p className="text-xs app-muted truncate">{user?.email || ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex items-center gap-3
              px-4 py-3
              rounded-xl
              text-red-500
              hover:bg-red-500/10
              transition-colors
            "
          >
            <LogOut size={19} />

            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ======================================
          MAIN CONTENT WRAPPER
      ====================================== */}

      <div className="lg:ml-[265px] min-h-screen flex flex-col app-bg">
        {/* ==================================
            HEADER
        ================================== */}

        <header
          className="
            h-[80px]
            border-b app-border
            app-bg app-text
            sticky top-0 z-30
            flex items-center justify-between
            px-4 md:px-8
          "
        >
          {/* HEADER LEFT */}

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden app-muted"
            >
              <Menu size={25} />
            </button>

            <div>
              <h1 className="text-lg md:text-xl font-bold">Super Admin</h1>

              <p className="text-xs app-muted hidden sm:block">
                Manage your entire platform
              </p>
            </div>
          </div>

          {/* HEADER RIGHT */}

          <div className="flex items-center gap-4">
            {/* DARK / LIGHT MODE */}

            <ThemeToggle />

            {/* NOTIFICATIONS */}

            <button
              type="button"
              aria-label="Notifications"
              className="relative app-muted hover:text-cyan-500"
            >
              <Bell size={21} />
            </button>

            {/* ADMIN PROFILE */}

            <div className="hidden sm:flex items-center gap-3 border-l app-border pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {user?.name || "Super Admin"}
                </p>

                <p className="text-xs app-muted">Administrator</p>
              </div>

              <div
                className="
                  w-10 h-10
                  rounded-full
                  bg-cyan-500
                  text-white
                  flex items-center justify-center
                  font-bold
                "
              >
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* ==================================
            DYNAMIC PAGES
        ================================== */}

        <main className="flex-1 p-4 md:p-8 app-bg app-text">{children}</main>

        {/* ==================================
            FOOTER
        ================================== */}

        <footer
          className="
            border-t app-border
            app-bg app-text
            px-4 md:px-8 py-5
            flex flex-col sm:flex-row
            justify-between gap-2
            text-xs app-muted
          "
        >
          <p>© CodeAgiles AfterSale AI</p>

          <p>Super Admin Management System</p>
        </footer>
      </div>
    </div>
  );
}
