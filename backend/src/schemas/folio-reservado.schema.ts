// backend/src/schemas/Folio reservado.schema.ts

import { z } from 'zod';

// Schema para crear folio reservado
export const createFolioReservadoSchema = z.object({
  folio_manual: z.string()
    .min(1, 'El folio manual es requerido')
    .max(50, 'El folio no puede exceder 50 caracteres')
    .regex(/^[A-Za-z]{2,8}-\d{3}-\d{4}$/, 'Formato de folio inválido. Ejemplo: AmPDC-001-2026'),
  plaza_id: z.string()
    .uuid('Plaza ID debe ser un UUID válido')
});

// Schema para actualizar folio reservado
export const updateFolioReservadoSchema = z.object({
  folio_manual: z.string()
    .min(1, 'El folio manual es requerido')
    .max(50, 'El folio no puede exceder 50 caracteres')
    .regex(/^[A-Za-z]{2,8}-\d{3}-\d{4}$/, 'Formato de folio inválido. Ejemplo: AmPDC-001-2026')
    .optional()
});

export type CreateFolioReservadoInput = z.infer<typeof createFolioReservadoSchema>;
export type UpdateFolioReservadoInput = z.infer<typeof updateFolioReservadoSchema>;