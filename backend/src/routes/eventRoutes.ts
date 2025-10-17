import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { bookEvent, createEvent, listEvents } from "../controllers/eventController";

const router = Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Lista eventos
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", authenticate, listEvents);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Cria um evento
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", authenticate, authorize(["ADMIN", "PORTEIRO"]), createEvent);

/**
 * @swagger
 * /api/events/book:
 *   post:
 *     summary: Reserva participação do morador
 *     tags: [Eventos]
 *     security:
 *       - bearerAuth: []
 */
router.post("/book", authenticate, authorize(["MORADOR"]), bookEvent);

export default router;
