// Thin wrapper around Google Identity Services (GIS). Loads the GIS script once and exposes the
// pieces the auth UI needs: the configured client id and a ready-promise for window.google.

const GIS_SRC = 'https://accounts.google.com/gsi/client';

/** The OAuth client id from the build env, or empty when sign-in is not configured. */
export function getClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
}

/** Whether Google sign-in is configured for this build. */
export function isAuthConfigured(): boolean {
  return getClientId().length > 0;
}

type GoogleGsi = NonNullable<Window['google']>;

let loader: Promise<GoogleGsi> | null = null;

/** Loads the Google Identity Services script once and resolves with window.google. */
export function loadGoogleIdentity(): Promise<GoogleGsi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error('Google Identity Services loaded without a global'));
    };
    script.onerror = () => {
      loader = null;
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });
  return loader;
}
