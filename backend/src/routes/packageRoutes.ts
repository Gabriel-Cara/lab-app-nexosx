import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { createPackage, listPackages, retrievePackage } from "../controllers/packageController";

const router = Router();

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Lista encomendas
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, listPackages);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Cria uma encomenda
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticate, authorize(["ADMIN", "PORTEIRO"]), createPackage);

/**
 * @swagger
 * /api/packages/{id}/retrieve:
 *   post:
 *     summary: Finaliza a retirada de uma encomenda
 *     tags: [Encomendas]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/retrieve", authenticate, authorize(["ADMIN", "PORTEIRO"]), retrievePackage);

export default router;
