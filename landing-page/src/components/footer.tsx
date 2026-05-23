import {useTranslation} from 'react-i18next';

import nexosLogo from 'public/favicon.png';

import Container from '@/components/ui/container';
import {Link} from 'react-router-dom';
import {useLocale} from '@/lib/locale';
import {localePath} from '@/lib/routes';

export default function Footer() {
  const locale = useLocale();
  const {t} = useTranslation();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl p-2 bg-slate-900 text-sm font-extrabold text-white">
                <img src={nexosLogo} alt="Nexos Logo" />
              </span>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">Nexos</span>
            </div>
            <p className="text-sm text-slate-600">{t('footer.tagline')}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <p className="font-semibold text-slate-900">{t('footer.pages')}</p>
            <Link to={localePath(locale, '')} className="text-slate-600 hover:text-slate-900">{t('footer.home')}</Link>
            <Link to={localePath(locale, 'pricing')} className="text-slate-600 hover:text-slate-900">{t('footer.pricing')}</Link>
            <a href="#contact" className="text-slate-600 hover:text-slate-900">{t('footer.contact')}</a>
          </div>

          {/* <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">{t('footer.legal')}</p>
            <Link to={localePath(locale, 'privacy')} className="text-slate-600 hover:text-slate-900">{t('footer.privacy')}</Link>
            <Link to={localePath(locale, 'terms')} className="text-slate-600 hover:text-slate-900">{t('footer.terms')}</Link>
          </div> */}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Nexos. {t('footer.rights')}
          </p>
          <p>{t('footer.madeWith')}</p>
        </div>
      </Container>
    </footer>
  );
}