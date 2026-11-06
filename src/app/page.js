"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";

import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Headphones,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareText,
  Moon,
  Package,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Sun,
  Ticket,
  TrendingUp,
  Workflow,
  X,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Support",
    description:
      "Use AI assistance to prepare helpful responses and make customer support more efficient.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Ticket,
    title: "Support Ticket Management",
    description:
      "Create, prioritize, track, and resolve customer issues from one organized workspace.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Mail,
    title: "Email Conversations",
    description:
      "Keep customer email replies connected with tickets and complete conversation history.",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: RefreshCcw,
    title: "Returns Management",
    description:
      "Organize product return requests and manage after-sales issues with clarity.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Store,
    title: "Multi-Store Management",
    description:
      "Manage support operations across multiple ecommerce stores in one dashboard.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: LayoutDashboard,
    title: "Centralized Dashboard",
    description:
      "View support tickets, conversations, returns, and important activities in one place.",
    color: "from-pink-500 to-rose-500",
  },
];

const steps = [
  {
    number: "01",
    icon: CheckCircle2,
    title: "Create Your Account",
    description: "Register your business and access your support workspace.",
  },
  {
    number: "02",
    icon: Store,
    title: "Set Up Your Store",
    description:
      "Configure your ecommerce store and organize your support workflow.",
  },
  {
    number: "03",
    icon: Headphones,
    title: "Manage Customer Support",
    description:
      "Handle customer tickets, email replies, and returns from one dashboard.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "For smaller ecommerce businesses.",
    popular: false,
  },
  {
    name: "Growth",
    price: 49,
    description: "For growing ecommerce businesses.",
    popular: true,
  },
  {
    name: "Pro",
    price: 119,
    description: "For businesses scaling their support operations.",
    popular: false,
  },
];

const faqs = [
  {
    question: "What is CodeAgiles AfterSale AI?",
    answer:
      "CodeAgiles AfterSale AI is an ecommerce customer support platform for managing tickets, customer conversations, email replies, and product returns.",
  },
  {
    question: "Does it support WooCommerce?",
    answer:
      "The platform includes WooCommerce store integration workflows for ecommerce merchants.",
  },
  {
    question: "Can I manage multiple stores?",
    answer:
      "Yes. You can organize customer support operations across multiple stores.",
  },
  {
    question: "Can customers reply through email?",
    answer:
      "Yes. Customer email replies can be tracked in support ticket conversations.",
  },
  {
    question: "Can I manage product returns?",
    answer:
      "Yes. The platform includes tools for organizing and tracking product return requests.",
  },
];

const navigation = [
  { name: "Features", href: "#features" },
  { name: "How It Works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
];

const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, className = "", delay = 0, y = 35 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        delay: reduceMotion ? 0 : delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
        <Sparkles size={14} />
        {eyebrow}
      </div>

      <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </Reveal>
  );
}

