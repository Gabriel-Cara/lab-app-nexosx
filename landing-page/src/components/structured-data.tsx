import {organizationJsonLd, websiteJsonLd} from '@/lib/seo';

export default function StructuredData() {
  const data = [organizationJsonLd(), websiteJsonLd()];

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}
