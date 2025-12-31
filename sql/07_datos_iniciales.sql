-- ============================================
-- ACRUX-BIO - DATOS INICIALES
-- Ejecutar SÉPTIMO (último) en Supabase SQL Editor
-- ============================================

-- Insertar tipos de residuos predefinidos
INSERT INTO tipos_residuos (nombre, descripcion, factor_co2, color_hex) VALUES
    ('Orgánico', 'Residuos orgánicos biodegradables', 0.1, '#10b981'),
    ('Inorgánico', 'Residuos inorgánicos generales', 0.5, '#6b7280'),
    ('Cartón', 'Cartón y papel', 1.5, '#f59e0b'),
    ('Aluminio', 'Latas y aluminio', 1.2, '#3b82f6'),
    ('Archivo', 'Papel de archivo y documentos', 1.5, '#8b5cf6'),
    ('Plástico Duro', 'Plásticos rígidos', 2.0, '#ef4444'),
    ('PET', 'Botellas PET', 1.8, '#06b6d4'),
    ('Playo', 'Bolsas y plástico flexible', 2.0, '#ec4899'),
    ('Vidrio', 'Botellas y vidrio', 0.5, '#14b8a6'),
    ('Tetra Pak', 'Envases Tetra Pak', 1.3, '#f97316'),
    ('Chatarra', 'Metal y chatarra', 1.2, '#64748b')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar usuario admin inicial
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
    (
        'Administrador', 
        'admin@acruxbio.com', 
        crypt('admin123', gen_salt('bf')), 
        'ADMIN', 
        true
    )
ON CONFLICT (email) DO NOTHING;
