import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mangalam Vastu - Modern AI Vastu Analysis",
    short_name: "Mangalam Vastu",
    description:
      "AI-Assisted Vastu Analysis Platform featuring 16 Zone Vedic Grid & Devta Mapping.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#13547a",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
