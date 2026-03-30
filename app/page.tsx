import ClientPageWrapper from "./components/ClientPageWrapper";
import RouteStats from "./components/RouteStats";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("SeoSection");
  const shareTweetText = encodeURIComponent(t("shareTweetText"));

  return (
    <main>
      <ClientPageWrapper>
        <RouteStats />
      </ClientPageWrapper>

      <section
        aria-labelledby="home-seo-heading"
        className="w-screen py-12 md:px-8 dark:bg-gray-800 dark:text-gray-200 p-2 bg-gray-300 text-gray-800"
      >
        <h1
          id="home-seo-heading"
          className="text-3xl font-semibold leading-tight text-gray-900 dark:text-white"
        >
          {t("heading")}
        </h1>

        <p className="mt-5 text-base leading-7 text-gray-700 dark:text-gray-300">
          {t("paragraph1")}
        </p>

        <p className="mt-4 text-base leading-7 text-gray-700 dark:text-gray-300">
          {t("paragraph2")}
        </p>

        <p className="mt-4 text-base leading-7 text-gray-700 dark:text-gray-300">
          {t("paragraph3")}
        </p>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("exploreTitle")}
          </h2>
          <ul className="mt-3 space-y-2 text-base text-gray-700 dark:text-gray-300">
            <li>
              <Link className="underline" href="/privacy-policy">
                {t("linkPrivacy")}
              </Link>
            </li>
            <li>
              <a className="underline" href="/sitemap.xml">
                {t("linkSitemap")}
              </a>
            </li>
            <li>
              <a className="underline" href="/robots.txt">
                {t("linkRobots")}
              </a>
            </li>
            <li>
              <a className="underline" href="/manifest.json">
                {t("linkManifest")}
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("shareTitle")}
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-700 dark:text-gray-300">
            {t("shareDescription")}
          </p>
          <ul className="mt-3 space-y-2 text-base text-gray-700 dark:text-gray-300">
            <li>
              <a
                className="underline"
                href={`https://x.com/intent/tweet?text=${shareTweetText}&url=https%3A%2F%2Froute-random.lukasolivier.be`}
                target="_blank"
                rel="noreferrer"
              >
                {t("shareX")}
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Froute-random.lukasolivier.be"
                target="_blank"
                rel="noreferrer"
              >
                {t("shareFacebook")}
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Froute-random.lukasolivier.be"
                target="_blank"
                rel="noreferrer"
              >
                {t("shareLinkedIn")}
              </a>
            </li>
            <li>
              <a
                className="underline"
                href="https://www.reddit.com/submit?url=https%3A%2F%2Froute-random.lukasolivier.be&title=Route%20Random%20for%20new%20running%2C%20walking%2C%20and%20cycling%20loops"
                target="_blank"
                rel="noreferrer"
              >
                {t("shareReddit")}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
