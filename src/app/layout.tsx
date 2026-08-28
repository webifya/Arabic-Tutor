import type { Metadata } from "next";
import { Noto_Sans_Arabic, Noto_Sans_Bengali } from "next/font/google";
import { appConfig } from "@/config/app";
import "./globals.css";

const bengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  display: "swap",
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: appConfig.appName,
  description: appConfig.tagline,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={appConfig.defaultLocale}>
      <body className={`${bengali.variable} ${arabic.variable}`}>{children}</body>
    </html>
  );
}
