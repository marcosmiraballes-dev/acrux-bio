// Parametrización de la portada (.cover-page) de generateDirectorHTML.ts (líneas 529-549)

interface BuildCoverPageParams {
  titulo: string;
  subtitulo?: string;
  plaza?: string;
  fecha: string;
  logoUrl?: string;
  userName?: string;
}

export function buildCoverPage(params: BuildCoverPageParams): string {
  const { titulo, subtitulo, plaza, fecha, logoUrl = '/logo-blanco.png', userName } = params;

  // En el original, la línea del cover-header era siempre
  // "Elefantes Verdes - {plazaSeleccionada || 'Todas las Plazas'}".
  // Si el caller no pasa subtitulo explícito, se reconstruye ese mismo patrón.
  const lineaSubtitulo = subtitulo ?? `Elefantes Verdes - ${plaza || 'Todas las Plazas'}`;

  return `
  <!-- PORTADA -->
  <div class="cover-page">
    <div class="cover-header">
      <h1>${titulo}</h1>
      <p>${lineaSubtitulo}</p>
    </div>

    <div class="logo-container">
      <img src="${logoUrl}" alt="Elefantes Verdes" style="width: 100px; height: 100px; object-fit: contain;" />
    </div>

    <div class="cover-info">
      <p><strong>Fecha de generación:</strong> ${fecha}</p>
      ${userName ? `<p><strong>Generado por:</strong> ${userName}</p>` : ''}
    </div>

    <div class="cover-footer">
      <p>Elefantes Verdes - Estrategias Ambientales</p>
      <p>Sistema de Trazabilidad de Residuos</p>
    </div>
  </div>
  `;
}
