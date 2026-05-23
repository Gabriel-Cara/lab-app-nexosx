import {useEffect} from 'react';
import {useParams} from 'react-router-dom';
import i18n, {defaultLocale, isLocale, type Locale} from '@/lib/i18n';

export function useLocale(): Locale {
  const params = useParams();
  const localeParam = (params as any)?.locale as string | undefined;
  return isLocale(localeParam) ? localeParam : defaultLocale;
}

export function useSyncI18nWithRoute() {
  const locale = useLocale();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return locale;
}
