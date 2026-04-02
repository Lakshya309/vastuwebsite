import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google"; // Cormorant Garamond for Serifs, Inter for UI
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "../components/Navbar";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
        className={`${cormorant.variable} ${inter.variable} font-inter antialiased bg-background text-foreground selection:bg-teal-100 grid-overlay organic-gradient`}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
