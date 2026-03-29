import type { Metadata } from "next";
import type {
  WebSite,
  BreadcrumbList,
  WithContext,
  SoftwareApplication,
  WebPage,
} from "schema-dts";
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

const siteTitle =
  "Route Random | Free Random Running, Walking & Cycling Route Generator";
const description =
  "Generate unique, circular routes in seconds. Route Random is a free, no-account-needed generator for runners, walkers, and cyclists looking to discover new paths and beat routine boredom.";
const image = "https://route-random.lukasolivier.be/og-image.png";
const mySite = "https://route-random.lukasolivier.be";

export const metadata: Metadata = {
  title: siteTitle,
  description: description,
  keywords:
    "random route generator, running loop generator, circular route finder, free running routes, cycling route generator, walk planner, distance-based routes, GPX export, discovery tool, street completion, route randomizer",
  metadataBase: new URL(mySite),
  alternates: {
    canonical: mySite,
  },
  openGraph: {
    siteName: "Route Random",
    type: "website",
    url: mySite,
    title: siteTitle,
    description: description,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: "Route Random - Free Random Route Generator for Runners, Walkers & Cyclists",
      },
    ],
  },
  twitter: {
    site: "@route-random",
    creator: "@route-random",
    card: "summary_large_image",
    title: siteTitle,
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

const webpageSchema: WithContext<WebPage> = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: siteTitle,
  url: mySite,
  description: description,
  image: image,
  inLanguage: "en",
  isPartOf: {
    "@type": "WebSite",
    url: mySite,
    name: "Route Random",
  },
  author: {
    "@type": "Person",
    name: "Lukas Olivier",
    url: "https://lukasolivier.be",
  },
};

const softwareApplicationSchema: WithContext<SoftwareApplication> = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Route Random",
  description: description,
  url: mySite,
  applicationCategory: "HealthAndFitnessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  author: {
    "@type": "Person",
    name: "Lukas Olivier",
    url: "https://lukasolivier.be",
  },
  image: image,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://umami.lukasolivier.be/script.js"
          data-website-id="a0e3a80f-8804-4070-a7b5-46b223dfa8dc"
        ></script>

        <meta name="robots" content="index, follow" />

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
        <link rel="icon" href="/icon.png" />
        <meta name="theme-color" content="#ffffff" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbListSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
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
