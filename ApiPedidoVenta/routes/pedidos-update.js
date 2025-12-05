/**
 * Rutas para reapertura y actualización integral de pedidos (KARDEX)
 * Endpoint base: /api/pedidos-update
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const config = require('../config/app.config');



async function executeQueryInTransaction(transaction, query, params = []) {
    return new Promise((resolve, reject) => {
        transaction.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}


function round2(value) {
    const num = Number(value) || 0;
    return Math.round(num * 100) / 100;
}

// Verifica si el pedido tiene información de facturación en DEKARDEXSELF, con tolerancia a errores
async function isPedidoFacturado(transactionOrPool, kardexId) {
    const runner = (query, params) => new Promise((resolve, reject) => {
        try {
            transactionOrPool.query(query, params, (err, result) => err ? reject(err) : resolve(result));
        } catch (err) {
            reject(err);
        }
    });
    // 0) Preferir verificación en DEKARDEX por columna REMTOTFAC/REMTOFAC
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
                // Intentar nombre alterno REMTOFAC si aplica
                try {
                    const rAlt = await runner(
                        'SELECT COUNT(*) AS CNT FROM DEKARDEX WHERE KARDEXID = ? AND COALESCE(REMTOFAC, 0) <> 0',
                        [kardexId]
                    );
                    const cntAlt = Number(rAlt && rAlt[0] && (rAlt[0].CNT || rAlt[0].cnt) || 0);
                    if (cntAlt > 0) return true;
                } catch (e2) {
                    console.warn('[isPedidoFacturado] Error consultando DEKARDEX.REMTOTFAC/REMTOFAC:', e1 && e1.message, e2 && e2.message);
                }
            }
        }
    } catch (e) {
        console.warn('[isPedidoFacturado] No se pudo validar columnas en DEKARDEX:', e && e.message);
    }
    // 1) Confirmar existencia de la tabla
    try {
        const rel = await runner(
            'SELECT COUNT(*) AS CNT FROM RDB$RELATIONS WHERE TRIM(UPPER(RDB$RELATION_NAME)) = ?',
            ['DEKARDEXSELF']
        );
        const exists = Number(rel && rel[0] && (rel[0].CNT || rel[0].cnt) || 0) > 0;
        if (!exists) return false; // si no existe, no puede estar facturado
    } catch (e) {
        console.warn('[isPedidoFacturado] No se pudo consultar metadata de RDB$RELATIONS:', e && e.message);
        return false; // no bloquear por errores de metadata
    }
    // 2) Consultar por PEDIDOID (esquema estándar)
    try {
        const r2 = await runner('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE PEDIDOID = ?', [kardexId]);
        const c2 = Number(r2 && r2[0] && (r2[0].CNT || r2[0].cnt) || 0);
        if (c2 > 0) return true;
    } catch (e) {
        console.warn('[isPedidoFacturado] Error consultando DEKARDEXSELF.PEDIDOID:', e && e.message);
    }
    // Si nada marcó facturado y hubo errores, preferimos NO bloquear
    return false;
}

// PUT /api/pedidos-update/:id/reabrir - Reabrir pedido cerrado
router.put('/:id/reabrir', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        connection = await createConnection();

        await executeTransactionWithCallback(connection, async (transaction) => {
            // Validar existencia
            const rows = await executeQueryInTransaction(transaction, 'SELECT KARDEXID, CERRADO, FECANULADO, FECASENTAD FROM KARDEX WHERE KARDEXID = ?', [idNum]);
            if (!rows || rows.length === 0) {
                const e = new Error('Pedido no encontrado');
                e.status = 404; throw e;
            }
            if (rows[0].FECANULADO) {
                const e = new Error('No se puede reabrir: pedido anulado');
                e.status = 400; throw e;
            }
            if (rows[0].FECASENTAD) {
                const e = new Error('No se puede reabrir: pedido asentado (FECASENTAD con valor)');
                e.status = 400; throw e;
            }

            // Bloquear si ya está facturado
            const fact = await isPedidoFacturado(transaction, idNum);
            if (fact) {
                const e = new Error('Pedido facturado: no se puede reabrir ni modificar');
                e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e;
            }

            // Reabrir (CERRADO='N')
            await executeQueryInTransaction(transaction, "UPDATE KARDEX SET CERRADO = 'N' WHERE KARDEXID = ?", [idNum]);
        });

        res.json({ success: true, message: 'Pedido reabierto', data: { kardexid: idNum } });
    } catch (error) {
        next(error);
    } finally {
        if (connection) connection.detach();
    }
});

// PUT /api/pedidos-update/:id/desasentar - Quitar FECASENTAD (poner NULL)
router.put('/:id/desasentar', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        connection = await createConnection();

        await executeTransactionWithCallback(connection, async (transaction) => {
            const row = await executeQueryInTransaction(
                transaction,
                'SELECT KARDEXID, FECASENTAD, FECANULADO FROM KARDEX WHERE KARDEXID = ?',
                [idNum]
            );
            if (!row || row.length === 0) {
                const e = new Error('Pedido no encontrado'); e.status = 404; throw e;
            }
            if (row[0].FECANULADO) {
                const e = new Error('No se puede desasentar: pedido anulado'); e.status = 400; throw e;
            }

            // Bloquear si ya está facturado
            const fact = await isPedidoFacturado(transaction, idNum);
            if (fact) {
                const e = new Error('Pedido facturado: no se puede desasentar'); e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e;
            }

            await executeQueryInTransaction(transaction, 'UPDATE KARDEX SET FECASENTAD = NULL WHERE KARDEXID = ?', [idNum]);
        });

        res.json({ success: true, message: 'Pedido desasentado (FECASENTAD = NULL)', data: { kardexid: idNum } });
    } catch (error) {
        next(error);
    } finally {
        if (connection) connection.detach();
    }
});

// PUT /api/pedidos-update/:id - Actualizar encabezado y reemplazar líneas (opcional)
router.put('/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;
        const idNum = parseInt(String(id), 10);
        if (!Number.isFinite(idNum) || idNum <= 0) {
            return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
        }
        const {
            documento = {},
            cliente, // TERID
            vendedor, // TERID
            lineas, // opcional: reemplazo completo
            reabrir = true,
            USUARIO = 'ADMIN',
            usarPrecioSucursal = true
        } = req.body || {};

        connection = await createConnection();

        const resultado = await executeTransactionWithCallback(connection, async (transaction) => {
            // Validar existencia y estado
            const ped = await executeQueryInTransaction(transaction, 'SELECT KARDEXID, CLIENTE, VENDEDOR, SUCID, CERRADO, FECANULADO, FECASENTAD FROM KARDEX WHERE KARDEXID = ?', [idNum]);
            if (!ped || ped.length === 0) {
                const e = new Error('Pedido no encontrado'); e.status = 404; throw e;
            }
            if (ped[0].FECANULADO) {
                const e = new Error('No se puede actualizar: pedido anulado'); e.status = 400; throw e;
            }
            if (ped[0].FECASENTAD) {
                const e = new Error('No se puede actualizar: pedido asentado (FECASENTAD con valor)'); e.status = 400; throw e;
            }

            // Bloquear si ya está facturado
            const fact = await isPedidoFacturado(transaction, idNum);
            if (fact) { const e = new Error('Pedido facturado: no se puede modificar'); e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e; }

            // Reabrir si corresponde
            if (reabrir) {
                try {
                    await executeQueryInTransaction(transaction, "UPDATE KARDEX SET CERRADO = 'N' WHERE KARDEXID = ?", [idNum]);
                } catch (_) {}
            }

            // Validar cliente/vendedor si vienen distintos
            const clienteId = cliente || ped[0].CLIENTE;
            const vendedorId = vendedor || ped[0].VENDEDOR;

            const cliRows = await executeQueryInTransaction(transaction, 'SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?', [clienteId]);
            if (!cliRows || Number(cliRows[0].CNT) === 0) { const e = new Error('Cliente no existe'); e.status = 400; throw e; }
            const venRows = await executeQueryInTransaction(transaction, 'SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?', [vendedorId]);
            if (!venRows || Number(venRows[0].CNT) === 0) { const e = new Error('Vendedor no existe'); e.status = 400; throw e; }

            // Actualizar encabezado (campos extensos)
            const fechaParam = (documento.FECHA || '').toString().slice(0, 10) || null;
            const observ = (documento.OBSERV ?? '').toString().slice(0, 500);
            const periodo = documento.PERIODO || (fechaParam ? String(new Date(fechaParam).getMonth() + 1).padStart(2, '0') : null);
            const fecVence = (documento.FECVENCE || '').toString().slice(0, 10) || null;
            const codDespachaA = (documento.CODDESPACHAA || '').toString().slice(0, 20) || null;
            const nomDespacha = (documento.NOMDESPACHA || '').toString().slice(0, 120) || null;

            const updParts = [];
            const updParams = [];

            const setIf = (cond, sql, val) => { if (cond) { updParts.push(sql); updParams.push(val); } };

            // Identificación/consecutivos básicos
            setIf(Boolean(documento.CODPREFIJO), 'CODPREFIJO = ?', documento.CODPREFIJO);
            setIf(Boolean(documento.NUMERO), 'NUMERO = ?', documento.NUMERO);
            setIf(Boolean(fechaParam), 'FECHA = ?', fechaParam);
            if (observ !== undefined) { updParts.push('OBSERV = ?'); updParams.push(observ); }
            setIf(Boolean(periodo), 'PERIODO = ?', periodo);

            // Ubicación y terceros
            setIf(Boolean(documento.CENID), 'CENID = ?', Number(documento.CENID));
            setIf(Boolean(documento.AREADID), 'AREADID = ?', Number(documento.AREADID));
            setIf(Boolean(documento.SUCID), 'SUCID = ?', Number(documento.SUCID));
            if (clienteId) { updParts.push('CLIENTE = ?'); updParams.push(clienteId); }
            if (vendedorId) { updParts.push('VENDEDOR = ?'); updParams.push(vendedorId); }

            // Pago/moneda
            setIf(Boolean(documento.FORMAPAGO), 'FORMAPAGO = ?', documento.FORMAPAGO);
            if (documento.PLAZODIAS !== undefined) { updParts.push('PLAZODIAS = ?'); updParams.push(Number(documento.PLAZODIAS || 0)); }
            setIf(Boolean(documento.MONEDA), 'MONEDA = ?', documento.MONEDA);

            // Datos de despacho
            setIf(Boolean(documento.BCOID), 'BCOID = ?', Number(documento.BCOID));
            setIf(Boolean(codDespachaA), 'CODDESPACHAA = ?', codDespachaA);
            setIf(Boolean(nomDespacha), 'NOMDESPACHA = ?', nomDespacha);
            setIf(Boolean(documento.DESPACHAR_A), 'DESPACHAR_A = ?', Number(documento.DESPACHAR_A));

            // Retenciones/ajustes y varios (si se envían)
            const numericFields = [
                'RETIVA','RETICA','RETFTE','AJUSTEBASE','AJUSTEIVA','AJUSTEIVAEXC','AJUSTENETO',
                'VRICONSUMO','VRRFTE','VRRIVA','VRRICA','FPCONTADO','DESXCAMBIO','VRIVAEXC',
                'RETCREE','VRRCREE','NETOIVA','NETOIVAEXC','TIPOFACTURA','VRADVA','VRDCTOS',
                'VRINC','VRIPUU','VRICUI','FPCREDITO'
            ];
            numericFields.forEach(f => {
                if (documento[f] !== undefined) {
                    updParts.push(`${f} = ?`);
                    updParams.push(Number(documento[f]));
                }
            });

            // Totales manuales (si se envían). Si además envían líneas, luego se recalculan.
            const manualTotals = ['VRBASE','VRIVA','TOTAL','NETO','NETOBASE','VRTOTAL'];
            manualTotals.forEach(f => {
                if (documento[f] !== undefined) {
                    updParts.push(`${f} = ?`);
                    updParams.push(Number(documento[f]));
                }
            });

            // Vencimiento
            setIf(Boolean(fecVence), 'FECVENCE = ?', fecVence);

            // Usuario
            updParts.push('USUARIO = ?'); updParams.push(USUARIO);
            updParams.push(idNum);

            if (updParts.length > 1) {
                const updSql = `UPDATE KARDEX SET ${updParts.join(', ')} WHERE KARDEXID = ?`;
                await executeQueryInTransaction(transaction, updSql, updParams);
            }

            // Reemplazar líneas si se envían
            if (Array.isArray(lineas)) {
                // Borrar existentes
                await executeQueryInTransaction(transaction, 'DELETE FROM DEKARDEX WHERE KARDEXID = ?', [idNum]);

                let totalDocumento = 0;
                let totalIVA = 0;

                for (let i = 0; i < lineas.length; i++) {
                    const ln = lineas[i] || {};
                    const matid = ln.MATID || ln.matid;
                    const bodid = ln.BODID || ln.bodid || 1;
                    const canmat = Number(ln.CANMAT || ln.canmat || 0);
                    let preciovta = Number(ln.PRECIOVTA || ln.preciovta || 0);
                    const descuento = Number(ln.DESCUENTO || ln.descuento || 0);
                    if (!matid || canmat <= 0) { throw new Error(`Línea ${i + 1} inválida`); }

                    // Validaciones FK: MATERIAL y BODEGA deben existir para evitar REL_MAT_KDX y similares
                    const matCntRows = await executeQueryInTransaction(
                        transaction,
                        'SELECT COUNT(*) AS CNT FROM MATERIAL WHERE MATID = ?',
                        [matid]
                    );
                    const matExists = Number(matCntRows && matCntRows[0] && (matCntRows[0].CNT || matCntRows[0].cnt) || 0) > 0;
                    if (!matExists) { const e = new Error(`Línea ${i + 1}: MATERIAL no existe (MATID=${matid})`); e.status = 400; throw e; }

                    const bodCntRows = await executeQueryInTransaction(
                        transaction,
                        'SELECT COUNT(*) AS CNT FROM BODEGA WHERE BODID = ?',
                        [bodid]
                    );
                    const bodExists = Number(bodCntRows && bodCntRows[0] && (bodCntRows[0].CNT || bodCntRows[0].cnt) || 0) > 0;
                    if (!bodExists) { const e = new Error(`Línea ${i + 1}: BODEGA no existe (BODID=${bodid})`); e.status = 400; throw e; }

                    // SUCID del pedido
                    const sucidRow = await executeQueryInTransaction(transaction, 'SELECT SUCID FROM KARDEX WHERE KARDEXID = ?', [idNum]);
                    const sucid = sucidRow && sucidRow[0] ? sucidRow[0].SUCID : 1;

                    // PORCIVA desde MATERIAL/TIPOIVA
                    const ivaRows = await executeQueryInTransaction(
                        transaction,
                        `SELECT COALESCE(TI.PORCIVA, 0) AS PORCIVA FROM MATERIAL M LEFT JOIN TIPOIVA TI ON TI.TIPOIVAID = M.TIPOIVAID WHERE M.MATID = ?`,
                        [matid]
                    );
                    const porciva = Number((ivaRows && ivaRows[0] && ivaRows[0].PORCIVA) || 0);

                    // Precio lista desde MATERIALSUC
                    let precioLista = 0;
                    const precioRows = await executeQueryInTransaction(
                        transaction,
                        'SELECT FIRST 1 PRECIO1 FROM MATERIALSUC WHERE MATID = ? AND SUCID = ?',
                        [matid, sucid]
                    );
                    precioLista = Number((precioRows && precioRows[0] && precioRows[0].PRECIO1) || 0);
                    if (!Number.isFinite(precioLista) || precioLista <= 0) {
                        const anyRow = await executeQueryInTransaction(transaction, 'SELECT FIRST 1 PRECIO1 FROM MATERIALSUC WHERE MATID = ? ORDER BY SUCID', [matid]);
                        precioLista = Number((anyRow && anyRow[0] && anyRow[0].PRECIO1) || 0) || 1;
                    }
                    if (usarPrecioSucursal || !Number.isFinite(preciovta) || preciovta <= 0) {
                        preciovta = precioLista;
                    }

                    const precioBase = preciovta - descuento;
                    if (precioBase < 0) { throw new Error(`Línea ${i + 1}: descuento mayor al precio`); }
                    const precioIva = round2(precioBase * (porciva / 100));
                    const precioNeto = round2(precioBase + precioIva);

                    const insertLn = `
                        INSERT INTO DEKARDEX (
                            KARDEXID, MATID, BODID, REMTOTFAC,
                            TIPUND, PORCIVA, DESCUENTO, CANLISTA, CANMAT,
                            PRECIOLISTA, PRECIOVTA, PRECIOBASE, PRECIOIVA,
                            PRECIONETO, PARCVTA, SALCAN, SALCOST, IMPRESO,
                            PRECIOEXCENTO, PRECIOICONSUMO, DAJUSTEBASE, PRECIOIPUU, IMPICUI
                        ) VALUES (?, ?, ?, 0, 'D', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'N', 0, 0, 0, 0, 0)
                    `;
                    const lnParams = [
                        id, matid, bodid, porciva, descuento, canmat, canmat,
                        // PRECIOLISTA: usar precio digitado (PRECIOVTA) si no viene explícito
                        (Number.isFinite(Number(ln.PRECIOLISTA || ln.preciolista)) && Number(ln.PRECIOLISTA || ln.preciolista) > 0)
                            ? round2(Number(ln.PRECIOLISTA || ln.preciolista))
                            : round2(preciovta),
                        round2(preciovta),
                        round2(precioBase), round2(precioIva), round2(precioNeto), round2(precioNeto * canmat), canmat
                    ];
                    await executeQueryInTransaction(transaction, insertLn, lnParams);

                    totalDocumento += round2(precioBase * canmat);
                    totalIVA += round2(precioIva * canmat);
                }

                const totalGeneral = round2(totalDocumento + totalIVA);
                await executeQueryInTransaction(transaction, `UPDATE KARDEX SET VRBASE = ?, VRIVA = ?, TOTAL = ?, NETO = ?, NETOBASE = ?, VRTOTAL = ? WHERE KARDEXID = ?`, [totalDocumento, totalIVA, totalGeneral, totalGeneral, totalDocumento, totalGeneral, idNum]);
            }

            return idNum;
        });

        // Responder con encabezado y líneas
        const pedidoQuery = `
            SELECT KARDEXID, CODCOMP, CODPREFIJO, NUMERO, FECHA, OBSERV, VRBASE, VRIVA, TOTAL, FORMAPAGO, PLAZODIAS, MONEDA
            FROM KARDEX WHERE KARDEXID = ?
        `;
        const pedido = await executeQuery(pedidoQuery, [resultado]);
        const lineasQuery = `
            SELECT DEKARDEXID, MATID, BODID, CANMAT, PRECIOVTA, DESCUENTO, PRECIONETO, PRECIOIVA
            FROM DEKARDEX WHERE KARDEXID = ? ORDER BY DEKARDEXID
        `;
        const lineasRes = await executeQuery(lineasQuery, [resultado]);

        res.json({ success: true, message: 'Pedido actualizado', data: { pedido: pedido[0], lineas: lineasRes } });
    } catch (error) {
        next(error);
    } finally {
        if (connection) connection.detach();
    }
});

// PUT /api/pedidos-update/lineas/:id - Actualizar una línea específica (DEKARDEX)
router.put('/lineas/:id', async (req, res, next) => {
    let connection;
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'ID de línea inválido' });
        }

        const {
            matid, bodid, tipund,
            porciva, descuento, canlista, canmat,
            preciolista, preciovta, preciobase, precioiva, precioneto,
            parcvta, salcan, salcost, impreso
        } = req.body || {};

        const validatePositiveNumber = (value, fieldName) => {
            const num = Number(value);
            if (!Number.isFinite(num) || num < 0) {
                throw new Error(`${fieldName} debe ser un número positivo`);
            }
            return round2(num);
        };

        const validateNumber = (value, fieldName) => {
            const num = Number(value);
            if (!Number.isFinite(num)) {
                throw new Error(`${fieldName} debe ser un número válido`);
            }
            return round2(num);
        };

        connection = await createConnection();

        await executeTransactionWithCallback(connection, async (transaction) => {
            // Obtener línea y pedido asociado
            const lineaActual = await executeQueryInTransaction(
                transaction,
                'SELECT DEKARDEXID, KARDEXID, MATID, BODID FROM DEKARDEX WHERE DEKARDEXID = ?',[id]
            );
            if (!lineaActual || lineaActual.length === 0) {
                const e = new Error(`Línea no encontrada (DEKARDEXID=${id})`); e.status = 404; throw e;
            }
            const kardexid = lineaActual[0].KARDEXID;

            // Validar estado del pedido
            const ped = await executeQueryInTransaction(
                transaction,
                'SELECT KARDEXID, FECANULADO, FECASENTAD FROM KARDEX WHERE KARDEXID = ?',
                [kardexid]
            );
            if (!ped || ped.length === 0) { const e = new Error('Pedido no encontrado'); e.status = 404; throw e; }
            if (ped[0].FECANULADO) { const e = new Error('No se puede actualizar línea: pedido anulado'); e.status = 400; throw e; }
            if (ped[0].FECASENTAD) { const e = new Error('No se puede actualizar línea: pedido asentado (FECASENTAD con valor)'); e.status = 400; throw e; }

            // Bloquear si facturado por documento
            const fact = await isPedidoFacturado(transaction, kardexid);
            if (fact) { const e = new Error('Pedido facturado: no se puede modificar línea'); e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e; }

            // Bloquear si la línea ya fue facturada (existe en DEKARDEXSELF por DEKARDEXID)
            try {
                const rel = await executeQueryInTransaction(
                    transaction,
                    "SELECT COUNT(*) AS CNT FROM RDB$RELATIONS WHERE TRIM(UPPER(RDB$RELATION_NAME)) = 'DEKARDEXSELF'",
                    []
                );
                const hasRel = Number(rel && rel[0] && (rel[0].CNT || rel[0].cnt) || 0) > 0;
                if (hasRel) {
                    const rln = await executeQueryInTransaction(
                        transaction,
                        'SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE DEKARDEXID = ?',
                        [id]
                    );
                    const cntLine = Number(rln && rln[0] && (rln[0].CNT || rln[0].cnt) || 0);
                    if (cntLine > 0) {
                        const e = new Error('Pedido facturado: no se puede modificar esta línea');
                        e.status = 409; e.code = 'PEDIDO_FACTURADO_LINEA'; throw e;
                    }
                }
            } catch (errCheck) {
                // No bloquear por error de metadata; log solo para diagnóstico
                console.warn('[update linea] Verificación DEKARDEXSELF por DEKARDEXID falló:', errCheck && errCheck.message);
            }

            // Validaciones referenciales si cambian referencias
            if (matid !== undefined && matid !== lineaActual[0].MATID) {
                const materialExiste = await executeQueryInTransaction(transaction, 'SELECT COUNT(*) AS CNT FROM MATERIAL WHERE MATID = ?', [matid]);
                if (!materialExiste || Number(materialExiste[0].CNT) === 0) {
                    const e = new Error(`Material no existe (MATID=${matid})`); e.status = 400; throw e;
                }
            }
            if (bodid !== undefined && bodid !== lineaActual[0].BODID) {
                const bodegaExiste = await executeQueryInTransaction(transaction, 'SELECT COUNT(*) AS CNT FROM BODEGA WHERE BODID = ?', [bodid]);
                if (!bodegaExiste || Number(bodegaExiste[0].CNT) === 0) {
                    const e = new Error(`Bodega no existe (BODID=${bodid})`); e.status = 400; throw e;
                }
            }

            // Construcción dinámica del UPDATE
            const updateFields = [];
            const params = [];

            try {
                if (matid !== undefined) { updateFields.push('MATID = ?'); params.push(parseInt(matid)); }
                if (bodid !== undefined) { updateFields.push('BODID = ?'); params.push(parseInt(bodid)); }
                if (tipund !== undefined) { updateFields.push('TIPUND = ?'); params.push(String(tipund).substring(0, 10)); }

                if (porciva !== undefined) { updateFields.push('PORCIVA = ?'); params.push(validatePositiveNumber(porciva, 'PORCIVA')); }
                if (descuento !== undefined) { updateFields.push('DESCUENTO = ?'); params.push(validatePositiveNumber(descuento, 'DESCUENTO')); }
                if (canlista !== undefined) { updateFields.push('CANLISTA = ?'); params.push(validatePositiveNumber(canlista, 'CANLISTA')); }
                if (canmat !== undefined) { updateFields.push('CANMAT = ?'); params.push(validatePositiveNumber(canmat, 'CANMAT')); }

                if (preciolista !== undefined) {
                    updateFields.push('PRECIOLISTA = ?'); params.push(validatePositiveNumber(preciolista, 'PRECIOLISTA'));
                } else if (preciovta !== undefined) {
                    updateFields.push('PRECIOLISTA = ?'); params.push(validatePositiveNumber(preciovta, 'PRECIOVTA'));
                }
                if (preciovta !== undefined) { updateFields.push('PRECIOVTA = ?'); params.push(validatePositiveNumber(preciovta, 'PRECIOVTA')); }
                if (preciobase !== undefined) { updateFields.push('PRECIOBASE = ?'); params.push(validatePositiveNumber(preciobase, 'PRECIOBASE')); }
                if (precioiva !== undefined) { updateFields.push('PRECIOIVA = ?'); params.push(validatePositiveNumber(precioiva, 'PRECIOIVA')); }
                if (precioneto !== undefined) { updateFields.push('PRECIONETO = ?'); params.push(validatePositiveNumber(precioneto, 'PRECIONETO')); }
                if (parcvta !== undefined) { updateFields.push('PARCVTA = ?'); params.push(validateNumber(parcvta, 'PARCVTA')); }
                if (salcan !== undefined) { updateFields.push('SALCAN = ?'); params.push(validateNumber(salcan, 'SALCAN')); }
                if (salcost !== undefined) { updateFields.push('SALCOST = ?'); params.push(validateNumber(salcost, 'SALCOST')); }
                if (impreso !== undefined) { updateFields.push('IMPRESO = ?'); params.push(impreso ? 'S' : 'N'); }

                if (req.body && req.body.PRECIOEXCENTO !== undefined) {
                    updateFields.push('PRECIOEXCENTO = ?'); params.push(validatePositiveNumber(req.body.PRECIOEXCENTO, 'PRECIOEXCENTO'));
                }
                if (req.body && req.body.PRECIOICONSUMO !== undefined) {
                    updateFields.push('PRECIOICONSUMO = ?'); params.push(validatePositiveNumber(req.body.PRECIOICONSUMO, 'PRECIOICONSUMO'));
                }
                if (req.body && req.body.DAJUSTEBASE !== undefined) {
                    updateFields.push('DAJUSTEBASE = ?'); params.push(validateNumber(req.body.DAJUSTEBASE, 'DAJUSTEBASE'));
                }
            } catch (validationError) {
                const e = new Error(validationError.message); e.status = 400; throw e;
            }

            if (updateFields.length === 0) {
                const e = new Error('Sin datos para actualizar'); e.status = 400; throw e;
            }

            // Ejecutar actualización
            params.push(id);
            const updSql = `UPDATE DEKARDEX SET ${updateFields.join(', ')} WHERE DEKARDEXID = ?`;
            await executeQueryInTransaction(transaction, updSql, params);

            // Recalcular totales del pedido
            const sumQuery = `
                SELECT 
                    COALESCE(SUM(CANMAT * PRECIOBASE), 0) AS VRBASE,
                    COALESCE(SUM(CANMAT * PRECIOIVA), 0) AS VRIVA,
                    COALESCE(SUM(PARCVTA), 0) AS TOTAL
                FROM DEKARDEX
                WHERE KARDEXID = ?
            `;
            const sumRows = await executeQueryInTransaction(transaction, sumQuery, [kardexid]);
            const { VRBASE, VRIVA, TOTAL } = sumRows[0] || { VRBASE: 0, VRIVA: 0, TOTAL: 0 };
            await executeQueryInTransaction(
                transaction,
                'UPDATE KARDEX SET VRBASE = ?, VRIVA = ?, TOTAL = ? WHERE KARDEXID = ?',
                [VRBASE, VRIVA, TOTAL, kardexid]
            );
        });

        // Devolver la línea actualizada
        const lineaActualizada = await executeQuery(
            `SELECT 
                D.DEKARDEXID, D.KARDEXID, D.MATID, D.BODID, D.TIPUND,
                D.PORCIVA, D.DESCUENTO, D.CANLISTA, D.CANMAT, D.PRECIOLISTA, D.PRECIOVTA,
                D.PRECIOBASE, D.PRECIOIVA, D.PRECIONETO, D.PARCVTA, D.SALCAN, D.SALCOST, D.IMPRESO,
                COALESCE(D.PRECIOEXCENTO, 0) AS PRECIOEXCENTO, 
                COALESCE(D.PRECIOICONSUMO, 0) AS PRECIOICONSUMO,
                COALESCE(D.DAJUSTEBASE, 0) AS DAJUSTEBASE
             FROM DEKARDEX D WHERE D.DEKARDEXID = ?`,
            [id]
        );

        res.json({ success: true, message: 'Línea actualizada', data: lineaActualizada && lineaActualizada[0] });
    } catch (error) {
        // Errores de validación ya traen status
        if (error && error.status) { return next(error); }
        next(error);
    } finally {
        if (connection) connection.detach();
    }
});

// GET /api/pedidos-update/:id/detalle - Trae encabezado (KARDEX) y líneas (DEKARDEX)
router.get('/:id/detalle', async (req, res, next) => {
    try {
        const { id } = req.params;
        const pedidoRows = await executeQuery(
            `SELECT 
                KARDEXID, CODCOMP, CODPREFIJO, NUMERO, FECHA, OBSERV,
                VRBASE, VRIVA, TOTAL, FORMAPAGO, PLAZODIAS, MONEDA,
                FECASENTAD, HORAASEN, FECANULADO
             FROM KARDEX WHERE KARDEXID = ?`,
            [id]
        );
        if (!pedidoRows || pedidoRows.length === 0) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Pedido no encontrado' });
        }
        const lineasRows = await executeQuery(
            `SELECT 
                DEKARDEXID, MATID, BODID, PRIORIDAD, REMTOTFAC,
                TIPUND, PORCIVA, DESCUENTO, CANLISTA, CANMAT,
                PRECIOLISTA, PRECIOVTA, PRECIOBASE, PRECIOIVA, PRECIONETO,
                PARCVTA, SALCAN, SALCOST, IMPRESO
             FROM DEKARDEX WHERE KARDEXID = ? ORDER BY DEKARDEXID`,
            [id]
        );
        // Determinar si está facturado por presencia en DEKARDEXSELF
        let facturado = false;
        try {
            // Intentar por KARDEXID primero
            const f1 = await executeQuery('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE KARDEXID = ?', [id]);
            const c1 = Number(f1 && f1[0] && (f1[0].CNT || f1[0].cnt) || 0);
            if (c1 > 0) facturado = true; else {
                const f2 = await executeQuery('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE PEDIDOID = ?', [id]);
                facturado = Number(f2 && f2[0] && (f2[0].CNT || f2[0].cnt) || 0) > 0;
            }
        } catch (_) { facturado = false; }
        res.json({ success: true, data: { pedido: pedidoRows[0], lineas: lineasRows, facturado } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;




/**
 * DOCUMENTACIÓN API - ACTUALIZAR LÍNEA DE PEDIDO
 * Endpoint: PUT /api/pedidos-update/lineas/:id
 * 
 * Este endpoint permite actualizar cualquier campo de una línea de pedido (DEKARDEX).
 * Realiza validaciones completas y recalcula automáticamente los totales del pedido.
 * 
 * CARACTERÍSTICAS:
 * - Actualización parcial o completa de campos
 * - Validaciones de integridad referencial
 * - Recálculo automático de totales
 * - Transacciones para consistencia de datos
 * - Verificación de estado del pedido (no anulado, no facturado)
 * 
 * CAMPOS ACTUALIZABLES:
 * - matid: ID del material (referencia a MATERIAL)
 * - bodid: ID de la bodega (referencia a BODEGA)
 * - tipund: Tipo de unidad
 * - porciva: Porcentaje de IVA
 * - descuento: Descuento unitario
 * - canlista: Cantidad en lista
 * - canmat: Cantidad de material
 * - preciolista: Precio de lista unitario
 * - preciovta: Precio de venta unitario
 * - preciobase: Precio base sin IVA
 * - precioiva: Valor del IVA
 * - precioneto: Precio neto final
 * - parcvta: Parcial de venta
 * - salcan: Saldo en cantidad
 * - salcost: Saldo en costo
 * - impreso: Flag de impresión (0/1)
 */

