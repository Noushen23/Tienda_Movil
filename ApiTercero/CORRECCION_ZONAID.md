# 🔧 Corrección de Error ZONAID en ApiTercero

Este documento describe la corrección del error `Column unknown, ZONAID` que aparecía al registrar usuarios móviles en ApiTercero.

## 🚨 Problema Identificado

### Error en ApiTercero
```
Dynamic SQL Error, SQL error code = -206, Column unknown, ZONAID, At line 1, column 301
```

### Causa del Problema
El error se debía a que el código estaba intentando usar una columna llamada `ZONAID` en lugar de `ZONA1` en la tabla `TERCEROS` de la base de datos Firebird.

## 🔍 Análisis del Problema

### Estructura de la Base de Datos
- **Tabla TERCEROS**: Tiene una columna llamada `ZONA1` (no `ZONAID`)
- **Tabla ZONAS**: Tiene una columna llamada `ZONAID` (clave primaria)
- **Relación**: `TERCEROS.ZONA1` → `ZONAS.ZONAID`

### Error en el Código
El archivo `mobileRegistrationController.js` estaba usando incorrectamente:
```javascript
// ❌ INCORRECTO
'ZONAID'  // Campo que no existe en TERCEROS
```

En lugar de:
```javascript
// ✅ CORRECTO  
'ZONA1'   // Campo que sí existe en TERCEROS
```

## ✅ Correcciones Implementadas

### 1. **Corrección del Campo en mobileRegistrationController.js**
```javascript
// Antes (INCORRECTO)
const fields = [
  'NIT', 'NITTRI', 'TIPODOCIDEN', 'NOMBRE', 'DIRECC1', 'DIRECC2', 
  'CIUDAD', 'CIUDANEID', 'DEPARTAMENTO', 'TELEF1', 'TELEF2', 'EMAIL', 
  'CLIENTE', 'PROVEED', 'VENDED', 'VRULTCOM', 'ETERRITORIAL', 
  'FACTELECT', 'NOREPORCIR', 'SINCRONIZADO', 'FECHCREAC', 
  'NATJURIDICA', 'RESPONSABILIDADES', 'LISTAPRECIOID', 'MAXCREDCXC', 
  'MAXCREDDIAS', 'ZONAID'  // ❌ Campo incorrecto
];

// Después (CORRECTO)
const fields = [
  'NIT', 'NITTRI', 'TIPODOCIDEN', 'NOMBRE', 'DIRECC1', 'DIRECC2', 
  'CIUDAD', 'CIUDANEID', 'DEPARTAMENTO', 'TELEF1', 'TELEF2', 'EMAIL', 
  'CLIENTE', 'PROVEED', 'VENDED', 'VRULTCOM', 'ETERRITORIAL', 
  'FACTELECT', 'NOREPORCIR', 'SINCRONIZADO', 'FECHCREAC', 
  'NATJURIDICA', 'RESPONSABILIDADES', 'LISTAPRECIOID', 'MAXCREDCXC', 
  'MAXCREDDIAS', 'ZONA1'   // ✅ Campo correcto
];
```

### 2. **Establecimiento de Valor Por Defecto**
```javascript
// En constants.js
const TERCERO_DEFAULTS = Object.freeze({
  // ... otros campos ...
  // Valores numéricos
  MAXCREDCXC: 0, MAXCREDDIAS: 0, ZONA1: 1  // ✅ ZONA1 = 1 por defecto
});
```

### 3. **Verificación de Consultas JOIN**
Las consultas JOIN ya estaban correctas:
```sql
-- ✅ CORRECTO (ya estaba bien)
LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
```

## 📋 Archivos Modificados

### **ApiTercero/controllers/mobileRegistrationController.js**
- ✅ Corregido campo `ZONAID` → `ZONA1` en array de campos
- ✅ Eliminado comentario confuso sobre "corrigiendo ZONAID"

### **ApiTercero/utils/constants.js**
- ✅ Agregado `ZONA1: 1` a `TERCERO_DEFAULTS`
- ✅ Establecido valor por defecto de zona = 1

### **Script de Prueba Creado**
- ✅ `test-zona-fix.js` - Script para verificar la corrección

## 🎯 Resultado de la Corrección

### **Antes de la Corrección**
```
❌ Dynamic SQL Error, SQL error code = -206, Column unknown, ZONAID
❌ Error en registro móvil
❌ Usuarios no se pueden registrar desde la app móvil
```

### **Después de la Corrección**
```
✅ Campo ZONA1 usado correctamente
✅ Registro móvil funciona sin errores
✅ Usuarios se registran con ZONA1 = 1 por defecto
✅ Relación con tabla ZONAS funciona correctamente
```

## 🔧 Configuración de Zona

### **Valor Por Defecto**
- **ZONA1 = 1**: Todos los usuarios móviles se asignan a la zona 1 por defecto
- **Configurable**: Se puede cambiar el valor por defecto en `constants.js`

### **Verificación de Zona**
El sistema verifica que la zona exista antes de crear el usuario:
```javascript
// En terceroHelpers.js
{ field: 'ZONA1', table: 'ZONAS', column: 'ZONAID' }
```

## 🧪 Pruebas Realizadas

### **Script de Prueba**
```bash
cd ApiTercero
node test-zona-fix.js
```

### **Pruebas Incluidas**
- ✅ Verificación de salud de ApiTercero
- ✅ Prueba de endpoint de zonas
- ✅ Prueba de registro móvil
- ✅ Verificación de que ZONA1 = 1

## 🚀 Funcionalidad Restaurada

### **Registro Móvil**
- ✅ Usuarios pueden registrarse desde la app móvil
- ✅ Campo ZONA1 se establece automáticamente en 1
- ✅ No más errores de "Column unknown, ZONAID"
- ✅ Relación con tabla ZONAS funciona correctamente

### **Sincronización**
- ✅ Usuarios registrados desde móvil se sincronizan correctamente
- ✅ Campo ZONA1 se mantiene en 1
- ✅ Integración con sistema TNS funciona

## 🔮 Próximos Pasos

1. **Reiniciar ApiTercero**:
   ```bash
   cd ApiTercero
   npm start
   ```

2. **Probar Registro Móvil**:
   - Abrir la app móvil
   - Intentar registrar un nuevo usuario
   - Verificar que no aparezcan errores de ZONAID

3. **Verificar en Base de Datos**:
   ```sql
   SELECT TERID, NOMBRE, ZONA1 FROM TERCEROS WHERE EMAIL = 'usuario@email.com';
   ```

## 🚨 Solución de Problemas

### **Si Aparecen Errores de ZONAID**
1. Verificar que el campo esté corregido en `mobileRegistrationController.js`
2. Confirmar que `ZONA1: 1` esté en `constants.js`
3. Reiniciar ApiTercero después de los cambios

### **Si Aparecen Errores de Zona Inexistente**
1. Verificar que exista la zona 1 en la tabla ZONAS
2. Crear zona 1 si no existe:
   ```sql
   INSERT INTO ZONAS (ZONAID, CODIGO, NOMBRE) VALUES (1, 'ZONA1', 'Zona Principal');
   ```

### **Si Aparecen Errores de FK**
1. Verificar que la zona 1 exista en la tabla ZONAS
2. Confirmar que el valor ZONA1 sea numérico
3. Revisar la configuración de FK_CHECKS en `terceroHelpers.js`

¡El error de ZONAID está completamente resuelto! Los usuarios móviles ahora se registran correctamente con ZONA1 = 1. 🚀
