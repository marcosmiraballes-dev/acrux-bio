import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import MainLayout from './components/layout/MainLayout';
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
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recolecciones"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'COORDINADOR', 'CAPTURADOR']}>
                <MainLayout>
                  <Recolecciones />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <Usuarios />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tipos-residuos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <TiposResiduos />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/plazas"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <Plazas />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/locales"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout>
                  <Locales />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas - DIRECTOR */}
          <Route
            path="/dashboard-director"
            element={
              <ProtectedRoute allowedRoles={['DIRECTOR']}>
                <MainLayout>
                  <DashboardDirector />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* RUTAS Dashboard Empresa (Director) */}
          <Route path="/graficas-residuo" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <GraficasPorResiduos />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/graficas-lugar" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <GraficaPorLugar />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* RUTAS Dashboard Cliente (Director) */}
          <Route path="/residuos-totales" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <ResiduosTotales />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/graficas-residuo-cliente" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <GraficasResiduoCliente />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* RUTAS Reportes (Director) */}
          <Route path="/reporte-plaza" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <Proximamente 
                  titulo="Reporte por Plaza" 
                  descripcion="Reporte ejecutivo consolidado por plaza en PDF y Excel." 
                />
              </MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/impacto-ambiental" element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <MainLayout>
                <Proximamente 
                  titulo="Impacto Ambiental" 
                  descripcion="Reportes de impacto ambiental para clientes e inversionistas." 
                />
              </MainLayout>
            </ProtectedRoute>
          } />

          {/* Rutas protegidas - COORDINADOR */}
          <Route path="/dashboard-coordinador" element={
            <ProtectedRoute allowedRoles={['COORDINADOR']}>
              <MainLayout><DashboardCoordinador /></MainLayout>
            </ProtectedRoute>
          } />

          {/* NUEVA RUTA - INFRACCIONES (Coordinador + Director + Admin) */}
          <Route path="/infracciones" element={
            <ProtectedRoute allowedRoles={['COORDINADOR', 'DIRECTOR', 'ADMIN']}>
              <MainLayout><ListaInfracciones /></MainLayout>
            </ProtectedRoute>
          } />

          {/* NUEVA RUTA - PLAZAS INFRACCIONES (Solo Admin) */}
          <Route path="/plazas-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout><PlazasInfracciones /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/reglamentos-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout><ReglamentosInfracciones /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/tipos-aviso-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout><TiposAvisoInfracciones /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/faltas-predefinidas" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout><FaltasPredefinidas /></MainLayout>
            </ProtectedRoute>
          } />

          {/* RUTA - LOCATARIOS INFRACCIONES (Solo Admin) */}
          <Route path="/locatarios-infracciones" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MainLayout><LocatariosInfracciones /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Rutas protegidas - CAPTURADOR */}
          <Route path="/panel-capturador" element={
            <ProtectedRoute allowedRoles={['CAPTURADOR']}>
              <MainLayout><PanelCapturador /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Reportes - Director y Coordinador */}
          <Route path="/reportes" element={
            <ProtectedRoute allowedRoles={['DIRECTOR', 'COORDINADOR']}>
              <MainLayout><ReportesDirector /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Reportes - Capturador (solo bitácoras) */}
          <Route path="/reportes-capturador" element={
            <ProtectedRoute allowedRoles={['CAPTURADOR']}>
              <MainLayout><ReportesCapturador /></MainLayout>
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