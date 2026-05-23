import {useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Menu, X} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {useLocale} from '@/lib/locale';
import {localePath} from '@/lib/routes';


import Container from '@/components/ui/container';
import Button from '@/components/ui/button';
import LanguageSwitcher from '@/components/language-switcher';
import {cn} from '@/lib/cn';


import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  const locale = useLocale();
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-transparent backdrop-blur',
        scrolled && 'border-slate-200/70 bg-white/70'
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link to={localePath(locale, '')} className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 p-2 items-center justify-center rounded-xl bg-slate-900">
            <img src="/icon.png" alt="Nexos logo" className="h-auto w-full" />
          </span>
          <span className="text-sm font-extrabold tracking-tight text-slate-900">
            Nexos
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <Link to={localePath(locale, "")} className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            {t('nav.home')}
          </Link>
          <Link to={localePath(locale, 'pricing')}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            {t('nav.pricing')}
          </Link>
          <a
            href="#contact"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            {t('nav.contact')}
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {/* <ThemeToggle /> */}
          <a href={import.meta.env.VITE_APP_URL ?? '#'} target={import.meta.env.VITE_APP_URL ? '_blank' : undefined} rel={import.meta.env.VITE_APP_URL ? 'noreferrer' : undefined}>
            <Button variant="secondary" size="sm">
              {t('nav.login')}
            </Button>
          </a>
          <a href="#contact">
            <Button size="sm">{t('nav.cta')}</Button>
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-900 shadow-soft backdrop-blur"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{height: 0, opacity: 0}}
            animate={{height: 'auto', opacity: 1}}
            exit={{height: 0, opacity: 0}}
            transition={{duration: 0.25}}
            className="md:hidden"
          >
            <Container className="pb-4">
              <div className="mt-2 grid gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-soft">
                <Link
                  to={localePath(locale, '')}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {t('nav.home')}
                </Link>
                <Link to={localePath(locale, 'pricing')}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {t('nav.pricing')}
                </Link>
                <a
                  href="#contact"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {t('nav.contact')}
                </a>
                <div className="pt-2">
                  <a href="#contact" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t('nav.cta')}</Button>
                  </a>
                </div>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}