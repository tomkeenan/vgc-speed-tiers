import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fiFI from './locales/fi-FI.json';
import { loadLanguage } from './language';

export const defaultNS = 'translation';

export const resources = {
  en: { translation: en },
  'fi-FI': { translation: fiFI },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: loadLanguage(),
  fallbackLng: 'en',
  defaultNS,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
