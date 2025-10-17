import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { loginSchema, userCreateSchema } from "../validators/authSchemas";
import { signToken } from "../utils/token";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = signToken({ sub: user.id, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      apartment: user.apartment,
    },
  });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { residents: true },
  });

  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  res.json(user);
};

export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = userCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const { password, ...data } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ message: "Email já utilizado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      apartment: data.apartment,
      passwordHash,
      residents:
        data.role === "MORADOR"
          ? {
              create: {
                building: data.building ?? null,
                vehicle: data.vehicle ?? null,
                emergencyContact: data.emergencyContact ?? null,
              },
            }
          : undefined,
    },
  });

  res.status(201).json(created);
};

export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    include: { residents: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
};
