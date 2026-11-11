import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocale, type Locale } from "./locales";

const messages = {
  en: () => import("../messages/en.json"),
  nl: () => import("../messages/nl.json"),
  fr: () => import("../messages/fr.json"),
  de: () => import("../messages/de.json"),
  es: () => import("../messages/es.json"),
  pl: () => import("../messages/pl.json"),
} satisfies Record<Locale, () => Promise<{ default: unknown }>>;

export default getRequestConfig(async () => {
  const [store, headersList] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale(
    store.get("locale")?.value,
    headersList.get("accept-language"),
  );
  return { locale, messages: (await messages[locale]()).default };
});
