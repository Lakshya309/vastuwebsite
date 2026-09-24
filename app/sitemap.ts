import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pricing",
    "/contact",
    "/privacy",
    "/terms",
    "/refund",
  ];

  const currentDate = new Date().toISOString();

  return routes.map((route) => {
    let priority = 0.5;
    let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "monthly";

    if (route === "") {
      priority = 1.0;
      changeFrequency = "weekly";
    } else if (route === "/pricing") {
      priority = 0.9;
      changeFrequency = "weekly";
    } else if (route === "/contact") {
      priority = 0.7;
      changeFrequency = "monthly";
    } else if (["/privacy", "/terms", "/refund"].includes(route)) {
      priority = 0.3;
      changeFrequency = "yearly";
    }

    return {
      url: `${SITE_URL}${route}`,
      lastModified: currentDate,
      changeFrequency,
      priority,
    };
  });
}
