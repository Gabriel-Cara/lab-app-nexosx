import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';

export default function PrivacyPage() {
  const {t} = useTranslation();

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t('legal.privacyTitle')}</h1>
        <p className="text-sm text-slate-600">{t('legal.privacyIntro')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.privacyWhatWeCollectTitle')}</h2>
        <ul className="list-disc pl-6 text-sm text-slate-600 space-y-1">
          <li>{t('legal.privacyWhatWeCollect1')}</li>
          <li>{t('legal.privacyWhatWeCollect2')}</li>
          <li>{t('legal.privacyWhatWeCollect3')}</li>
        </ul>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.privacyHowWeUseTitle')}</h2>
        <ul className="list-disc pl-6 text-sm text-slate-600 space-y-1">
          <li>{t('legal.privacyHowWeUse1')}</li>
          <li>{t('legal.privacyHowWeUse2')}</li>
          <li>{t('legal.privacyHowWeUse3')}</li>
        </ul>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.privacySharingTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.privacySharingText')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.privacyRightsTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.privacyRightsText')}</p>

        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('legal.privacyContactTitle')}</h2>
        <p className="text-sm text-slate-600">{t('legal.privacyContactText')}</p>
      </Container>
    </section>
  );
}
