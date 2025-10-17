import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userCreateSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "PORTEIRO", "MORADOR"]),
  apartment: z.string().optional(),
  password: z.string().min(6),
  building: z.string().optional(),
  vehicle: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  vehicle: z.string().optional(),
  emergencyContact: z.string().optional(),
});
