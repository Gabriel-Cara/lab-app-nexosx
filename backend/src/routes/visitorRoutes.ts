import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { listVisitors, markExit, registerVisitor } from "../controllers/visitorController";

const router = Router();

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     summary: Lista entradas de visitantes
 *     tags: [Visitantes]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, authorize(["ADMIN", "PORTEIRO"]), listVisitors);

/**
 * @swagger
 * /api/visitors:
 *   post:
 *     summary: Registra entrada de visitante
 *     tags: [Visitantes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticate, authorize(["ADMIN", "PORTEIRO"]), registerVisitor);

/**
 * @swagger
 * /api/visitors/{id}/exit:
 *   post:
 *     summary: Marca a saída de um visitante
 *     tags: [Visitantes]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/exit", authenticate, authorize(["ADMIN", "PORTEIRO"]), markExit);

export default router;
