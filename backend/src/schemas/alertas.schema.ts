export interface AlertaCumplimiento {
  id: string;
  local_id: string;
  plaza_id: string;
  coordinador_id: string;
  mes_alerta: string;
  kilos_promedio_historico: number;
  kilos_mes_actual: number;
  porcentaje_desviacion: number;
  tipo_alerta: 'CAIDA' | 'AUSENCIA_TOTAL';
  estatus: 'PENDIENTE' | 'REVISADA' | 'INFORMADA';
  nota_coordinador?: string;
  informe_generado: boolean;
  informe_fecha?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerarAlertasMesInput {
  mes: string;
}

export interface ActualizarAlertaInput {
  estatus?: 'PENDIENTE' | 'REVISADA' | 'INFORMADA';
  nota_coordinador?: string;
  informe_generado?: boolean;
  informe_fecha?: string;
}
