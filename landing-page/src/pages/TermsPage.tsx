import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';

export default function TermsPage() {
  const {t} = useTranslation();

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('legal.termsTitle')}</h1>
        <p className="text-sm text-slate-600">{t('legal.termsIntro')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.termsUseTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.termsUseText')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.termsLimitationsTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.termsLimitationsText')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.termsContactTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.termsContactText')}</p>
      </Container>
    </section>
  );
}
