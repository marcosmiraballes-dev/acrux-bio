-- ============================================
-- ACRUX-BIO - ÍNDICES
-- Ejecutar SEGUNDO en Supabase SQL Editor
-- ============================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Índices para plazas
CREATE INDEX idx_plazas_nombre ON plazas(nombre);
CREATE INDEX idx_plazas_ciudad ON plazas(ciudad);
CREATE INDEX idx_plazas_activo ON plazas(activo);

-- Índices para locales
CREATE INDEX idx_locales_plaza_id ON locales(plaza_id);
CREATE INDEX idx_locales_nombre ON locales(nombre);
CREATE INDEX idx_locales_activo ON locales(activo);

-- Índices para clientes independientes
CREATE INDEX idx_clientes_razon_social ON clientes_independientes(razon_social);
CREATE INDEX idx_clientes_activo ON clientes_independientes(activo);

-- Índices para tipos de residuos
CREATE INDEX idx_tipos_residuos_nombre ON tipos_residuos(nombre);
CREATE INDEX idx_tipos_residuos_activo ON tipos_residuos(activo);

-- Índices para recolecciones
CREATE INDEX idx_recolecciones_fecha ON recolecciones(fecha_recoleccion DESC);
CREATE INDEX idx_recolecciones_usuario ON recolecciones(usuario_id);
CREATE INDEX idx_recolecciones_plaza ON recolecciones(plaza_id);
CREATE INDEX idx_recolecciones_local ON recolecciones(local_id);
CREATE INDEX idx_recolecciones_cliente ON recolecciones(cliente_id);
CREATE INDEX idx_recolecciones_created ON recolecciones(created_at DESC);

-- Índices para detalle de recolecciones
CREATE INDEX idx_detalle_recoleccion ON detalle_recolecciones(recoleccion_id);
CREATE INDEX idx_detalle_tipo_residuo ON detalle_recolecciones(tipo_residuo_id);

-- Índices para sesiones
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_token ON sesiones(token);
CREATE INDEX idx_sesiones_expires ON sesiones(expires_at);

-- Índices para auditoría
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla);
CREATE INDEX idx_auditoria_created ON auditoria(created_at DESC);
