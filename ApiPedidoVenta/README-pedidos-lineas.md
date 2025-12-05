# API Líneas de Pedidos (DEKARDEX) - TNS

## Endpoint Base
```
/api/pedidos-lineas
```

## Descripción
API completa para la gestión de líneas de pedidos (DEKARDEX) del sistema TNS. Permite crear, leer, actualizar y eliminar líneas individuales de pedidos, así como consultar líneas por pedido específico.

## Endpoints Disponibles

### 1. GET /api/pedidos-lineas
**Obtener líneas de pedidos con paginación y filtros**

#### Parámetros de Query:
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 50)
- `kardexid` (opcional): Filtrar por ID de pedido
- `matid` (opcional): Filtrar por ID de material
- `bodid` (opcional): Filtrar por ID de bodega
- `search` (opcional): Búsqueda en descripción o código de material

#### Ejemplo de uso:
```bash
GET /api/pedidos-lineas?page=1&limit=20&kardexid=12345
GET /api/pedidos-lineas?search=cemento&bodid=1
```

#### Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "DEKARDEXID": "1234567890",
      "KARDEXID": "12345",
      "MATID": "MAT001",
      "BODID": 1,
      "PRIORIDAD": "N",
      "REMTOTFAC": 0,
      "TIPUND": "U",
      "PORCIVA": 19,
      "DESCUENTO": 0,
      "CANLISTA": 10,
      "CANMAT": 10,
      "PRECIOLISTA": 50000,
      "PRECIOVTA": 50000,
      "PRECIOBASE": 50000,
      "PRECIOIVA": 9500,
      "PRECIONETO": 59500,
      "PARCVTA": 59500,
      "SALCAN": 10,
      "SALCOST": 0,
      "IMPRESO": "N",
      "MATERIAL_DESCRIPCION": "Cemento Portland",
      "MATERIAL_CODIGO": "CEM001",
      "MATERIAL_UNIDAD": "BULTO",
      "BODEGA_NOMBRE": "Bodega Principal",
      "PEDIDO_NUMERO": "PED-2024-001",
      "PEDIDO_FECHA": "2024-01-15",
      "PEDIDO_CLIENTE": "CLI001",
      "PEDIDO_VENDEDOR": "VEN001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. GET /api/pedidos-lineas/:id
**Obtener línea específica por ID**

#### Parámetros:
- `id`: DEKARDEXID de la línea

#### Ejemplo:
```bash
GET /api/pedidos-lineas/1234567890
```

### 3. GET /api/pedidos-lineas/pedido/:kardexid
**Obtener todas las líneas de un pedido específico**

#### Parámetros:
- `kardexid`: ID del pedido (KARDEX)

#### Ejemplo:
```bash
GET /api/pedidos-lineas/pedido/12345
```

#### Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "DEKARDEXID": "1234567890",
      "KARDEXID": "12345",
      "MATID": "MAT001",
      "BODID": 1,
      "PRIORIDAD": "N",
      "REMTOTFAC": 0,
      "TIPUND": "U",
      "PORCIVA": 19,
      "DESCUENTO": 0,
      "CANLISTA": 10,
      "CANMAT": 10,
      "PRECIOLISTA": 50000,
      "PRECIOVTA": 50000,
      "PRECIOBASE": 50000,
      "PRECIOIVA": 9500,
      "PRECIONETO": 59500,
      "PARCVTA": 59500,
      "SALCAN": 10,
      "SALCOST": 0,
      "IMPRESO": "N",
      "MATERIAL_DESCRIPCION": "Cemento Portland",
      "MATERIAL_CODIGO": "CEM001",
      "MATERIAL_UNIDAD": "BULTO",
      "BODEGA_NOMBRE": "Bodega Principal"
    }
  ],
  "total": 3
}
```

### 4. POST /api/pedidos-lineas
**Crear nueva línea de pedido**

#### Body requerido:
```json
{
  "kardexid": "12345",
  "matid": "MAT001",
  "bodid": 1
}
```

#### Body completo (opcional):
```json
{
  "kardexid": "12345",
  "matid": "MAT001",
  "bodid": 1,
  "prioridad": "N",
  "remtotfac": 0,
  "tipund": "U",
  "porciva": 19,
  "descuento": 0,
  "canlista": 10,
  "canmat": 10,
  "preciolista": 50000,
  "preciovta": 50000,
  "preciobase": 50000,
  "precioiva": 9500,
  "precioneto": 59500,
  "parcvta": 59500,
  "salcan": 10,
  "salcost": 0,
  "impreso": "N"
}
```

#### Respuesta:
```json
{
  "success": true,
  "data": {
    "DEKARDEXID": "1234567890",
    "KARDEXID": "12345",
    "MATID": "MAT001",
    "BODID": 1,
    "PRIORIDAD": "N",
    "REMTOTFAC": 0,
    "TIPUND": "U",
    "PORCIVA": 19,
    "DESCUENTO": 0,
    "CANLISTA": 10,
    "CANMAT": 10,
    "PRECIOLISTA": 50000,
    "PRECIOVTA": 50000,
    "PRECIOBASE": 50000,
    "PRECIOIVA": 9500,
    "PRECIONETO": 59500,
    "PARCVTA": 59500,
    "SALCAN": 10,
    "SALCOST": 0,
    "IMPRESO": "N",
    "MATERIAL_DESCRIPCION": "Cemento Portland",
    "MATERIAL_CODIGO": "CEM001",
    "MATERIAL_UNIDAD": "BULTO",
    "BODEGA_NOMBRE": "Bodega Principal"
  },
  "message": "Línea de pedido creada exitosamente",
  "lineaId": "1234567890"
}
```

### 5. PUT /api/pedidos-lineas/:id
**Actualizar línea de pedido existente**

#### Parámetros:
- `id`: DEKARDEXID de la línea

#### Body (campos opcionales):
```json
{
  "canlista": 15,
  "preciovta": 55000,
  "descuento": 5000
}
```

#### Respuesta:
```json
{
  "success": true,
  "data": {
    "DEKARDEXID": "1234567890",
    "KARDEXID": "12345",
    "MATID": "MAT001",
    "BODID": 1,
    "PRIORIDAD": "N",
    "REMTOTFAC": 0,
    "TIPUND": "U",
    "PORCIVA": 19,
    "DESCUENTO": 5000,
    "CANLISTA": 15,
    "CANMAT": 15,
    "PRECIOLISTA": 50000,
    "PRECIOVTA": 55000,
    "PRECIOBASE": 50000,
    "PRECIOIVA": 9500,
    "PRECIONETO": 59500,
    "PARCVTA": 59500,
    "SALCAN": 15,
    "SALCOST": 0,
    "IMPRESO": "N",
    "MATERIAL_DESCRIPCION": "Cemento Portland",
    "MATERIAL_CODIGO": "CEM001",
    "MATERIAL_UNIDAD": "BULTO",
    "BODEGA_NOMBRE": "Bodega Principal"
  },
  "message": "Línea de pedido actualizada exitosamente"
}
```

### 6. DELETE /api/pedidos-lineas/:id
**Eliminar línea de pedido**

#### Parámetros:
- `id`: DEKARDEXID de la línea

#### Respuesta:
```json
{
  "success": true,
  "message": "Línea de pedido eliminada exitosamente"
}
```

## Validaciones

### Campos Obligatorios:
- `kardexid`: ID del pedido (debe existir en KARDEX)
- `matid`: ID del material (debe existir en MATERIALES)
- `bodid`: ID de la bodega (debe existir en BODEGAS)

### Validaciones de Integridad:
- Se verifica que el pedido existe antes de crear líneas
- Se verifica que el material existe antes de crear líneas
- Se verifica que la bodega existe antes de crear líneas
- Se verifica que la línea existe antes de actualizar/eliminar

## Estructura de la Base de Datos

### Tabla DEKARDEX:
- **DEKARDEXID**: Identificador único de la línea
- **KARDEXID**: Referencia al pedido (KARDEX)
- **MATID**: Referencia al material (MATERIALES)
- **BODID**: Referencia a la bodega (BODEGAS)
- **PRIORIDAD**: Prioridad de la línea (N=Normal, A=Alta, B=Baja)
- **REMTOTFAC**: Remisión total facturada
- **TIPUND**: Tipo de unidad (U=Unidad, K=Kilogramo, L=Litro)
- **PORCIVA**: Porcentaje de IVA
- **DESCUENTO**: Monto del descuento
- **CANLISTA**: Cantidad de lista
- **CANMAT**: Cantidad de material
- **PRECIOLISTA**: Precio de lista
- **PRECIOVTA**: Precio de venta
- **PRECIOBASE**: Precio base
- **PRECIOIVA**: Precio con IVA
- **PRECIONETO**: Precio neto
- **PARCVTA**: Parcial de venta
- **SALCAN**: Saldo de cantidad
- **SALCOST**: Saldo de costo
- **IMPRESO**: Estado de impresión (S=Si, N=No)

## JOINs Implementados

### Consultas principales incluyen:
- **DEKARDEX** ↔ **MATERIALES**: Para obtener información del material
- **DEKARDEX** ↔ **BODEGAS**: Para obtener información de la bodega
- **DEKARDEX** ↔ **KARDEX**: Para obtener información del pedido

## Códigos de Estado HTTP

- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Datos inválidos o incompletos
- **404**: Not Found - Recurso no encontrado
- **409**: Conflict - Conflicto (ej: material ya existe)
- **500**: Internal Server Error - Error interno del servidor

## Ejemplos de Uso

### Crear línea de pedido:
```bash
curl -X POST http://localhost:51250/api/pedidos-lineas \
  -H "Content-Type: application/json" \
  -d '{
    "kardexid": "12345",
    "matid": "MAT001",
    "bodid": 1,
    "canlista": 10,
    "preciovta": 50000
  }'
```

### Obtener líneas de un pedido:
```bash
curl http://localhost:51250/api/pedidos-lineas/pedido/12345
```

### Actualizar cantidad:
```bash
curl -X PUT http://localhost:51250/api/pedidos-lineas/1234567890 \
  -H "Content-Type: application/json" \
  -d '{"canlista": 15}'
```

### Eliminar línea:
```bash
curl -X DELETE http://localhost:51250/api/pedidos-lineas/1234567890
```

## Notas Importantes

1. **Generación de IDs**: Los DEKARDEXID se generan automáticamente usando timestamp + random
2. **Transacciones**: Las operaciones de creación usan transacciones para garantizar integridad
3. **Paginación**: Por defecto se muestran 50 elementos por página
4. **Búsqueda**: La búsqueda se realiza en descripción y código de material
5. **Ordenamiento**: Por defecto se ordena por KARDEXID descendente, luego por DEKARDEXID descendente
6. **Validaciones**: Se validan todas las referencias antes de crear/actualizar líneas
