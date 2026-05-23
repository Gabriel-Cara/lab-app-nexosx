import type {ReactNode} from 'react';
import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {motion, AnimatePresence} from 'framer-motion';
import {Mail, Phone, Send} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {useLocale} from '@/lib/locale';

import Container from '@/components/ui/container';
import SectionHeading from '@/components/ui/section-heading';
import Button from '@/components/ui/button';
import type {ContactPayload} from '@/lib/contact';
import {contactSchema} from '@/lib/contact';
import {cn} from '@/lib/cn';

export default function ContactSection() {
  const {t} = useTranslation();
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(() => contactSchema, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors}
  } = useForm<ContactPayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      locale: locale as any,
      _hp: ''
    }
  });

  async function onSubmit(data: ContactPayload) {
    setStatus('sending');
    setError(null);

    const endpoint = (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim();
    const apiEndpoint = endpoint && endpoint.length ? endpoint : '/api/contact';

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...data, locale})
      });
      const json = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      setStatus('success');
      reset();
    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Erro ao enviar. Tente novamente.');
    }
  }
  return (
    <section id="contact" className="py-20 sm:py-24 bg-slate-50">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <SectionHeading
              eyebrow={<span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('contact.eyebrow')}</span>}
              title={t('contact.title')}
              description={t('contact.subtitle')}
            />

            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t('contact.emailLabel')}</p>
                  <p className="text-sm text-slate-600">{import.meta.env.VITE_CONTACT_EMAIL ?? 'gabricar28@gmail.com'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t('contact.phoneLabel')}</p>
                  <p className="text-sm text-slate-600">{import.meta.env.VITE_CONTACT_PHONE ?? '+55 (11) 0000-0000'}</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-500">{t('contact.privacyNote')}</p>
            </div>
          </div>

          <div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('contact.name')} error={errors.name?.message}>
                  <input
                    {...register('name')}
                    className={inputClass(errors.name)}
                    placeholder={t('contact.namePh')}
                    autoComplete="name"
                  />
                </Field>

                <Field label={t('contact.email')} error={errors.email?.message}>
                  <input
                    {...register('email')}
                    className={inputClass(errors.email)}
                    placeholder={t('contact.emailPh')}
                    autoComplete="email"
                  />
                </Field>

                <Field label={t('contact.company')}>
                  <input
                    {...register('company')}
                    className={inputClass()}
                    placeholder={t('contact.companyPh')}
                    autoComplete="organization"
                  />
                </Field>

                <Field label={t('contact.phone')}>
                  <input
                    {...register('phone')}
                    className={inputClass()}
                    placeholder={t('contact.phonePh')}
                    autoComplete="tel"
                  />
                </Field>

                {/* Honeypot */}
                <div className="hidden" aria-hidden>
                  <label>
                    Don’t fill this
                    <input tabIndex={-1} {...register('_hp')} />
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <Field label={t('contact.message')} error={errors.message?.message}>
                    <textarea
                      {...register('message')}
                      className={cn(inputClass(errors.message), 'min-h-[140px] resize-y')}
                      placeholder={t('contact.messagePh')}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold text-slate-500">{t('contact.responseTime')}</p>
                <Button disabled={status === 'sending'} type="submit" className="sm:w-auto">
                  {status === 'sending' ? t('contact.sending') : t('contact.send')} <Send className="h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence>
                {status === 'success' ? (
                  <motion.div
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 10}}
                    className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
                  >
                    {t('contact.success')}
                  </motion.div>
                ) : null}

                {status === 'error' ? (
                  <motion.div
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 10}}
                    className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
                  >
                    {t('contact.error')} {error ? <span className="font-semibold">({error})</span> : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function inputClass(err?: unknown) {
  return cn(
    'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/10',
    err ? 'border-red-300 focus:border-red-300' : 'border-slate-200 focus:border-slate-300'
  );
}
