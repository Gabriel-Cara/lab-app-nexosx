import {env} from './env';

export function getSiteUrl() {
  const url = env.VITE_SITE_URL ?? 'http://localhost:5173';
  try {
    return new URL(url);
  } catch {
    return new URL('http://localhost:5173');
  }
}

export function absoluteUrl(pathname: string) {
  const base = getSiteUrl();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, base).toString();
}

export function organizationJsonLd() {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: env.VITE_SITE_NAME,
    url: base.toString(),
    logo: absoluteUrl('/icon.png')
  };
}

export function websiteJsonLd() {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: env.VITE_SITE_NAME,
    url: base.toString(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base.toString()}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}
