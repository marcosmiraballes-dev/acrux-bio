-- ============================================
-- ACRUX-BIO - TRIGGERS
-- Ejecutar CUARTO en Supabase SQL Editor
-- ============================================

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plazas_updated_at 
    BEFORE UPDATE ON plazas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locales_updated_at 
    BEFORE UPDATE ON locales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes_independientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipos_residuos_updated_at 
    BEFORE UPDATE ON tipos_residuos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recolecciones_updated_at 
    BEFORE UPDATE ON recolecciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para recalcular totales
CREATE TRIGGER trigger_calcular_totales_insert
    AFTER INSERT ON detalle_recolecciones
    FOR EACH ROW EXECUTE FUNCTION calcular_totales_recoleccion();

CREATE TRIGGER trigger_calcular_totales_update
    AFTER UPDATE ON detalle_recolecciones
    FOR EACH ROW EXECUTE FUNCTION calcular_totales_recoleccion();

CREATE TRIGGER trigger_calcular_totales_delete
    AFTER DELETE ON detalle_recolecciones
    FOR EACH ROW EXECUTE FUNCTION calcular_totales_recoleccion();
