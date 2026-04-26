import type { Metadata } from "next";
// Removed next/font/google imports due to network fetch errors during build
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: '%s | DevNexus',
    default: 'DevNexus - Incident Management',
  },
  description: "Enterprise-grade incident tracking and resolution nexus. Pinpoint errors, utilize Gemini AI root-cause analysis, and enforce organizational SLA standards instantly.",
  manifest: "/manifest.json",
  authors: [{ name: "DevNexus Team" }],
  openGraph: {
    title: 'DevNexus - Incident Management',
    description: 'Enterprise-grade incident tracking and resolution nexus powered by Gemini AI.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://devnexus.io',
    siteName: 'DevNexus',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevNexus - Incident Management',
    description: 'Enterprise-grade incident tracking and resolution nexus.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
