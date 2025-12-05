# API TNS - Prueba de Conexión

## Descripción
Script de prueba para verificar la conexión a la base de datos Firebird del sistema TNS.

## Requisitos Previos
- Node.js 14.0.0 o superior
- Servidor Firebird ejecutándose en el puerto 3050
- Base de datos TNS accesible en la ruta configurada

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Verificar configuración:**
   - Revisar `config/app.config.js` para confirmar los parámetros de conexión
   - Asegurarse de que la ruta de la base de datos sea correcta
   - Verificar credenciales de usuario

## Configuración de Conexión

La configuración actual está en `config/app.config.js`:

```javascript
database: {
    firebird: {
        host: '127.0.0.1',           // Host del servidor Firebird
        port: 3050,                   // Puerto por defecto de Firebird
        database: 'C:\\Datos TNS\\PRUEBA.GDB',  // Ruta de la base de datos
        user: 'SYSDBA',               // Usuario
        password: 'masterkey'         // Contraseña
    }
}
```

## Uso

### Ejecutar Prueba de Conexión
```bash
npm test
# o
node test-connection.js
```

### Scripts Disponibles
- `npm test` - Ejecuta la prueba de conexión
- `npm start` - Ejecuta la prueba de conexión
- `npm run dev` - Ejecuta con nodemon (requiere instalación previa)
- `npm run scan` - Ejecuta el escáner completo de tablas
- `npm run scan:dev` - Ejecuta el escáner con nodemon

## Qué Prueba el Script

1. **Conexión Simple**: Verifica conexión básica a Firebird
2. **Pool de Conexiones**: Prueba el sistema de pool de conexiones
3. **Tablas TNS**: Verifica acceso a las tablas principales del sistema:
   - TERCEROS
   - MATERIAL
   - BODEGA
   - KARDEX
   - DEKARDEX

## 🔍 Escáner de Tablas

El escáner analiza en detalle las tablas principales para el desarrollo de la API:

### Tablas Analizadas:
- **BODEGA**: Estructura de bodegas/almacenes
- **TERCEROS**: Clientes, proveedores y vendedores
- **MATERIAL**: Productos y materiales
- **MATERIALSUC**: Materiales por sucursal

### Información Obtenida:
- 🏗️ Estructura completa de cada tabla
- 📊 Estadísticas y conteo de registros
- 🔍 Índices y claves
- 🔒 Restricciones y reglas
- 📋 Muestras de datos reales
- 🔗 Relaciones entre tablas
- 💡 Recomendaciones para la API

## Solución de Problemas

### Error de Conexión
- Verificar que Firebird esté ejecutándose
- Confirmar puerto 3050 esté abierto
- Verificar credenciales de usuario

### Error de Ruta de Base de Datos
- Confirmar que el archivo .gdb existe
- Verificar permisos de acceso al archivo
- Usar rutas absolutas completas

### Error de Red
- Verificar firewall
- Confirmar que el host sea accesible
- Verificar configuración de red

## Estructura del Proyecto

```
ApiTns/
├── config/
│   ├── app.config.js      # Configuración principal
│   └── database.js        # Funciones de base de datos
├── test-connection.js     # Script de prueba de conexión
├── table-scanner.js       # Escáner completo de tablas
├── scanner-config.js      # Configuración del escáner
├── package.json           # Dependencias del proyecto
└── README.md             # Este archivo
```

## Soporte

Para problemas técnicos, contactar a: soporte@tns.com
