import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { generateGraficasResiduoClienteHTML } from '../utils/generateGraficasResiduoClienteHTML';

// Interfaces
interface StatsByTipo {
  tipo_residuo_id: string;
  tipo_residuo_nombre: string;
  total_kilos: number;
  co2_evitado: number;
  total_recolecciones: number;
}

interface Plaza {
  id: string;
  nombre: string;
}

interface Local {
  id: string;
  nombre: string;
  plaza_id: string;
}

interface TopLocal {
  local_nombre: string;
  plaza_nombre: string;
  total_kilos: number;
}

// Emojis por tipo de residuo
const EMOJI_RESIDUOS: { [key: string]: string } = {
  'Orgánico': '🍃',
  'Inorgánico': '🗑️',
  'Cartón': '📦',
  'Vidrio': '🍷', // ✅ CORREGIDO
  'PET': '🧴',
  'Plástico Duro': '🥤',
  'Playo': '🛍️',
  'Tetra Pak': '🧃',
  'Aluminio': '🥫',
  'Chatarra': '🔩',
  'Archivo': '📄'
};

// Colores por material
const COLORES_MATERIALES: { [key: string]: string } = {
  'Orgánico': 'from-green-50 to-green-100 border-green-300',
  'Inorgánico': 'from-blue-50 to-blue-100 border-blue-200',
  'Cartón': 'from-orange-50 to-orange-100 border-orange-200',
  'Vidrio': 'from-purple-50 to-purple-100 border-purple-200',
  'PET': 'from-pink-50 to-pink-100 border-pink-200',
  'Plástico Duro': 'from-teal-50 to-teal-100 border-teal-200',
  'Playo': 'from-red-50 to-red-100 border-red-200',
  'Tetra Pak': 'from-yellow-50 to-yellow-100 border-yellow-200',
  'Aluminio': 'from-indigo-50 to-indigo-100 border-indigo-200',
  'Chatarra': 'from-cyan-50 to-cyan-100 border-cyan-200',
  'Archivo': 'from-lime-50 to-lime-100 border-lime-200'
};

// Tips de reciclaje por material
const TIPS_RECICLAJE: { [key: string]: any } = {
  'Orgánico': {
    si: ['Restos de frutas y verduras', 'Cáscaras de huevo', 'Posos de café', 'Servilletas de papel usadas'],
    no: ['Carnes y pescados', 'Productos lácteos', 'Aceites y grasas', 'Excremento de mascotas'],
    sabias: 'Los residuos orgánicos representan aproximadamente el 40% de los desechos generados en establecimientos de comida. Al separarlos correctamente, ayudas a crear composta que puede nutrir la tierra.'
  },
  'Cartón': {
    si: ['Cajas de cartón', 'Papel kraft', 'Tubos de cartón', 'Empaques de cereales'],
    no: ['Cartón encerado o plastificado', 'Cartón con restos de comida', 'Vasos de café desechables', 'Cajas de pizza grasosas'],
    sabias: 'Reciclar 1 tonelada de cartón salva 17 árboles y ahorra 4,100 kWh de energía. El cartón puede reciclarse hasta 7 veces manteniendo su calidad.'
  },
  'PET': {
    si: ['Botellas de agua', 'Botellas de refresco', 'Envases de aceite', 'Botellas de jugo'],
    no: ['Botellas con residuos de químicos', 'PET con etiquetas pegadas', 'Botellas con líquidos dentro', 'Tapas de diferente material'],
    sabias: 'Una botella de PET tarda 450 años en degradarse. Reciclarla ahorra hasta 50% de energía comparado con producir PET nuevo desde petróleo.'
  },
  'Vidrio': {
    si: ['Botellas de vidrio', 'Frascos', 'Envases de conservas', 'Botellas de vino'],
    no: ['Espejos', 'Vidrio de ventanas', 'Bombillas', 'Cristal de laboratorio'],
    sabias: 'El vidrio es 100% reciclable y puede reciclarse infinitas veces sin perder calidad. Reciclar vidrio ahorra un 30% de energía.'
  },
  'Aluminio': {
    si: ['Latas de refresco', 'Latas de cerveza', 'Papel aluminio', 'Bandejas de aluminio'],
    no: ['Aluminio con restos de comida', 'Envases aerosol', 'Aluminio mezclado con plástico', 'Papel aluminio muy sucio'],
    sabias: 'Reciclar aluminio ahorra hasta 95% de la energía necesaria para producir aluminio nuevo. Una lata puede reciclarse y volver a las tiendas en solo 60 días.'
  }
};

