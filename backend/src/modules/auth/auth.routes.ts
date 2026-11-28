import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { validar } from "../../middlewares/validar";
import { autenticar } from "../../middlewares/autenticar";
import { authController } from "./auth.controller";
import { loginSchema } from "./auth.schema";

const router = Router();

// Freno contra ataques de fuerza bruta: máximo 20 intentos de login por IP cada 15 minutos.
// (Aparte del bloqueo por usuario tras MAX_INTENTOS_LOGIN contraseñas incorrectas.)
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { ok: false, error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
});

router.post("/login", limiteLogin, validar(loginSchema), authController.login);
router.post("/renovar", authController.renovar);
router.post("/logout", authController.logout);
router.get("/yo", autenticar, authController.yo);

export default router;
