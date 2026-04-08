import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.movicarweb.com.br",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.movicarweb.com.br/checklist-vistoria-veicular",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.movicarweb.com.br/vistoria-veicular-app",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
  {
    url: "https://www.movicarweb.com.br/vistoria-veicular-locacao",
    lastModified: new Date(),
  },
}