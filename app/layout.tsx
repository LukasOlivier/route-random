import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Route Random is a free route generator that creates random circular routes for runners and walkers. Generate random routes based on your desired distance and starting location anywhere in the world.";
const ogTitle = "Route Random - Free Random Route Generator";
const image = "https://route-random.lukasolivier.be/og-image.png";
const mySite = "https://route-random.lukasolivier.be";

export const metadata: Metadata = {
  title: ogTitle,
  description: description,
  metadataBase: new URL(mySite),
  alternates: {
    canonical: mySite,
  },
  openGraph: {
    siteName: mySite,
    type: "website",
    url: mySite,
    title: ogTitle,
    description: description,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: ogTitle,
      },
    ],
  },
  twitter: {
    site: "@qdnvubp",
    card: "summary_large_image",
    title: ogTitle,
    description: description,
    images: [image],
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
