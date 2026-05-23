import {motion} from 'framer-motion';
import {BarChart3, CreditCard, FileText, Shield, Sparkles, Workflow} from 'lucide-react';
import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';

const items = [
  {key: 'automation', icon: Workflow},
  {key: 'billing', icon: CreditCard},
  {key: 'docs', icon: FileText},
  {key: 'insights', icon: BarChart3},
  {key: 'security', icon: Shield},
  {key: 'polish', icon: Sparkles}
] as const;

export default function Features() {
  const {t} = useTranslation();

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('features.eyebrow')}</span>}
          title={t('features.title')}
          description={t('features.subtitle')}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({key, icon: Icon}, idx) => (
            <motion.div
              key={key}
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.45, delay: idx * 0.05}}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex p-3 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-base font-bold text-slate-900">{t(`features.items.${key}.title`)}</p>
                  <p className="text-sm text-slate-600">{t(`features.items.${key}.desc`)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}