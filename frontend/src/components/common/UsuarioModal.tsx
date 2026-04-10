import React, { useState, useEffect } from 'react';
import { Usuario } from '../../types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Usuario> & { password?: string }) => Promise<void>;
  usuario?: Usuario | null;
  title: string;
  currentUserId: string; // Para evitar que se edite el propio rol
}

const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  usuario,
  title,
  currentUserId,
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'CAPTURADOR' as 'ADMIN' | 'DIRECTOR' | 'COORDINADOR' | 'CAPTURADOR' | 'FINANCIERO',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(true);

  const isEditingOwnUser = usuario?.id === currentUserId;

  // Cargar datos si es edición
  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        confirmPassword: '',
        rol: usuario.rol,
      });
      setShowPasswordFields(false); // Ocultar password al editar
    } else {
      // Reset form
      setFormData({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'CAPTURADOR',
      });
      setShowPasswordFields(true);
    }
    setErrors({});
  }, [usuario, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    // Validar password solo si es nuevo usuario o si se está cambiando
    if (!usuario || showPasswordFields) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Validar que no se cambie el propio rol
    if (isEditingOwnUser && formData.rol !== usuario.rol) {
      newErrors.rol = 'No puedes cambiar tu propio rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const dataToSend: Partial<Usuario> & { password?: string } = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        rol: formData.rol,
      };

      // Solo incluir password si es nuevo usuario o si se está cambiando
      if (!usuario || (showPasswordFields && formData.password)) {
        dataToSend.password = formData.password;
      }

      await onSave(dataToSend);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const rolesInfo = {
    ADMIN: {
      label: 'Administrador',
      description: 'Acceso total al sistema',
      icon: '👑',
      color: 'text-red-700 bg-red-50 border-red-200',
    },
    DIRECTOR: {
      label: 'Director',
      description: 'Solo visualización de dashboards y reportes',
      icon: '📊',
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    COORDINADOR: {
      label: 'Coordinador',
      description: 'Captura y edición de recolecciones + reportes',
      icon: '📋',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    CAPTURADOR: {
      label: 'Capturador',
      description: 'Solo captura de recolecciones',
      icon: '✍️',
      color: 'text-green-700 bg-green-50 border-green-200',
    },
    FINANCIERO: {
      label: 'Financiero',
      description: 'Gestión del módulo de facturación',
      icon: '💼',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="label">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`input ${errors.nombre ? 'border-red-500' : ''}`}
              placeholder="Ej: Juan Pérez García"
              disabled={loading}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="label">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="usuario@ejemplo.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="label">
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {Object.entries(rolesInfo).map(([key, info]) => (
                <label
                  key={key}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.rol === key
                      ? info.color
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    isEditingOwnUser && key !== usuario?.rol
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={key}
                    checked={formData.rol === key}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                    disabled={loading || (isEditingOwnUser && key !== usuario?.rol)}
                    className="mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{info.icon}</span>
                      <span className="font-medium">{info.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.rol && (
              <p className="text-red-500 text-sm mt-1">{errors.rol}</p>
            )}
            {isEditingOwnUser && (
              <p className="text-amber-600 text-sm mt-2">
                ⚠️ No puedes cambiar tu propio rol
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="border-t border-gray-200 pt-4">
            {usuario && !showPasswordFields ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPasswordFields(true)}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  🔑 Cambiar contraseña
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {usuario ? 'Nueva Contraseña' : 'Contraseña'} <span className="text-red-500">*</span>
                </h3>

                {/* Password */}
                <div className="mb-4">
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`input ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirmar Password */}
                <div>
                  <label className="label">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Repite la contraseña"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {usuario && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(false);
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 mt-2"
                  >
                    Cancelar cambio de contraseña
                  </button>
                )}
              </>
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;