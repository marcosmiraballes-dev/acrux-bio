import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ProximamenteProps {
  titulo: string;
  descripcion?: string;
}

const Proximamente: React.FC<ProximamenteProps> = ({ titulo, descripcion }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-8xl">🚧</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">{titulo}</h1>
        <p className="text-gray-600 mb-6">
          {descripcion || 'Esta sección está en desarrollo y estará disponible próximamente.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary w-full"
          >
            ← Volver atrás
          </button>
          <button
            onClick={() => navigate('/dashboard-director')}
            className="btn btn-secondary w-full"
          >
            🏠 Ir al Dashboard
          </button>
        </div>
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Próximamente:</strong> Esta funcionalidad será implementada en las siguientes fases del proyecto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Proximamente;