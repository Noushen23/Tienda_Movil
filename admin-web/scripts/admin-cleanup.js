#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script de mantenimiento para admin-web
 * Ejecuta múltiples tareas de limpieza y optimización
 */

// Configuración
const CONFIG = {
  srcPath: path.join(__dirname, '..', 'src'),
  scriptsPath: path.join(__dirname, '..', 'scripts'),
  excludePatterns: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.git'
  ]
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bright}${colors.blue}=== ${title} ===${colors.reset}`);
}

// Función para ejecutar scripts de limpieza
async function runCleanupScripts() {
  logSection('🧹 Ejecutando Scripts de Limpieza');
  
  try {
    // Ejecutar script de limpieza de console.logs
    const { execSync } = require('child_process');
    
    log('📝 Limpiando console.logs de desarrollo...', 'yellow');
    execSync('node scripts/clean-console-logs.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    log('✅ Console.logs limpiados exitosamente', 'green');
    
  } catch (error) {
    log(`❌ Error ejecutando scripts de limpieza: ${error.message}`, 'red');
  }
}

// Función para verificar archivos duplicados
function checkDuplicateFiles() {
  logSection('🔍 Verificando Archivos Duplicados');
  
  const duplicates = [];
  const fileMap = new Map();
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !CONFIG.excludePatterns.includes(item)) {
        scanDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        const content = fs.readFileSync(itemPath, 'utf8');
        const hash = require('crypto').createHash('md5').update(content).digest('hex');
        
        if (fileMap.has(hash)) {
          duplicates.push({
            original: fileMap.get(hash),
            duplicate: itemPath,
            hash
          });
        } else {
          fileMap.set(hash, itemPath);
        }
      }
    }
  }
  
  scanDirectory(CONFIG.srcPath);
  
  if (duplicates.length > 0) {
    log(`⚠️  Se encontraron ${duplicates.length} archivos potencialmente duplicados:`, 'yellow');
    duplicates.forEach((dup, index) => {
      log(`  ${index + 1}. ${path.relative(CONFIG.srcPath, dup.duplicate)}`, 'yellow');
      log(`     Duplicado de: ${path.relative(CONFIG.srcPath, dup.original)}`, 'yellow');
    });
  } else {
    log('✅ No se encontraron archivos duplicados', 'green');
  }
  
  return duplicates;
}

// Función para verificar imports no utilizados
function checkUnusedImports() {
  logSection('📦 Verificando Imports No Utilizados');
  
  const unusedImports = [];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const importMatch = line.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          
          // Verificar si el import se usa en el archivo
          const importName = line.match(/import\s+\{([^}]+)\}/);
          if (importName) {
            const names = importName[1].split(',').map(name => name.trim().split(' as ')[0].trim());
            const usedNames = names.filter(name => {
              const regex = new RegExp(`\\b${name}\\b`, 'g');
              const matches = content.match(regex);
              return matches && matches.length > 1; // Más de 1 porque incluye el import
            });
            
            if (usedNames.length === 0) {
              unusedImports.push({
                file: filePath,
                line: index + 1,
                import: line.trim(),
                unused: names
              });
            }
          }
        }
      });
    } catch (error) {
      // Ignorar errores de archivos individuales
    }
  }
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !CONFIG.excludePatterns.includes(item)) {
        scanDirectory(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        scanFile(itemPath);
      }
    }
  }
  
  scanDirectory(CONFIG.srcPath);
  
  if (unusedImports.length > 0) {
    log(`⚠️  Se encontraron ${unusedImports.length} imports potencialmente no utilizados:`, 'yellow');
    unusedImports.slice(0, 10).forEach((imp, index) => {
      log(`  ${index + 1}. ${path.relative(CONFIG.srcPath, imp.file)}:${imp.line}`, 'yellow');
      log(`     ${imp.import}`, 'yellow');
    });
    
    if (unusedImports.length > 10) {
      log(`     ... y ${unusedImports.length - 10} más`, 'yellow');
    }
  } else {
    log('✅ No se encontraron imports no utilizados', 'green');
  }
  
  return unusedImports;
}

// Función para generar reporte de limpieza
function generateCleanupReport() {
  logSection('📊 Reporte de Limpieza');
  
  const report = {
    timestamp: new Date().toISOString(),
    consoleLogsRemoved: 0,
    duplicateFiles: 0,
    unusedImports: 0,
    filesProcessed: 0
  };
  
  // Contar archivos procesados
  function countFiles(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !CONFIG.excludePatterns.includes(item)) {
        countFiles(itemPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        report.filesProcessed++;
      }
    }
  }
  
  countFiles(CONFIG.srcPath);
  
  log(`📁 Archivos procesados: ${report.filesProcessed}`, 'cyan');
  log(`🧹 Console.logs removidos: ${report.consoleLogsRemoved}`, 'cyan');
  log(`📦 Imports no utilizados: ${report.unusedImports}`, 'cyan');
  log(`🔄 Archivos duplicados: ${report.duplicateFiles}`, 'cyan');
  
  return report;
}

// Función principal
async function main() {
  log(`${colors.bright}${colors.magenta}🧹 Admin-Web Cleanup Tool${colors.reset}`);
  log(`${colors.cyan}Ejecutando tareas de limpieza y mantenimiento...${colors.reset}`);
  
  try {
    // Ejecutar todas las tareas de limpieza
    await runCleanupScripts();
    const duplicates = checkDuplicateFiles();
    const unusedImports = checkUnusedImports();
    const report = generateCleanupReport();
    
    // Actualizar reporte con datos reales
    report.duplicateFiles = duplicates.length;
    report.unusedImports = unusedImports.length;
    
    logSection('✅ Limpieza Completada');
    log('🎉 Todas las tareas de limpieza se completaron exitosamente', 'green');
    
    // Guardar reporte
    const reportPath = path.join(CONFIG.scriptsPath, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`📄 Reporte guardado en: ${reportPath}`, 'cyan');
    
  } catch (error) {
    log(`❌ Error durante la limpieza: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  runCleanupScripts,
  checkDuplicateFiles,
  checkUnusedImports,
  generateCleanupReport
};

