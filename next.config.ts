import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.86.33"],
  async headers() {
    return [
      {
        // Apenas exemplos com hash de conteúdo no nome (<base>.<8 hex>.webp,
        // ver src/app/lib/inspectionExampleImage.ts): trocar a imagem gera URL
        // nova, então o cache pode ser imutável. PNGs antigos e arquivos sem
        // hash mantêm o comportamento padrão.
        source: "/examples/:file(.+\\.[0-9a-f]{8}\\.webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;