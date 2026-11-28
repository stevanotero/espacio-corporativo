import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { rutaNoEncontrada, manejarErrores } from "./middlewares/errores";
import { autenticar } from "./middlewares/autenticar";
import authRoutes from "./modules/auth/auth.routes";
import empresasRoutes from "./modules/empresas/empresas.routes";

// Arma la aplicación Express: middlewares globales + rutas de cada módulo.
// Está separado de index.ts para poder probar la app sin abrir un puerto.
export function crearApp() {
  const app = express();

  // Para leer la IP real del usuario cuando hay proxies delante (Next.js / nginx)
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (env.NODE_ENV === "development") app.use(morgan("dev"));

  // Para saber si el backend está vivo (lo usa la web en la página de inicio)
  app.get("/api/salud", (_req, res) => {
    res.json({ ok: true, data: { estado: "ok", fecha: new Date().toISOString() } });
  });

  // ── Rutas de los módulos ──
  // Cada módulo nuevo (comunicados, bandeja, canales...) se registra aquí con una línea.
  // Las rutas privadas llevan "autenticar": sin sesión responden 401.
  app.use("/api/auth", authRoutes);
  app.use("/api/empresas", autenticar, empresasRoutes);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);

  return app;
}
