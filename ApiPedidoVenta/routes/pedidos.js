/**
 * Rutas para gestión completa de Pedidos (KARDEX) - VERSIÓN CORREGIDA
 * Endpoint: /api/pedidos
 * CRUD completo: Crear, Leer, Actualizar, Eliminar pedidos
 * Sistema TNS - Estructura real respetada
 * 
 * CORRECCIÓN: Ajustado el número de parámetros en la inserción de DEKARDEX
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const config = require('../config/app.config');




// Función helper para ejecutar consultas dentro de transacciones
async function executeQueryInTransaction(transaction, query, params = []) {
    return new Promise((resolve, reject) => {
        transaction.query(query, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// Redondeo a 2 decimales
function round2(value) {
    const num = Number(value) || 0;
    return Math.round(num * 100) / 100;
}

// GET /api/pedidos - Obtener pedidos con paginación y filtros
router.get('/', async (req, res, next) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            cliente,
            vendedor,
            sucursal,
            estado,
            fechaDesde,
            fechaHasta,
            search 
        } = req.query;
        
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;
        
        // Construir WHERE dinámicamente
        let whereConditions = [];
        let params = [];
        
        if (cliente) { whereConditions.push('K.CLIENTE = ?'); params.push(Number(cliente)); }
        if (vendedor) { whereConditions.push('K.VENDEDOR = ?'); params.push(Number(vendedor)); }
        if (sucursal) { whereConditions.push('K.SUCID = ?'); params.push(Number(sucursal)); }
        if (estado) { const est = String(estado).toUpperCase() === 'S' ? 'S' : (String(estado).toUpperCase() === 'N' ? 'N' : null); if (est) { whereConditions.push('K.CERRADO = ?'); params.push(est); } }
        if (fechaDesde) { whereConditions.push('K.FECHA >= ?'); params.push(String(fechaDesde).slice(0,10)); }
        if (fechaHasta) { whereConditions.push('K.FECHA <= ?'); params.push(String(fechaHasta).slice(0,10)); }
        if (search) {
            whereConditions.push("(K.NUMERO LIKE ? OR K.OBSERV LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Query para contar total
        const countQuery = `
            SELECT COUNT(*) as TOTAL 
            FROM KARDEX K
            INNER JOIN TERCEROS T ON K.CLIENTE = T.TERID
            INNER JOIN TERCEROS V ON K.VENDEDOR = V.TERID
            ${whereClause}
        `;
        
        const totalResult = await executeQuery(countQuery, params);
        const total = totalResult[0].TOTAL;
        
        // Query principal con paginación y JOINs
        const query = `
            SELECT FIRST ${limitNum} SKIP ${offset}
                K.KARDEXID,
                K.NUMERO,
                K.FECHA,
                K.CLIENTE,
                K.VENDEDOR,
                K.SUCID,
                K.CENID,
                K.CODCOMP,
                K.CODPREFIJO,
                K.VRBASE,
                K.VRIVA,
                K.TOTAL,
                K.OBSERV,
                K.PERIODO,
                K.FORMAPAGO,
                K.USUARIO,
                K.HORA,
                K.MONEDA,
                T.NOMBRE as CLIENTE_NOMBRE,
                T.NIT as CLIENTE_NIT,
                T.CIUDAD as CLIENTE_CIUDAD,
                V.NOMBRE as VENDEDOR_NOMBRE
            FROM KARDEX K
            INNER JOIN TERCEROS T ON K.CLIENTE = T.TERID
            INNER JOIN TERCEROS V ON K.VENDEDOR = V.TERID
            ${whereClause}
            ORDER BY K.FECHA DESC, K.KARDEXID DESC
        `;
        
        const pedidos = await executeQuery(query, params);
        
        // Calcular paginación
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.json({
            success: true,
            data: pedidos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
        
    } catch (error) {
        next(error);
    }
});

// GET /api/pedidos/:id - Obtener pedido por ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        const pedidoQuery = `
            SELECT 
                K.KARDEXID,
                K.CODCOMP, K.CODPREFIJO, K.NUMERO,
                K.FECHA, K.FECVENCE, K.CLIENTE, K.VENDEDOR, K.SUCID, K.CENID,
                K.VRBASE, K.VRIVA, K.TOTAL, K.OBSERV, K.PERIODO,
                K.FORMAPAGO, K.PLAZODIAS, K.MONEDA, K.USUARIO,
                K.FECASENTAD, K.HORAASEN, K.FECANULADO,
                T.NOMBRE AS CLIENTE_NOMBRE, V.NOMBRE AS VENDEDOR_NOMBRE
            FROM KARDEX K
            INNER JOIN TERCEROS T ON K.CLIENTE = T.TERID
            INNER JOIN TERCEROS V ON K.VENDEDOR = V.TERID
            WHERE K.KARDEXID = ?
        `;
        const rows = await executeQuery(pedidoQuery, [idNum]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Pedido no encontrado' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
});

// POST /api/pedidos - Crear nuevo pedido
router.post('/', async (req, res, next) => {
    let connection;
    try {
        const { 
            numero,
            fecha,
            cliente,
            vendedor,
            sucid,
            cenid,
            areadid,
            codcomp,
            codprefijo,
            observ,
            /* periodo (derivado de fecha) */
            formapago,
            plazodias,
            moneda,
            lineas 
        } = req.body;
        
        // Validaciones básicas (NUMERO puede autogenerarse)
        if (!fecha || !cliente || !vendedor || !sucid || !lineas || lineas.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'FECHA, CLIENTE, VENDEDOR, SUCID y LINEAS son obligatorios'
            });
        }
        
        // Validaciones de longitud y preparación de valores
        if (numero !== undefined && numero !== null && String(numero).length > 8) {
            return res.status(400).json({
                success: false,
                error: 'Número demasiado largo',
                message: 'NUMERO no puede exceder 8 caracteres'
            });
        }

        if (codprefijo && String(codprefijo).length > 2) {
            return res.status(400).json({
                success: false,
                error: 'Prefijo demasiado largo',
                message: 'CODPREFIJO no puede exceder 2 caracteres'
            });
        }

        // Preparar valores por defecto de compañía/prefijo
        const codcompVal = codcomp || 'PV';
        const codprefijoVal = codprefijo || 'FA';
        const observTrunc = (observ && String(observ).slice(0, 500)) || 'Pedido creado por API';

        // Verificar duplicado solo si viene NUMERO explícito
        if (numero !== undefined && numero !== null && String(numero).trim() !== '') {
            const existeQuery = 'SELECT COUNT(*) as TOTAL FROM KARDEX WHERE CODCOMP = ? AND CODPREFIJO = ? AND NUMERO = ?';
            const existe = await executeQuery(existeQuery, [codcompVal, codprefijoVal, numero]);
            
            if (existe[0].TOTAL > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Número duplicado',
                    message: `Ya existe un pedido con el número: ${numero}`
                });
            }
        }
        
        // Validar existencia de CLIENTE y VENDEDOR (evitar error de FK REL_VEN_KDX)
        const clienteRows = await executeQuery('SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?', [parseInt(String(cliente), 10)]);
        if (!clienteRows || Number(clienteRows[0].CNT) === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cliente no existe',
                message: `No existe CLIENTE con TERID=${cliente}`
            });
        }
        const vendedorRows = await executeQuery('SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?', [parseInt(String(vendedor), 10)]);
        if (!vendedorRows || Number(vendedorRows[0].CNT) === 0) {
            return res.status(400).json({
                success: false,
                error: 'Vendedor no existe',
                message: `No existe VENDEDOR con TERID=${vendedor}`
            });
        }

        // Validar existencia de materiales de las líneas (evitar FK REL_MAT_KDX en DEKARDEX)
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i];
            const matidVal = linea && linea.matid;
            if (!matidVal) {
                return res.status(400).json({
                    success: false,
                    error: 'Línea inválida',
                    message: `Línea ${i + 1}: MATID es obligatorio`
                });
            }
            const matRows = await executeQuery('SELECT COUNT(*) AS CNT FROM MATERIAL WHERE MATID = ?', [matidVal]);
            if (!matRows || Number(matRows[0].CNT) === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Material no existe',
                    message: `Línea ${i + 1}: no existe MATERIAL con MATID=${matidVal}`
                });
            }
        }

        // Crear el pedido con transacción
        connection = await createConnection();
        const resultado = await executeTransactionWithCallback(connection, async (transaction) => {
            const horaActual = new Date().toTimeString().slice(0, 5); // HH:MM (compatibilidad con columnas CHAR(5))
            
            // Derivar PERIODO desde fecha (mes MM)
            let periodoCalc = '01';
            try {
                const d = new Date(fecha);
                const m = d && !isNaN(d.getTime()) ? d.getMonth() + 1 : 1;
                periodoCalc = String(m).padStart(2, '0');
            } catch (_) {
                periodoCalc = '01';
            }

            // Obtener/generar NUMERO desde tabla CONSECUTIVO por CODCOMP+CODPREFIJO+SUCID
            let numeroVal = (numero !== undefined && numero !== null && String(numero).trim() !== '') ? String(numero).trim() : null;
            let siguienteDesdeConsecutivo = null;
            try {
                const consRows = await executeQueryInTransaction(
                    transaction,
                    'SELECT FIRST 1 CONSECUTIVO FROM CONSECUTIVO WHERE CODCOMP = ? AND CODPREFIJO = ? AND SUCID = ?',
                    [codcompVal, codprefijoVal, sucid || 1]
                );
                if (consRows && consRows[0] && consRows[0].CONSECUTIVO !== undefined) {
                    const lastNum = parseInt(String(consRows[0].CONSECUTIVO || '').replace(/\D/g, ''), 10) || 0;
                    siguienteDesdeConsecutivo = lastNum + 1;
                }
            } catch (_) {}

            if (!numeroVal && siguienteDesdeConsecutivo !== null) {
                numeroVal = String(siguienteDesdeConsecutivo).padStart(8, '0');
            }

            // Si cliente envía NUMERO, validar que coincide con el consecutivo calculado (si existe)
            if (numeroVal && (numero !== undefined && numero !== null && String(numero).trim() !== '')) {
                if (siguienteDesdeConsecutivo !== null) {
                    const esperado = String(siguienteDesdeConsecutivo).padStart(8, '0');
                    if (numeroVal !== esperado) {
                        throw new Error(`El número enviado (${numeroVal}) no coincide con el consecutivo esperado (${esperado}).`);
                    }
                }
            }

            // Si no hay fila en CONSECUTIVO o no se pudo leer, fallback a máximo de KARDEX por CODCOMP+CODPREFIJO
            if (!numeroVal) {
                const maxNumRows = await executeQueryInTransaction(
                    transaction,
                    `SELECT COALESCE(MAX(CAST(NUMERO AS INTEGER)), 0) AS MAXNUM
                     FROM KARDEX
                     WHERE CODCOMP = ? AND CODPREFIJO = ? AND NUMERO SIMILAR TO '[0-9]+'`,
                    [codcompVal, codprefijoVal]
                );
                const maxNum = Number(maxNumRows && maxNumRows[0] && maxNumRows[0].MAXNUM) || 0;
                const siguiente = maxNum + 1;
                numeroVal = String(siguiente).padStart(8, '0');
            }

            // Validar no duplicidad justo antes de insertar (evitar carreras)
            const dupRows = await executeQueryInTransaction(
                transaction,
                'SELECT COUNT(*) AS TOTAL FROM KARDEX WHERE CODCOMP = ? AND CODPREFIJO = ? AND NUMERO = ?',
                [codcompVal, codprefijoVal, numeroVal]
            );
            if (Number(dupRows && dupRows[0] && dupRows[0].TOTAL) > 0) {
                const err = new Error(`El consecutivo ${numeroVal} ya existe para CODCOMP=${codcompVal}, CODPREFIJO=${codprefijoVal}, SUCID=${sucid || 1}`);
                err.code = 'CONSECUTIVO_DUPLICADO';
                err.status = 409;
                err.data = { numero: numeroVal, codcomp: codcompVal, codprefijo: codprefijoVal, sucid: sucid || 1 };
                throw err;
            }

            // Intentar actualizar CONSECUTIVO con el nuevo valor si se obtuvo desde esa tabla
            if (siguienteDesdeConsecutivo !== null) {
                try {
                    await executeQueryInTransaction(
                        transaction,
                        'UPDATE CONSECUTIVO SET CONSECUTIVO = ? WHERE CODCOMP = ? AND CODPREFIJO = ? AND SUCID = ?',
                        [siguienteDesdeConsecutivo, codcompVal, codprefijoVal, sucid || 1]
                    );
                } catch (_) {}
            }

            // Insertar el pedido principal
            const insertPedidoQuery = `
                INSERT INTO KARDEX (
                    CODCOMP, CODPREFIJO, NUMERO, FECHA, OBSERV, PERIODO,
                    CENID, AREADID, SUCID, CLIENTE, VENDEDOR, FORMAPAGO,
                    PLAZODIAS, VRBASE, VRIVA, TOTAL, USUARIO, HORA, HORACREA, MONEDA,
                    BCOID, CODDESPACHAA, NOMDESPACHA, DESPACHAR_A,
                    RETIVA, RETICA, RETFTE, AJUSTEBASE, AJUSTEIVA, AJUSTEIVAEXC, AJUSTENETO,
                    VRICONSUMO, VRRFTE, VRRIVA, VRRICA, FPCONTADO, DESXCAMBIO, VRIVAEXC,
                    RETCREE, VRRCREE, NETOIVA, NETOIVAEXC, TIPOFACTURA, VRADVA, VRDCTOS,
                    VRINC, VRIPUU, VRICUI,
                    FECVENCE, FPCREDITO
                ) VALUES (
                    ?, ?, ?, CAST(? AS DATE), ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?
                )
            `;
            
            // Forzar FECHA solo fecha (YYYY-MM-DD) para que almacene sin hora
            const fechaParam = String(fecha || '').slice(0, 10);
            // Calcular FECVENCE = FECHA + PLAZODIAS (si CRÉDITO), si no, igual a FECHA
            const plazodiasVal = Number(plazodias || 25);
            function addDays(dateStr, days) {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                d.setDate(d.getDate() + (Number.isFinite(days) ? days : 0));
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
            const fecVenceParam = (String(formapago || 'CR').toUpperCase() === 'CR')
                ? addDays(fechaParam, plazodiasVal)
                : fechaParam;
            
            // Obtener CODDESPACHAA del cliente: NIT o fallback TERID (máx 20 chars)
            let codDespachaA = '';
            try {
                const nitRows = await executeQueryInTransaction(
                    transaction,
                    `SELECT COALESCE(NULLIF(TRIM(NIT), ''), CAST(TERID AS VARCHAR(20))) AS COD
                     FROM TERCEROS WHERE TERID = ?`,
                    [cliente]
                );
                codDespachaA = (nitRows && nitRows[0] && (nitRows[0].COD || '').toString().trim()) || '';
                if (codDespachaA.length > 20) {
                    codDespachaA = codDespachaA.slice(0, 20);
                }
            } catch (_) {}

            // Obtener nombre del cliente para NOMDESPACHA (máx 120 chars)
            let nomDespacha = '';
            try {
                const nomRows = await executeQueryInTransaction(
                    transaction,
                    'SELECT NOMBRE FROM TERCEROS WHERE TERID = ?',
                    [cliente]
                );
                nomDespacha = (nomRows && nomRows[0] && (nomRows[0].NOMBRE || '').toString().trim()) || '';
                if (nomDespacha.length > 120) {
                    nomDespacha = nomDespacha.slice(0, 120);
                }
            } catch (_) {}

            let kardexId;
            const pedidoParams = [
                codcompVal,                                  // CODCOMP
                codprefijoVal,                               // CODPREFIJO
                String(numeroVal),                           // NUMERO
                fechaParam,                                   // FECHA (Date)
                observTrunc,                                 // OBSERV (máx 500)
                periodoCalc,                                 // PERIODO derivado
                cenid || 1,                                  // CENID
                areadid || 1,                                // AREADID
                sucid,                                       // SUCID
                cliente,                                     // CLIENTE
                vendedor,                                    // VENDEDOR
                formapago || 'CR',                           // FORMAPAGO
                plazodias || 25,                             // PLAZODIAS
                0,                                           // VRBASE (se actualizará después)
                0,                                           // VRIVA (se actualizará después)
                0,                                           // TOTAL (se actualizará después)
                'ADMIN',                                     // USUARIO
                horaActual,                                  // HORA
                horaActual,                                  // HORACREA
                moneda || 'COP',                             // MONEDA
                12,                                          // BCOID fijo
                codDespachaA,                                // CODDESPACHAA (NIT/TERID del cliente)
                nomDespacha,                                 // NOMDESPACHA (nombre cliente)
                Number(cliente) || 0,                        // DESPACHAR_A (TERID del cliente)
                0,                                           // RETIVA
                0,                                           // RETICA
                0,                                           // RETFTE
                0,                                           // AJUSTEBASE
                0,                                           // AJUSTEIVA
                0,                                           // AJUSTEIVAEXC
                0,                                           // AJUSTENETO
                0,                                           // VRICONSUMO
                0,                                           // VRRFTE
                0,                                           // VRRIVA
                0,                                           // VRRICA
                0,                                           // FPCONTADO
                0,                                           // DESXCAMBIO
                0,                                           // VRIVAEXC
                0,                                           // RETCREE
                0,                                           // VRRCREE
                0,                                           // NETOIVA
                0,                                           // NETOIVAEXC
                0,                                           // TIPOFACTURA
                0,                                           // VRADVA
                0,                                           // VRDCTOS
                0,                                           // VRINC
                0,                                           // VRIPUU
                0,                                           // VRICUI
                fecVenceParam,                               // FECVENCE (YYYY-MM-DD)
                (String(formapago || 'CR').toUpperCase() === 'CR') ? 1 : 0  // FPCREDITO (1/0)
            ];
            
            try {
                await executeQueryInTransaction(transaction, insertPedidoQuery, pedidoParams);
                const idRows = await executeQueryInTransaction(
                    transaction,
                    `SELECT KARDEXID FROM KARDEX 
                     WHERE CODCOMP = ? AND CODPREFIJO = ? AND NUMERO = ? AND SUCID = ?
                     ORDER BY KARDEXID DESC ROWS 1`,
                    [codcompVal, codprefijoVal, String(numeroVal), sucid]
                );
                kardexId = Number(idRows && idRows[0] && idRows[0].KARDEXID);
            } catch (e) {
                console.error('Fallo INSERT KARDEX', { insertPedidoQuery, pedidoParams });
                throw e;
            }
            
            // Insertar las líneas del pedido
            let totalDocumento = 0; // VRBASE acumulado (sin IVA)
            let totalIVA = 0;       // IVA acumulado
            
            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i];
                
                if (!linea.matid || !linea.cantidad) {
                    throw new Error(`Línea ${i + 1} incompleta: MATID y CANTIDAD son obligatorios`);
                }
                
                // Cálculos por unidad y totales de documento
                const cantidad = Number(linea.cantidad);
                let precioUnit = Number(linea.precio);
                const descuentoUnit = Number(linea.descuento || 0);
                let porciva;
                if (linea.porciva !== undefined && linea.porciva !== null) {
                    porciva = Number(linea.porciva);
                } else {
                    const ivaRows = await executeQueryInTransaction(
                        transaction,
                        `SELECT COALESCE(TI.PORCIVA, 0) AS PORCIVA
                         FROM MATERIAL M
                         LEFT JOIN TIPOIVA TI ON TI.TIPOIVAID = M.TIPOIVAID
                         WHERE M.MATID = ?`,
                        [linea.matid]
                    );
                    const materialPorcIva = Number((ivaRows && ivaRows[0] && ivaRows[0].PORCIVA) || 0);
                    porciva = Number.isFinite(materialPorcIva) ? materialPorcIva : 0;
                }

                // Siempre traer PRECIOLISTA desde MATERIALSUC.PRECIO1 (consulta por MATID+SUCID)
                // Buscar precio lista: PRECIO1..PRECIO10, si no,
                let precioListaRows2 = await executeQueryInTransaction(
                    transaction,
                    `SELECT FIRST 1 
                        PRECIO1, PRECIO2, PRECIO3, PRECIO4, PRECIO5
                     FROM MATERIALSUC WHERE MATID = ? AND SUCID = ?`,
                    [linea.matid, sucid]
                );
                let precioListaUnit = 0;
                const pickPrecio = (row) => {
                    if (!row) return 0;
                    const candidates = [
                        row.PRECIO1, row.PRECIO2, row.PRECIO3, row.PRECIO4, row.PRECIO5
                    ];
                    for (const v of candidates) {
                        const n = Number(v || 0);
                        if (Number.isFinite(n) && n > 0) return n;
                    }
                    return 0;
                };
                precioListaUnit = pickPrecio(precioListaRows2 && precioListaRows2[0]);
                if (!Number.isFinite(precioListaUnit) || precioListaUnit <= 0) {
                    // Fallback adicional: cualquier sucursal
                    precioListaRows2 = await executeQueryInTransaction(
                        transaction,
                        `SELECT FIRST 1 
                            PRECIO1, PRECIO2, PRECIO3, PRECIO4, PRECIO5
                         FROM MATERIALSUC WHERE MATID = ? ORDER BY SUCID`,
                        [linea.matid]
                    );
                    precioListaUnit = pickPrecio(precioListaRows2 && precioListaRows2[0]);
                }
                if (!Number.isFinite(precioListaUnit) || precioListaUnit <= 0) {
                    precioListaUnit = 1; // Fallback por requerimiento
                }

                // PRECIOVTA por defecto igual a PRECIO1 si no viene en payload o es inválido
                const usarPrecioSucursal = Boolean(req.body.usarPrecioSucursal);
                if (usarPrecioSucursal || !Number.isFinite(precioUnit) || precioUnit <= 0) {
                    precioUnit = precioListaUnit;
                }

                const precioBaseUnit = precioUnit - descuentoUnit; // Base por unidad (sin IVA)
                if (precioBaseUnit < 0) {
                    throw new Error(`Línea ${i + 1} inválida: el descuento por unidad no puede superar el precio`);
                }
                if (!Number.isFinite(cantidad) || cantidad <= 0) {
                    throw new Error(`Línea ${i + 1} inválida: la cantidad debe ser mayor que cero`);
                }
                if (!Number.isFinite(precioUnit) || precioUnit < 0) {
                    throw new Error(`Línea ${i + 1} inválida: el precio no puede ser negativo`);
                }
                const ivaUnit = round2(precioBaseUnit * (porciva / 100));
                const precioNetoUnit = round2(precioBaseUnit + ivaUnit); // Neto por unidad (incluye IVA)
                
                // CORRECCIÓN: Ajustado para que coincidan los campos con los parámetros
                const insertLineaQuery = `
                    INSERT INTO DEKARDEX (
                        KARDEXID, MATID, BODID, REMTOTFAC,
                        TIPUND, PORCIVA, DESCUENTO, CANLISTA, CANMAT, 
                        PRECIOLISTA, PRECIOVTA, PRECIOBASE, PRECIOIVA, 
                        PRECIONETO, PARCVTA, SALCAN, SALCOST, IMPRESO, PRECIOEXCENTO, PRECIOICONSUMO, DAJUSTEBASE, PRECIOIPUU, IMPICUI
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const lineaParams = [
                    kardexId,                      // KARDEXID
                    linea.matid,                   // MATID
                    linea.bodid || 1,              // BODID
                    //'N',                           // PRIORIDAD
                    0,                             // REMTOTFAC
                    (linea.tipund || linea.TIPUND || 'D'), // TIPUND
                    porciva,                       // PORCIVA
                    descuentoUnit,                 // DESCUENTO (por unidad)
                    cantidad,                      // CANLISTA
                    cantidad,                      // CANMAT
                    // PRECIOLISTA: si el usuario digitó precio (PRECIOVTA), usar ese valor.
                    // Si envió PRECIOLISTA explícito y > 0, respetarlo; de lo contrario usar PRECIOVTA efectivo.
                    (Number.isFinite(Number(linea.preciolista)) && Number(linea.preciolista) > 0)
                        ? round2(Number(linea.preciolista))
                        : round2(precioUnit),
                    precioUnit,                    // PRECIOVTA (por unidad)
                    round2(precioBaseUnit),        // PRECIOBASE (por unidad, sin IVA)
                    round2(ivaUnit),               // PRECIOIVA (IVA por unidad)
                    round2(precioNetoUnit),        // PRECIONETO (por unidad, con IVA)
                    round2(precioNetoUnit * cantidad), // PARCVTA (total línea)
                    cantidad,                      // SALCAN
                    0,                              // SALCOST
                    'N',                           // IMPRESO
                    0,                              // PRECIOEXCENTO
                    0,                              // PRECIOICONSUMO
                    0,                               // DAJUSTEBASE
                    0,                               // PRECIOIPUU
                    0                                // IMPICUI
                ];
                
                try {
                    await executeQueryInTransaction(transaction, insertLineaQuery, lineaParams);
                } catch (e) {
                    console.error('Fallo INSERT DEKARDEX', { insertLineaQuery, lineaParams });
                    throw e;
                }
                
                totalDocumento += round2(precioBaseUnit * cantidad); // acumular base
                totalIVA += round2(ivaUnit * cantidad);              // acumular IVA
            }
            
            // Actualizar totales del documento
            const totalGeneral = round2(totalDocumento + totalIVA);
            
            const updateTotalesQuery = `
                UPDATE KARDEX 
                SET VRBASE = ?, VRIVA = ?, TOTAL = ?,
                    NETO = ?, NETOBASE = ?, VRTOTAL = ?,
                    FECVENCE = ?, FPCREDITO = ?
                WHERE KARDEXID = ?
            `;
            
            await executeQueryInTransaction(transaction, updateTotalesQuery, [
                totalDocumento, totalIVA, totalGeneral,
                totalGeneral, totalDocumento, totalGeneral,
                fecVenceParam, (String(formapago || 'CR').toUpperCase() === 'CR') ? 1 : 0,
                kardexId
            ]);
            
            return kardexId;
        });
        
        // Obtener el pedido creado
        const pedidoCreadoQuery = `
            SELECT 
                K.KARDEXID,
                K.NUMERO,
                K.FECHA,
                K.FECVENCE,
                K.CLIENTE,
                K.VENDEDOR,
                K.SUCID,
                K.CENID,
                K.CODCOMP,
                K.CODPREFIJO,
                K.BCOID,
                K.CODDESPACHAA,
                K.NOMDESPACHA,
                K.DESPACHAR_A,
                K.VRBASE,
                K.VRIVA,
                K.TOTAL,
                K.NETO,
                K.NETOBASE,
                K.VRTOTAL,
                K.OBSERV,
                K.PERIODO,
                K.FORMAPAGO,
                K.FPCREDITO,
                K.USUARIO,
                K.HORA,
                K.MONEDA,
                T.NOMBRE as CLIENTE_NOMBRE,
                V.NOMBRE as VENDEDOR_NOMBRE
            FROM KARDEX K
            INNER JOIN TERCEROS T ON K.CLIENTE = T.TERID
            INNER JOIN TERCEROS V ON K.VENDEDOR = V.TERID
            WHERE K.KARDEXID = ?
        `;
        
        const pedidoCreado = await executeQuery(pedidoCreadoQuery, [resultado]);
        
        res.status(201).json({
            success: true,
            data: pedidoCreado[0],
            message: 'Pedido creado exitosamente',
            pedidoId: resultado
        });
        
    } catch (error) {
        if (error && (error.code === 'CONSECUTIVO_DUPLICADO' || error.status === 409)) {
            return res.status(409).json({
                success: false,
                error: 'Número duplicado',
                message: error.message,
                data: error.data || null
            });
        }
        next(error);
    } finally {
        if (connection) {
            connection.detach();
        }
    }
});

module.exports = router;


/**
 * DOCUMENTACIÓN API - GESTIÓN DE PEDIDOS
 * 
 * Esta API permite crear y consultar pedidos en el sistema TNS.
 * Incluye validación de clientes, vendedores y generación automática de consecutivos.
 * 
 * ENDPOINTS DISPONIBLES:
 * - GET /api/pedidos/:id - Obtener pedido específico
 * - POST /api/pedidos - Crear nuevo pedido
 * 
 * CARACTERÍSTICAS:
 * - Validación de referencias (cliente, vendedor, bodega)
 * - Generación automática de consecutivos
 * - Transacciones para consistencia de datos
 * - Cálculo automático de totales
 * - Prevención de duplicados
 */

/*
===============================================
ENDPOINT: GET /api/pedidos/:id
===============================================

DESCRIPCIÓN:
Obtiene los datos completos de un pedido específico incluyendo información del cliente y vendedor.

CURL PARA OBTENER PEDIDO:
curl -X GET \
  http://localhost:51250/api/pedidos/12345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token"

RESPUESTA EXITOSA:
{
  "success": true,
  "data": {
    "KARDEXID": 12345,
    "CODCOMP": "VT",
    "CODPREFIJO": "PV",
    "NUMERO": 1001,
    "FECHA": "2024-01-15",
    "CLIENTE": 567,
    "VENDEDOR": 89,
    "BODEGA": 1,
    "NOMDESPACHA": "Juan Pérez",
    "DESPACHAR_A": "Calle 123 #45-67",
    "VRBASE": 84033.61,
    "VRIVA": 15966.39,
    "TOTAL": 100000.00,
    "OBSERV": "Pedido urgente",
    "FORMAPAGO": "CONTADO",
    "USUARIO": 1,
    "MONEDA": "COP",
    "CLIENTE_NOMBRE": "EMPRESA ABC LTDA",
    "VENDEDOR_NOMBRE": "María López"
  }
}

RESPUESTA ERROR (Pedido no encontrado):
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Pedido no encontrado"
}

===============================================
ENDPOINT: POST /api/pedidos
===============================================

DESCRIPCIÓN:
Crea un nuevo pedido en el sistema con validación completa y generación automática de consecutivo.

JSON MÍNIMO REQUERIDO:
{
  "cliente": 567,
  "vendedor": 89,
  "bodega": 1
}

CURL MÍNIMO:
curl -X POST \
  http://localhost:51250/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "cliente": 567,
    "vendedor": 89,
    "bodega": 1
  }'

JSON COMPLETO CON TODOS LOS CAMPOS:
{
  "cliente": 567,
  "vendedor": 89,
  "bodega": 1,
  "nomdespacha": "Juan Pérez",
  "despachar_a": "Calle 123 #45-67, Bogotá",
  "observ": "Pedido con descuento especial - Cliente VIP",
  "formapago": "CREDITO",
  "plazodias": 30,
  "moneda": "COP",
  "descuentoglobal": 5.0,
  "usuario": 1
}

CURL COMPLETO:
curl -X POST \
  http://localhost:51250/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "cliente": 567,
    "vendedor": 89,
    "bodega": 1,
    "nomdespacha": "Juan Pérez",
    "despachar_a": "Calle 123 #45-67, Bogotá",
    "observ": "Pedido con descuento especial - Cliente VIP",
    "formapago": "CREDITO",
    "plazodias": 30,
    "moneda": "COP",
    "descuentoglobal": 5.0,
    "usuario": 1
  }'

JSON PARA PEDIDO DE CONTADO:
{
  "cliente": 123,
  "vendedor": 45,
  "bodega": 2,
  "nomdespacha": "Ana García",
  "despachar_a": "Carrera 15 #30-25, Medellín",
  "observ": "Entrega inmediata",
  "formapago": "CONTADO",
  "moneda": "COP"
}

CURL PARA PEDIDO DE CONTADO:
curl -X POST \
  http://localhost:51250/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "cliente": 123,
    "vendedor": 45,
    "bodega": 2,
    "nomdespacha": "Ana García",
    "despachar_a": "Carrera 15 #30-25, Medellín",
    "observ": "Entrega inmediata",
    "formapago": "CONTADO",
    "moneda": "COP"
  }'

JSON PARA PEDIDO A CRÉDITO:
{
  "cliente": 789,
  "vendedor": 12,
  "bodega": 3,
  "nomdespacha": "Carlos Rodríguez",
  "despachar_a": "Avenida 68 #25-30, Cali",
  "observ": "Cliente preferencial - 60 días de plazo",
  "formapago": "CREDITO",
  "plazodias": 60,
  "moneda": "COP",
  "descuentoglobal": 3.0
}

CURL PARA PEDIDO A CRÉDITO:
curl -X POST \
  http://localhost:51250/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "cliente": 789,
    "vendedor": 12,
    "bodega": 3,
    "nomdespacha": "Carlos Rodríguez",
    "despachar_a": "Avenida 68 #25-30, Cali",
    "observ": "Cliente preferencial - 60 días de plazo",
    "formapago": "CREDITO",
    "plazodias": 60,
    "moneda": "COP",
    "descuentoglobal": 3.0
  }'

RESPUESTA EXITOSA (PEDIDO CREADO):
{
  "success": true,
  "data": {
    "KARDEXID": 12346,
    "CODCOMP": "VT",
    "CODPREFIJO": "PV",
    "NUMERO": 1002,
    "FECHA": "2024-01-15",
    "CLIENTE": 567,
    "VENDEDOR": 89,
    "BODEGA": 1,
    "NOMDESPACHA": "Juan Pérez",
    "DESPACHAR_A": "Calle 123 #45-67, Bogotá",
    "VRBASE": 0.00,
    "VRIVA": 0.00,
    "TOTAL": 0.00,
    "OBSERV": "Pedido con descuento especial - Cliente VIP",
    "FORMAPAGO": "CREDITO",
    "PLAZODIAS": 30,
    "USUARIO": 1,
    "MONEDA": "COP",
    "CLIENTE_NOMBRE": "EMPRESA ABC LTDA",
    "VENDEDOR_NOMBRE": "María López"
  },
  "message": "Pedido creado exitosamente",
  "pedidoId": 12346
}

ERRORES COMUNES Y RESPUESTAS:

ERROR - Cliente no encontrado:
{
  "success": false,
  "error": "CLIENTE_NO_ENCONTRADO",
  "message": "No existe un cliente con TERID: 99999"
}

ERROR - Vendedor no encontrado:
{
  "success": false,
  "error": "VENDEDOR_NO_ENCONTRADO", 
  "message": "No existe un vendedor con TERID: 99999"
}

ERROR - Bodega no encontrada:
{
  "success": false,
  "error": "BODEGA_NO_ENCONTRADA",
  "message": "No existe una bodega con BODID: 99999"
}

ERROR - Número duplicado:
{
  "success": false,
  "error": "Número duplicado",
  "message": "Ya existe un pedido con número 1001 para el prefijo PV",
  "data": {
    "numero": 1001,
    "prefijo": "PV",
    "sugerido": 1003
  }
}

ERROR - Datos faltantes:
{
  "success": false,
  "error": "CAMPOS_REQUERIDOS",
  "message": "Los campos cliente, vendedor y bodega son obligatorios"
}

===============================================
EJEMPLOS DE TESTING CON JEST
===============================================

describe('API Pedidos', () => {
  test('Debe crear un pedido con datos mínimos', async () => {
    const pedidoData = {
      cliente: 567,
      vendedor: 89,
      bodega: 1
    };
    
    const response = await request(app)
      .post('/api/pedidos')
      .send(pedidoData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('KARDEXID');
    expect(response.body.data.CLIENTE).toBe(567);
  });

  test('Debe obtener un pedido existente', async () => {
    const response = await request(app)
      .get('/api/pedidos/12345')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('CLIENTE_NOMBRE');
  });

  test('Debe retornar error para cliente inexistente', async () => {
    const pedidoData = {
      cliente: 99999,
      vendedor: 89,
      bodega: 1
    };
    
    const response = await request(app)
      .post('/api/pedidos')
      .send(pedidoData)
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('CLIENTE_NO_ENCONTRADO');
  });
});

===============================================
EJEMPLOS DE TESTING CON POSTMAN
===============================================

Test 1: Crear pedido exitoso
- Method: POST
- URL: {{base_url}}/api/pedidos
- Headers: 
  Content-Type: application/json
  Authorization: Bearer {{token}}
- Body (raw JSON):
  {
    "cliente": 567,
    "vendedor": 89,
    "bodega": 1,
    "observ": "Test desde Postman"
  }
- Tests (JavaScript):
  pm.test("Status code is 201", function () {
      pm.response.to.have.status(201);
  });
  pm.test("Response has pedidoId", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.success).to.eql(true);
      pm.expect(jsonData).to.have.property('pedidoId');
      pm.environment.set("pedido_id", jsonData.pedidoId);
  });

Test 2: Obtener pedido creado
- Method: GET
- URL: {{base_url}}/api/pedidos/{{pedido_id}}
- Headers:
  Content-Type: application/json
  Authorization: Bearer {{token}}
- Tests (JavaScript):
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });
  pm.test("Response has client data", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.data).to.have.property('CLIENTE_NOMBRE');
  });

===============================================
CAMPOS PRINCIPALES DE KARDEX (PEDIDOS)
===============================================

CAMPOS OBLIGATORIOS:
- CLIENTE: ID del cliente (FK a TERCEROS)
- VENDEDOR: ID del vendedor (FK a TERCEROS)
- BODEGA: ID de bodega (FK a BODEGA)

CAMPOS OPCIONALES:
- NOMDESPACHA: Nombre para despacho
- DESPACHAR_A: Dirección de despacho
- OBSERV: Observaciones del pedido
- FORMAPAGO: Forma de pago (CONTADO/CREDITO)
- PLAZODIAS: Plazo en días (para crédito)
- MONEDA: Moneda del pedido
- DESCUENTOGLOBAL: Descuento global en porcentaje
- USUARIO: ID del usuario que crea el pedido

CAMPOS AUTOGENERADOS:
- KARDEXID: ID único del pedido
- CODCOMP: Código de compañía (VT)
- CODPREFIJO: Prefijo del consecutivo (PV)
- NUMERO: Número consecutivo
- FECHA: Fecha de creación
- VRBASE: Valor base (calculado)
- VRIVA: Valor IVA (calculado)
- TOTAL: Total del pedido (calculado)

===============================================
BUENAS PRÁCTICAS DE SEGURIDAD
===============================================

1. Validar existencia de referencias antes de insertar
2. Sanitizar todos los inputs para prevenir SQL injection
3. Usar transacciones para mantener consistencia
4. Validar permisos del usuario para crear pedidos
5. Implementar rate limiting para prevenir spam
6. Logging de todas las operaciones para auditoría
7. Validar rangos de fechas y valores numéricos
8. Encriptar datos sensibles en tránsito y reposo
9. Validar formato de campos de texto (observaciones, direcciones)
10. Implementar timeout en consultas largas

===============================================
CÓDIGOS DE ESTADO HTTP
===============================================

200 OK: Consulta exitosa
201 Created: Pedido creado exitosamente
400 Bad Request: Datos inválidos o faltantes
401 Unauthorized: Token inválido o expirado
403 Forbidden: Sin permisos
404 Not Found: Pedido no encontrado
409 Conflict: Número duplicado
500 Internal Server Error: Error del servidor
*/

