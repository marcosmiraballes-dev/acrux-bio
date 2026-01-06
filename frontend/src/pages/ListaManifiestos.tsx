/// frontend/src/pages/ListaManifiestos.tsx

import React, { useState, useEffect } from 'react';
import { manifiestoService } from '../services/manifiesto.service';
import { plazaService } from '../services/plaza.service';
import { localService } from '../services/local.service';
import NuevoManifiestoModal from '../components/manifiestos/NuevoManifiestoModal';
import { generateManifiestoHTML } from '../utils/generateManifiestoHTML';

interface Manifiesto {
  id: string;
  folio: string;
  fecha_emision: string;
  local: {
    id: string;
    nombre: string;
  };
  recolector: {
    id: string;
    nombre: string;
  };
  pdf_generado: boolean;
  pdf_path: string | null;
  created_at: string;
}

const ListaManifiestos: React.FC = () => {
  const [manifiestos, setManifiestos] = useState<Manifiesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [plazaId, setPlazaId] = useState('');
  const [localId, setLocalId] = useState('');
  const [plazas, setPlazas] = useState<any[]>([]);
  const [locales, setLocales] = useState<any[]>([]);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    esteMes: 0,
    esteAnio: 0,
  });

  useEffect(() => {
    loadPlazas();
    loadStats();
  }, []);

  useEffect(() => {
    if (plazaId) {
      loadLocalesByPlaza(plazaId);
    } else {
      setLocales([]);
      setLocalId('');
    }
  }, [plazaId]);

  useEffect(() => {
    loadManifiestos();
  }, [page, plazaId, localId]);

  const loadPlazas = async () => {
    try {
      const data = await plazaService.getAll();
      setPlazas(data);
    } catch (error) {
      console.error('Error al cargar plazas:', error);
    }
  };

  const loadLocalesByPlaza = async (plazaIdParam: string) => {
    try {
      const data = await localService.getAll();
      const filtered = data.filter((l: any) => l.plaza_id === plazaIdParam);
      setLocales(filtered);
    } catch (error) {
      console.error('Error al cargar locales:', error);
    }
  };

  const loadStats = async () => {
    try {
      const total = await manifiestoService.count();
      
      // Obtener todos los manifiestos para calcular estadísticas
      const todosManifiestos = await manifiestoService.getAll(1, 1000);
      
      const now = new Date();
      const mesActual = now.getMonth();
      const anioActual = now.getFullYear();
      
      const esteMes = todosManifiestos.filter((m: any) => {
        const fecha = new Date(m.fecha_emision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
      }).length;
      
      const esteAnio = todosManifiestos.filter((m: any) => {
        const fecha = new Date(m.fecha_emision);
        return fecha.getFullYear() === anioActual;
      }).length;

      setStats({ total, esteMes, esteAnio });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadManifiestos = async () => {
    setLoading(true);
    try {
      const data = await manifiestoService.getAll(page, 50, plazaId, localId);
      setManifiestos(data);
      
      const count = await manifiestoService.count();
      setTotalCount(count);
    } catch (error) {
      console.error('Error al cargar manifiestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setPlazaId('');
    setLocalId('');
    setPage(1);
  };

  const handleManifiestoCreado = () => {
    setShowModal(false);
    loadManifiestos();
    loadStats();
  };

  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este manifiesto?')) {
      return;
    }

    try {
      await manifiestoService.delete(id);
      loadManifiestos();
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Error al eliminar manifiesto');
    }
  };

  const handleDescargarPDF = async (manifiestoId: string) => {
    try {
      // Obtener el manifiesto completo con todos los snapshots Y residuos
      const manifiesto = await manifiestoService.getById(manifiestoId);
      
      console.log('✅ Manifiesto completo desde backend:', manifiesto);
      console.log('🧪 RESIDUOS:', manifiesto.residuos);
      
      // El backend YA trae los residuos en manifiesto.residuos
      const residuos = manifiesto.residuos || [];
      const totalKilos = manifiesto.recoleccion?.total_kilos || 0;
      
      // Preparar datos para el PDF con TODOS los snapshots
      const pdfData = {
        folio: manifiesto.folio,
        fecha_emision: manifiesto.fecha_emision,
        
        // Generador (snapshots del local)
        generador_nombre_comercial: manifiesto.generador_nombre_comercial || '',
        generador_razon_social: manifiesto.generador_razon_social || '',
        generador_rfc: manifiesto.generador_rfc || '',
        generador_domicilio_completo: manifiesto.generador_domicilio_completo || '',
        generador_municipio: 'Playa del Carmen',
        generador_telefono: manifiesto.generador_telefono || '',
        generador_email: manifiesto.generador_email || '',
        generador_actividad_principal: manifiesto.local?.giro || '',
        
        // Transportista (snapshots de Elefante Verde)
        recolector_empresa: manifiesto.recolector_empresa,
        recolector_rfc: manifiesto.recolector_rfc || 'PENDIENTE',
        recolector_domicilio: manifiesto.recolector_domicilio,
        recolector_telefono: manifiesto.recolector_telefono,
        recolector_email: manifiesto.recolector_email,
        recolector_registro_sema: manifiesto.recolector_registro_sema,
        recolector_nombre_chofer: manifiesto.recolector_nombre_chofer,
        
        // ⭐ VEHÍCULO (snapshots)
        vehiculo_tipo: manifiesto.vehiculo_tipo || 'N/A',
        vehiculo_placas: manifiesto.vehiculo_placas || 'N/A',
        
        // ⭐ DESTINO FINAL (snapshots)
        destino_nombre: manifiesto.destino_nombre || 'N/A',
        destino_domicilio: manifiesto.destino_domicilio || 'N/A',
        destino_autorizacion: manifiesto.destino_final_oficio || 'N/A',
        
        // Residuos
        residuos: residuos,
        total_kilos: totalKilos,
        
        // Destino (oficio)
        destino_final_oficio: manifiesto.destino_final_oficio,
      };
      
      console.log('📄 Datos enviados al PDF:', pdfData);
      console.log('🚗 Vehículo:', pdfData.vehiculo_tipo, pdfData.vehiculo_placas);
      console.log('🏭 Destino:', pdfData.destino_nombre);
      
      generateManifiestoHTML(pdfData);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al generar PDF del manifiesto');
    }
  };

  const formatearFecha = (fecha: string) => {
    // FIX: Extraer solo la fecha sin conversión de zona horaria
    const [year, month, day] = fecha.split('T')[0].split('-');
    return `${parseInt(day)} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📄 Manifiestos de Residuos
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de manifiestos para cumplimiento legal SEMA
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>➕</span>
            Generar Manifiesto
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Manifiestos</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Este Mes</div>
            <div className="text-2xl font-bold text-gray-800">{stats.esteMes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Este Año</div>
            <div className="text-2xl font-bold text-gray-800">{stats.esteAnio}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          🔍 Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plaza */}
          <div>
            <label className="label">Plaza</label>
            <select
              value={plazaId}
              onChange={(e) => setPlazaId(e.target.value)}
              className="input"
            >
              <option value="">Todas las plazas</option>
              {plazas.map((plaza) => (
                <option key={plaza.id} value={plaza.id}>
                  {plaza.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Local */}
          <div>
            <label className="label">Local</label>
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="input"
              disabled={!plazaId}
            >
              <option value="">Todos los locales</option>
              {locales.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar */}
          <div className="flex items-end">
            <button
              onClick={handleLimpiarFiltros}
              className="btn btn-secondary w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Emisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Local
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recolector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  PDF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : manifiestos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <div className="font-medium">No hay manifiestos registrados</div>
                    <div className="text-sm mt-1">
                      Haz clic en "Generar Manifiesto" para crear el primero
                    </div>
                  </td>
                </tr>
              ) : (
                manifiestos.map((manifiesto) => (
                  <tr key={manifiesto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {manifiesto.folio}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(manifiesto.fecha_emision)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {manifiesto.local?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {manifiesto.recolector?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {manifiesto.pdf_generado ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          ✓ Generado
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDescargarPDF(manifiesto.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalles / Descargar PDF"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleDescargarPDF(manifiesto.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Descargar PDF"
                        >
                          📥
                        </button>
                        <button
                          onClick={() => handleEliminar(manifiesto.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalCount > 50 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-600">
              Mostrando {((page - 1) * 50) + 1} - {Math.min(page * 50, totalCount)} de {totalCount}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 50 >= totalCount}
                className="btn btn-secondary btn-sm"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NuevoManifiestoModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleManifiestoCreado}
        />
      )}
    </div>
  );
};

export default ListaManifiestos;