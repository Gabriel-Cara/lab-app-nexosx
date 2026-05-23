function read(key: string, fallback?: string) {
  // Vite exposes env vars via import.meta.env and only those prefixed with VITE_
  const v = (import.meta as any).env?.[key] as string | undefined;
  if (v === undefined || v === '') return fallback;
  return v;
}

export const env = {
  MODE: read('MODE', 'development'),

  // Public
  VITE_SITE_NAME: read('VITE_SITE_NAME', 'Nexos'),
  VITE_SITE_URL: read('VITE_SITE_URL', 'http://localhost:5173'),
  VITE_TWITTER_HANDLE: read('VITE_TWITTER_HANDLE', '@nexos'),

  // Optional: where the "Entrar" button should point to
  VITE_APP_URL: read('VITE_APP_URL', ''),

  // Contact
  VITE_CONTACT_ENDPOINT: read('VITE_CONTACT_ENDPOINT', ''),
  VITE_CONTACT_EMAIL: read('VITE_CONTACT_EMAIL', '')
};
