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
  openGraph: {
    title: "FlagRisk — community safety for the people you love",
    description:
      "Build a circle of people you trust. Raise an alarm, share a trip, and see safety concerns nearby.",
    url: "https://flagrisk.org",
    siteName: "FlagRisk",
    type: "website",
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
