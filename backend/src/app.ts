import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { rutaNoEncontrada, manejarErrores } from "./middlewares/errores";
import empresasRoutes from "./modules/empresas/empresas.routes";

// Arma la aplicación Express: middlewares globales + rutas de cada módulo.
// Está separado de index.ts para poder probar la app sin abrir un puerto.
export function crearApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  if (env.NODE_ENV === "development") app.use(morgan("dev"));

  // Para saber si el backend está vivo (lo usa la web en la página de inicio)
  app.get("/api/salud", (_req, res) => {
    res.json({ ok: true, data: { estado: "ok", fecha: new Date().toISOString() } });
  });

  // ── Rutas de los módulos ──
  // Cada módulo nuevo (comunicados, bandeja, canales...) se registra aquí con una línea.
  app.use("/api/empresas", empresasRoutes);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);

  return app;
}
