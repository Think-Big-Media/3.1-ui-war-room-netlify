import type React from 'react';
import { Helmet } from 'react-helmet-async';

interface HeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonicalUrl?: string;
}

const defaultMeta = {
  title: 'War Room - Political Campaign Management Platform',
  description:
    'Comprehensive campaign management platform for political campaigns, advocacy groups, and non-profit organizations. Manage volunteers, events, communications, and data analytics.',
  image: 'https://war-room-oa9t.onrender.com/og-image.png',
  url: 'https://war-room-oa9t.onrender.com',
  type: 'website' as const,
  keywords: [
    'political campaign management',
    'volunteer coordination',
    'event management',
    'campaign analytics',
    'advocacy tools',
    'non-profit management',
    'fundraising platform',
    'voter outreach',
    'grassroots organizing',
    'political tech',
  ],
  author: 'War Room Team',
};

export const Head: React.FC<HeadProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false,
  canonicalUrl,
}) => {
  const siteTitle = title ? `${title} | ${defaultMeta.title}` : defaultMeta.title;
  const metaDescription = description || defaultMeta.description;
  const metaImage = image || defaultMeta.image;
  const metaUrl = url || defaultMeta.url;
  const metaKeywords = [...defaultMeta.keywords, ...keywords].join(', ');
  const metaAuthor = author || defaultMeta.author;

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={metaAuthor} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#D97706" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots meta */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph tags */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="War Room" />
      <meta property="og:locale" content="en_US" />

      {/* Article specific Open Graph tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {metaAuthor && <meta property="article:author" content={metaAuthor} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:url" content={metaUrl} />
      <meta name="twitter:site" content="@WarRoomPlatform" />
      <meta name="twitter:creator" content="@WarRoomPlatform" />

      {/* Additional meta tags for rich snippets */}
      <meta name="application-name" content="War Room" />
      <meta name="apple-mobile-web-app-title" content="War Room" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Favicon and app icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Helmet>
  );
};

// Pre-configured Head components for common pages
export const DashboardHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Dashboard"
    description="Campaign command center with real-time monitoring, analytics, and crisis management tools."
    keywords={['campaign dashboard', 'real-time monitoring', 'campaign metrics']}
    {...props}
  />
);

export const AnalyticsHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Analytics"
    description="Comprehensive campaign analytics including volunteer metrics, event performance, and fundraising insights."
    keywords={['campaign analytics', 'performance metrics', 'data insights']}
    {...props}
  />
);

export const AlertCenterHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Alert Center"
    description="Crisis management and real-time alert monitoring for campaign operations."
    keywords={['crisis management', 'alerts', 'monitoring']}
    {...props}
  />
);

export const CampaignControlHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="War Room"
    description="Manage campaign assets, projects, and operational workflows."
    keywords={['campaign management', 'project control', 'asset management']}
    {...props}
  />
);

export const IntelligenceHubHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Intelligence"
    description="AI-powered document intelligence and information analysis platform."
    keywords={['document intelligence', 'AI analysis', 'information hub']}
    {...props}
  />
);

export const RealTimeMonitoringHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Live Monitoring"
    description="Live monitoring of campaign performance, social media, and public sentiment."
    keywords={['real-time monitoring', 'social media monitoring', 'sentiment analysis']}
    {...props}
  />
);

export const SettingsHead: React.FC<Partial<HeadProps>> = (props) => (
  <Head
    title="Settings"
    description="Configure your War Room platform settings, integrations, and preferences."
    keywords={['settings', 'configuration', 'platform preferences']}
    {...props}
  />
);
