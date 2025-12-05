# 🔄 Sincronización MySQL -> TNS

Este documento describe la funcionalidad de sincronización de usuarios desde la base de datos MySQL del backend hacia el sistema TNS (Firebird).

## 📋 Funcionalidades Implementadas

### ✅ **CRUD Completo de Ciudades**
- **GET** `/api/ciudades` - Listar ciudades con paginación y filtros
- **GET** `/api/ciudades/:id` - Obtener ciudad por ID
- **GET** `/api/ciudades/codigo/:codigo` - Obtener ciudad por código
- **POST** `/api/ciudades` - Crear nueva ciudad
- **PUT** `/api/ciudades/:id` - Actualizar ciudad existente
- **DELETE** `/api/ciudades/:id` - Eliminar ciudad
- **GET** `/api/ciudades/departamentos/lista` - Lista de departamentos

### ✅ **Sincronización de Usuarios**
- **POST** `/api/sync/usuarios` - Sincronizar usuarios masivamente
- **GET** `/api/sync/usuarios/status` - Estado de sincronización
- **POST** `/api/sync/usuarios/single` - Sincronizar usuario individual

## 🚀 Uso de la Sincronización

### 1. **Sincronización Masiva**

```bash
curl -X POST http://localhost:51250/api/sync/usuarios \
  -H "Authorization: Bearer tu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 50,
    "force": false
  }'
```

**Parámetros:**
- `limit`: Número máximo de usuarios a procesar (default: 50)
- `force`: Si true, sobrescribe usuarios existentes (default: false)

**Respuesta:**
```json
{
  "success": true,
  "message": "Sincronización completada: 25 creados, 10 existentes, 0 errores",
  "data": {
    "procesados": 35,
    "creados": 25,
    "existentes": 10,
    "errores": 0,
    "erroresDetalle": []
  }
}
```

### 2. **Estado de Sincronización**

```bash
curl -X GET http://localhost:51250/api/sync/usuarios/status \
  -H "Authorization: Bearer tu_token"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "mysql": {
      "usuariosActivos": 150
    },
    "tns": {
      "totalClientes": 200,
      "sincronizados": 120,
      "pendientes": 80
    },
    "ultimaSincronizacion": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. **Sincronización Individual**

```bash
curl -X POST http://localhost:51250/api/sync/usuarios/single \
  -H "Authorization: Bearer tu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` basado en `env.example`:

```bash
# Configuración del servidor
PORT=51250
HOST=localhost

# Configuración de Firebird (TNS)
FIREBIRD_HOST=127.0.0.1
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:\Datos TNS\PRUEBA.GDB
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Configuración de MySQL (Backend)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=TiendaMovil

# Token de autenticación
API_BEARER_TOKEN=tu_token_secreto
```

## 📊 Mapeo de Datos

### MySQL → TNS

| Campo MySQL | Campo TNS | Descripción |
|-------------|-----------|-------------|
| `id` | - | ID interno MySQL (no se mapea) |
| `email` | `EMAIL` | Email del usuario |
| `nombre_completo` | `NOMBRE` | Nombre completo |
| `telefono` | `TELEF1` | Teléfono principal |
| `numero_identificacion` | `NIT` | Número de identificación |
| `tipo_identificacion` | `TIPODOCIDEN` | Tipo de documento |
| - | `CLIENTE` | Siempre 'S' (todos son clientes) |
| - | `SINCRONIZADO` | Siempre 'S' (marcado como sincronizado) |

### Valores por Defecto

- **Ciudad**: Bogotá, Cundinamarca (si existe en TNS)
- **Zona**: 1 (zona por defecto)
- **Clasificación**: 1 (clasificación por defecto)
- **Lista de Precio**: 1 (lista por defecto)
- **Naturaleza Jurídica**: NATURAL
- **Tipo de Cliente**: NORMAL

## 🧪 Pruebas

### Script de Prueba

```bash
# Instalar dependencias
npm install axios

# Ejecutar pruebas
node test-sync.js
```

### Pruebas Manuales

1. **Verificar estado inicial:**
   ```bash
   curl -X GET http://localhost:51250/api/sync/usuarios/status \
     -H "Authorization: Bearer tu_token"
   ```

2. **Sincronizar usuarios:**
   ```bash
   curl -X POST http://localhost:51250/api/sync/usuarios \
     -H "Authorization: Bearer tu_token" \
     -H "Content-Type: application/json" \
     -d '{"limit": 10}'
   ```

3. **Verificar resultado:**
   ```bash
   curl -X GET http://localhost:51250/api/sync/usuarios/status \
     -H "Authorization: Bearer tu_token"
   ```

## 🔍 Monitoreo

### Logs de Sincronización

La sincronización genera logs detallados:

```
🔄 Iniciando sincronización de usuarios (límite: 50, forzar: false)
📊 Usuarios encontrados en MySQL: 35
✅ Usuario sincronizado: usuario1@example.com -> TERID: 1001
⚠️ Usuario ya existe en TNS: usuario2@example.com (TERID: 1002)
❌ Error sincronizando usuario usuario3@example.com: Error de validación
📈 Sincronización completada: { procesados: 35, creados: 25, existentes: 8, errores: 2 }
```

### Métricas Disponibles

- **Usuarios procesados**: Total de usuarios evaluados
- **Usuarios creados**: Nuevos terceros creados en TNS
- **Usuarios existentes**: Ya existían en TNS
- **Errores**: Fallos durante la sincronización

## ⚠️ Consideraciones Importantes

1. **Autenticación**: Todos los endpoints requieren token Bearer
2. **Transacciones**: Cada sincronización usa transacciones para consistencia
3. **Duplicados**: Se verifica por NIT antes de crear
4. **Ciudades**: Se busca automáticamente en TNS, usa Bogotá por defecto
5. **Rollback**: En caso de error, se revierten todos los cambios

## 🚨 Solución de Problemas

### Error de Conexión MySQL
```
❌ Error obteniendo conexión: ECONNREFUSED
```
**Solución**: Verificar que MySQL esté corriendo y las credenciales sean correctas.

### Error de Conexión Firebird
```
❌ Error obteniendo conexión: Connection refused
```
**Solución**: Verificar que Firebird esté corriendo y la ruta de la base de datos sea correcta.

### Error de Autenticación
```
❌ Token requerido para esta operación
```
**Solución**: Incluir header `Authorization: Bearer tu_token` en las peticiones.

### Error de Duplicado
```
❌ Ya existe un tercero con NIT: 12345678
```
**Solución**: Usar `"force": true` para sobrescribir o verificar datos duplicados.
