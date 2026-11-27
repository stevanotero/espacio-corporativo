import { Router } from "express";
import { validar } from "../../middlewares/validar";
import { empresasController } from "./empresas.controller";
import { empresaIdSchema } from "./empresas.schema";

// ROUTES: une cada URL con su controller (y los middlewares que necesite antes).
// Este router se monta en app.ts bajo /api/empresas
const router = Router();

router.get("/", empresasController.listar);
router.get("/:id", validar(empresaIdSchema, "params"), empresasController.obtener);

export default router;
