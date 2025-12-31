-- ============================================
-- ACRUX-BIO - VISTAS
-- Ejecutar QUINTO en Supabase SQL Editor
-- ============================================

-- Vista de recolecciones con información completa
CREATE OR REPLACE VIEW vista_recolecciones_completas AS
SELECT 
    r.id,
    r.fecha_recoleccion,
    r.hora_recoleccion,
    r.total_kilos,
    r.co2_evitado,
    r.notas,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    CASE 
        WHEN r.plaza_id IS NOT NULL THEN p.nombre
        ELSE NULL
    END as plaza_nombre,
    CASE 
        WHEN r.local_id IS NOT NULL THEN l.nombre
        ELSE NULL
    END as local_nombre,
    CASE 
        WHEN r.cliente_id IS NOT NULL THEN c.razon_social
        ELSE NULL
    END as cliente_nombre,
    r.created_at
FROM recolecciones r
LEFT JOIN usuarios u ON r.usuario_id = u.id
LEFT JOIN plazas p ON r.plaza_id = p.id
LEFT JOIN locales l ON r.local_id = l.id
LEFT JOIN clientes_independientes c ON r.cliente_id = c.id;

-- Vista de estadísticas por plaza
CREATE OR REPLACE VIEW vista_stats_plazas AS
SELECT 
    p.id,
    p.nombre,
    p.ciudad,
    COUNT(DISTINCT l.id) as total_locales,
    COUNT(DISTINCT r.id) as total_recolecciones,
    COALESCE(SUM(r.total_kilos), 0) as total_kilos,
    COALESCE(SUM(r.co2_evitado), 0) as total_co2_evitado,
    COALESCE(AVG(r.total_kilos), 0) as promedio_kilos_recoleccion
FROM plazas p
LEFT JOIN locales l ON p.id = l.plaza_id
LEFT JOIN recolecciones r ON l.id = r.local_id
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.ciudad;

-- Vista de estadísticas por tipo de residuo
CREATE OR REPLACE VIEW vista_stats_residuos AS
SELECT 
    tr.id,
    tr.nombre,
    tr.factor_co2,
    COUNT(dr.id) as total_recolecciones,
    COALESCE(SUM(dr.kilos), 0) as total_kilos,
    COALESCE(SUM(dr.co2_evitado), 0) as total_co2_evitado
FROM tipos_residuos tr
LEFT JOIN detalle_recolecciones dr ON tr.id = dr.tipo_residuo_id
WHERE tr.activo = true
GROUP BY tr.id, tr.nombre, tr.factor_co2;
