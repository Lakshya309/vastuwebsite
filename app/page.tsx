import { Metadata } from "next";
import HomeClient from "./HomeClient";
import JsonLd from "@/components/seo/JsonLd";
import {
  getSoftwareApplicationSchema,
  getFAQPageSchema,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mangalam Vastu | Modern AI Vastu Analysis & 16 Zone Vedic Grid",
  description:
    "Harmonize your living and commercial spaces with Mangalam Vastu AI. Features 16-zone Vedic analysis, Devta grid mapping, Marma point sensitivity, and automated reports.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Mangalam Vastu | Modern AI Vastu Analysis Platform",
    description:
      "Transform floor plans with AI-assisted 16-zone Vedic Vastu analysis, Devta energy grid mapping, and professional architectural reports.",
    url: SITE_URL,
    type: "website",
    images: [
      {
        url: "/shaktichakra.png",
        width: 1200,
        height: 630,
        alt: "Mangalam Vastu 16 Zone Grid",
      },
    ],
  },
};

export default function HomePage() {
  const softwareSchema = getSoftwareApplicationSchema();
  const faqSchema = getFAQPageSchema([
    {
      question: "What is Mangalam Vastu?",
      answer:
        "Mangalam Vastu is an advanced AI-powered platform for Vastu Shastra analysis, enabling property owners, architects, and consultants to perform 16-zone Vedic grid alignment, Devta mapping, and Marma point sensitivity detection on floor plans.",
    },
    {
      question: "How does 16-zone Vastu analysis work?",
      answer:
        "Our engine calculates precise cardinal and ordinal directions on your uploaded floor plan layout, mapping all 16 directional zones and 45 Devta energy fields to identify elemental imbalances and suggest non-destructive remedies.",
    },
    {
      question: "Can I generate downloadable PDF Vastu reports?",
      answer:
        "Yes, Mangalam Vastu generates high-fidelity, professional PDF reports complete with zone compliance scores, Devta bar charts, elemental balances, and actionable remediation steps.",
    },
    {
      question: "Is there a free trial or credit system?",
      answer:
        "Yes, new users receive free analysis credits upon signup to explore the Vastu engine and evaluate sample floor plans without requiring a credit card.",
    },
  ]);

  return (
    <>
      <JsonLd data={[softwareSchema, faqSchema]} />
      <HomeClient />
    </>
  );
}