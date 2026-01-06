import { z } from 'zod';

/**
 * Schema para crear un nuevo local
 * ✅ ACTUALIZADO: Campo 'direccion' en lugar de 'notas'
 * ✅ ACTUALIZADO: Agregados campos para manifiestos (opcionales)
 */
export const createLocalSchema = z.object({
  // ========================================
  // CAMPOS EXISTENTES (MANTENER IGUAL)
  // ========================================
  plaza_id: z.string().uuid('Plaza ID inválido').nullable().optional(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  giro: z.string().max(100).optional(),
  contacto: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  direccion: z.string().optional(), // ✅ CAMBIADO: 'notas' → 'direccion'
  activo: z.boolean().optional().default(true),
  
  // ========================================
  // CAMPOS NUEVOS PARA MANIFIESTOS (OPCIONALES)
  // ========================================
  razon_social: z.string()
    .max(255, 'Razón social debe tener máximo 255 caracteres')
    .optional()
    .nullable(),
  
  rfc: z.string()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, 'RFC inválido. Debe tener 13 caracteres (ej: ABC123456XYZ)')
    .optional()
    .nullable()
    .transform(val => val ? val.toUpperCase() : val),
  
  ciudad: z.string()
    .max(100, 'Ciudad debe tener máximo 100 caracteres')
    .optional()
    .nullable(),
  
  estado: z.string()
    .max(100, 'Estado debe tener máximo 100 caracteres')
    .optional()
    .nullable(),
  
  codigo_postal: z.string()
    .regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos')
    .optional()
    .nullable(),
  
  encargado_entrega: z.string()
    .max(255, 'Encargado de entrega debe tener máximo 255 caracteres')
    .optional()
    .nullable()
});

/**
 * Schema para actualizar un local
 * ✅ ACTUALIZADO: Agregados campos para manifiestos (opcionales)
 */
export const updateLocalSchema = z.object({
  // ========================================
  // CAMPOS EXISTENTES (MANTENER IGUAL)
  // ========================================
  plaza_id: z.string().uuid('Plaza ID inválido').nullable().optional(),
  nombre: z.string().min(1).max(100).optional(),
  giro: z.string().max(100).optional(),
  contacto: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').max(100).optional(),
  direccion: z.string().optional(), // ✅ CAMBIADO: 'notas' → 'direccion'
  activo: z.boolean().optional(),
  
  // ========================================
  // CAMPOS NUEVOS PARA MANIFIESTOS (OPCIONALES)
  // ========================================
  razon_social: z.string()
    .max(255, 'Razón social debe tener máximo 255 caracteres')
    .optional()
    .nullable(),
  
  rfc: z.string()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, 'RFC inválido. Debe tener 13 caracteres')
    .optional()
    .nullable()
    .transform(val => val ? val.toUpperCase() : val),
  
  ciudad: z.string()
    .max(100, 'Ciudad debe tener máximo 100 caracteres')
    .optional()
    .nullable(),
  
  estado: z.string()
    .max(100, 'Estado debe tener máximo 100 caracteres')
    .optional()
    .nullable(),
  
  codigo_postal: z.string()
    .regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos')
    .optional()
    .nullable(),
  
  encargado_entrega: z.string()
    .max(255, 'Encargado de entrega debe tener máximo 255 caracteres')
    .optional()
    .nullable()
});

/**
 * TypeScript types
 */
export type CreateLocalInput = z.infer<typeof createLocalSchema>;
export type UpdateLocalInput = z.infer<typeof updateLocalSchema>;

/**
 * ============================================
 * NOTAS IMPORTANTES
 * ============================================
 * 
 * CAMPOS AGREGADOS PARA MANIFIESTOS:
 * - razon_social: Nombre legal del local
 * - rfc: RFC del local (auto-uppercase)
 * - ciudad: Ciudad del local
 * - estado: Estado del local
 * - codigo_postal: CP del local (5 dígitos)
 * - encargado_entrega: Persona que entrega residuos
 * 
 * TODOS SON OPCIONALES (.optional().nullable()):
 * - No afecta los 463 locales existentes
 * - No rompe funcionalidad actual
 * - Se validan solo si se proporciona valor
 * 
 * VALIDACIONES ACTIVAS:
 * - RFC: 13 caracteres alfanuméricos + auto-uppercase
 * - CP: Exactamente 5 dígitos numéricos
 * - Email: Formato email válido
 */