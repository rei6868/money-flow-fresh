import { z } from 'zod';

export const CreatePersonSchema = z.object({
  personName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
