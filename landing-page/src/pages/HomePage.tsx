import Hero from '@/components/hero';
import Features from '@/components/features';
import ScreenshotShowcase from '@/components/screenshot-showcase';
import PricingPreview from '@/components/pricing-preview';
import ContactSection from '@/components/contact-section';
import StructuredData from '@/components/structured-data';

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <Features />
      <ScreenshotShowcase />
      <PricingPreview />
      <ContactSection />
    </>
  );
}
