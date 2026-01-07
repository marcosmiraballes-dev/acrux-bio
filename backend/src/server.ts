import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import plazaRoutes from './routes/plaza.routes';
import localRoutes from './routes/local.routes';
import recoleccionRoutes from './routes/recoleccion.routes';
import tipoResiduoRoutes from './routes/tipo-residuo.routes';
import authRoutes from './routes/auth.routes';
import usuarioRoutes from './routes/usuario.routes';
import reportesRoutes from './routes/reportes.routes'; 
import bitacorasRoutes from './routes/bitacoras.routes';
import coordinadorRoutes from './routes/coordinador.routes';
import capturadorRoutes from './routes/capturador.routes';
import comparacionRoutes from './routes/comparacion.routes';
import locatariosInfraccionesRoutes from './routes/locatarios-infracciones.routes';
import infraccionesRoutes from './routes/infracciones.routes';
import reglamentosRoutes from './routes/reglamentos.routes';
import tiposAvisoRoutes from './routes/tipos-aviso.routes';
import faltasPredefinidas from './routes/faltas-predefinidas.routes';
import manifiestosRoutes from './routes/manifiestos.routes';
import recolectoresRoutes from './routes/recolectores.routes';
import vehiculosRoutes from './routes/vehiculos.routes';
import destinosFinalesRoutes from './routes/destinos-finales.routes';
import foliosReservadosRoutes from './routes/folios-reservados.routes';
import logsAuditoriaRoutes from './routes/logs-auditoria.routes';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Acrux-Bio API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🌟 Bienvenido a Acrux-Bio API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      plazas: '/api/plazas',
      locales: '/api/locales',
      tipos_residuos: '/api/tipos-residuos',
      recolecciones: '/api/recolecciones',
      usuarios: '/api/usuarios',
      coordinador: '/api/coordinador',
      capturador: '/api/capturador',
      bitacoras: '/api/bitacoras',
      reportes: '/api/reportes',
      infracciones: '/api/infracciones',
      locatarios_infracciones: '/api/locatarios-infracciones',
      reglamentos: '/api/reglamentos',
      tipos_aviso: '/api/tipos-aviso',
      faltas_predefinidas: '/api/faltas-predefinidas',
      manifiestos: '/api/manifiestos',
      recolectores: '/api/recolectores',
      vehiculos: '/api/vehiculos',
      destinos_finales: '/api/destinos-finales',
      folios_reservados: '/api/folios-reservados',
      logs_auditoria: '/api/logs-auditoria',
      logs_auditoria_stats: '/api/logs-auditoria/stats',
      logs_auditoria_limpiar: '/api/logs-auditoria/limpiar'
    }
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/plazas', plazaRoutes);
app.use('/api/locales', localRoutes);
app.use('/api/tipos-residuos', tipoResiduoRoutes);
app.use('/api/recolecciones', recoleccionRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/bitacoras', bitacorasRoutes);
app.use('/api/coordinador', coordinadorRoutes);
app.use('/api/capturador', capturadorRoutes);
app.use('/api/comparacion', comparacionRoutes);
app.use('/api/locatarios-infracciones', locatariosInfraccionesRoutes);
app.use('/api/infracciones', infraccionesRoutes);
app.use('/api/reglamentos', reglamentosRoutes);
app.use('/api/tipos-aviso', tiposAvisoRoutes);
app.use('/api/faltas-predefinidas', faltasPredefinidas);
app.use('/api/manifiestos', manifiestosRoutes); 
app.use('/api/recolectores', recolectoresRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/destinos-finales', destinosFinalesRoutes);
app.use('/api/folios-reservados', foliosReservadosRoutes);
app.use('/api/logs-auditoria', logsAuditoriaRoutes);



// Iniciar servidor
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 ACRUX-BIO API');
  console.log('='.repeat(50));
  console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`🗄️  Base de datos: Supabase`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
});

export default app;