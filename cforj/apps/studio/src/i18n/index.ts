import { useLocaleStore } from '../store/localeStore'
import { translations } from './translations'

export { LOCALE_NAMES } from './translations'
export type { Locale } from '../store/localeStore'

export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  const dict = translations[locale] ?? translations.en
  return (key: string): string => dict[key] ?? translations.en[key] ?? key
}