/*
===============================================
ENDPOINT: PUT /api/pedidos-lineas/:id
===============================================

JSON COMPLETO PARA EDITAR LÍNEA:
{
  "matid": 105,
  "bodid": 2,
  "tipund": "UND",
  "porciva": 19.00,
  "descuento": 10.00,
  "canlista": 15.00,
  "canmat": 15.00,
  "preciolista": 120.00,
  "preciovta": 110.00,
  "preciobase": 110.00,
  "precioiva": 20.90,
  "precioneto": 130.90,
  "parcvta": 1650.00,
  "salcan": 0.00,
  "salcost": 0.00,
  "impreso": 0,
  "usarPrecioSucursal": true
}

CURL COMPLETO:
curl -X PUT \
  http://localhost:51250/api/pedidos-lineas/67890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "matid": 105,
    "bodid": 2,
    "tipund": "UND",
    "porciva": 19.00,
    "descuento": 10.00,
    "canlista": 15.00,
    "canmat": 15.00,
    "preciolista": 120.00,
    "preciovta": 110.00,
    "preciobase": 110.00,
    "precioiva": 20.90,
    "precioneto": 130.90,
    "parcvta": 1650.00,
    "salcan": 0.00,
    "salcost": 0.00,
    "impreso": 0,
    "usarPrecioSucursal": true
  }'

JSON MÍNIMO (solo cantidad y descuento):
{
  "canmat": 20.00,
  "descuento": 5.00
}

CURL MÍNIMO:
curl -X PUT \
  http://localhost:51250/api/pedidos-lineas/67890 \
  -H "Content-Type: application/json" \
  -d '{
    "canmat": 20.00,
    "descuento": 5.00
  }'

JSON CAMBIO DE MATERIAL:
{
  "matid": 150,
  "canmat": 10.00,
  "preciolista": 200.00,
  "preciovta": 180.00,
  "usarPrecioSucursal": true
}

CURL CAMBIO DE MATERIAL:
curl -X PUT \
  http://localhost:51250/api/pedidos-lineas/67890 \
  -H "Content-Type: application/json" \
  -d '{
    "matid": 150,
    "canmat": 10.00,
    "preciolista": 200.00,
    "preciovta": 180.00,
    "usarPrecioSucursal": true
  }'

JSON CAMBIO DE PRECIOS:
{
  "preciolista": 150.00,
  "preciovta": 140.00,
  "descuento": 15.00,
  "porciva": 19.00
}

CURL CAMBIO DE PRECIOS:
curl -X PUT \
  http://localhost:51250/api/pedidos-lineas/67890 \
  -H "Content-Type: application/json" \
  -d '{
    "preciolista": 150.00,
    "preciovta": 140.00,
    "descuento": 15.00,
    "porciva": 19.00
  }'

JSON CAMBIO DE BODEGA:
{
  "bodid": 3,
  "canmat": 25.00
}

CURL CAMBIO DE BODEGA:
curl -X PUT \
  http://localhost:51250/api/pedidos-lineas/67890 \
  -H "Content-Type: application/json" \
  -d '{
    "bodid": 3,
    "canmat": 25.00
  }'

RESPUESTA EXITOSA:
{
  "success": true,
  "message": "Línea actualizada exitosamente",
  "data": {
    "dekardexid": 67890,
    "kardexid": 12345,
    "cambios": ["CANMAT: 10.00 → 20.00", "DESCUENTO: 0.00 → 5.00"],
    "totales_recalculados": {
      "vrbase": 1900.00,
      "vriva": 361.00,
      "total": 2261.00
    }
  }
}
*/


/**
 * Endpoint para desasentar un pedido
 * 
 * PUT /api/pedidos-update/:kardexid/desasentar
 * 
 * Cambia el estado del pedido de "asentado" a "no asentado",
 * permitiendo modificaciones posteriores al documento.
 * 
 * @param {number} kardexid - ID del pedido a desasentar
 * @returns {Object} Respuesta con estado de la operación
 * 
 * EJEMPLO DE USO:
 * curl -X PUT http://localhost:51250/api/pedidos-update/170671/desasentar
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Pedido desasentado exitosamente",
 *   "data": {
 *     "kardexid": 170671,
 *     "estado_anterior": "asentado",
 *     "estado_actual": "no_asentado",
 *     "fecha_desasentado": "2025-01-27T10:30:00.000Z"
 *   }
 * }
 * 
 * RESPUESTA ERROR:
 * {
 *   "success": false,
 *   "message": "El pedido no existe o ya está desasentado",
 *   "error": "PEDIDO_NO_ENCONTRADO"
 * }
 */
// Ruta obsoleta eliminada: '/:kardexid/desasentar' (dependía de un cliente db inexistente)


