// Script de cierre: auto-print (patrón de generateDirectorHTML.ts).
// La numeración de página ya no la hace JS — la resuelve el navegador vía
// counter(page)/counter(pages) en el @page de reportTemplate/styles.ts.

export function buildClosing(): string {
  return `
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
  `;
}
