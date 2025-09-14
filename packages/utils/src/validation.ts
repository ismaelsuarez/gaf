import { z } from 'zod';

export const nonEmptyString = z.string().min(1);

export function safeParse<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}


