import { Response } from "express";
import { prisma } from "../config/prisma";
import { packageCreateSchema, packageRetrieveSchema } from "../validators/packageSchemas";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { notifyResident } from "../services/notificationService";
import { randomBytes } from "crypto";

const generateCode = () => randomBytes(3).toString("hex").toUpperCase();

export const listPackages = async (req: AuthenticatedRequest, res: Response) => {
  const { role, id } = req.user!;

  const packages = await prisma.package.findMany({
    where: role === "MORADOR" ? { residentId: id } : undefined,
    include: {
      resident: { select: { name: true, apartment: true, phone: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { receivedAt: "desc" },
  });

  res.json(packages);
};

export const createPackage = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = packageCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const code = generateCode();

  const pkg = await prisma.package.create({
    data: {
      code,
      description: parsed.data.description,
      carrier: parsed.data.carrier,
      residentId: parsed.data.residentId,
      createdById: req.user!.id,
    },
    include: {
      resident: true,
    },
  });

  await notifyResident({
    phone: pkg.resident.phone ?? undefined,
    message: `Olá ${pkg.resident.name}, sua encomenda chegou! Código: ${code}`,
  });

  res.status(201).json(pkg);
};

export const retrievePackage = async (req: AuthenticatedRequest, res: Response) => {
  const packageId = req.params.id;
  const parsed = packageRetrieveSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return res.status(404).json({ message: "Encomenda não encontrada" });
  }

  if (pkg.code !== parsed.data.code) {
    return res.status(400).json({ message: "Código inválido" });
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      retrievedAt: new Date(),
      retrievalLogs: {
        create: {
          verifiedById: req.user!.id,
          method: "codigo",
        },
      },
    },
  });

  res.json(updated);
};
