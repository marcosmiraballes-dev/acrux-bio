// ARCHIVO 1: frontend/src/components/RoleBasedRedirect.tsx
// REVERTIR A ORIGINAL

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

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