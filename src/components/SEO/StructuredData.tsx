import type React from 'react';
import { Helmet } from 'react-helmet-async';

// Base organization schema
const baseOrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'War Room',
  description: 'Political Campaign Management Platform',
  url: 'https://war-room-oa9t.onrender.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://war-room-oa9t.onrender.com/logo.png',
    width: '400',
    height: '400',
  },
  sameAs: [
    'https://twitter.com/WarRoomPlatform',
    'https://linkedin.com/company/war-room-platform',
    'https://github.com/war-room',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    email: 'support@warroom.com',
    availableLanguage: 'English',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
};

// Software application schema
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'War Room',
  description:
    'Comprehensive campaign management platform for political campaigns, advocacy groups, and non-profit organizations',
  url: 'https://war-room-oa9t.onrender.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  author: baseOrganizationSchema,
  publisher: baseOrganizationSchema,
  softwareVersion: '1.0',
  datePublished: '2024-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  screenshot: {
    '@type': 'ImageObject',
    url: 'https://war-room-oa9t.onrender.com/screenshot-dashboard.png',
    caption: 'War Room Dashboard',
  },
  featureList: [
    'Volunteer Management',
    'Event Coordination',
    'Real-time Analytics',
    'Crisis Management',
    'Document Intelligence',
    'Social Media Monitoring',
    'Fundraising Tools',
    'Campaign Asset Management',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '150',
    bestRating: '5',
    worstRating: '1',
  },
};

interface StructuredDataProps {
  schema: Record<string, any>;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ schema }) => {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema, null, 2)}</script>
    </Helmet>
  );
};

// Pre-configured structured data components

export const OrganizationStructuredData: React.FC = () => (
  <StructuredData schema={baseOrganizationSchema} />
);

export const SoftwareApplicationStructuredData: React.FC = () => (
  <StructuredData schema={softwareApplicationSchema} />
);

export const WebPageStructuredData: React.FC<{
  name: string;
  description: string;
  url: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}> = ({ name, description, url, breadcrumbs = [] }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'War Room',
      url: 'https://war-room-oa9t.onrender.com',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://war-room-oa9t.onrender.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    ...(breadcrumbs.length > 0 && {
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    }),
  };

  return <StructuredData schema={schema} />;
};

export const DashboardStructuredData: React.FC = () => (
  <WebPageStructuredData
    name="Campaign Dashboard"
    description="Real-time campaign monitoring and management dashboard"
    url="https://war-room-oa9t.onrender.com/dashboard"
    breadcrumbs={[
      { name: 'Home', url: 'https://war-room-oa9t.onrender.com' },
      { name: 'Dashboard', url: 'https://war-room-oa9t.onrender.com/dashboard' },
    ]}
  />
);

export const AnalyticsStructuredData: React.FC = () => (
  <WebPageStructuredData
    name="Campaign Analytics"
    description="Comprehensive analytics and performance metrics for your campaign"
    url="https://war-room-oa9t.onrender.com/analytics"
    breadcrumbs={[
      { name: 'Home', url: 'https://war-room-oa9t.onrender.com' },
      { name: 'Analytics', url: 'https://war-room-oa9t.onrender.com/analytics' },
    ]}
  />
);

// FAQ structured data for better search visibility
export const FAQStructuredData: React.FC<{
  faqs: Array<{ question: string; answer: string }>;
}> = ({ faqs }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return <StructuredData schema={schema} />;
};

// Article structured data for blog posts or news
export const ArticleStructuredData: React.FC<{
  headline: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image: string;
  url: string;
}> = ({ headline, description, author, publishedTime, modifiedTime, image, url }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: [image],
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: baseOrganizationSchema,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return <StructuredData schema={schema} />;
};
