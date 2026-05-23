import type {Locale} from '@/lib/i18n';

export function localePath(locale: Locale, pathname: string) {
  const cleaned = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  if (!cleaned.length) return `/${locale}`;
  return `/${locale}/${cleaned}`;
}
