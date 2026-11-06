import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "CodeAgiles AfterSale AI | AI Customer Support Software",
    template: "%s | CodeAgiles AfterSale AI",
  },

  description:
    "CodeAgiles AfterSale AI helps ecommerce businesses manage customer support tickets, email conversations, product returns, and multiple stores from one platform.",

  keywords: [
    "CodeAgiles AfterSale AI",
    "AI customer support software",
    "WooCommerce customer support",
    "ecommerce customer support software",
    "AI support ticket system",
    "after sales support software",
    "returns management software",
    "customer email management",
    "multi-store customer support",
  ],

  applicationName: "CodeAgiles AfterSale AI",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codeagile-aftersale-ai.netlify.app",
    siteName: "CodeAgiles AfterSale AI",
    title: "CodeAgiles AfterSale AI | AI Customer Support Software",
    description:
      "Manage ecommerce support tickets, customer email conversations, returns, and multi-store operations with CodeAgiles AfterSale AI.",
  },

  twitter: {
    card: "summary",
    title: "CodeAgiles AfterSale AI",
    description:
      "Smarter ecommerce customer support, ticket management, and after-sales operations.",
  },

  metadataBase: new URL("https://codeagile-aftersale-ai.netlify.app"),

  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
