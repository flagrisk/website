import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

const sora = localFont({
  src: "./fonts/sora.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://flagrisk.org"),
  title: {
    default: "FlagRisk — community safety for the people you love",
    template: "%s · FlagRisk",
  },
  description:
    "FlagRisk is a community safety network. Build a circle of people you trust, raise an alarm, share a trip, and see safety concerns nearby, so help is never a stranger.",
  alternates: { canonical: "/" },
  applicationName: "FlagRisk",
  authors: [{ name: "FlagRisk Technologies Limited", url: "https://flagrisk.org" }],
  creator: "FlagRisk Technologies Limited",
  publisher: "FlagRisk Technologies Limited",
  category: "safety",
  keywords: [
    "community safety",
    "personal safety app",
    "safety app Nigeria",
    "emergency alert",
    "panic alarm",
    "trip sharing",
    "Trip Watch",
    "safety circle",
    "SOS Nigeria",
    "WhatsApp safety",
    "USSD safety",
    "FlagRisk",
  ],
  openGraph: {
    title: "FlagRisk — community safety for the people you love",
    description:
      "Build a circle of people you trust. Raise an alarm, share a trip, and see safety concerns nearby.",
    url: "https://flagrisk.org",
    siteName: "FlagRisk",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/img/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "FlagRisk — community safety for the people you trust",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@FlagRisk",
    creator: "@FlagRisk",
    title: "FlagRisk — community safety for the people you love",
    description:
      "Build a circle of people you trust. Raise an alarm, share a trip, and see safety concerns nearby.",
    images: ["/img/og-default.jpg"],
  },
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
  manifest: "/site.webmanifest",
  icons: {
    icon: "/img/logo.png",
    shortcut: "/img/logo.png",
    apple: "/img/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "FlagRisk",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
