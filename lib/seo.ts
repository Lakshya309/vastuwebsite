/**
 * Schema.org JSON-LD Helper utilities for Mangalam Vastu
 * Provides structured data schemas for Organization, WebSite, SoftwareApplication, FAQs, Breadcrumbs, and Services.
 */

export const SITE_URL = "https://manglamvastu.in";
export const SITE_NAME = "Mangalam Vastu";
export const SITE_TAGLINE = "Modern Vastu Analysis & Sacred Intelligence";
export const SITE_DESCRIPTION =
  "AI-powered Vastu analysis platform featuring 16 Zone Vedic Grid, Devta Mapping, Marma Point Detection, and instant architectural compliance reports.";

/**
 * Organization & Business Schema
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineBusiness"],
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      caption: SITE_NAME,
    },
    image: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    slogan: SITE_TAGLINE,
    sameAs: [
      // Add social links if present
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${SITE_URL}/contact`,
      availableLanguage: ["English", "Hindi"],
    },
  };
}

/**
 * WebSite Schema with SearchAction capability
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: ["Manglam Vastu", "Mangalam Vastu AI"],
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: "en-US",
  };
}

/**
 * SoftwareApplication / WebApplication Schema for Mangalam Vastu AI Tool
 */
export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "Mangalam Vastu AI Platform",
    applicationCategory: "DesignApplication",
    operatingSystem: "All (Web Based)",
    url: SITE_URL,
    description:
      "Advanced AI tool for 16-zone Vedic Vastu analysis, floor plan mapping, Devta energy distribution, and automated remediation reports.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "0",
      highPrice: "9999",
      offerCount: "4",
      url: `${SITE_URL}/pricing`,
    },
    featureList: [
      "16 Zone Vedic Grid Alignment",
      "45 Devta Energy Distribution Mapping",
      "Marma Point Sensitivity Detection",
      "Auto Floor Plan Door & Object Recognition",
      "Instant PDF Vastu Remediation Report Generation",
      "Astrologer & Vastu Expert Portal",
    ],
    author: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

/**
 * BreadcrumbList Schema generator
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * FAQPage Schema generator
 */
export function getFAQPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Vastu & Architectural Analysis Service Schema
 */
export function getServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI-Powered Vastu Shastra & Architectural Analysis",
    serviceType: "Architectural & Energy Consultancy",
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "Worldwide",
    },
    description:
      "Comprehensive digital Vastu analysis of home and commercial floor plans using 16 zone grid geometry and Devta placement algorithms.",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/pricing`,
      priceCurrency: "INR",
    },
  };
}
