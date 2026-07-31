// Script de cierre: numeración de página (patrón tomado de generateCoordinadorHTML.ts,
// único de los 6 originales que numera dinámicamente) + auto-print de generateDirectorHTML.ts

export function buildClosing(): string {
  return `
  <script>
    window.onload = function() {
      const pageNumbers = document.querySelectorAll('.page-number');
      const pageTotals = document.querySelectorAll('.page-total');
      const total = pageNumbers.length;

      pageNumbers.forEach((el, i) => {
        el.textContent = String(i + 1);
      });
      pageTotals.forEach((el) => {
        el.textContent = String(total);
      });

      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
  `;
}
