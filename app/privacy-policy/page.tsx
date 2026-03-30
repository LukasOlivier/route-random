import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Route Random",
  description:
    "Privacy policy for Route Random, describing how location, route, and analytics data are handled.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900 dark:bg-gray-900 dark:text-gray-100 md:px-8">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800 md:p-8">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Last updated: March 30, 2026
        </p>

        <p className="mt-6 leading-7">
          Route Random is a route planning app for walking, running, and
          cycling. This page explains what data is processed when you use the
          app.
        </p>

        <h2 className="mt-8 text-xl font-semibold">What data is used</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
          <li>
            Start location and route preferences (distance/time, pace) are used
            to generate routes.
          </li>
          <li>
            If you choose <strong>Use current location</strong>, your browser
            asks for location permission and your coordinates are used for route
            generation.
          </li>
          <li>
            Address search queries are sent to OpenStreetMap Nominatim to find
            matching places.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Route sharing storage</h2>
        <p className="mt-3 leading-7">
          When a route is saved for sharing, Route Random strips out markers,
          including your selected start marker, and stores only the route line
          coordinates, route distance, a generated route ID, and creation time
          in a Neon PostgreSQL database. No account data, name, email, IP-based
          profile, or other identifier is stored with a route, so saved routes
          are anonymous.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Analytics</h2>
        <p className="mt-3 leading-7">
          Route Random uses Umami analytics to measure traffic and improve the
          app. Umami is self-hosted by Route Random (not a third-party analytics
          provider for this site), and analytics are collected in an anonymous,
          privacy-focused way.
        </p>

        <h2 className="mt-8 text-xl font-semibold">Third-party services</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
          <li>OpenRouteService (route generation)</li>
          <li>OpenStreetMap Nominatim (location search)</li>
          <li>Neon PostgreSQL (shared route storage)</li>
          <li>Umami (self-hosted anonymous analytics)</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Your choices</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
          <li>You can use the app without creating an account.</li>
          <li>
            You can deny browser location permission and still use manual start
            locations.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold">Contact</h2>
        <p className="mt-3 leading-7">
          For privacy questions, contact{" "}
          <a className="underline" href="mailto:olivier.lukas2003@gmail.com">
            olivier.lukas2003@gmail.com
          </a>
          .
        </p>

        <p className="mt-8 text-sm">
          <Link className="underline" href="/">
            Back to Route Random
          </Link>
        </p>
      </section>
    </main>
  );
}
