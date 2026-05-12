export type TipoOrigen =
  | 'MANUAL'
  | 'INFRACCION'
  | 'MANIFIESTO'
  | 'CERTIFICADO'
  | 'ALERTA_CUMPLIMIENTO'
  | 'ANOMALIA';

export type TipoNotaManual =
  | 'LLAMADA'
  | 'VISITA'
  | 'ACUERDO'
  | 'SEGUIMIENTO_INFRACCION'
  | 'SOLICITUD'
  | 'OTRO';

export interface HistorialEvento {
  id: string;
  local_id: string;
  tipo_origen: TipoOrigen;
  tipo_nota_manual?: TipoNotaManual;
  referencia_id?: string;
  descripcion: string;
  coordinador_id: string;
  created_at: string;
}

export interface CrearNotaManualInput {
  local_id: string;
  tipo_nota_manual: TipoNotaManual;
  descripcion: string;
  coordinador_id: string;
}
