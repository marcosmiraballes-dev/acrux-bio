// frontend/src/components/layout/MobileLayout.tsx

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

const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menú según el rol del usuario (mismo que MainLayout)
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

  // Bottom Navigation Items (primeras 4 opciones del menú)
  const getBottomNavItems = (): MenuItem[] => {
    if (hasMenuSections) {
      const sections = menuItems as MenuSection[];
      const firstSection = sections[0];
      return firstSection.items.slice(0, 4);
    } else {
      const items = menuItems as MenuItem[];
      return items.slice(0, 4);
    }
  };

  const bottomNavItems = getBottomNavItems();

  return (
    <div className="mobile-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-header-hamburger"
          onClick={() => setMobileMenuOpen(true)}
        >
          ☰
        </button>
        <div className="mobile-header-logo">
          <img src="/logo.png" alt="Logo" className="mobile-header-logo-img" />
          <span className="mobile-header-logo-text">Acrux-Bio</span>
        </div>
        <div className="mobile-header-avatar">
          {user?.nombre?.charAt(0)}
        </div>
      </header>

      {/* Mobile Content */}
      <main className="mobile-main-content">
        <div className="p-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="mobile-bottom-nav-icon">{item.icon}</span>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-user-name">{user?.nombre}</div>
          <span className="mobile-drawer-user-role">{user?.rol}</span>
        </div>
        <div className="mobile-drawer-content">
          {hasMenuSections ? (
            (menuItems as MenuSection[]).map((section, idx) => (
              <div key={idx} className="mobile-drawer-section">
                <div className="mobile-drawer-section-title">{section.title}</div>
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-drawer-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-drawer-item-icon">{item.icon}</span>
                    <span className="mobile-drawer-item-label">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))
          ) : (
            <div className="mobile-drawer-section">
              {(menuItems as MenuItem[]).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-drawer-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mobile-drawer-item-icon">{item.icon}</span>
                  <span className="mobile-drawer-item-label">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button className="mobile-drawer-logout" onClick={handleLogout}>
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default MobileLayout;