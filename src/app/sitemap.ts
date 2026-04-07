import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.movicarweb.com.br",
      lastModified: new Date(),
    },
    {
      url: "https://www.movicarweb.com.br/checklist-vistoria-veicular",
      lastModified: new Date(),
    },
  ];
}