import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { bookingCreateSchema, eventCreateSchema } from "../validators/eventSchemas";

export const listEvents = async (req: AuthenticatedRequest, res: Response) => {
  const events = await prisma.event.findMany({
    include: {
      bookings: {
        include: {
          resident: { select: { id: true, name: true, apartment: true } },
        },
      },
      createdBy: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  res.json(events);
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = eventCreateSchema.safeParse({
    ...req.body,
    capacity: Number(req.body.capacity),
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  });

  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const { description, ...eventData } = parsed.data;

  const event = await prisma.event.create({
    data: {
      ...eventData,
      description: description ?? null,
      createdById: req.user!.id,
    },
  });

  res.status(201).json(event);
};

export const bookEvent = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = bookingCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parsed.error.flatten() });
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    include: { bookings: true },
  });

  if (!event) {
    return res.status(404).json({ message: "Evento não encontrado" });
  }

  if (event.bookings.length >= event.capacity) {
    return res.status(400).json({ message: "Capacidade esgotada" });
  }

  const booking = await prisma.eventBooking.create({
    data: {
      eventId: parsed.data.eventId,
      residentId: req.user!.id,
      notes: parsed.data.notes ?? null,
    },
  });

  res.status(201).json(booking);
};
