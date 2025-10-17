import { z } from "zod";

export const packageCreateSchema = z.object({
  residentId: z.string(),
  description: z.string().min(3),
  carrier: z.string().optional(),
});

export const packageRetrieveSchema = z.object({
  code: z.string().min(4),
});