const GraficasResiduoCliente: React.FC = () => {
  // Estados
  const [statsByTipo, setStatsByTipo] = useState<StatsByTipo[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<StatsByTipo | null>(null);
  const [topLocales, setTopLocales] = useState<TopLocal[]>([]);
  const [datosGraficaMeses, setDatosGraficaMeses] = useState<any[]>([]); // ✅ NUEVO
  
  const [plazas, setPlazas] = useState<Plaza[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [localesFiltrados, setLocalesFiltrados] = useState<Local[]>([]);
  
  const [plazaId, setPlazaId] = useState<string>('');
  const [localId, setLocalId] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlazasYLocales();
  }, []);

  useEffect(() => {
    if (plazaId) {
      const filtrados = locales.filter(l => l.plaza_id === plazaId);
      setLocalesFiltrados(filtrados);
      setLocalId('');
    } else {
      setLocalesFiltrados([]);
      setLocalId('');
    }
  }, [plazaId, locales]);

  useEffect(() => {
    if (plazas.length > 0) {
      loadAllData();
    }
  }, [plazas]);

  // ✅ NUEVO: useEffect para cargar datos de la gráfica cuando cambia el material O los filtros
  useEffect(() => {
    if (materialSeleccionado) {
      loadDatosGraficaMeses();
    }
  }, [materialSeleccionado?.tipo_residuo_id, plazaId, localId, fechaDesde, fechaHasta]);

  const loadPlazasYLocales = async () => {
    try {
      const [plazasRes, localesRes] = await Promise.all([
        api.get('/plazas'),
        api.get('/locales')
      ]);
      
      setPlazas(plazasRes.data.data || []);
      setLocales(localesRes.data.data || []);
    } catch (err) {
      console.error('Error cargando plazas/locales:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (plazaId) filters.plaza_id = plazaId;
      if (localId) filters.local_id = localId;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      const tiposRes = await api.get('/recolecciones/stats/tipo', { params: filters });
      const datos = tiposRes.data.data || [];
      
      setStatsByTipo(datos);
      
      // ✅ ACTUALIZAR material seleccionado con datos frescos
      if (materialSeleccionado) {
        const materialActualizado = datos.find(
          (d: StatsByTipo) => d.tipo_residuo_id === materialSeleccionado.tipo_residuo_id
        );
        if (materialActualizado) {
          setMaterialSeleccionado(materialActualizado);
        }
      } else if (datos.length > 0) {
        // Seleccionar el primer material si no hay ninguno seleccionado
        setMaterialSeleccionado(datos[0]);
      }

    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Cargar datos de tendencia mensual para la gráfica
  const loadDatosGraficaMeses = async () => {
    if (!materialSeleccionado) return;

    try {
      // ✅ USAR SNAKE_CASE como espera el controller
      const filters: any = { tipo_residuo_id: materialSeleccionado.tipo_residuo_id };
      if (plazaId) filters.plaza_id = plazaId;
      if (localId) filters.local_id = localId;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      // Llamar al endpoint de tendencia mensual
      const tendenciaRes = await api.get('/recolecciones/stats/tendencia-mensual', { params: filters });
      const datosMeses = tendenciaRes.data.data || [];

      // Formatear datos para Recharts
      const datosFormateados = datosMeses
        .map((item: any) => ({
          mes: new Date(item.mes + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
          mesOriginal: item.mes,
          kilos: parseFloat(item.total_kilos) || 0
        }))
        .sort((a: any, b: any) => b.mesOriginal.localeCompare(a.mesOriginal))
        .slice(0, 5)
        .reverse(); // ✅ Invertir orden: más antiguo a la izquierda

      setDatosGraficaMeses(datosFormateados);
    } catch (err) {
      console.error('Error cargando tendencia mensual:', err);
      setDatosGraficaMeses([]);
    }
  };

  const handleAplicarFiltros = () => {
    loadAllData();
  };

  const handleLimpiarFiltros = () => {
    setPlazaId('');
    setLocalId('');
    setFechaDesde('');
    setFechaHasta('');
    setTimeout(() => loadAllData(), 100);
  };

  const handleSelectMaterial = (material: StatsByTipo) => {
    setMaterialSeleccionado(material);
  };

  const handleExportarPDF = async () => {
    if (!materialSeleccionado) return;

    try {
      // Filtros comunes
      const filters: any = { tipo_residuo_id: materialSeleccionado.tipo_residuo_id };
      if (plazaId) filters.plaza_id = plazaId;
      if (localId) filters.local_id = localId;
      if (fechaDesde) filters.fecha_desde = fechaDesde;
      if (fechaHasta) filters.fecha_hasta = fechaHasta;

      // 1️⃣ Cargar top 10 locales
      const topRes = await api.get('/recolecciones/stats/top-locales', { params: filters });
      const topData = topRes.data.data || [];

      // 2️⃣ Cargar datos de tendencia mensual (gráfica)
      const tendenciaRes = await api.get('/recolecciones/stats/tendencia-mensual', { params: filters });
      const datosMeses = tendenciaRes.data.data || [];

      // Formatear datos de la gráfica
      const datosGraficaFormateados = datosMeses
        .map((item: any) => ({
          mes: new Date(item.mes + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
          mesOriginal: item.mes,
          kilos: parseFloat(item.total_kilos) || 0
        }))
        .sort((a: any, b: any) => b.mesOriginal.localeCompare(a.mesOriginal))
        .slice(0, 5)
        .reverse(); // Más antiguo a la izquierda

      const plazaSeleccionada = plazas.find(p => p.id === plazaId);

      // 3️⃣ Generar PDF con TODOS los datos
      generateGraficasResiduoClienteHTML({
        materialSeleccionado: {
          nombre: materialSeleccionado.tipo_residuo_nombre,
          total_kilos: materialSeleccionado.total_kilos,
          co2_evitado: materialSeleccionado.co2_evitado,
          recolecciones: materialSeleccionado.total_recolecciones || 0
        },
        topLocales: topData.map((item: any) => ({
          local_nombre: item.local_nombre,
          plaza_nombre: item.plaza_nombre,
          total_kilos: item.total_kilos
        })),
        datosGrafica: datosGraficaFormateados, // ✅ Datos frescos de la gráfica
        plazaSeleccionada: plazaSeleccionada?.nombre
      });
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
  };

  // ✅ NUEVO: Custom Tooltip formateado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const kilos = payload[0].value;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px 15px',
          border: '2px solid #10B981',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#047857', fontSize: '16px' }}>
            {kilos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </p>
        </div>
      );
    }
    return null;
  };

  // Obtener nombre de plaza/local seleccionado
  const plazaSeleccionada = plazas.find(p => p.id === plazaId);
  const localSeleccionado = locales.find(l => l.id === localId);
  
  const nombreMostrar = localSeleccionado 
    ? `${plazaSeleccionada?.nombre} - ${localSeleccionado.nombre}`
    : plazaSeleccionada?.nombre || 'Todas las plazas';

  // Obtener datos del material seleccionado
  const colorMaterial = COLORES_MATERIALES[materialSeleccionado?.tipo_residuo_nombre || ''] || 'from-gray-50 to-gray-100 border-gray-200';
  const emojiMaterial = EMOJI_RESIDUOS[materialSeleccionado?.tipo_residuo_nombre || ''] || '♻️';
  const tipsMaterial = TIPS_RECICLAJE[materialSeleccionado?.tipo_residuo_nombre || ''] || TIPS_RECICLAJE['Orgánico'];

  if (loading && plazas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      
      {/* LOGO ELEFANTES VERDES */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <img 
            src="/logo.png" 
            alt="Elefantes Verdes" 
            className="h-20 object-contain"
          />
        </div>
      </div>

      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-primary-800 mb-3">♻️ TU CONTRIBUCIÓN POR MATERIAL</h1>
        <p className="text-2xl text-primary-700">Conoce el detalle de cada residuo que reciclas</p>
        <p className="text-xl text-gray-700 mt-2 font-semibold">{nombreMostrar}</p>
      </div>

      {/* FILTROS */}
      <div className="card mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold text-gray-800">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Plaza</label>
            <select value={plazaId} onChange={(e) => setPlazaId(e.target.value)} className="input">
              <option value="">Todas las plazas</option>
              {plazas.map(plaza => (
                <option key={plaza.id} value={plaza.id}>{plaza.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Fecha Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Fecha Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex space-x-4">
          <button onClick={handleAplicarFiltros} className="btn btn-primary">
            Aplicar Filtros
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary">
            Limpiar
          </button>
          {materialSeleccionado && (
            <button 
              onClick={handleExportarPDF}
              disabled={loading}
              className="btn bg-red-600 hover:bg-red-700 text-white"
            >
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500 text-white rounded-2xl p-4 mb-6 text-center">
          ⚠️ {error}
        </div>
      )}

      {/* GRID DE 11 MATERIALES (CLICKEABLE) */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">📦 Selecciona un Material</h2>
        <p className="text-center text-gray-600 mb-6">Haz clic en cualquier material para ver su detalle</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {statsByTipo.slice(0, 11).map((material, index) => {
            const isSelected = material.tipo_residuo_nombre === materialSeleccionado?.tipo_residuo_nombre;
            const colorClass = COLORES_MATERIALES[material.tipo_residuo_nombre] || 'from-gray-50 to-gray-100 border-gray-200';
            
            return (
              <div 
                key={index}
                onClick={() => handleSelectMaterial(material)}
                className={`
                  bg-gradient-to-br ${colorClass} rounded-xl p-4 border-2 
                  cursor-pointer transition-all duration-300 transform
                  hover:scale-105 hover:shadow-xl
                  ${isSelected ? 'border-emerald-600 shadow-2xl scale-105 ring-4 ring-emerald-300' : ''}
                `}
              >
                <div className="text-5xl mb-2 text-center">
                  {EMOJI_RESIDUOS[material.tipo_residuo_nombre] || '♻️'}
                </div>
                <p className="text-sm font-bold text-gray-800 text-center truncate">
                  {material.tipo_residuo_nombre}
                </p>
                <p className="text-2xl font-bold text-center" style={{ 
                  color: isSelected ? '#047857' : 'inherit' 
                }}>
                  {material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-center text-gray-600">kg</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETALLE DEL MATERIAL SELECCIONADO */}
      {materialSeleccionado && (
        <div className={`bg-gradient-to-br ${colorMaterial} rounded-2xl shadow-2xl p-8 mb-8 border-4 border-emerald-400`}>
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl mr-4">{emojiMaterial}</div>
            <h2 className="text-4xl font-bold text-gray-800">{materialSeleccionado.tipo_residuo_nombre.toUpperCase()}</h2>
          </div>

          {/* 3 KPIs + GRÁFICA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* KPIs */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Kilos</p>
                    <p className="text-4xl font-bold text-emerald-700">
                      {materialSeleccionado.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div className="text-5xl">⚖️</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">CO₂ Evitado</p>
                    <p className="text-4xl font-bold text-blue-700">
                      {materialSeleccionado.co2_evitado.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                    </p>
                  </div>
                  <div className="text-5xl">🌍</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recolecciones</p>
                    <p className="text-4xl font-bold text-purple-700">
                      {materialSeleccionado.total_recolecciones || 0}
                    </p>
                  </div>
                  <div className="text-5xl">📋</div>
                </div>
              </div>
            </div>

            {/* ✅ GRÁFICA CORREGIDA - Ahora usa datos REALES */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 Top 5 Meses</h3>
              {datosGraficaMeses.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datosGraficaMeses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="kilos" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-gray-400">
                  <p>No hay datos disponibles para este material</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* RANKING DE MATERIALES */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🏆 RANKING DE TUS MATERIALES</h2>
        
        <div className="space-y-3">
          {statsByTipo.slice(0, 11).map((material, index) => {
            const maxKilos = statsByTipo[0]?.total_kilos || 1;
            const porcentaje = (material.total_kilos / maxKilos) * 100;
            
            return (
              <div 
                key={index}
                className={`
                  flex items-center rounded-lg p-4 border-2 transition-all
                  ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' : ''}
                  ${index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400' : ''}
                  ${index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400' : ''}
                  ${index > 2 ? 'bg-gray-50 border-gray-200' : ''}
                `}
              >
                {index < 3 && (
                  <div className="text-4xl mr-4">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                  </div>
                )}
                {index >= 3 && (
                  <div className="text-gray-500 mr-4 font-bold">{index + 1}.</div>
                )}
                <div className="text-3xl mr-4">{EMOJI_RESIDUOS[material.tipo_residuo_nombre] || '♻️'}</div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{material.tipo_residuo_nombre}</p>
                  {index < 3 && (
                    <div 
                      className={`h-3 rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  )}
                </div>
                <p className="text-2xl font-bold ml-4" style={{ color: '#047857' }}>
                  {material.total_kilos.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TIPS DE RECICLAJE */}
      {materialSeleccionado && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 border-2 border-blue-300">
          <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
            💡 TIPS DE RECICLAJE - {materialSeleccionado.tipo_residuo_nombre.toUpperCase()}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="text-4xl mr-4">✅</div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-green-700">SÍ se puede reciclar</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {tipsMaterial.si.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-start">
                <div className="text-4xl mr-4">❌</div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-red-700">NO se puede reciclar</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {tipsMaterial.no.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md md:col-span-2">
              <div className="flex items-start">
                <div className="text-4xl mr-4">🌟</div>
                <div>
                  <h3 className="font-bold text-lg mb-2 text-blue-700">¿Sabías que...?</h3>
                  <p className="text-sm text-gray-700">{tipsMaterial.sabias}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default GraficasResiduoCliente;