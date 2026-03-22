import type { Metadata } from "next";
import type { WebSite, BreadcrumbList, WithContext } from "schema-dts";
import { Geist, Geist_Mono } from "next/font/google";
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
  "Route Random is a free route generator that creates random routes for. Generate random routes based on your desired distance or time and start exploring!";
const ogTitle = "Route Random - Free Random Route Generator";
const image = "https://route-random.lukasolivier.be/og-image.png";
const mySite = "https://route-random.lukasolivier.be";

export const metadata: Metadata = {
  title: ogTitle,
  description: description,
  keywords:
    "route generator, random route, free route planner, walking routes, cycling routes, running routes, route randomizer, GPX export, distance planner, time-based routes, explore routes, outdoor navigation, route planning, adventure routes, map generator, route explorer",
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
    site: "@route-random",
    creator: "@route-random",
    card: "summary_large_image",
    title: ogTitle,
    description: description,
    images: [image],
  },
  manifest: "/manifest.json",
};

const websiteSchema: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Route Random",
  url: mySite,
  description: description,
};

const breadcrumbListSchema: WithContext<BreadcrumbList> = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: mySite,
    },
  ],
};

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: ogTitle,
  url: mySite,
  description: description,
  image: image,
  inLanguage: "en",
  isPartOf: {
    "@type": "WebSite",
    url: mySite,
    name: "Route Random",
  },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: image,
    width: 1200,
    height: 630,
    caption: ogTitle,
  },
  author: {
    "@type": "Person",
    name: "Lukas Olivier",
    url: "https://lukasolivier.be",
  },
  potentialAction: {
    "@type": "ReadAction",
    target: mySite,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Umami analytics script */}
        <script
          defer
          src="https://umami.lukasolivier.be/script.js"
          data-website-id="a0e3a80f-8804-4070-a7b5-46b223dfa8dc"
        ></script>

        {/* Robots meta tag for SEO */}
        <meta name="robots" content="index, follow" />

        {/* Hreflang alternate links for English and Dutch */}
        <link
          rel="alternate"
          href="https://route-random.lukasolivier.be/"
          hrefLang="en"
        />
        <link
          rel="alternate"
          href="https://route-random.lukasolivier.be/nl"
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href="https://route-random.lukasolivier.be/"
          hrefLang="x-default"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <meta name="theme-color" content="#ffffff" />

        {/* JSON-LD Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbListSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webpageSchema),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
