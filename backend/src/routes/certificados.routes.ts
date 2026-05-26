import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { huellaCarbonoService } from '../services/huella-carbono.service';

const router = Router();

router.get('/reciclaje', authenticate, async (req: Request, res: Response) => {
  try {
    const { local_id, anio, mes, tipo } = req.query as Record<string, string>;

    if (!local_id || !anio) {
      return res.status(400).json({ success: false, error: 'local_id y anio son requeridos' });
    }

    const mesNum = tipo === 'mensual' && mes ? parseInt(mes) : undefined;
    const data = await huellaCarbonoService.getReporteLocatario(local_id, parseInt(anio), mesNum);

    const esMensual = tipo === 'mensual' && mesNum;
    const nombreMes = esMensual ? new Date(parseInt(anio), mesNum! - 1, 1)
      .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : null;
    const periodoLabel = esMensual ? nombreMes! : `Año ${anio}`;
    const periodoCorto = esMensual ? `${String(mesNum).padStart(2,'0')}-${anio}` : anio;
    const folioNum = `CERT-${periodoCorto}-${String(data.resumen.total_recolecciones).padStart(6,'0')}`;

    const materialesHTML = data.por_material
      .filter(m => !m.es_inorganico && m.co2_evitado > 0)
      .slice(0, 5)
      .map(m => `<div class="mat-item"><span class="mat-nombre">${m.nombre}</span><span class="mat-kilos">${m.kilos.toLocaleString('es-MX')} kg</span></div>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificado de Reciclaje — ${data.locatario.nombre}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:#f0f4f0;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:2rem;}
  .cert{width:1056px;height:816px;display:flex;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.15);position:relative;overflow:hidden;}
  .sidebar{width:300px;min-width:300px;background:#1a4a2e;color:#fff;display:flex;flex-direction:column;align-items:center;padding:2.5rem 1.5rem;position:relative;}
  .sidebar::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");}
  .logo-circle{width:110px;height:110px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;position:relative;z-index:1;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
  .logo-circle img{width:85px;height:85px;object-fit:contain;}
  .cert-por{font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#86c99a;position:relative;z-index:1;margin-bottom:0.5rem;}
  .cert-org{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;text-align:center;line-height:1.2;position:relative;z-index:1;margin-bottom:0.25rem;}
  .cert-sub{font-size:0.75rem;color:#a8d5b5;font-style:italic;position:relative;z-index:1;margin-bottom:2rem;}
  .equiv-list{width:100%;display:flex;flex-direction:column;gap:0.75rem;position:relative;z-index:1;margin-top:auto;}
  .equiv-item{background:rgba(255,255,255,0.08);border-radius:10px;padding:0.75rem 1rem;display:flex;align-items:center;gap:0.75rem;}
  .equiv-icon{font-size:1.4rem;}
  .equiv-val{font-size:1.05rem;font-weight:700;}
  .equiv-lbl{font-size:0.65rem;color:#a8d5b5;text-transform:uppercase;letter-spacing:0.05em;}
  .anio-badge{margin-top:1.5rem;background:rgba(255,255,255,0.12);border-radius:10px;padding:0.5rem 1rem;text-align:center;position:relative;z-index:1;}
  .anio-num{font-size:1.5rem;font-weight:700;}
  .anio-tipo{font-size:0.65rem;color:#a8d5b5;text-transform:uppercase;letter-spacing:0.1em;}
  .main{flex:1;display:flex;flex-direction:column;padding:2.5rem 3rem;}
  .reconoc{font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#4a7c59;margin-bottom:0.5rem;}
  .titulo{font-family:'Playfair Display',serif;font-size:2.8rem;font-weight:700;color:#1a4a2e;line-height:1;margin-bottom:0.25rem;}
  .subtitulo{font-size:0.85rem;color:#6b9e7a;font-style:italic;margin-bottom:1.5rem;}
  .otorga-label{font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#9ca3af;margin-bottom:0.4rem;}
  .local-box{background:#f0f7f2;border-radius:12px;padding:1rem 1.5rem;margin-bottom:1.5rem;border-left:4px solid #2d7a4f;}
  .local-nom{font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:700;color:#1a4a2e;}
  .local-plaza{font-size:0.8rem;color:#6b7280;margin-top:0.2rem;}
  .co2-label{font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:#9ca3af;margin-bottom:0.25rem;}
  .co2-val{font-size:3rem;font-weight:700;color:#1a4a2e;line-height:1;}
  .co2-unit{font-size:1rem;font-weight:400;color:#4a7c59;margin-left:0.25rem;}
  .co2-desc{font-size:0.75rem;color:#6b7280;margin-top:0.25rem;margin-bottom:1.25rem;}
  .cards{display:flex;gap:0.75rem;margin-bottom:1.25rem;}
  .card-m{flex:1;background:#f9fafb;border-radius:10px;padding:0.75rem;text-align:center;border:1px solid #e5e7eb;}
  .card-num{font-size:1.2rem;font-weight:700;color:#1a4a2e;}
  .card-lbl{font-size:0.65rem;color:#6b7280;margin-top:0.15rem;line-height:1.3;}
  .footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto;padding-top:1rem;border-top:1px solid #e5e7eb;}
  .nota{font-size:0.6rem;color:#9ca3af;line-height:1.6;max-width:280px;}
  .folio-area{text-align:center;}
  .folio-num{font-size:0.7rem;font-weight:600;color:#4a7c59;font-family:monospace;}
  .folio-fecha{font-size:0.6rem;color:#9ca3af;margin-top:0.1rem;}
  .firma-area{text-align:center;}
  .firma-linea{width:140px;border-top:1.5px solid #374151;margin-bottom:0.3rem;}
  .firma-nom{font-size:0.75rem;font-weight:600;color:#111827;}
  .firma-cargo{font-size:0.6rem;color:#6b7280;}
  @media print{
    @page{size:letter landscape;margin:0;}
    body{margin:0;padding:0;background:#fff;}
    .cert{box-shadow:none;width:100vw;height:100vh;page-break-inside:avoid;}
  }
</style>
</head>
<body>
<div class="cert">
  <div class="sidebar">
    <div class="logo-circle"><img src="https://acrux-bio-frontend.onrender.com/logo-color.png" alt="Elefantes Verdes" onerror="this.style.display='none'" /></div>
    <div class="cert-por">Certificado por</div>
    <div class="cert-org">Elefantes Verdes</div>
    <div class="cert-sub">Estrategias Ambientales</div>
    <div class="equiv-list">
      <div class="equiv-item"><span class="equiv-icon">🌳</span><div><div class="equiv-val">${data.resumen.equivalencias.arboles.toLocaleString('es-MX')}</div><div class="equiv-lbl">Árboles equivalentes</div></div></div>
      <div class="equiv-item"><span class="equiv-icon">⚡</span><div><div class="equiv-val">${data.resumen.equivalencias.kwh.toLocaleString('es-MX')} kWh</div><div class="equiv-lbl">Energía ahorrada</div></div></div>
      <div class="equiv-item"><span class="equiv-icon">🚗</span><div><div class="equiv-val">${data.resumen.equivalencias.km_auto.toLocaleString('es-MX')} km</div><div class="equiv-lbl">En auto evitados</div></div></div>
    </div>
    <div class="anio-badge"><div class="anio-num">${esMensual ? String(mesNum).padStart(2,'0') + '/' + anio : anio}</div><div class="anio-tipo">${esMensual ? 'Mensual' : 'Anual'}</div></div>
  </div>
  <div class="main">
    <div class="reconoc">Reconocimiento de Impacto Ambiental</div>
    <div class="titulo">Certificado de Reciclaje</div>
    <div class="subtitulo">Por su compromiso activo con la economía circular</div>
    <div class="otorga-label">Se otorga a</div>
    <div class="local-box">
      <div class="local-nom">${data.locatario.nombre}</div>
      <div class="local-plaza">${data.locatario.plaza} · ${data.locatario.ciudad}, México</div>
    </div>
    <div class="co2-label">Total de CO₂ evitado</div>
    <div class="co2-val">${data.resumen.total_co2_evitado.toLocaleString('es-MX')}<span class="co2-unit">kg CO₂eq</span></div>
    <div class="co2-desc">mediante el reciclaje responsable de sus residuos durante ${periodoLabel}</div>
    <div class="cards">
      <div class="card-m"><div class="card-num">${data.resumen.total_kilos.toLocaleString('es-MX')}</div><div class="card-lbl">kg de residuos<br>reciclados</div></div>
      <div class="card-m"><div class="card-num">${data.resumen.total_recolecciones.toLocaleString('es-MX')}</div><div class="card-lbl">recolecciones<br>realizadas</div></div>
      <div class="card-m"><div class="card-num">${data.por_material.filter(m => !m.es_inorganico && m.kilos > 0).length}</div><div class="card-lbl">tipos de material<br>gestionados</div></div>
    </div>
    <div class="footer">
      <div class="nota">Factores de emisión: EPA WARM v16 (dic. 2023).<br>Factor eléctrico: SEMARNAT/RENE 2026 — 0.444 kg CO₂/kWh.<br>Verificado con metodología internacional citable.</div>
      <div class="folio-area"><div class="folio-num">${folioNum}</div><div class="folio-fecha">Emitido: ${new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</div></div>
      <div class="firma-area"><div class="firma-linea"></div><div class="firma-nom">Gabriel Parada</div><div class="firma-cargo">Director General · Elefantes Verdes</div></div>
    </div>
  </div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${data.locatario.nombre.replace(/\s+/g,'-')}-${periodoCorto}.html"`);
    res.send(html);

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
