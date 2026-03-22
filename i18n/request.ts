import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const store = await cookies();
  const headersList = await headers();

  let locale = store.get("locale")?.value;

  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");

    if (acceptLanguage) {
      const preferredLanguage = acceptLanguage
        .split(",")[0]
        .split("-")[0]
        .toLowerCase();

      const supportedLocales = ["en", "nl"];
      if (supportedLocales.includes(preferredLanguage)) {
        locale = preferredLanguage;
      }
    }
  }

  if (!locale) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
