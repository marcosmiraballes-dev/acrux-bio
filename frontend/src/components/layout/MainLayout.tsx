// frontend/src/components/layout/MainLayout.tsx

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menú según el rol del usuario
  const getMenuItems = (): MenuItem[] | MenuSection[] => {
    if (!user) return [];

    switch (user.rol) {
      case 'ADMIN':
        return [
          {
            title: 'PANEL ADMIN',
            items: [
              { path: '/dashboard', label: 'Dashboard', icon: '📊' },
              { path: '/usuarios', label: 'Usuarios', icon: '👥' },
              { path: '/plazas', label: 'Plazas', icon: '🏢' },
              { path: '/locales', label: 'Locales', icon: '🏪' },
              { path: '/tipos-residuos', label: 'Tipos de Residuos', icon: '♻️' },
              { path: '/recolecciones', label: 'Recolecciones', icon: '📋' }
            ]
          },
          {
            title: 'GESTIÓN',
            items: [
              { path: '/infracciones', label: 'Infracciones', icon: '⚠️' },
              { path: '/manifiestos', label: 'Manifiestos', icon: '📄' }
            ]
          },
          {
            title: 'CATÁLOGOS INFRACCIONES',
            items: [
              { path: '/plazas-infracciones', label: 'Plazas', icon: '🏢' },
              { path: '/locatarios-infracciones', label: 'Locatarios', icon: '👥' },
              { path: '/reglamentos-infracciones', label: 'Reglamentos', icon: '📋' },
              { path: '/tipos-aviso-infracciones', label: 'Tipos de Aviso', icon: '⚠️' },
              { path: '/faltas-predefinidas', label: 'Faltas Predefinidas', icon: '❌' }
            ]
          },
          {
            title: 'CATÁLOGOS MANIFIESTOS',
            items: [
              { path: '/vehiculos', label: 'Vehículos', icon: '🚗' },
              { path: '/destinos-finales', label: 'Destinos Finales', icon: '🏭' },
              { path: '/folios-reservados', label: 'Folios Reservados', icon: '📑' }
            ]
          },
          {
            title: 'SISTEMA',
            items: [
              { path: '/logs-auditoria', label: 'Logs de Auditoría', icon: '📋' }
            ]
          }
        ];

      case 'DIRECTOR':
        return [
          {
            title: 'DASHBOARD EMPRESA',
            items: [
              { path: '/dashboard-director', label: 'Inicio', icon: '🏠' },
              { path: '/graficas-residuo', label: 'Gráficas por Residuo', icon: '♻️' },
              { path: '/graficas-lugar', label: 'Gráfica por Lugar', icon: '📍' }
            ]
          },
          {
            title: 'DASHBOARD CLIENTE',
            items: [
              { path: '/residuos-totales', label: 'Residuos Totales', icon: '🌍' },
              { path: '/graficas-residuo-cliente', label: 'Gráficas por Residuo', icon: '📊' }
            ]
          },
          {
            title: 'GESTIÓN',
            items: [
              { path: '/infracciones', label: 'Infracciones', icon: '⚠️' },
              { path: '/manifiestos', label: 'Manifiestos', icon: '📄' }
            ]
          },
          {
            title: 'REPORTES',
            items: [
              { path: '/reportes', label: 'Bitácora de Locatario', icon: '📋' }
            ]
          }
        ];

      case 'COORDINADOR':
        return [
          { path: '/dashboard-coordinador', label: 'Dashboard', icon: '📊' },
          { path: '/recolecciones', label: 'Recolecciones', icon: '📋' },
          { path: '/infracciones', label: 'Infracciones', icon: '⚠️' },
          { path: '/reportes', label: 'Reportes', icon: '📄' }
        ];

      case 'CAPTURADOR':
        return [
          { path: '/panel-capturador', label: 'Recolecciones', icon: '📋' },
          { path: '/reportes-capturador', label: 'Bitácoras', icon: '📊' }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const hasMenuSections = menuItems.length > 0 && 'title' in menuItems[0];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-primary-700 to-primary-900 text-white transition-all duration-300 flex flex-col overflow-y-auto`}>
        {/* Logo */}
        <div className="p-4 border-b border-primary-600">
          <div className="flex items-center space-x-3">
            {/* Logo Elefantes Verdes desde /public */}
            <div className="flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="Elefantes Verdes" 
                className="w-12 h-12 object-contain rounded-lg bg-white p-1"
              />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-base leading-tight truncate">Elefantes Verdes</h1>
                <p className="text-xs text-primary-200 leading-tight">Acrux-Bio - Sistema de trazabilidad</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {hasMenuSections ? (
            // Menú con secciones (DIRECTOR y ADMIN)
            (menuItems as MenuSection[]).map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-2 px-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary-600 text-white'
                          : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                      }`}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <span className="text-xl">{item.icon}</span>
                      {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Menú simple (COORDINADOR, CAPTURADOR)
            <div className="space-y-1">
              {(menuItems as MenuItem[]).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-100 hover:bg-primary-600 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-primary-600">
          {sidebarOpen ? (
            <div className="mb-3">
              <p className="text-sm font-medium truncate">{user?.nombre}</p>
              <p className="text-xs text-primary-300">{user?.rol}</p>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{user?.nombre?.charAt(0)}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <span>🚪</span>
            {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border-t border-primary-600 hover:bg-primary-600 transition-colors"
        >
          <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;