import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminSections = [
    {
      id: 'usuarios',
      title: 'Usuarios',
      icon: '👥',
      description: 'Crear, editar y eliminar usuarios del sistema',
      color: 'blue',
      route: '/usuarios'
    },
    {
      id: 'plazas',
      title: 'Plazas',
      icon: '🏢',
      description: 'Gestionar plazas comerciales',
      color: 'green',
      route: '/plazas'
    },
    {
      id: 'locales',
      title: 'Locatarios',
      icon: '🏪',
      description: 'Gestionar locales comerciales',
      color: 'purple',
      route: '/locales'
    },
    {
      id: 'tipos-residuo',
      title: 'Tipos de Residuo',
      icon: '♻️',
      description: 'Gestionar tipos de residuos',
      color: 'orange',
      route: '/tipos-residuo'
    },
    {
      id: 'recolecciones',
      title: 'Búsqueda de Recolecciones',
      icon: '🔍',
      description: 'Buscar y editar recolecciones antiguas',
      color: 'gray',
      route: '/recolecciones'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string, border: string, icon: string, hover: string } } = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100',
        hover: 'hover:border-blue-400'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100',
        hover: 'hover:border-green-400'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-100',
        hover: 'hover:border-purple-400'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'bg-orange-100',
        hover: 'hover:border-orange-400'
      },
      gray: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'bg-gray-100',
        hover: 'hover:border-gray-400'
      }
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Panel de Administración
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.nombre} - Gestión del Sistema
        </p>
      </div>

      {/* Info Card */}
      <div className="card mb-8 bg-primary-50 border-primary-200">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="text-sm font-semibold text-primary-800 mb-1">Panel de Administrador</h3>
            <p className="text-sm text-primary-700">
              Desde aquí puedes gestionar todos los elementos del sistema. 
              Puedes crear, editar y eliminar usuarios, plazas, locatarios y tipos de residuos.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const colors = getColorClasses(section.color);
          
          return (
            <div
              key={section.id}
              onClick={() => navigate(section.route)}
              className={`card ${colors.bg} ${colors.border} ${colors.hover} cursor-pointer transition-all duration-200 hover:shadow-lg`}
            >
              <div className="flex items-start space-x-4">
                <div className={`h-14 w-14 rounded-lg ${colors.icon} flex items-center justify-center text-3xl flex-shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.description}
                  </p>
                  <div className="mt-3">
                    <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
                      Ir a {section.title} →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🚀 Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/usuarios?action=create')}
            className="btn btn-primary text-sm"
          >
            + Nuevo Usuario
          </button>
          <button
            onClick={() => navigate('/plazas?action=create')}
            className="btn btn-primary text-sm"
          >
            + Nueva Plaza
          </button>
          <button
            onClick={() => navigate('/locales?action=create')}
            className="btn btn-primary text-sm"
          >
            + Nuevo Locatario
          </button>
          <button
            onClick={() => navigate('/tipos-residuo?action=create')}
            className="btn btn-primary text-sm"
          >
            + Nuevo Tipo Residuo
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="card mt-8 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          📊 Información del Sistema
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">👥</p>
            <p className="text-xs text-gray-600 mt-1">Usuarios</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">🏢</p>
            <p className="text-xs text-gray-600 mt-1">Plazas</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-600">🏪</p>
            <p className="text-xs text-gray-600 mt-1">Locatarios</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-2xl font-bold text-orange-600">♻️</p>
            <p className="text-xs text-gray-600 mt-1">Tipos Residuo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;