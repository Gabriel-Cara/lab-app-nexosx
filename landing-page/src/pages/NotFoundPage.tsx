import {Link} from 'react-router-dom';
import Container from '@/components/ui/container';
import Button from '@/components/ui/button';
import {useLocale} from '@/lib/locale';

export default function NotFoundPage() {
  const locale = useLocale();

  return (
    <section className="py-20">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">404</h1>
        <p className="mt-4 text-sm text-slate-600">This page could not be found.</p>
        <div className="mt-8">
          <Link to={`/${locale}`}>
            <Button>Go to home</Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
