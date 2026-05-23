import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';
import PricingTable from '@/components/pricing-table';
import {Link} from 'react-router-dom';
import {useLocale} from '@/lib/locale';
import {localePath} from '@/lib/routes';

export default function PricingPreview() {
  const locale = useLocale();
  const {t} = useTranslation();

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('pricingPreview.eyebrow')}</span>}
            title={t('pricingPreview.title')}
            description={t('pricingPreview.subtitle')}
          />
          <Link to={localePath(locale, 'pricing')}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            {t('pricingPreview.seeFull')}
          </Link>
        </div>

        <div className="mt-10">
          <PricingTable compact />
        </div>
      </Container>
    </section>
  );
}