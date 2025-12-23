# 🔧 Configuración de ApiTercero

## Variables de Entorno Requeridas

Cree un archivo `.env` en la carpeta `ApiTercero` con las siguientes variables:

```env
# Base de datos Firebird (TNS)
FIREBIRD_HOST=localhost
FIREBIRD_PORT=3050
FIREBIRD_DATABASE=C:\TNS\DATOS.FDB
FIREBIRD_USER=SYSDBA
FIREBIRD_PASSWORD=masterkey

# Base de datos MySQL (Backend)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ecommerce_db
MYSQL_USER=root
MYSQL_PASSWORD=tu_password_mysql

# API Token para autenticación
API_TOKEN=tu_token_secreto_aqui

# Puerto del servidor
PORT=51250
```

## 🔑 Generar Token de Autenticación

Para generar un token válido, puede usar uno de estos métodos:

### Método 1: Token Simple (Desarrollo)
```bash
# En ApiTercero
echo "Bearer $(openssl rand -hex 32)"
```

### Método 2: Token con JWT (Producción)
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign({ 
  service: 'apitercero',
  timestamp: Date.now() 
}, 'tu_secret_key', { expiresIn: '24h' });
console.log('Bearer', token);
```

### Método 3: Token Fijo (Para Pruebas)
```env
API_TOKEN=Bearer apitercero_2025_test_token_12345
```

## 🚀 Pasos para Configurar

1. **Crear archivo .env**:
   ```bash
   cd ApiTercero
   cp env.example .env
   ```

2. **Editar .env con sus credenciales**:
   ```env
   FIREBIRD_HOST=localhost
   FIREBIRD_PORT=3050
   FIREBIRD_DATABASE=C:\TNS\DATOS.FDB
   FIREBIRD_USER=SYSDBA
   FIREBIRD_PASSWORD=masterkey
   
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=ecommerce_db
   MYSQL_USER=root
   MYSQL_PASSWORD=tu_password
   
   API_TOKEN=Bearer apitercero_2025_test_token_12345
   PORT=51250
   ```

3. **Reiniciar ApiTercero**:
   ```bash
   npm start
   ```

4. **Probar sincronización**:
   ```bash
   node test-sync-fixed.js
   ```

## 🔍 Verificar Configuración

### Test de Conexión Firebird
```bash
# Verificar que la base de datos Firebird esté accesible
telnet localhost 3050
```

### Test de Conexión MySQL
```bash
# Verificar que la base de datos MySQL esté accesible
mysql -h localhost -u root -p ecommerce_db
```

### Test de API
```bash
# Verificar que ApiTercero responda
curl http://localhost:51250/
```

## 🎯 Resultado Esperado

Después de configurar correctamente, debería ver:

```
✅ API respondiendo: API de Terceros TNS - Solo Lectura
✅ Tercero encontrado por NIT: { TERID: 1007667, NOMBRE: 'CARVAJALINO...' }
✅ Tercero creado exitosamente
✅ Sincronización exitosa: 1 usuario procesado
```

## 🚨 Solución de Problemas

### Error: "Token inválido"
- Verificar que `API_TOKEN` esté configurado en `.env`
- Confirmar que el token tenga el formato `Bearer token_aqui`
- Reiniciar ApiTercero después de cambiar el token

### Error: "No se pudo conectar con Firebird"
- Verificar que el servicio Firebird esté ejecutándose
- Confirmar la ruta de la base de datos
- Verificar credenciales de usuario SYSDBA

### Error: "No se pudo conectar con MySQL"
- Verificar que MySQL esté ejecutándose
- Confirmar que la base de datos `ecommerce_db` exista
- Verificar credenciales de usuario root

¡Con esta configuración, la sincronización debería funcionar perfectamente! 🚀
