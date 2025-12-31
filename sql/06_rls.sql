-- ============================================
-- ACRUX-BIO - ROW LEVEL SECURITY (RLS)
-- Ejecutar SEXTO en Supabase SQL Editor
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plazas ENABLE ROW LEVEL SECURITY;
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_independientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_residuos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recolecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_recolecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" 
    ON usuarios FOR SELECT 
    USING (auth.uid()::text = id::text);

CREATE POLICY "Admins pueden ver todos los usuarios" 
    ON usuarios FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id::text = auth.uid()::text AND rol = 'ADMIN'
        )
    );

-- Políticas para recolecciones (todos pueden ver)
CREATE POLICY "Todos pueden ver recolecciones" 
    ON recolecciones FOR SELECT 
    USING (true);

CREATE POLICY "Capturadores pueden crear recolecciones" 
    ON recolecciones FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id::text = auth.uid()::text 
            AND activo = true
        )
    );

-- Políticas para catálogos (públicos)
CREATE POLICY "Todos pueden ver plazas activas" 
    ON plazas FOR SELECT 
    USING (activo = true);

CREATE POLICY "Todos pueden ver locales activos" 
    ON locales FOR SELECT 
    USING (activo = true);

CREATE POLICY "Todos pueden ver tipos de residuos" 
    ON tipos_residuos FOR SELECT 
    USING (activo = true);

CREATE POLICY "Todos pueden ver clientes activos" 
    ON clientes_independientes FOR SELECT 
    USING (activo = true);

-- Políticas para detalle (heredan de recolecciones)
CREATE POLICY "Todos pueden ver detalles" 
    ON detalle_recolecciones FOR SELECT 
    USING (true);

CREATE POLICY "Usuarios pueden crear detalles" 
    ON detalle_recolecciones FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id::text = auth.uid()::text 
            AND activo = true
        )
    );
