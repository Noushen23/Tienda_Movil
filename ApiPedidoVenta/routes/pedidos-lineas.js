/**
 * Rutas para gestión completa de Líneas de Pedidos (DEKARDEX)
 * Endpoint: /api/pedidos-lineas
 * CRUD completo: Crear, Leer, Actualizar, Eliminar líneas de pedidos
 * Sistema TNS - Estructura real respetada
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

// Verifica si el pedido tiene información de facturación, priorizando DEKARDEX.REMTOTFAC/REMTOFAC y luego DEKARDEXSELF
async function isPedidoFacturadoInTx(transaction, kardexId) {
	const runner = (query, params) => new Promise((resolve, reject) => {
		try {
			transaction.query(query, params, (err, result) => err ? reject(err) : resolve(result));
		} catch (err) {
			reject(err);
		}
	});
    // 0) Preferir verificación por columna REMTOTFAC/REMTOFAC en DEKARDEX
    try {
        const col = await runner(
            `SELECT COUNT(*) AS CNT
             FROM RDB$RELATION_FIELDS
             WHERE TRIM(UPPER(RDB$RELATION_NAME)) = 'DEKARDEX'
               AND TRIM(UPPER(RDB$FIELD_NAME)) IN ('REMTOTFAC','REMTOFAC')`,
            []
        );
        const hasRemTotFac = Number(col && col[0] && (col[0].CNT || col[0].cnt) || 0) > 0;
        if (hasRemTotFac) {
            try {
                const r = await runner(
                    'SELECT COUNT(*) AS CNT FROM DEKARDEX WHERE KARDEXID = ? AND COALESCE(REMTOTFAC, 0) <> 0',
                    [kardexId]
                );
                const cnt = Number(r && r[0] && (r[0].CNT || r[0].cnt) || 0);
                if (cnt > 0) return true;
            } catch (e1) {
                try {
                    const rAlt = await runner(
                        'SELECT COUNT(*) AS CNT FROM DEKARDEX WHERE KARDEXID = ? AND COALESCE(REMTOFAC, 0) <> 0',
                        [kardexId]
                    );
                    const cntAlt = Number(rAlt && rAlt[0] && (rAlt[0].CNT || rAlt[0].cnt) || 0);
                    if (cntAlt > 0) return true;
                } catch (e2) {
                    console.warn('[isPedidoFacturadoInTx] Error consultando DEKARDEX.REMTOTFAC/REMTOFAC:', e1 && e1.message, e2 && e2.message);
                }
            }
        }
    } catch (e) {
        console.warn('[isPedidoFacturadoInTx] No se pudo validar columnas en DEKARDEX:', e && e.message);
    }
	// 1) Confirmar existencia de la tabla
	try {
		const rel = await runner(
			'SELECT COUNT(*) AS CNT FROM RDB$RELATIONS WHERE TRIM(UPPER(RDB$RELATION_NAME)) = ?',
			['DEKARDEXSELF']
		);
		const exists = Number(rel && rel[0] && (rel[0].CNT || rel[0].cnt) || 0) > 0;
		if (!exists) return false;
	} catch (e) {
		console.warn('[isPedidoFacturadoInTx] No se pudo consultar metadata de RDB$RELATIONS:', e && e.message);
		return false;
	}
	// 2) Consultar por PEDIDOID
	try {
		const r2 = await runner('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE PEDIDOID = ?', [kardexId]);
		const c2 = Number(r2 && r2[0] && (r2[0].CNT || r2[0].cnt) || 0);
		if (c2 > 0) return true;
	} catch (e) {
		console.warn('[isPedidoFacturadoInTx] Error consultando DEKARDEXSELF.PEDIDOID:', e && e.message);
	}
	return false;
}

// Redondeo a 2 decimales
function round2(value) {
    const num = Number(value) || 0;
    return Math.round(num * 100) / 100;
}


// GET /api/pedidos-lineas - Obtener líneas de pedidos con paginación y filtros
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 50, kardexid, matid, bodid, search } = req.query;
        
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        // Construir WHERE dinámicamente
        let whereConditions = [];
        let params = [];
        
        if (kardexid) {
            whereConditions.push("D.KARDEXID = ?");
            params.push(kardexid);
        }
        if (matid) {
            whereConditions.push("D.MATID = ?");
            params.push(matid);
        }
        if (bodid) {
            whereConditions.push("D.BODID = ?");
            params.push(bodid);
        }
        if (search) {
            whereConditions.push("(M.DESCRIP LIKE ? OR M.CODIGO LIKE ?)");
            params.push(`%${search}%`, `%${search}%`);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Query para contar total
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM DEKARDEX D
            INNER JOIN MATERIAL M ON D.MATID = M.MATID
            INNER JOIN KARDEX K ON D.KARDEXID = K.KARDEXID
            ${whereClause}
        `;
        
        const totalResult = await executeQuery(countQuery, params);
        const total = totalResult[0].TOTAL;
        
        // Query principal con paginación y JOINs
        const query = `
            SELECT FIRST ${limitNum} SKIP ${offset}
                D.DEKARDEXID, D.KARDEXID, D.MATID, D.BODID,
                D.TIPUND, D.PORCIVA, D.DESCUENTO, D.CANLISTA, D.CANMAT, D.PRECIOLISTA,
                D.PRECIOVTA, D.PRECIOBASE, D.PRECIOIVA, D.PRECIONETO, D.PARCVTA, D.SALCAN,
                D.SALCOST, D.IMPRESO, COALESCE(D.PRECIOEXCENTO, 0) AS PRECIOEXCENTO,
                COALESCE(D.PRECIOICONSUMO, 0) AS PRECIOICONSUMO, COALESCE(D.DAJUSTEBASE, 0) AS DAJUSTEBASE,
                M.DESCRIP as MATERIAL_DESCRIPCION, M.CODIGO as MATERIAL_CODIGO, M.UNIDAD as MATERIAL_UNIDAD,
                B.NOMBRE as BODEGA_NOMBRE, K.NUMERO as PEDIDO_NUMERO, K.FECHA as PEDIDO_FECHA,
                K.CLIENTE as PEDIDO_CLIENTE, K.VENDEDOR as PEDIDO_VENDEDOR
            FROM DEKARDEX D
            INNER JOIN MATERIAL M ON D.MATID = M.MATID
            INNER JOIN BODEGA B ON D.BODID = B.BODID
            INNER JOIN KARDEX K ON D.KARDEXID = K.KARDEXID
            ${whereClause}
            ORDER BY D.KARDEXID DESC, D.DEKARDEXID DESC
        `;
        
        const lineas = await executeQuery(query, params);
        
        // Calcular paginación
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        
        res.json({
            success: true,
            data: lineas,
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

// GET /api/pedidos-lineas/:id - Obtener línea específica por ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        
        const query = `
            SELECT 
                D.DEKARDEXID, D.KARDEXID, D.MATID, D.BODID, D.TIPUND,
                D.PORCIVA, D.DESCUENTO, D.CANLISTA, D.CANMAT, D.PRECIOLISTA, D.PRECIOVTA,
                D.PRECIOBASE, D.PRECIOIVA, D.PRECIONETO, D.PARCVTA, D.SALCAN, D.SALCOST, D.IMPRESO,
                D.PRECIOEXCENTO, D.PRECIOICONSUMO, D.DAJUSTEBASE, M.DESCRIP as MATERIAL_DESCRIPCION,
                M.CODIGO as MATERIAL_CODIGO, M.UNIDAD as MATERIAL_UNIDAD, B.NOMBRE as BODEGA_NOMBRE,
                K.NUMERO as PEDIDO_NUMERO, K.FECHA as PEDIDO_FECHA, K.CLIENTE as PEDIDO_CLIENTE,
                K.VENDEDOR as PEDIDO_VENDEDOR
            FROM DEKARDEX D
            INNER JOIN MATERIAL M ON D.MATID = M.MATID
            INNER JOIN BODEGA B ON D.BODID = B.BODID
            INNER JOIN KARDEX K ON D.KARDEXID = K.KARDEXID
            WHERE D.DEKARDEXID = ?
        `;
        
        const linea = await executeQuery(query, [idNum]);
        
        if (!linea || linea.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Línea no encontrada',
                message: `No se encontró la línea con ID: ${id}`
            });
        }
        
        res.json({
            success: true,
            data: linea[0]
        });
        
    } catch (error) {
        next(error);
    }
});

// GET /api/pedidos-lineas/pedido/:kardexid - Obtener todas las líneas de un pedido específico
router.get('/pedido/:kardexid', async (req, res, next) => {
    try {
        const { kardexid } = req.params;
        const kidNum = parseInt(String(kardexid), 10);
        if (!Number.isFinite(kidNum) || kidNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro kardexid debe ser numérico y mayor a cero' });
        }
        
        const query = `
            SELECT 
                D.DEKARDEXID, D.KARDEXID, D.MATID, D.BODID, D.TIPUND,
                D.PORCIVA, D.DESCUENTO, D.CANLISTA, D.CANMAT, D.PRECIOLISTA, D.PRECIOVTA,
                D.PRECIOBASE, D.PRECIOIVA, D.PRECIONETO, D.PARCVTA, D.SALCAN, D.SALCOST, D.IMPRESO,
                M.DESCRIP as MATERIAL_DESCRIPCION, M.CODIGO as MATERIAL_CODIGO, M.UNIDAD as MATERIAL_UNIDAD,
                B.NOMBRE as BODEGA_NOMBRE
            FROM DEKARDEX D
            INNER JOIN MATERIAL M ON D.MATID = M.MATID
            INNER JOIN BODEGA B ON D.BODID = B.BODID
            WHERE D.KARDEXID = ?
            ORDER BY D.DEKARDEXID ASC
        `;
        
        const lineas = await executeQuery(query, [kidNum]);
        
        res.json({
            success: true,
            data: lineas,
            total: lineas.length
        });
        
    } catch (error) {
        next(error);
    }
});

// POST /api/pedidos-lineas - Crear nueva línea de pedido
router.post('/', async (req, res, next) => {
    let connection;
    try {
        const { 
            kardexid, matid, bodid, tipund, porciva, descuento,
            canlista, canmat, preciolista, preciovta, preciobase, precioiva, precioneto,
            parcvta, salcan, salcost, impreso
        } = req.body;
        const usarPrecioSucursal = Boolean(req.body && req.body.usarPrecioSucursal);
        
        // Validaciones básicas
        if (!kardexid || !matid || !bodid) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'KARDEXID, MATID y BODID son obligatorios'
            });
        }

        const kardexIdNum = parseInt(String(kardexid), 10);
        const matIdNum = parseInt(String(matid), 10);
        const bodIdNum = parseInt(String(bodid), 10);
        if (!Number.isFinite(kardexIdNum) || kardexIdNum <= 0 ||
            !Number.isFinite(matIdNum) || matIdNum <= 0 ||
            !Number.isFinite(bodIdNum) || bodIdNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_PARAMS', message: 'KARDEXID, MATID y BODID deben ser numéricos > 0' });
        }
        
        // Verificar que el pedido existe
        const pedidoExisteQuery = 'SELECT COUNT(*) as total FROM KARDEX WHERE KARDEXID = ?';
        const pedidoExiste = await executeQuery(pedidoExisteQuery, [kardexIdNum]);
        
        if (pedidoExiste[0].TOTAL === 0) {
            return res.status(404).json({
                success: false,
                error: 'Pedido no encontrado',
                message: `No existe un pedido con KARDEXID: ${kardexid}`
            });
        }
        
        // Verificar que el material existe
        const materialExisteQuery = 'SELECT COUNT(*) as total FROM MATERIAL WHERE MATID = ?';
        const materialExiste = await executeQuery(materialExisteQuery, [matIdNum]);
        
        if (materialExiste[0].TOTAL === 0) {
            return res.status(404).json({
                success: false,
                error: 'Material no encontrado',
                message: `No existe un material con MATID: ${matid}`
            });
        }
        
        // Verificar que la bodega existe
        const bodegaExisteQuery = 'SELECT COUNT(*) as total FROM BODEGA WHERE BODID = ?';
        const bodegaExiste = await executeQuery(bodegaExisteQuery, [bodIdNum]);
        
        if (bodegaExiste[0].TOTAL === 0) {
            return res.status(404).json({
                success: false,
                error: 'Bodega no encontrada',
                message: `No existe una bodega con BODID: ${bodid}`
            });
        }
        
        // Ejecutar en transacción: inserción de línea + recalculo de totales
        connection = await createConnection();
        const resultado = await executeTransactionWithCallback(connection, async (transaction) => {
            // Estado del pedido: no permitir si asentado, anulado o facturado
            const pedRows = await executeQueryInTransaction(
                transaction,
                'SELECT KARDEXID, FECASENTAD, FECANULADO FROM KARDEX WHERE KARDEXID = ?',
                [kardexIdNum]
            );
            if (!pedRows || pedRows.length === 0) {
                const e = new Error(`Pedido no encontrado (KARDEXID=${kardexIdNum})`); e.status = 404; throw e;
            }
            if (pedRows[0].FECASENTAD) { const e = new Error('No se puede crear línea: pedido asentado'); e.status = 400; e.code = 'PEDIDO_ASENTADO'; throw e; }
            if (pedRows[0].FECANULADO) { const e = new Error('No se puede crear línea: pedido anulado'); e.status = 400; e.code = 'PEDIDO_ANULADO'; throw e; }
            const fact = await isPedidoFacturadoInTx(transaction, kardexIdNum);
            if (fact) { const e = new Error('No se puede crear línea: pedido facturado'); e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e; }

            // Derivar valores si no fueron enviados y validar consistencia
            const cantidad = Number(canmat || canlista || 0);
            let precioUnit = Number(preciovta || preciolista || 0);
            const descuentoUnit = Number(descuento || 0);
            let porcentajeIva;
            if (porciva !== undefined && porciva !== null) {
                porcentajeIva = Number(porciva);
            } else {
                const ivaMatRows = await executeQueryInTransaction(transaction, `SELECT COALESCE(TI.PORCIVA, 0) AS PORCIVA FROM MATERIAL M LEFT JOIN TIPOIVA TI ON TI.TIPOIVAID = M.TIPOIVAID WHERE M.MATID = ?`, [matIdNum]);
                const materialPorcIva = Number((ivaMatRows && ivaMatRows[0] && ivaMatRows[0].PORCIVA) || 0);
                porcentajeIva = Number.isFinite(materialPorcIva) ? materialPorcIva : 0;
            }

            if (cantidad <= 0) {
                throw new Error('Cantidad inválida: debe ser mayor a cero');
            }
            if (precioUnit < 0) {
                throw new Error('Precio inválido: no puede ser negativo');
            }
            if (descuentoUnit > precioUnit) {
                throw new Error('Descuento inválido: no puede superar el precio por unidad');
            }

            // Siempre traer PRECIOLISTA desde MATERIALSUC.PRECIO1 (consulta por MATID+SUCID)
            {
                // Obtener SUCID del KARDEX
                const sucRow = await executeQueryInTransaction(transaction, 'SELECT SUCID FROM KARDEX WHERE KARDEXID = ?', [kardexIdNum]);
                const sucidFromKardex = sucRow && sucRow[0] ? sucRow[0].SUCID : null;
                if (!sucidFromKardex) {
                    throw new Error(`No se pudo determinar SUCID para KARDEXID=${kardexid}`);
                }
                let precioRows2 = await executeQueryInTransaction(
                    transaction,
                    `SELECT FIRST 1 PRECIO1 FROM MATERIALSUC WHERE MATID = ? AND SUCID = ?`,
                    [matIdNum, sucidFromKardex]
                );
                let precioListaUnit = Number((precioRows2 && precioRows2[0] && precioRows2[0].PRECIO1) || 0);
                if (!Number.isFinite(precioListaUnit) || precioListaUnit <= 0) {
                    // Fallback adicional: cualquier sucursal
                    precioRows2 = await executeQueryInTransaction(
                        transaction,
                        `SELECT FIRST 1 PRECIO1 FROM MATERIALSUC WHERE MATID = ? ORDER BY SUCID`,
                        [matIdNum]
                    );
                    precioListaUnit = Number((precioRows2 && precioRows2[0] && precioRows2[0].PRECIO1) || 0);
                }
                if (!Number.isFinite(precioListaUnit) || precioListaUnit <= 0) {
                    precioListaUnit = 1; // Fallback por requerimiento
                }
                // Setear PRECIOLISTA desde MATERIALSUC solo si no viene proporcionado manualmente
                if (!Number.isFinite(preciolista) || Number(preciolista) <= 0) {
                    req.body.preciolista = round2(precioListaUnit);
                }
                if (usarPrecioSucursal || !Number.isFinite(precioUnit) || precioUnit <= 0) {
                    precioUnit = precioListaUnit;
                }
            }

            const precioBaseUnit = Number.isFinite(preciobase) && Number(preciobase) > 0
                ? Number(preciobase)
                : (precioUnit - descuentoUnit);

            const ivaUnit = Number.isFinite(precioiva) && Number(precioiva) > 0
                ? Number(precioiva)
                : round2(precioBaseUnit * (porcentajeIva / 100));

            const precioNetoUnit = Number.isFinite(precioneto) && Number(precioneto) > 0
                ? Number(precioneto)
                : round2(precioBaseUnit + ivaUnit);

            const totalLinea = Number.isFinite(parcvta) && Number(parcvta) > 0
                ? Number(parcvta)
                : round2(precioNetoUnit * cantidad);

            // Insertar la línea
            const insertQuery = `
                INSERT INTO DEKARDEX (
                    KARDEXID, MATID, BODID, TIPUND, PORCIVA, DESCUENTO,
                    CANLISTA, CANMAT, PRECIOLISTA, PRECIOVTA, PRECIOBASE, PRECIOIVA, PRECIONETO,
                    PARCVTA, SALCAN, SALCOST, IMPRESO, PRECIOEXCENTO, PRECIOICONSUMO, DAJUSTEBASE
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                kardexIdNum,               // KARDEXID
                matIdNum,                  // MATID
                bodIdNum,                  // BODID
                tipund || 'D',             // TIPUND
                porcentajeIva,             // PORCIVA
                descuentoUnit,             // DESCUENTO (por unidad)
                cantidad,                  // CANLISTA
                cantidad,                  // CANMAT
                Number.isFinite(preciolista) && Number(preciolista) > 0 ? Number(preciolista) : precioUnit,  // PRECIOLISTA
                precioUnit,                // PRECIOVTA
                round2(precioBaseUnit),    // PRECIOBASE (por unidad)
                round2(ivaUnit),           // PRECIOIVA (por unidad)
                round2(precioNetoUnit),    // PRECIONETO (por unidad)
                totalLinea,                // PARCVTA (total línea)
                cantidad,                  // SALCAN
                salcost || 0,              // SALCOST
                impreso || 'N',            // IMPRESO
                0,                         // PRECIOEXCENTO
                0,                         // PRECIOICONSUMO
                0                          // DAJUSTEBASE
            ];

            await executeQueryInTransaction(transaction, insertQuery, params);
            const idRes = await executeQueryInTransaction(transaction, 'SELECT MAX(DEKARDEXID) AS ID FROM DEKARDEX WHERE KARDEXID = ?', [kardexIdNum]);
            const dekardexId = Number(idRes && idRes[0] && idRes[0].ID);

            // Recalcular totales del documento KARDEX
            const sumQuery = `
                SELECT 
                    COALESCE(SUM(CANMAT * PRECIOBASE), 0) AS VRBASE,
                    COALESCE(SUM(CANMAT * PRECIOIVA), 0) AS VRIVA,
                    COALESCE(SUM(PARCVTA), 0) AS TOTAL
                FROM DEKARDEX
                WHERE KARDEXID = ?
            `;
            const sumRows = await executeQueryInTransaction(transaction, sumQuery, [kardexIdNum]);
            const { VRBASE, VRIVA, TOTAL } = sumRows[0];

            const updQuery = `
                UPDATE KARDEX
                SET VRBASE = ?, VRIVA = ?, TOTAL = ?
                WHERE KARDEXID = ?
            `;
            await executeQueryInTransaction(transaction, updQuery, [VRBASE, VRIVA, TOTAL, kardexIdNum]);

            return dekardexId;
        });
        
        // Obtener la línea creada
        const lineaCreadaQuery = `
            SELECT D.DEKARDEXID, D.KARDEXID, D.MATID, D.BODID, D.TIPUND,
            D.PORCIVA, D.DESCUENTO, D.CANLISTA, D.CANMAT, D.PRECIOLISTA, D.PRECIOVTA, D.PRECIOBASE,
            D.PRECIOIVA, D.PRECIONETO, D.PARCVTA, D.SALCAN, D.SALCOST, D.IMPRESO, D.PRECIOEXCENTO,
            D.PRECIOICONSUMO, D.DAJUSTEBASE, M.DESCRIP as MATERIAL_DESCRIPCION, M.CODIGO as MATERIAL_CODIGO,
            M.UNIDAD as MATERIAL_UNIDAD, B.NOMBRE as BODEGA_NOMBRE
            FROM DEKARDEX D INNER JOIN MATERIAL M ON D.MATID = M.MATID INNER JOIN BODEGA B ON D.BODID = B.BODID
            WHERE D.DEKARDEXID = ?
        `;
        
        const lineaCreada = await executeQuery(lineaCreadaQuery, [resultado]);
        
        res.status(201).json({
            success: true,
            data: lineaCreada[0],
            message: 'Línea de pedido creada exitosamente',
            lineaId: resultado
        });
        
    } catch (error) {
        next(error);
    } finally {
        if (connection) {
            connection.detach();
        }
    }
});

// PUT /api/pedidos-lineas/:id - Se movió a /api/pedidos-update/lineas/:id

// DELETE /api/pedidos-lineas/:id - Eliminar línea de pedido
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        
        // Verificar que la línea existe
        const lineaExisteQuery = 'SELECT COUNT(*) as total FROM DEKARDEX WHERE DEKARDEXID = ?';
        const lineaExiste = await executeQuery(lineaExisteQuery, [idNum]);
        
        if (lineaExiste[0].TOTAL === 0) {
            return res.status(404).json({
                success: false,
                error: 'Línea no encontrada',
                message: `No existe una línea con DEKARDEXID: ${idNum}`
            });
        }
        
        // Obtener KARDEXID antes de eliminar
        const kidRow = await executeQuery('SELECT KARDEXID FROM DEKARDEX WHERE DEKARDEXID = ?', [idNum]);
        const kid = kidRow && kidRow[0] ? kidRow[0].KARDEXID : null;

        // Bloquear si pedido está asentado, anulado o facturado
        if (kid !== null) {
            const ped = await executeQuery('SELECT KARDEXID, FECASENTAD, FECANULADO FROM KARDEX WHERE KARDEXID = ?', [kid]);
            if (ped && ped[0]) {
                if (ped[0].FECASENTAD) return res.status(400).json({ success: false, error: 'PEDIDO_ASENTADO', message: 'No se puede eliminar línea: pedido asentado' });
                if (ped[0].FECANULADO) return res.status(400).json({ success: false, error: 'PEDIDO_ANULADO', message: 'No se puede eliminar línea: pedido anulado' });
            }
        }

        // Bloquear si la línea ya fue facturada (existe en DEKARDEXSELF por DEKARDEXID)
        try {
            const rel = await executeQuery("SELECT COUNT(*) AS CNT FROM RDB$RELATIONS WHERE TRIM(UPPER(RDB$RELATION_NAME)) = 'DEKARDEXSELF'");
            const hasRel = Number(rel && rel[0] && (rel[0].CNT || rel[0].cnt) || 0) > 0;
            if (hasRel) {
                const rln = await executeQuery('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE DEKARDEXID = ?', [idNum]);
                const cntLine = Number(rln && rln[0] && (rln[0].CNT || rln[0].cnt) || 0);
                if (cntLine > 0) {
                    return res.status(409).json({ success: false, error: 'PEDIDO_FACTURADO_LINEA', message: 'No se puede eliminar línea: ya tiene relación de factura' });
                }
            }
        } catch (errCheck) {
            console.warn('[delete linea] Verificación DEKARDEXSELF por DEKARDEXID falló:', errCheck && errCheck.message);
        }

        // Eliminar la línea
        const deleteQuery = 'DELETE FROM DEKARDEX WHERE DEKARDEXID = ?';
        await executeQuery(deleteQuery, [idNum]);

        // Recalcular totales del documento KARDEX
        if (kid !== null) {
            try {
                const sumQuery = `
                    SELECT 
                        COALESCE(SUM(CANMAT * PRECIOBASE), 0) AS VRBASE,
                        COALESCE(SUM(CANMAT * PRECIOIVA), 0) AS VRIVA,
                        COALESCE(SUM(PARCVTA), 0) AS TOTAL
                    FROM DEKARDEX
                    WHERE KARDEXID = ?
                `;
                const sumRows = await executeQuery(sumQuery, [kid]);
                const { VRBASE, VRIVA, TOTAL } = sumRows[0] || { VRBASE: 0, VRIVA: 0, TOTAL: 0 };
                await executeQuery('UPDATE KARDEX SET VRBASE = ?, VRIVA = ?, TOTAL = ? WHERE KARDEXID = ?', [VRBASE, VRIVA, TOTAL, kid]);
            } catch (e) {
                console.error('Error recalculando totales de KARDEX (DELETE):', e.message);
            }
        }
        
        res.json({
            success: true,
            message: 'Línea de pedido eliminada exitosamente'
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;