function DashboardPreview() {
  const reduceMotion = useReducedMotion();

  const metrics = [
    { label: "Support Tickets", value: "128", icon: Ticket },
    {
      label: "Conversations",
      value: "64",
      icon: MessageSquareText,
    },
    { label: "Returns", value: "12", icon: RefreshCcw },
  ];

  const activity = [
    {
      title: "Order delivery inquiry",
      subtitle: "Customer support ticket",
      status: "Open",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      title: "Product return request",
      subtitle: "Returns management",
      status: "Pending",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
    },
    {
      title: "Email reply received",
      subtitle: "Customer conversation",
      status: "Resolved",
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="pointer-events-none absolute -inset-8 rounded-full bg-cyan-500/15 blur-[90px]" />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 45, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: reduceMotion ? 0 : 0.9,
          delay: 0.2,
          ease,
        }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-cyan-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-cyan-950/30"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <p className="text-sm font-bold">AfterSale AI</p>
              <p className="text-xs text-slate-500">Dashboard preview</p>
            </div>
          </div>

          <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Demo
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-sm text-slate-500">Welcome to your workspace</p>
            <h3 className="mt-1 text-xl font-bold">Support Overview</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;

              return (
                <motion.div
                  key={metric.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.5 + index * 0.12,
                    duration: 0.5,
                  }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4"
                >
                  <Icon size={19} className="text-cyan-500" />
                  <p className="mt-3 text-xl font-extrabold sm:text-2xl">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                    {metric.label}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
              <h4 className="text-sm font-semibold">Recent Support Activity</h4>
              <span className="text-xs text-cyan-500">Sample data</span>
            </div>

            {activity.map((item, index) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.8 + index * 0.15,
                  duration: 0.45,
                }}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 last:border-0 dark:border-slate-800"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <MessageSquareText size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold sm:text-sm">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.color}`}
                >
                  {item.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <p className="mt-5 text-center text-xs text-slate-500">
        Illustrative dashboard with sample data.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const reduceMotion = useReducedMotion();

  const dark = theme === "dark";

  const closeMenu = () => setMobileMenu(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-base font-extrabold tracking-tight sm:text-xl"
          >
            <motion.span
              whileHover={
                reduceMotion ? undefined : { rotate: 12, scale: 1.08 }
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950"
            >
              <Sparkles size={22} />
            </motion.span>
            <span className="truncate">
              CodeAgiles <span className="text-cyan-500">AfterSale AI</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative transition-colors hover:text-cyan-500"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={toggleTheme}
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-400"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={
                    reduceMotion
                      ? false
                      : { rotate: -90, opacity: 0, scale: 0.6 }
                  }
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={
                    reduceMotion
                      ? undefined
                      : { rotate: 90, opacity: 0, scale: 0.6 }
                  }
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                >
                  {dark ? <Sun size={20} /> : <Moon size={20} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <Link
              href="/login"
              className="hidden text-sm font-semibold text-slate-600 transition-colors hover:text-cyan-500 dark:text-slate-300 sm:block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="hidden items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-400 md:inline-flex"
            >
              Get Started <ArrowRight size={17} />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenu((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenu}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 lg:hidden"
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 text-sm font-semibold">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="py-1 transition-colors hover:text-cyan-500"
                  >
                    {item.name}
                  </a>
                ))}
                <Link href="/login" onClick={closeMenu}>
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-cyan-500 px-4 py-3 text-center text-slate-950"
                >
                  Create Account
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-32 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[90px]" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-2 lg:py-32">
          <div>
            <Reveal>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-600 dark:text-cyan-300 sm:text-sm">
                <Sparkles size={15} />
                Smarter After-Sales Customer Support
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Customer Support,
                <span className="mt-2 block bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                  Made Smarter
                </span>
                with AI.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-400 sm:text-lg">
                Manage customer support tickets, email conversations, product
                returns, and ecommerce operations from one powerful platform.
                Simplify after-sales support with CodeAgiles AfterSale AI.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-7 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
                  >
                    Get Started <ArrowRight size={19} />
                  </Link>
                </motion.div>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-7 py-4 font-semibold transition-colors hover:border-cyan-500 hover:text-cyan-500 dark:border-slate-700"
                >
                  Explore Platform <ArrowUpRight size={18} />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                {[
                  "Centralized Support",
                  "Multi-Store Workflow",
                  "AI Assistance",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-cyan-500" />
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* PLATFORM HIGHLIGHTS */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-center sm:grid-cols-3 sm:px-8">
          {[
            { icon: Headphones, label: "Customer Support" },
            { icon: Workflow, label: "Workflow Management" },
            { icon: Package, label: "Ecommerce Operations" },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <Reveal key={item.label} delay={index * 0.1}>
                <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  <Icon size={22} className="text-cyan-500" />
                  {item.label}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Powerful Features"
            title="Everything You Need to Support Your Customers"
            description="Bring your after-sales operations together and give your team the tools to manage customer issues more efficiently."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <Reveal
                  key={feature.title}
                  delay={(index % 3) * 0.1}
                  className="h-full"
                >
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-cyan-500/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />

                    <div
                      className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg shadow-slate-900/10 transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={26} />
                    </div>

                    <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>

                    <p className="leading-7 text-slate-500 dark:text-slate-400">
                      {feature.description}
                    </p>

                    <ArrowUpRight
                      size={19}
                      className="absolute right-6 top-7 text-slate-300 opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-500 group-hover:opacity-100"
                    />
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY CODEAGILES */}
      <section className="border-y border-slate-200 bg-slate-50 px-5 py-24 dark:border-slate-800 dark:bg-slate-900/40 sm:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-500">
              Why CodeAgiles?
            </p>

            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Spend Less Time Managing Issues.
              <span className="text-cyan-500"> More Time Growing.</span>
            </h2>

            <p className="mt-6 leading-8 text-slate-500 dark:text-slate-400">
              Customer support gets complicated when tickets, emails, and
              returns are scattered across different workflows. CodeAgiles
              AfterSale AI helps bring them together.
            </p>

            <div className="mt-8 space-y-5">
              {[
                "Keep customer conversations organized",
                "Manage support tickets and priorities",
                "Handle multiple stores from one platform",
                "Improve visibility into after-sales operations",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={21}
                    className="mt-0.5 shrink-0 text-cyan-500"
                  />
                  <span className="text-slate-600 dark:text-slate-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "Efficient Workflows",
                text: "Organize customer support tasks in one place.",
              },
              {
                icon: ShieldCheck,
                title: "Organized Access",
                text: "Dedicated owner and administration workflows.",
              },
              {
                icon: TrendingUp,
                title: "Ready to Grow",
                text: "Support your expanding ecommerce operations.",
              },
              {
                icon: Bot,
                title: "AI Assistance",
                text: "Bring AI into your customer support process.",
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <Reveal key={item.title} delay={(index % 2) * 0.12}>
                  <motion.div
                    whileHover={
                      reduceMotion ? undefined : { y: -6, scale: 1.015 }
                    }
                    className="h-full rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
                  >
                    <Icon size={30} className="mb-5 text-cyan-500" />
                    <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                    <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                      {item.text}
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="How It Works"
            title="Get Started in Three Simple Steps"
            description="A straightforward way to organize ecommerce customer support."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <Reveal key={step.number} delay={index * 0.15}>
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -7 }}
                    className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-5xl font-extrabold text-cyan-500/30">
                        {step.number}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="mt-7 text-xl font-bold">{step.title}</h3>
                    <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-50 px-5 py-24 dark:border-slate-800 dark:bg-slate-900/40 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Simple Pricing"
            title="Choose the Right Plan for Your Business"
            description="Explore our monthly subscription plans for ecommerce customer support."
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 0.12} className="h-full">
                <motion.div
                  whileHover={reduceMotion ? undefined : { y: -9 }}
                  className={`relative flex h-full flex-col rounded-2xl border p-8 transition-shadow duration-300 hover:shadow-xl ${
                    plan.popular
                      ? "border-cyan-500 bg-white shadow-xl shadow-cyan-900/10 dark:bg-slate-900"
                      : "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
                      POPULAR CHOICE
                    </span>
                  )}

                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {plan.description}
                  </p>

                  <div className="my-7 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">
                      ${plan.price}
                    </span>
                    <span className="text-slate-500">/month</span>
                  </div>

                  <div className="mb-8 h-px bg-slate-200 dark:bg-slate-800" />

                  <div className="mb-9 space-y-4">
                    {[
                      "Customer support dashboard",
                      "Ticket management",
                      "After-sales support tools",
                      "Subscription-based access",
                    ].map((item) => (
                      <div key={item} className="flex gap-3">
                        <Check size={19} className="shrink-0 text-cyan-500" />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/register"
                    className={`mt-auto flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-bold transition-colors ${
                      plan.popular
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        : "border border-slate-300 hover:border-cyan-500 dark:border-slate-700"
                    }`}
                  >
                    Get Started <ArrowRight size={18} />
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Plan features and usage limits should be confirmed during signup.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            eyebrow="Frequently Asked Questions"
            title="Everything You Want to Know"
            description="Answers to common questions about CodeAgiles AfterSale AI."
          />

          <div className="mt-14 space-y-4">
            {faqs.map((faq, index) => (
              <Reveal key={faq.question} delay={index * 0.06}>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-cyan-500/40 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    aria-expanded={openFaq === index}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left font-semibold"
                  >
                    {faq.question}
                    <motion.span
                      animate={{ rotate: openFaq === index ? 180 : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="shrink-0 text-cyan-500"
                    >
                      <ChevronDown size={20} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        key="answer"
                        initial={
                          reduceMotion ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                          reduceMotion ? undefined : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: reduceMotion ? 0 : 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 leading-7 text-slate-500 dark:text-slate-400">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 sm:px-8 lg:pb-32">
        <Reveal className="mx-auto max-w-7xl">
          <div className="relative isolate overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-50 via-white to-sky-50 px-6 py-16 text-center dark:from-cyan-950/60 dark:via-slate-900 dark:to-slate-900 sm:px-12 lg:py-20">
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-60 w-96 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[90px]" />

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-6 flex w-fit items-center justify-center"
            >
              <Sparkles size={36} className="text-cyan-500" />
            </motion.div>

            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Ready to Simplify Customer Support?
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-slate-600 dark:text-slate-300">
              Bring your ecommerce customer support operations together with
              CodeAgiles AfterSale AI.
            </p>

            <motion.div
              whileHover={reduceMotion ? undefined : { y: -4, scale: 1.03 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="mt-9 inline-block"
            >
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
              >
                Get Started Today <ArrowUpRight size={19} />
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
          <div>
            <Link href="/" className="text-xl font-extrabold">
              CodeAgiles <span className="text-cyan-500">AfterSale AI</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">
              Smarter after-sales customer support for modern ecommerce
              businesses.
            </p>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Platform</h3>
            <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-cyan-500"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Account</h3>
            <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/login" className="hover:text-cyan-500">
                Login
              </Link>
              <Link href="/register" className="hover:text-cyan-500">
                Create Account
              </Link>
              <Link href="/forgot-password" className="hover:text-cyan-500">
                Forgot Password
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          © {new Date().getFullYear()} CodeAgiles AfterSale AI. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}
