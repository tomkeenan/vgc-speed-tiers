import 'i18next';
import type en from '../locales/en.json';

/** Types the translation keys from the English resources so `t()` is checked and autocompleted. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
