import type { Metadata } from "next";
import type { WebSite, BreadcrumbList, WithContext } from "schema-dts";
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

const BreadcrumbListSchema: WithContext<BreadcrumbList> = {
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

const searchActionSchema = {
  "@context": "https://schema.org",
  "@type": "SearchAction",
  target: `${mySite}/search?q={search_term_string}`,
  "query-input": {
    "@type": "PropertyValueSpecification",
    valueRequired: true,
    valueName: "search_term_string",
  },
};

const imageObjectSchema = {
  "@context": "https://schema.org",
  "@type": "ImageObject",
  url: image,
  width: 1200,
  height: 630,
  caption: ogTitle,
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Lukas Olivier",
  url: "https://www.lukasolivier.be",
};

const readActionSchema = {
  "@context": "https://schema.org",
  "@type": "ReadAction",
  agent: {
    "@type": "Person",
    name: "Visitor",
  },
  object: mySite,
  target: {
    "@type": "EntryPoint",
    urlTemplate: mySite,
  },
};

const entryPointSchema = {
  "@context": "https://schema.org",
  "@type": "EntryPoint",
  urlTemplate: mySite,
  actionPlatform: [
    "http://schema.org/DesktopWebPlatform",
    "http://schema.org/MobileWebPlatform",
  ],
};

const propertyValueSpecificationSchema = {
  "@context": "https://schema.org",
  "@type": "PropertyValueSpecification",
  valueRequired: true,
  valueName: "search_term_string",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
            __html: JSON.stringify(BreadcrumbListSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webpageSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(searchActionSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(imageObjectSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(readActionSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entryPointSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(propertyValueSpecificationSchema),
          }}
        />
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
