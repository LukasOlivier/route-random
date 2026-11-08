export const languageOptions = [
  { value: "en", label: "EN", countryCode: "GB" },
  { value: "nl", label: "NL", countryCode: "NL" },
  { value: "fr", label: "FR", countryCode: "FR" },
  { value: "de", label: "DE", countryCode: "DE" },
  { value: "es", label: "ES", countryCode: "ES" },
  { value: "pl", label: "PL", countryCode: "PL" },
] as const;

export type Locale = (typeof languageOptions)[number]["value"];
export type LanguageOption = (typeof languageOptions)[number];

export function isSupportedLocale(value: unknown): value is Locale {
  return languageOptions.some((option) => option.value === value);
}

export function resolveLocale(
  cookieLocale?: string,
  acceptLanguage?: string | null,
): Locale {
  if (isSupportedLocale(cookieLocale)) return cookieLocale;
  const preferredLanguage = acceptLanguage
    ?.split(",")[0]
    .split("-")[0]
    .trim()
    .toLowerCase();
  return isSupportedLocale(preferredLanguage) ? preferredLanguage : "en";
}
