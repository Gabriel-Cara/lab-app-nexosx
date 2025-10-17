import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { visitorExitSchema, visitorRegisterSchema } from "../validators/visitorSchemas";

export const listVisitors = async (req: AuthenticatedRequest, res: Response) => {
  const logs = await prisma.visitLog.findMany({
    include: {
      visitor: true,
      host: { select: { name: true, apartment: true } },
      handledBy: { select: { name: true } },
    },
    orderBy: { entryTime: "desc" },
    take: 100,
  });

  res.json(logs);
};

export const registerVisitor = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = visitorRegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const { name, document, phone, visitReason, hostId } = parsed.data;

  const visitor = await prisma.visitor.upsert({
    where: { document },
    update: { name, phone, visitReason },
    create: { name, document, phone, visitReason },
  });

  const log = await prisma.visitLog.create({
    data: {
      visitorId: visitor.id,
      hostId,
      handledById: req.user!.id,
      notes: visitReason,
    },
    include: {
      visitor: true,
      host: true,
      handledBy: true,
    },
  });

  res.status(201).json(log);
};

export const markExit = async (req: AuthenticatedRequest, res: Response) => {
  const logId = req.params.id;
  const parsed = visitorExitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const log = await prisma.visitLog.update({
    where: { id: logId },
    data: {
      exitTime: new Date(),
      notes: parsed.data.notes,
    },
    include: {
      visitor: true,
      host: true,
      handledBy: true,
    },
  });

  res.json(log);
};
