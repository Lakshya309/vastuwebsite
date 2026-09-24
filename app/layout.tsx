import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema, getWebSiteSchema, getServiceSchema, SITE_URL } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#13547a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mangalam Vastu | AI Vastu Analysis & Modern Sacred Architecture",
    template: "%s | Mangalam Vastu",
  },
  description:
    "Transform floor plans with AI-assisted 16-zone Vedic Vastu analysis, Devta energy grid mapping, Marma point sensitivity, and professional architectural reports.",
  keywords: [
    "Vastu Shastra",
    "AI Vastu Analysis",
    "Vedic Architecture",
    "16 Zone Vastu Grid",
    "45 Devta Grid Analysis",
    "Marma Point Detection",
    "Floor Plan Vastu",
    "Vastu Consultancy Online",
    "Vastu Report Generator",
    "Mangalam Vastu",
  ],
  authors: [{ name: "Mangalam Vastu", url: SITE_URL }],
  creator: "Mangalam Vastu",
  publisher: "Mangalam Vastu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "Mangalam Vastu | Modern Vastu Analysis & Sacred Intelligence",
    description:
      "AI-Assisted 16-Zone Vedic Vastu & Devta Analysis Platform for modern homes, offices, and commercial properties.",
    siteName: "Mangalam Vastu",
    images: [
      {
        url: "/shaktichakra.png",
        width: 1200,
        height: 630,
        alt: "Mangalam Vastu - Sacred Geometry & 16 Zone Vedic Grid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mangalam Vastu | Modern AI Vastu Analysis",
    description:
      "AI-Assisted 16-Zone Vedic Vastu & Devta Analysis Platform with high-fidelity insights.",
    images: ["/shaktichakra.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();
  const serviceSchema = getServiceSchema();

  return (
    <html lang="en">
      <head>
        <JsonLd data={[organizationSchema, webSiteSchema, serviceSchema]} />
      </head>
      <body
        className={`${cormorant.variable} ${outfit.variable} antialiased bg-background text-foreground selection:bg-teal-100 grid-overlay organic-gradient min-h-screen flex flex-col`}
        style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}