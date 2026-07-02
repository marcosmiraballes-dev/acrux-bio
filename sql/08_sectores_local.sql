-- ============================================
-- ACRUX-BIO - DOCUMENTACION DE SECTORES LOCAL
-- NOTA: Este script se agrega para versionar en el repo.
-- La tabla ya existe en producción; NO ejecutar en producción.
-- ============================================

CREATE TABLE IF NOT EXISTS sectores_local (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    local_id UUID NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    icono VARCHAR(10) NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT sectores_local_local_id_fkey
      FOREIGN KEY (local_id)
      REFERENCES locales(id)
      ON DELETE CASCADE
);

ALTER TABLE recolecciones
ADD COLUMN IF NOT EXISTS sector_id UUID;

ALTER TABLE recolecciones
ADD CONSTRAINT recolecciones_sector_id_fkey
FOREIGN KEY (sector_id)
REFERENCES sectores_local(id)
ON DELETE SET NULL;
