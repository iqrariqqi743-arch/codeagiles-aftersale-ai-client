"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";

import { useTheme } from "@/context/ThemeProvider";

const pageTitles = {
  "/dashboard": "Dashboard Overview",
  "/dashboard/stores": "My Stores",
  "/dashboard/orders": "Orders",
  "/dashboard/returns": "Returns",
  "/dashboard/tickets": "Support Tickets",
  "/dashboard/ai": "AI Assistant",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
  "/dashboard/help": "Help & Support",
};

export default function Header({ user, setSidebarOpen }) {
  const router = useRouter();
  const pathname = usePathname();

  const { theme, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isDark = theme === "dark";

  const title =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(
      ([path]) => path !== "/dashboard" && pathname.startsWith(path + "/"),
    )?.[1] ||
    "Dashboard";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    setProfileOpen(false);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  return (
    <header
      className={`
        sticky top-0 z-30
        h-20 px-4 md:px-8
        flex items-center justify-between gap-4
        border-b backdrop-blur-xl
        transition-colors duration-200
        ${
          isDark
            ? "bg-[#0f1726]/95 border-white/10"
            : "bg-white/95 border-slate-200"
        }
      `}
    >
      {/* Left Side */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
          className={`
            lg:hidden p-2 rounded-xl
            ${
              isDark
                ? "text-slate-300 hover:bg-white/5"
                : "text-slate-700 hover:bg-slate-100"
            }
          `}
        >
          <Menu size={24} />
        </button>

        {/* Page Title */}
        <div className="min-w-0">
          <p
            className={`
              text-xs hidden sm:block mb-1
              ${isDark ? "text-slate-500" : "text-slate-500"}
            `}
          >
            Workspace / {title}
          </p>

          <h1
            className={`
              text-lg md:text-xl font-semibold truncate
              ${isDark ? "text-white" : "text-slate-900"}
            `}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        {/* Workspace Status */}
        <div
          className={`
            hidden sm:flex items-center gap-2
            rounded-full px-3 py-1.5 border
            ${
              isDark
                ? "bg-cyan-500/10 border-cyan-500/20"
                : "bg-cyan-50 border-cyan-200"
            }
          `}
        >
          <Sparkles size={14} className="text-cyan-500" />

          <span
            className={`
              text-xs font-medium
              ${isDark ? "text-cyan-400" : "text-cyan-700"}
            `}
          >
            AfterSale AI
          </span>
        </div>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Enable light mode" : "Enable dark mode"}
          className={`
            w-10 h-10
            flex items-center justify-center
            rounded-xl border
            transition-all duration-200
            ${
              isDark
                ? "bg-white/5 border-white/10 text-yellow-300 hover:bg-white/10"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }
          `}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="Open account menu"
            className={`
              flex items-center gap-3 rounded-xl
              transition-colors
              ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}
            `}
          >
            {/* Avatar */}
            <div
              className="
                w-10 h-10 rounded-xl
                bg-gradient-to-br from-cyan-500 to-blue-600
                flex items-center justify-center
                font-bold text-white
                shadow-md shadow-cyan-500/10
              "
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* User Info */}
            <div className="hidden md:block text-left">
              <p
                className={`
                  text-sm font-semibold max-w-36 truncate
                  ${isDark ? "text-white" : "text-slate-900"}
                `}
              >
                {user?.name || "Merchant"}
              </p>

              <p className="text-xs text-slate-500 capitalize">
                {user?.role || "Owner"}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`
                hidden md:block transition-transform
                ${profileOpen ? "rotate-180" : ""}
                ${isDark ? "text-slate-400" : "text-slate-500"}
              `}
            />
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div
              role="menu"
              className={`
                absolute right-0 top-14
                w-64 rounded-2xl border
                shadow-2xl p-2 z-50
                ${
                  isDark
                    ? "bg-[#172235] border-white/10 shadow-black/40"
                    : "bg-white border-slate-200 shadow-slate-300/50"
                }
              `}
            >
              {/* Account Info */}
              <div
                className={`
                  px-3 py-3 border-b mb-2
                  ${isDark ? "border-white/10" : "border-slate-200"}
                `}
              >
                <p
                  className={`
                    text-sm font-semibold truncate
                    ${isDark ? "text-white" : "text-slate-900"}
                  `}
                >
                  {user?.name || "Merchant"}
                </p>

                <p className="text-slate-500 text-xs truncate mt-1">
                  {user?.email}
                </p>
              </div>

              {/* Settings */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/dashboard/settings");
                }}
                className={`
                  w-full flex items-center gap-3
                  px-3 py-3 rounded-xl text-sm
                  transition-colors
                  ${
                    isDark
                      ? "text-slate-300 hover:bg-white/5"
                      : "text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                <Settings size={17} />
                Account Settings
              </button>

              {/* Logout */}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className={`
                  w-full flex items-center gap-3
                  px-3 py-3 rounded-xl
                  text-sm text-red-500
                  transition-colors
                  ${isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"}
                `}
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
