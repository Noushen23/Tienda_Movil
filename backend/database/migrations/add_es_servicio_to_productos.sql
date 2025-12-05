-- Migración: Agregar campo es_servicio a la tabla productos
-- Fecha: 2024
-- Descripción: Permite identificar productos que son servicios

USE TiendaMovil;

-- Agregar columna es_servicio a la tabla productos
ALTER TABLE productos 
ADD COLUMN es_servicio BOOLEAN DEFAULT FALSE AFTER destacado;

-- Crear índice para mejorar rendimiento en consultas de servicios
CREATE INDEX idx_productos_es_servicio ON productos(es_servicio);

-- Actualizar productos existentes que tengan la etiqueta "servicio" o "service"
UPDATE productos 
SET es_servicio = TRUE 
WHERE (
  etiquetas LIKE '%"servicio"%' 
  OR etiquetas LIKE '%"service"%'
  OR etiquetas LIKE '%servicio%'
  OR etiquetas LIKE '%service%'
) 
AND es_servicio = FALSE;

-- Comentario en la columna
ALTER TABLE productos 
MODIFY COLUMN es_servicio BOOLEAN DEFAULT FALSE 
COMMENT 'Indica si el producto es un servicio (TRUE) o un producto físico (FALSE)';

