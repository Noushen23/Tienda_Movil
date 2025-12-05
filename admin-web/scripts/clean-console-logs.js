#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patrones de console.logs de desarrollo que deben eliminarse
const DEV_CONSOLE_PATTERNS = [
  // Patrones con emojis y texto de desarrollo
  /console\.log\([^)]*['"`][🔍📊✅❌🚀👤📋💡🎉][^)]*['"`][^)]*\);?\s*/g,
  /console\.log\([^)]*['"`](Dashboard|Login|Productos|Categorías|Kardex|Obteniendo|Verificando|Resultado|Usuario|Rol|Redirigiendo)[^)]*['"`][^)]*\);?\s*/g,
  // Patrones de debug específicos
  /console\.log\([^)]*['"`](Iniciando|Proceso|Exitoso|Falló|Error|Debug|Info)[^)]*['"`][^)]*\);?\s*/g,
  // Console.logs con objetos de debug
  /console\.log\([^)]*['"`](resultado|data|response|error|info)[^)]*['"`][^)]*\);?\s*/g,
];

// Patrones de console.logs que DEBEN mantenerse (errores importantes)
const KEEP_CONSOLE_PATTERNS = [
  /console\.error\(/g,
  /console\.warn\(/g,
  // Mantener console.logs que no sean de desarrollo
  /console\.log\([^)]*['"`](Error|Warning|Critical|Fatal)[^)]*['"`][^)]*\);?\s*/g,
];

function shouldKeepConsoleLog(line) {
  return KEEP_CONSOLE_PATTERNS.some(pattern => pattern.test(line));
}

function cleanConsoleLogs(content) {
  let cleanedContent = content;
  let removedCount = 0;

  // Dividir en líneas para procesar cada una
  const lines = cleanedContent.split('\n');
  const cleanedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar si esta línea debe mantenerse
    if (shouldKeepConsoleLog(line)) {
      cleanedLines.push(line);
      continue;
    }

    // Verificar si esta línea contiene console.logs de desarrollo
    let shouldRemove = false;
    for (const pattern of DEV_CONSOLE_PATTERNS) {
      if (pattern.test(line)) {
        shouldRemove = true;
        removedCount++;
        break;
      }
    }

    // Si no debe removerse, agregar la línea
    if (!shouldRemove) {
      cleanedLines.push(line);
    }
  }

  return {
    content: cleanedLines.join('\n'),
    removedCount
  };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleanedContent, removedCount } = cleanConsoleLogs(content);
    
    if (removedCount > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✅ ${filePath}: ${removedCount} console.logs removidos`);
      return removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  let totalRemoved = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Procesar subdirectorios recursivamente
        totalRemoved += processDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        // Procesar archivos TypeScript/JavaScript
        totalRemoved += processFile(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando directorio ${dirPath}:`, error.message);
  }
  
  return totalRemoved;
}

// Función principal
function main() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  console.log('🧹 Iniciando limpieza de console.logs de desarrollo...');
  console.log(`📁 Procesando directorio: ${srcPath}`);
  
  const totalRemoved = processDirectory(srcPath);
  
  console.log(`\n🎉 Limpieza completada!`);
  console.log(`📊 Total de console.logs removidos: ${totalRemoved}`);
  
  if (totalRemoved === 0) {
    console.log('✨ No se encontraron console.logs de desarrollo para limpiar');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogs, processFile, processDirectory };

