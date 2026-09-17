/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public Google OAuth client id (…apps.googleusercontent.com). Empty disables sign-in. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
