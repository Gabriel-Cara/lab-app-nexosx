import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import {useTranslation} from 'react-i18next';

import Container from "@/components/ui/container";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

export default function Hero() {
  const {t} = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white to-white" />

      <Container className="relative py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6 }}
            >
              <Badge>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('hero.badge')}
                </span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl"
            >
              {t('hero.title')}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-xl text-base text-slate-600 sm:text-lg"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <a href="#contact">
                <Button size="lg">
                  {t('hero.primaryCta')} <ArrowRight className="h-5 w-5" />
                </Button>
              </a>
              <a href="#screens">
                <Button size="lg" variant="secondary">
                  {t('hero.secondaryCta')}
                </Button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid max-w-xl grid-cols-1 md:grid-cols-3 gap-4 pt-4"
            >
              <Stat
                label={t('hero.stat1Label')}
                value={<ShieldCheck className="h-6 w-6" />}
              />
              <Stat
                label={t('hero.stat2Label')}
                value={<Zap className="h-6 w-6" />}
              />
              <Stat
                label={t('hero.stat3Label')}
                value={<Sparkles className="h-6 w-6" />}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-500/20 via-sky-500/10 to-emerald-400/10 blur-2xl" />
            <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-3 shadow-soft backdrop-blur">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    nexos.app
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Kpi title={t('hero.kpi1Title')} value={t('hero.kpi1Value')} />
                      <Kpi title={t('hero.kpi2Title')} value={t('hero.kpi2Value')} />
                      <Kpi title={t('hero.kpi3Title')} value={t('hero.kpi3Value')} />
                    </div>
                    <div className="h-44 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 rounded-2xl border border-slate-200 bg-white" />
                      <div className="h-16 rounded-2xl border border-slate-200 bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-soft backdrop-blur flex gap-2 justify-center items-center">
      <p>{value}</p>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    </div>
  );
}