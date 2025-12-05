import { z } from 'zod';

/**
 * Esquema de validación para el formulario de login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Esquema de validación para el formulario de registro
 */
export const registerSchema = z.object({
  nombreCompleto: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Por favor ingresa un email válido'),
  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^\d{7,15}$/.test(val),
      'El teléfono debe tener entre 7 y 15 dígitos'
    ),
  tipoIdentificacion: z
    .enum(['CC', 'NIT', 'CE', 'TR'])
    .optional(),
  numeroIdentificacion: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (val.length >= 5 && val.length <= 20),
      'El número de identificación debe tener entre 5 y 20 caracteres'
    )
    .refine(
      (val) => !val || val.length === 0 || /^[a-zA-Z0-9\-]+$/.test(val),
      'El número de identificación solo puede contener letras, números y guiones'
    ),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/(?=.*[a-z])/, 'Debe contener al menos una letra minúscula')
    .regex(/(?=.*[A-Z])/, 'Debe contener al menos una letra mayúscula')
    .regex(/(?=.*\d)/, 'Debe contener al menos un número'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

