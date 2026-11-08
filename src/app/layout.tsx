import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from "@/components/moriva/locale-provider";
import { cookies } from "next/headers";
import { isRtl } from "@/i18n/dictionaries";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MORIVA — Notice earlier. Find the right support.",
    template: "%s · MORIVA",
  },
  description:
    "MORIVA is a privacy-first wellbeing recognition and care-navigation prototype: voluntary check-ins, explainable non-diagnostic results, consented referrals and honest follow-up.",
  icons: { icon: "/brand/favicon.svg" },
  // Prototype boundary: no medical, regulatory or effectiveness claims in metadata.
};

export const viewport: Viewport = {
  themeColor: "#122C38",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const locale = jar.get("moriva_locale")?.value ?? "en";
  const dir = isRtl(locale) ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} data-scroll-behavior="smooth" className={`${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <LocaleProvider initialLocale={locale}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:bg-white focus:text-moriva-ink focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-card"
          >
            Skip to main content
          </a>
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
