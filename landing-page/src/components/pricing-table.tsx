import {motion} from 'framer-motion';
import {Check} from 'lucide-react';
import {useTranslation} from 'react-i18next';

import Button from '@/components/ui/button';
import {cn} from '@/lib/cn';

type PlanKey = 'starter' | 'pro' | 'business';

const plans: {key: PlanKey; emphasized?: boolean}[] = [
  {key: 'starter'},
  {key: 'pro', emphasized: true},
  {key: 'business'}
];

export default function PricingTable({compact = false}: {compact?: boolean}) {
  const {t} = useTranslation();

  return (
    <div className={cn('grid gap-4', compact ? 'lg:grid-cols-3' : 'md:grid-cols-3')}
    >
      {plans.map(({key, emphasized}, idx) => {
        const features = t(`pricing.plans.${key}.features`, {returnObjects: true}) as string[];
        return (
          <motion.div
            key={key}
            initial={{opacity: 0, y: 16}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.3}}
            transition={{duration: 0.45, delay: idx * 0.05}}
            className={cn(
              'relative rounded-3xl border bg-white p-6 shadow-soft',
              emphasized ? 'border-slate-900' : 'border-slate-200'
            )}
          >
            {emphasized ? (
              <div className="absolute -top-3 left-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
                {t('pricing.mostPopular')}
              </div>
            ) : null}

            <p className="text-sm font-extrabold text-slate-900">{t(`pricing.plans.${key}.name`)}</p>
            <p className="mt-1 text-sm text-slate-600">{t(`pricing.plans.${key}.desc`)}</p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                {t(`pricing.plans.${key}.price`)}
              </span>
              <span className="pb-1 text-sm font-semibold text-slate-500">{t('pricing.perMonth')}</span>
            </div>

            <div className="mt-6">
              <a href="#contact">
                <Button className="w-full" variant={emphasized ? 'primary' : 'secondary'}>
                  {t('pricing.cta')}
                </Button>
              </a>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-slate-900" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {compact ? null : (
              <p className="mt-6 text-xs font-semibold text-slate-500">{t(`pricing.plans.${key}.footnote`)}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
