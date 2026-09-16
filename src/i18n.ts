import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fiFI from './locales/fi-FI.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import es419 from './locales/es-419.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zhHans from './locales/zh-hans.json';
import zhHant from './locales/zh-hant.json';
import { loadLanguage } from './language';

export const defaultNS = 'translation';

export const resources = {
  en: { translation: en },
  'fi-FI': { translation: fiFI },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  'es-419': { translation: es419 },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-hans': { translation: zhHans },
  'zh-hant': { translation: zhHant },
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
