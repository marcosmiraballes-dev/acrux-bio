import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import MainLayout from './components/layout/MainLayout';
import MobileLayout from './components/layout/MobileLayout';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardDirector from './pages/DashboardDirector';
import TiposResiduos from './pages/TiposResiduos';
import Plazas from './pages/Plazas';
import Locales from './pages/Locales';
import Usuarios from './pages/Usuarios';
import Recolecciones from './pages/Recolecciones';
import ReportesDirector from './pages/ReportesDirector';
import DashboardCoordinador from './pages/DashboardCoordinador';
import PanelCapturador from './pages/PanelCapturador';
import ReportesCapturador from './pages/ReportesCapturador';
import GraficasPorResiduos from './pages/GraficasPorResiduos';
import GraficaPorLugar from './pages/GraficaPorLugar';
import ResiduosTotales from './pages/ResiduosTotales';
import GraficasResiduoCliente from './pages/GraficasResiduoCliente';
import ListaInfracciones from './pages/ListaInfracciones';
import PlazasInfracciones from './pages/PlazasInfracciones';
import Proximamente from './components/Proximamente';
import LocatariosInfracciones from './pages/LocatariosInfracciones';
import ReglamentosInfracciones from './pages/ReglamentosInfracciones';
import TiposAvisoInfracciones from './pages/TiposAvisoInfracciones';
import FaltasPredefinidas from './pages/FaltasPredefinidas';
import ListaManifiestos from './pages/ListaManifiestos';
import Vehiculos from './pages/Vehiculos';
import DestinosFinales from './pages/DestinosFinales';
import FoliosReservados from './pages/FoliosReservados';
import LogsAuditoria from './pages/LogsAuditoria';

// Wrapper component que decide qué layout usar
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isMobile } = useDeviceDetection();
  
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas - ADMIN */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <Dashboard />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route 
            path="/logs-auditoria" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <LogsAuditoria />
                </LayoutWrapper>
              </ProtectedRoute>
            } 
          />

          <Route
            path="/recolecciones"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'CAPTURADOR']}>
                <LayoutWrapper>
                  <Recolecciones />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <Usuarios />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tipos-residuos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <TiposResiduos />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/plazas"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <Plazas />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route
            path="/locales"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <LayoutWrapper>
                  <Locales />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          <Route path="/vehiculos" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><Vehiculos /></LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/destinos-finales" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><DestinosFinales /></LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/folios-reservados" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
              <LayoutWrapper><FoliosReservados /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Rutas protegidas - DIRECTOR */}
          <Route
            path="/dashboard-director"
            element={
              <ProtectedRoute allowedRoles={['DIRECTOR']}>
                <LayoutWrapper>
                  <DashboardDirector />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />

          {/* RUTAS Dashboard Empresa (Director) */}
          <Route path="/graficas-residuo" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <GraficasPorResiduos />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/graficas-lugar" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <GraficaPorLugar />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* RUTAS Dashboard Cliente (Director) */}
          <Route path="/residuos-totales" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <ResiduosTotales />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/graficas-residuo-cliente" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <GraficasResiduoCliente />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* RUTAS Reportes (Director) */}
          <Route path="/reporte-plaza" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <Proximamente 
                  titulo="Reporte por Plaza" 
                  descripcion="Reporte ejecutivo consolidado por plaza en PDF y Excel." 
                />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/impacto-ambiental" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <LayoutWrapper>
                <Proximamente 
                  titulo="Impacto Ambiental" 
                  descripcion="Reportes de impacto ambiental para clientes e inversionistas." 
                />
              </LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Rutas protegidas - COORDINADOR */}
          <Route path="/dashboard-coordinador" element={
            <ProtectedRoute allowedRoles={['COORDINADOR']}>
              <LayoutWrapper><DashboardCoordinador /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* NUEVA RUTA - INFRACCIONES (Coordinador + Director + Admin) */}
          <Route path="/infracciones" element={
            <ProtectedRoute allowedRoles={['COORDINADOR', 'DIRECTOR', 'ADMIN']}>
              <LayoutWrapper><ListaInfracciones /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* NUEVA RUTA - MANIFIESTOS (Director + Admin) */}
          <Route path="/manifiestos" element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'ADMIN']}>
              <LayoutWrapper><ListaManifiestos /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* NUEVA RUTA - PLAZAS INFRACCIONES (Solo Admin) */}
          <Route path="/plazas-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><PlazasInfracciones /></LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/reglamentos-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><ReglamentosInfracciones /></LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/tipos-aviso-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><TiposAvisoInfracciones /></LayoutWrapper>
            </ProtectedRoute>
          } />

          <Route path="/faltas-predefinidas" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><FaltasPredefinidas /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* RUTA - LOCATARIOS INFRACCIONES (Solo Admin) */}
          <Route path="/locatarios-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <LayoutWrapper><LocatariosInfracciones /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Rutas protegidas - CAPTURADOR */}
          <Route path="/panel-capturador" element={
            <ProtectedRoute allowedRoles={['CAPTURADOR']}>
              <LayoutWrapper><PanelCapturador /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Reportes - Director y Coordinador */}
          <Route path="/reportes" element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'COORDINADOR']}>
              <LayoutWrapper><ReportesDirector /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Reportes - Capturador (solo bitácoras) */}
          <Route path="/reportes-capturador" element={
            <ProtectedRoute allowedRoles={['CAPTURADOR']}>
              <LayoutWrapper><ReportesCapturador /></LayoutWrapper>
            </ProtectedRoute>
          } />

          {/* Ruta por defecto - Redirect inteligente por rol */}
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* 404 - Redirect inteligente por rol */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;