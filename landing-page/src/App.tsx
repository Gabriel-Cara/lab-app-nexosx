import {Suspense} from 'react';
import {BrowserRouter, Routes, Route, Navigate, Outlet} from 'react-router-dom';
import {I18nextProvider} from 'react-i18next';
import {ThemeProvider} from 'next-themes';

import i18n from '@/lib/i18n';
import {useSyncI18nWithRoute} from '@/lib/locale';

import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

import HomePage from '@/pages/HomePage';
import PricingPage from '@/pages/PricingPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import NotFoundPage from '@/pages/NotFoundPage';

function LocaleLayout() {
  useSyncI18nWithRoute();

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow"
      >
        Skip to content
      </a>

      <div className="min-h-screen">
        <Navbar />
        <main id="content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Suspense fallback={null}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/pt" replace />} />
              <Route path="/:locale" element={<LocaleLayout />}>
                <Route index element={<HomePage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="terms" element={<TermsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </Suspense>
      </ThemeProvider>
    </I18nextProvider>
  );
}
