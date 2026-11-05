"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";

import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  RotateCcw,
  MessageSquareText,
  Bot,
  BarChart3,
  Settings,
  LifeBuoy,
  X,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const menu = [
  {
    title: "WORKSPACE",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "My Stores", href: "/dashboard/stores", icon: Store },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
      { name: "Returns", href: "/dashboard/returns", icon: RotateCcw },
      {
        name: "Support Tickets",
        href: "/dashboard/tickets",
        icon: MessageSquareText,
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        name: "AI Assistant",
        href: "/dashboard/ai-settings",
        icon: Bot,
      },
      {
        name: "Knowledge Base",
        href: "/dashboard/knowledge-base",
        icon: BookOpen,
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Help & Support", href: "/dashboard/help", icon: LifeBuoy },
    ],
  },
];

export default function Sidebar({ open, setOpen }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, setOpen]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        aria-label="Dashboard navigation"
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[265px] flex-col
          border-r transition-[transform,background-color,border-color]
          duration-300
          ${
            isDark
              ? "bg-[#0b1220] border-white/10"
              : "bg-white border-slate-200 shadow-xl lg:shadow-none"
          }
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div
          className={`
            flex h-20 shrink-0 items-center justify-between
            border-b px-5
            ${isDark ? "border-white/10" : "border-slate-200"}
          `}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Sparkles className="text-white" size={24} />
            </div>

            <div>
              <h2
                className={`text-lg font-bold leading-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                CodeAgiles
              </h2>
              <p className="text-[11px] font-semibold tracking-wider text-cyan-500">
                AFTERSALE AI
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            className={`rounded-lg p-2 lg:hidden ${
              isDark
                ? "text-slate-400 hover:bg-white/10"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {menu.map((section) => (
            <div key={section.title} className="mb-7">
              <p
                className={`mb-3 px-4 text-[10px] font-bold tracking-[0.18em] ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`
                        group flex items-center gap-3 rounded-xl
                        border-l-[3px] px-4 py-3 transition-all duration-200
                        ${
                          active
                            ? isDark
                              ? "border-cyan-400 bg-cyan-500/10 text-cyan-400"
                              : "border-cyan-600 bg-cyan-50 text-cyan-700"
                            : isDark
                              ? "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        }
                      `}
                    >
                      <Icon size={19} className="shrink-0" />

                      <span className="flex-1 text-sm font-medium">
                        {item.name}
                      </span>

                      {active && (
                        <ChevronRight size={15} className="shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          className={`shrink-0 border-t p-4 ${
            isDark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"
                : "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50"
            }`}
          >
            <div
              className={`mb-2 flex items-center gap-2 ${
                isDark ? "text-cyan-400" : "text-cyan-700"
              }`}
            >
              <Sparkles size={17} />
              <span className="text-sm font-semibold">AfterSale AI</span>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Automate post-purchase support and grow your business.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
