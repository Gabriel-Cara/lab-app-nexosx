import {motion} from 'framer-motion';
import {Star} from 'lucide-react';
import {useTranslation} from 'react-i18next';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';

export default function Testimonials() {
  const {t} = useTranslation();

  const people = ['one', 'two', 'three'] as const;

  return (
    <section className="py-20 sm:py-24 bg-slate-50">
      <Container>
        <SectionHeading
          eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('testimonials.eyebrow')}</span>}
          title={t('testimonials.title')}
          description={t('testimonials.subtitle')}
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {people.map((key, idx) => (
            <motion.figure
              key={key}
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.45, delay: idx * 0.05}}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <div className="flex gap-1 text-slate-900">
                {Array.from({length: 5}).map((_, i) => (
                  <Star key={i} className="h-4 w-4" fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm text-slate-700">“{t(`items.${key}.quote`)}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-slate-900">
                {t(`items.${key}.name`)}
                <span className="block text-xs font-semibold text-slate-500">{t(`items.${key}.role`)}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </Container>
    </section>
  );
}