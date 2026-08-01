export function getUltimoDiaDelMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
}

export function parseFechaInput(fechaISO: string): Date {
  if (!fechaISO) {
    throw new Error('fechaEmisionPersonalizada vacía');
  }
  const [year, month, day] = fechaISO.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Formato inválido de fechaEmisionPersonalizada: ${fechaISO}`);
  }
  return new Date(year, month - 1, day);
}

export function formatearISOFecha(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function obtenerFechaEmisionUltimoDia(fechaISO: string): string {
  return formatearISOFecha(getUltimoDiaDelMes(parseFechaInput(fechaISO)));
}

export function formatearFechaDDMMYYYY(fechaISO: string): string {
  const [year, month, day] = fechaISO.split('-');
  return `${day}/${month}/${year}`;
}
