import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'El correo electrónico es requerido').email('Ingresa un correo electrónico válido').max(255),
  password: z.string().min(1, 'La contraseña es requerida').max(128),
});

export type LoginFormData = z.infer<typeof loginSchema>;

type ValidationSuccess<T> = { success: true; data: T };
type ValidationError = { success: false; error: string };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.errors[0]?.message || 'Datos inválidos' };
}
