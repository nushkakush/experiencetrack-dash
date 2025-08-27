import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PageSEO, type PageSEOKey } from './seo-config';
import { useCurrentUrl } from '@/hooks/useCurrentUrl';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  // Additional OG properties
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  twitterCreator?: string;
  twitterSite?: string;
}

const defaultSEO = {
  title: 'LIT OS - Experiential Learning Management System',
  description:
    'LIT OS is a comprehensive experiential learning management system designed for educational institutions. Manage cohorts, track attendance, handle fee collection, and monitor student progress with our intuitive dashboard.',
  keywords:
    'LIT OS, experiential learning, education management, cohort management, attendance tracking, fee collection, student dashboard, learning management system',
  image:
    'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/lit-nav/lit-logo.svg',
  url: 'https://lit-cb3g6baa1-anushkas-projects-30c1e8f2.vercel.app',
  type: 'website' as const,
  author: 'LIT School',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'LIT OS - Experiential Learning Management System',
  twitterCreator: '@litschool',
  twitterSite: '@litschool',
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex = false,
  nofollow = false,
  ogImageWidth,
  ogImageHeight,
  ogImageAlt,
  twitterCreator,
  twitterSite,
}) => {
  const currentUrl = useCurrentUrl();

  const seoTitle = title ? `${title} | LIT OS` : defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;
  const seoUrl = url || currentUrl;
  const seoType = type || defaultSEO.type;
  const seoAuthor = author || defaultSEO.author;
  const seoOgImageWidth = ogImageWidth || defaultSEO.ogImageWidth;
  const seoOgImageHeight = ogImageHeight || defaultSEO.ogImageHeight;
  const seoOgImageAlt = ogImageAlt || defaultSEO.ogImageAlt;
  const seoTwitterCreator = twitterCreator || defaultSEO.twitterCreator;
  const seoTwitterSite = twitterSite || defaultSEO.twitterSite;

  const robots =
    noindex || nofollow
      ? `${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`
      : 'index, follow';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoTitle}</title>
      <meta name='title' content={seoTitle} />
      <meta name='description' content={seoDescription} />
      <meta name='keywords' content={seoKeywords} />
      <meta name='author' content={seoAuthor} />
      <meta name='robots' content={robots} />

      {/* Canonical URL */}
      <link rel='canonical' href={seoUrl} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={seoType} />
      <meta property='og:url' content={seoUrl} />
      <meta property='og:title' content={seoTitle} />
      <meta property='og:description' content={seoDescription} />
      <meta property='og:image' content={seoImage} />
      <meta property='og:image:width' content={seoOgImageWidth.toString()} />
      <meta property='og:image:height' content={seoOgImageHeight.toString()} />
      <meta property='og:image:alt' content={seoOgImageAlt} />
      <meta property='og:site_name' content='LIT OS' />
      <meta property='og:locale' content='en_US' />

      {/* Twitter */}
      <meta property='twitter:card' content='summary_large_image' />
      <meta property='twitter:url' content={seoUrl} />
      <meta property='twitter:title' content={seoTitle} />
      <meta property='twitter:description' content={seoDescription} />
      <meta property='twitter:image' content={seoImage} />
      <meta property='twitter:image:alt' content={seoOgImageAlt} />
      <meta property='twitter:creator' content={seoTwitterCreator} />
      <meta property='twitter:site' content={seoTwitterSite} />

      {/* Article specific meta tags */}
      {publishedTime && (
        <meta property='article:published_time' content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property='article:modified_time' content={modifiedTime} />
      )}
      {section && <meta property='article:section' content={section} />}
      {tags &&
        tags.map((tag, index) => (
          <meta key={index} property='article:tag' content={tag} />
        ))}

      {/* Additional meta tags */}
      <meta name='application-name' content='LIT OS' />
      <meta name='apple-mobile-web-app-title' content='LIT OS' />

      {/* Additional OG properties for better social sharing */}
      <meta property='og:determiner' content='the' />
      <meta property='og:locale:alternate' content='en_GB' />

      {/* Structured Data for better SEO */}
      <script type='application/ld+json'>
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'LIT OS',
          description: seoDescription,
          url: seoUrl,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          author: {
            '@type': 'Organization',
            name: 'LIT School',
          },
          offers: {
            '@type': 'Offer',
            category: 'Educational Software',
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
