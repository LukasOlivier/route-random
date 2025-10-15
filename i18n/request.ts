import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const store = await cookies();
  const headersList = await headers();

  let locale = store.get("locale")?.value;

  // If no locale cookie is found, try to detect from Accept-Language header
  if (!locale) {
    const acceptLanguage = headersList.get("accept-language");

    if (acceptLanguage) {
      // Parse the Accept-Language header to get the preferred language
      const preferredLanguage = acceptLanguage
        .split(",")[0] // Get the first (most preferred) language
        .split("-")[0] // Get just the language code (e.g., "en" from "en-US")
        .toLowerCase();

      // Check if we have translations for this language
      const supportedLocales = ["en", "nl"]; // Add your supported locales here
      if (supportedLocales.includes(preferredLanguage)) {
        locale = preferredLanguage;
      }
    }
  }

  // Fallback to English if still no locale found
  if (!locale) {
    locale = "en";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
