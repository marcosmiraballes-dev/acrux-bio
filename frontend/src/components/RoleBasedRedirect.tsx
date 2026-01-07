import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  // Manejar estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol
  switch (user.rol) {
    case 'ADMIN':
      return <Navigate to="/dashboard" replace />;
    case 'DIRECTOR':
      return <Navigate to="/dashboard-director" replace />;
    case 'COORDINADOR':
      return <Navigate to="/dashboard-coordinador" replace />;
    case 'CAPTURADOR':
      return <Navigate to="/panel-capturador" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default RoleBasedRedirect;