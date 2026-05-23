import {z} from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  company: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  message: z.string().min(10, 'Conte um pouco mais para que possamos ajudar'),
  locale: z.enum(['pt', 'en']).optional(),
  // Honeypot anti-spam: keep empty
  _hp: z.string().optional().or(z.literal(''))
});

export type ContactPayload = z.infer<typeof contactSchema>;
