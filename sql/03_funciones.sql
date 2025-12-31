-- ============================================
-- ACRUX-BIO - FUNCIONES
-- Ejecutar TERCERO en Supabase SQL Editor
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular totales de recolección
CREATE OR REPLACE FUNCTION calcular_totales_recoleccion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recolecciones
    SET 
        total_kilos = (
            SELECT COALESCE(SUM(kilos), 0)
            FROM detalle_recolecciones
            WHERE recoleccion_id = NEW.recoleccion_id
        ),
        co2_evitado = (
            SELECT COALESCE(SUM(co2_evitado), 0)
            FROM detalle_recolecciones
            WHERE recoleccion_id = NEW.recoleccion_id
        )
    WHERE id = NEW.recoleccion_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
