import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

export const metadata: Metadata = {
  title: "Mangalam Vastu | Modern Vastu Analysis",
  description: "AI-Assisted Vastu Analysis Platform with high-fidelity insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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