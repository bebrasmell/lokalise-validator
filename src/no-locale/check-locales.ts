export function checkLocales(
  localeKeys: Map<string, Map<string, string>>,
  baseLang: string
): Map<string, Set<string>> {
  const baseMap = localeKeys.get(baseLang);
  if (!baseMap) throw new Error(`Base language ${baseLang} not found`);

  const missingTranslations = new Map<string, Set<string>>(); // key, locales
  for (const [key, baseValue] of baseMap) {
    const localeMissing = new Set<string>();
    for (const [locale, localeMap] of localeKeys) {
      if (locale === baseLang) continue;

      const localeValue = localeMap.get(key);

      if (!localeValue || localeValue === baseValue) {
        localeMissing.add(locale);
      }

      if (localeMissing.size > 0) {
        missingTranslations.set(key, localeMissing);
      }
    }
  }

  return missingTranslations;
}
