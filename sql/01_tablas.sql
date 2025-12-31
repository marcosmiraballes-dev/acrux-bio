-- ============================================
-- ACRUX-BIO - TABLAS PRINCIPALES
-- Ejecutar PRIMERO en Supabase SQL Editor
-- ============================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('ADMIN', 'CAPTURADOR', 'VISOR')),
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: plazas
-- ============================================
CREATE TABLE plazas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(255) NOT NULL,
    estado VARCHAR(255) NOT NULL,
    direccion TEXT,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: locales
-- ============================================
CREATE TABLE locales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plaza_id UUID REFERENCES plazas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    giro VARCHAR(255),
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: clientes_independientes
-- ============================================
CREATE TABLE clientes_independientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razon_social VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    rfc VARCHAR(50),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: tipos_residuos
-- ============================================
CREATE TABLE tipos_residuos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    factor_co2 DECIMAL(10, 4) DEFAULT 0.5,
    unidad VARCHAR(50) DEFAULT 'kg',
    color_hex VARCHAR(7) DEFAULT '#10b981',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: recolecciones (PRINCIPAL)
-- ============================================
CREATE TABLE recolecciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    plaza_id UUID REFERENCES plazas(id) ON DELETE SET NULL,
    local_id UUID REFERENCES locales(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes_independientes(id) ON DELETE SET NULL,
    fecha_recoleccion DATE NOT NULL,
    hora_recoleccion TIME,
    total_kilos DECIMAL(10, 2) DEFAULT 0,
    co2_evitado DECIMAL(10, 2) DEFAULT 0,
    notas TEXT,
    fotos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (plaza_id IS NOT NULL AND local_id IS NOT NULL AND cliente_id IS NULL) OR
        (plaza_id IS NULL AND local_id IS NULL AND cliente_id IS NOT NULL)
    )
);

-- ============================================
-- TABLA: detalle_recolecciones
-- ============================================
CREATE TABLE detalle_recolecciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recoleccion_id UUID REFERENCES recolecciones(id) ON DELETE CASCADE,
    tipo_residuo_id UUID REFERENCES tipos_residuos(id),
    kilos DECIMAL(10, 2) NOT NULL CHECK (kilos >= 0),
    co2_evitado DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: sesiones
-- ============================================
CREATE TABLE sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: auditoria
-- ============================================
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    tabla VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
