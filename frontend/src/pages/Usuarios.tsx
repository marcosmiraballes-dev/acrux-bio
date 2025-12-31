import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuario.service';
import { Usuario } from '../types';
import { useAuth } from '../context/AuthContext';
import UsuarioModal from '../components/common/UsuarioModal';

const Usuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar usuarios
  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuarioService.getAll();
      setUsuarios(data);
      setError('');
    } catch (err: any) {
      setError('Error al cargar los usuarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<Usuario> & { password?: string }) => {
    try {
      if (selectedUsuario) {
        // Editar
        await usuarioService.update(selectedUsuario.id, data);
        setSuccessMessage('Usuario actualizado correctamente');
      } else {
        // Crear
        await usuarioService.create(data as any);
        setSuccessMessage('Usuario creado correctamente');
      }
      await loadUsuarios();
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    // Validar que no sea el usuario actual
    if (usuario.id === currentUser?.id) {
      setError('No puedes desactivar tu propio usuario');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Validar que no sea el último admin
    const adminCount = usuarios.filter((u) => u.rol === 'ADMIN' && u.activo).length;
    if (usuario.rol === 'ADMIN' && adminCount <= 1) {
      setError('No se puede desactivar el último administrador activo');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!window.confirm(`¿Estás seguro de desactivar al usuario "${usuario.nombre}"?`)) {
      return;
    }

    try {
      await usuarioService.delete(usuario.id);
      setSuccessMessage('Usuario desactivado correctamente');
      await loadUsuarios();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al desactivar');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleActivate = async (usuario: Usuario) => {
    if (!window.confirm(`¿Estás seguro de reactivar al usuario "${usuario.nombre}"?`)) {
      return;
    }

    try {
      // Reactivar actualizando el usuario con activo = true
      await usuarioService.update(usuario.id, { activo: true });
      setSuccessMessage('Usuario reactivado correctamente');
      await loadUsuarios();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reactivar');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRol = !filterRol || usuario.rol === filterRol;

    return matchesSearch && matchesRol;
  });

  // Estadísticas por rol
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.activo).length,
    admin: usuarios.filter((u) => u.rol === 'ADMIN' && u.activo).length,
    director: usuarios.filter((u) => u.rol === 'DIRECTOR' && u.activo).length,
    coordinador: usuarios.filter((u) => u.rol === 'COORDINADOR' && u.activo).length,
    capturador: usuarios.filter((u) => u.rol === 'CAPTURADOR' && u.activo).length,
  };

  const getRolBadge = (rol: string) => {
    const badges = {
      ADMIN: 'bg-red-100 text-red-800',
      DIRECTOR: 'bg-purple-100 text-purple-800',
      COORDINADOR: 'bg-blue-100 text-blue-800',
      CAPTURADOR: 'bg-green-100 text-green-800',
    };
    return badges[rol as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getRolIcon = (rol: string) => {
    const icons = {
      ADMIN: '👑',
      DIRECTOR: '📊',
      COORDINADOR: '📋',
      CAPTURADOR: '✍️',
    };
    return icons[rol as keyof typeof icons] || '👤';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Usuarios</h1>
        <p className="text-gray-600">
          Gestiona los usuarios del sistema y sus roles de acceso
        </p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Barra de acciones */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* Filtro por rol */}
          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="input flex-1 lg:flex-none lg:w-48"
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">👑 Administrador</option>
              <option value="DIRECTOR">📊 Director</option>
              <option value="COORDINADOR">📋 Coordinador</option>
              <option value="CAPTURADOR">✍️ Capturador</option>
            </select>

            {/* Botón crear */}
            <button onClick={handleCreate} className="btn btn-primary whitespace-nowrap">
              ➕ Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        {filteredUsuarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg">
              {searchTerm || filterRol
                ? 'No se encontraron usuarios'
                : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nombre}
                            {usuario.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-primary-600">(Tú)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRolBadge(usuario.rol)}`}>
                        {getRolIcon(usuario.rol)} {usuario.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          usuario.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(usuario)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        ✏️ Editar
                      </button>
                      {usuario.activo ? (
                        <button
                          onClick={() => handleDelete(usuario)}
                          className={`font-medium ${
                            usuario.id === currentUser?.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          disabled={usuario.id === currentUser?.id}
                        >
                          🗑️ Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(usuario)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          ✅ Activar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-700">{stats.activos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">👑 Admin</p>
          <p className="text-2xl font-bold text-red-700">{stats.admin}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">📊 Director</p>
          <p className="text-2xl font-bold text-purple-700">{stats.director}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">📋 Coord.</p>
          <p className="text-2xl font-bold text-blue-700">{stats.coordinador}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">✍️ Captur.</p>
          <p className="text-2xl font-bold text-green-700">{stats.capturador}</p>
        </div>
      </div>

      {/* Modal */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        usuario={selectedUsuario}
        currentUserId={currentUser?.id || ''}
        title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      />
    </div>
  );
};

export default Usuarios;