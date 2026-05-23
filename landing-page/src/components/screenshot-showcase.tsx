import {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {AnimatePresence, motion} from 'framer-motion';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';
import {cn} from '@/lib/cn';

const screens = [
  {key: 'dashboard', src: '/screenshots/dashboard.svg'},
  {key: 'invoices', src: '/screenshots/invoices.svg'},
  {key: 'clients', src: '/screenshots/clients.svg'},
  {key: 'reports', src: '/screenshots/reports.svg'}
] as const;

export default function ScreenshotShowcase() {
  const {t} = useTranslation();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = screens[active];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % screens.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [paused]);

  const tabs = useMemo(() => screens.map((s, idx) => ({
      key: s.key,
      title: t(`screens.${s.key}.title`),
      desc: t(`screens.${s.key}.desc`),
      idx
    })), [t]);
  return (
    <section id="screens" className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          align="center"
          eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('screens.eyebrow')}</span>}
          title={t('screens.title')}
          description={t('screens.subtitle')}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="grid gap-3">
              {tabs.map((tab) => {
                const isActive = tab.idx === active;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActive(tab.idx)}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    className={cn(
                      'group rounded-3xl border p-5 text-left transition',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-1">
                        <p className={cn('text-sm font-extrabold tracking-tight', !isActive && 'group-hover:text-slate-900')}>{tab.title}</p>
                        <p className={cn('text-sm', isActive ? 'text-white/80' : 'text-slate-600')}>{tab.desc}</p>
                      </div>
                      {isActive ? (
                        <motion.span
                          layoutId="tab-dot"
                          className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-white"
                          transition={{type: 'spring', stiffness: 500, damping: 35}}
                        />
                      ) : (
                        <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-slate-200 group-hover:bg-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div
              className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-sky-500/5 to-emerald-500/10" />
              <div className="relative p-3">
                <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500">{t('screens.livePreview')}</p>
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    </div>
                  </div>

                  <div className="relative">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={current.key}
                        initial={{opacity: 0, y: 10, scale: 0.99}}
                        animate={{opacity: 1, y: 0, scale: 1}}
                        exit={{opacity: 0, y: -10, scale: 0.99}}
                        transition={{duration: 0.35}}
                        className="relative"
                      >
                        <img
                          src={current.src}
                          alt={t(`${current.key}.title`)}
                          width={1200}
                          height={750}
                          className="h-auto w-full"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm backdrop-blur">
                  <p className="font-semibold text-slate-900">{t(`${current.key}.tag`)}</p>
                  <div className="flex items-center gap-1">
                    {screens.map((s, idx) => (
                      <button
                        key={s.key}
                        aria-label={t(`${s.key}.title`)}
                        type="button"
                        onClick={() => setActive(idx)}
                        className={cn(
                          'h-2.5 w-2.5 rounded-full transition',
                          idx === active ? 'bg-slate-900' : 'bg-slate-200 hover:bg-slate-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}