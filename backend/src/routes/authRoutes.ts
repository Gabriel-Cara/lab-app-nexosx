import { Router } from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { createUser, listUsers, login, me } from "../controllers/authController";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token JWT válido
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Retorna os dados do usuário logado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Cria um usuário
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.post("/users", authenticate, authorize(["ADMIN", "PORTEIRO"]), createUser);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Lista usuários
 *     tags: [Usuários]
 *     security:
 *       - bearerAuth: []
 */
router.get("/users", authenticate, authorize(["ADMIN", "PORTEIRO"]), listUsers);

export default router;
