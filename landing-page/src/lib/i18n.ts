import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import en from '@/messages/en.json';
import pt from '@/messages/pt.json';

export const supportedLocales = ['pt', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];
export const defaultLocale: Locale = 'pt';

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (supportedLocales as readonly string[]).includes(value);
}

const resources = {
  en: {translation: en},
  pt: {translation: pt}
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    interpolation: {escapeValue: false}
  });
}

export default i18n;
