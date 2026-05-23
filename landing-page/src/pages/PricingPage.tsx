import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';
import PricingTable from '@/components/pricing-table';
import ContactSection from '@/components/contact-section';

export default function PricingPage() {
  const {t} = useTranslation();

  return (
    <>
      <section className="py-16 sm:py-20 bg-slate-50">
        <Container>
          <SectionHeading
            eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('pricingPage.eyebrow')}</span>}
            title={t('pricingPage.title')}
            description={t('pricingPage.subtitle')}
          />

          <div className="mt-10">
            <PricingTable />
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-slate-900">{t('pricingPage.enterpriseTitle')}</p>
            <p className="mt-2 text-sm text-slate-600">{t('pricingPage.enterpriseDesc')}</p>
            <div className="mt-4">
              <a href="#contact" className="text-sm font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                {t('pricingPage.enterpriseCta')}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <ContactSection />
    </>
  );
}
