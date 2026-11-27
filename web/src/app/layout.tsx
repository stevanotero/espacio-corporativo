import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espacio Corporativo · Servired y Multired",
  description: "Comunicación interna de Servired y Multired",
};

// Layout raíz: envuelve TODAS las páginas. Solo pone el HTML base y los estilos.
// El menú lateral vive en app/(panel)/layout.tsx para que el login (más adelante) no lo tenga.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
