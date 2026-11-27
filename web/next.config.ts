import type { NextConfig } from "next";

// La web NUNCA llama al backend con su dirección completa desde el navegador.
// Siempre llama a "/api/...", y Next.js reenvía esa petición al backend.
// Así funciona igual en local y en producción, sin depender de variables públicas
// (fue lo que falló en el modal de crear ticket de la plataforma de soporte).
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4001";

const nextConfig: NextConfig = {
  // Permite importar el paquete compartido (TypeScript sin compilar)
  transpilePackages: ["@espacio/shared"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
