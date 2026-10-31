import type { Metadata, Viewport } from "next";
import { Montserrat, Source_Serif_4 } from "next/font/google";

import { siteConfig } from "@/lib/config/site";
import { getAppUrl } from "@/lib/env";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getAppUrl(),
  applicationName: siteConfig.name,
  title: {
    default: "Dawai — Turn any source into understanding",
    template: "%s · Dawai",
  },
  description: siteConfig.description,
  keywords: [
    "AI learning companion",
    "source-grounded learning",
    "audio lessons",
    "interactive tutoring",
    "study app",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "Dawai — Turn any source into understanding",
    description: siteConfig.description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Dawai — Turn any source into understanding",
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#060D20",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${montserrat.variable} ${sourceSerif.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
