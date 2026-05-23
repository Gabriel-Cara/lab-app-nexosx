import {useLocation, useNavigate} from 'react-router-dom';
import {useLocale} from '@/lib/locale';
import {motion} from 'framer-motion';

import {cn} from '@/lib/cn';
import type {Locale} from '@/lib/i18n';

const options: {label: string; value: Locale}[] = [
  {label: 'PT', value: 'pt'},
  {label: 'EN', value: 'en'}
];

export default function LanguageSwitcher({className}: {className?: string}) {
  const locale = useLocale() as Locale;
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  function toLocale(nextLocale: Locale) {
    if (!pathname) return `/${nextLocale}`;

    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return `/${nextLocale}`;

    // Replace first segment if it is a locale
    if (parts[0] === 'pt' || parts[0] === 'en') {
      parts[0] = nextLocale;
    } else {
      parts.unshift(nextLocale);
    }

    return `/${parts.join('/')}`;
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center rounded-full border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur',
        className
      )}
      role="tablist"
      aria-label="Language"
    >
      {options.map((opt) => {
        const active = opt.value === locale;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              'relative z-10 rounded-full px-2.5 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-slate-900/10',
              active ? 'text-white' : 'hover:text-slate-900'
            )}
            onClick={() => navigate(toLocale(opt.value), {replace: true})}
          >
            {active ? (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 -z-10 rounded-full bg-slate-900"
                transition={{type: 'spring', stiffness: 400, damping: 30}}
              />
            ) : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
