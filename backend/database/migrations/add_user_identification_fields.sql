-- Migración: Agregar campos de identificación a la tabla usuarios
-- Fecha: Diciembre 2024
-- Descripción: Agregar tipo_identificacion y numero_identificacion para mejor identificación de usuarios

-- Verificar si las columnas ya existen antes de agregarlas
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'usuarios' 
     AND COLUMN_NAME = 'tipo_identificacion') = 0,
    'ALTER TABLE usuarios ADD COLUMN tipo_identificacion VARCHAR(10) DEFAULT NULL',
    'SELECT "Columna tipo_identificacion ya existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'usuarios' 
     AND COLUMN_NAME = 'numero_identificacion') = 0,
    'ALTER TABLE usuarios ADD COLUMN numero_identificacion VARCHAR(20) DEFAULT NULL',
    'SELECT "Columna numero_identificacion ya existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índices para mejorar el rendimiento de búsquedas
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'usuarios' 
     AND INDEX_NAME = 'idx_usuarios_numero_identificacion') = 0,
    'CREATE INDEX idx_usuarios_numero_identificacion ON usuarios(numero_identificacion)',
    'SELECT "Índice idx_usuarios_numero_identificacion ya existe" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar comentarios a las columnas
ALTER TABLE usuarios MODIFY COLUMN tipo_identificacion VARCHAR(10) DEFAULT NULL COMMENT 'Tipo de identificación: CC, CE, NIT, etc.';
ALTER TABLE usuarios MODIFY COLUMN numero_identificacion VARCHAR(20) DEFAULT NULL COMMENT 'Número de identificación del usuario';

-- Mostrar resultado
SELECT 'Migración completada: Campos de identificación agregados a la tabla usuarios' as resultado;
