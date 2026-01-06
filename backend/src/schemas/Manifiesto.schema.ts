// backend/src/schemas/manifiesto.schema.ts

import { z } from 'zod';

/**
 * Schema para crear un nuevo manifiesto
 * AHORA: Un manifiesto cubre MÚLTIPLES recolecciones en un PERIODO
 */
export const createManifiestoSchema = z.object({
  // ========================================
  // REFERENCIAS PRINCIPALES
  // ========================================
  local_id: z.string().uuid('Local ID inválido'),
  recolector_id: z.string().uuid('Recolector ID inválido'),
  vehiculo_id: z.string().uuid('Vehículo ID inválido'),
  destino_final_id: z.string().uuid('Destino final ID inválido'),
  
  // ========================================
  // PERIODO DE RECOLECCIONES ⭐ NUEVO
  // ========================================
  fecha_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  fecha_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  
  // ========================================
  // CONTROL
  // ========================================
  folio_manual: z.string().max(50).optional(), // Para folios reservados
  fecha_emision: z.string().optional(),        // Default: fecha actual
});

/**
 * Schema para actualizar un manifiesto
 */
export const updateManifiestoSchema = z.object({
  pdf_generado: z.boolean().optional(),
  pdf_path: z.string().optional(),
});

/**
 * TypeScript types
 */
export type CreateManifiestoInput = z.infer<typeof createManifiestoSchema>;
export type UpdateManifiestoInput = z.infer<typeof updateManifiestoSchema>;