/**
 * Rutas para cierre de pedidos (KARDEX)
 * Endpoint base: /api/pedidos-cierre
 */




const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const config = require('../config/app.config');

// Helper local para ejecutar consultas dentro de una transacción
async function executeQueryInTransaction(transaction, query, params = []) {
	return new Promise((resolve, reject) => {
		transaction.query(query, params, (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
}


/**
 * Cerrar/Asentar un pedido
 * POST /api/pedidos-cierre/cerrar
 * Body: { kardexid?: number, codcomp?: string, codprefijo?: string, numero?: string, fechaCierre?: 'YYYY-MM-DD', horaCierre?: 'HH:mm' }
 */
router.post('/cerrar', async (req, res, next) => {
	let connection;
	try {
		const { kardexid, codcomp, codprefijo, numero, fechaCierre, horaCierre } = req.body || {};

		// Validación básica de body
		if (!kardexid && !(codcomp && codprefijo && numero)) {
			return res.status(400).json({
				success: false,
				error: 'Datos incompletos',
				message: 'Debe enviar KARDEXID o bien CODCOMP, CODPREFIJO y NUMERO'
			});
		}

		if (fechaCierre && !/^\d{4}-\d{2}-\d{2}$/.test(String(fechaCierre))) {
			return res.status(400).json({ success: false, error: 'FORMATO_FECHA', message: 'fechaCierre debe ser YYYY-MM-DD' });
		}
		if (horaCierre && !/^\d{2}:\d{2}$/.test(String(horaCierre))) {
			return res.status(400).json({ success: false, error: 'FORMATO_HORA', message: 'horaCierre debe ser HH:mm' });
		}

		connection = await createConnection();
		const result = await executeTransactionWithCallback(connection, async (transaction) => {
			// Resolver KARDEXID si viene por llaves
			let id = kardexid;
			let row;
			if (!id) {
				const rows = await executeQueryInTransaction(
					transaction,
					`SELECT FIRST 1 KARDEXID, FECASENTAD, HORAASEN, FECANULADO FROM KARDEX WHERE CODCOMP = ? AND CODPREFIJO = ? AND NUMERO = ?`,
					[String(codcomp).trim(), String(codprefijo).trim(), String(numero).trim()]
				);
				if (!rows || rows.length === 0) {
					const err = new Error('Pedido no encontrado');
					err.status = 404;
					throw err;
				}
				row = rows[0];
				id = row.KARDEXID;
			} else {
				const rows = await executeQueryInTransaction(
					transaction,
					`SELECT KARDEXID, FECASENTAD, HORAASEN, FECANULADO FROM KARDEX WHERE KARDEXID = ?`,
					[id]
				);
				if (!rows || rows.length === 0) {
					const err = new Error('Pedido no encontrado');
					err.status = 404;
					throw err;
				}
				row = rows[0];
			}

			// Verificar si está anulado
			if (row && row.FECANULADO) {
				const err = new Error('No se puede cerrar: pedido anulado');
				err.status = 400;
				err.code = 'PEDIDO_ANULADO';
				throw err;
			}

			// Verificar si ya está cerrado
			if (row && row.FECASENTAD) {
				const err = new Error(`El pedido ya está cerrado. FECASENTAD=${row.FECASENTAD} HORAASEN=${row.HORAASEN || ''}`);
				err.status = 409;
				err.code = 'PEDIDO_YA_CERRADO';
				throw err;
			}

			// Verificar que tenga líneas
			const lineas = await executeQueryInTransaction(
				transaction,
				'SELECT COUNT(*) AS CNT FROM DEKARDEX WHERE KARDEXID = ?',
				[id]
			);
			if (!lineas || !lineas[0] || Number(lineas[0].CNT) === 0) {
				const err = new Error('No se puede cerrar un pedido sin líneas');
				err.status = 400;
				err.code = 'SIN_LINEAS';
				throw err;
			}

			// Fecha/Hora de cierre
			const fecha = (fechaCierre && String(fechaCierre).slice(0, 10)) || new Date().toISOString().slice(0, 10);
			const hora = (horaCierre && String(horaCierre).slice(0, 5)) || new Date().toTimeString().slice(0, 5);

			// Actualizar
			await executeQueryInTransaction(
				transaction,
				`UPDATE KARDEX SET FECASENTAD = CAST(? AS DATE), HORAASEN = ? WHERE KARDEXID = ?`,
				[fecha, hora, id]
			);

			return { kardexid: id, fecha, hora };
		});

		res.json({
			success: true,
			message: 'Pedido cerrado exitosamente',
			data: result
		});
	} catch (error) {
		if (error && (error.status === 404 || error.status === 409)) {
			return res.status(error.status).json({
				success: false,
				error: error.code || 'ERROR',
				message: error.message
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

// GET /api/pedidos-cierre/abiertos
// Query params opcionales: codcomp, codprefijo, sucid, cliente, numero, desde, hasta, limit
router.get('/abiertos', async (req, res, next) => {
	try {
		const { codcomp, codprefijo, sucid, cliente, numero, desde, hasta } = req.query || {};
		let { limit } = req.query || {};
		const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

		const where = [ 'K.FECASENTAD IS NULL', 'K.FECANULADO IS NULL' ];
		const params = [];
		if (codcomp) { where.push('K.CODCOMP = ?'); params.push(String(codcomp).trim()); }
		if (codprefijo) { where.push('K.CODPREFIJO = ?'); params.push(String(codprefijo).trim()); }
		if (sucid) { where.push('K.SUCID = ?'); params.push(Number(sucid)); }
		if (cliente) { where.push('K.CLIENTE = ?'); params.push(Number(cliente)); }
		if (numero) { where.push('K.NUMERO = ?'); params.push(String(numero).trim()); }
		if (desde) { where.push('K.FECHA >= ?'); params.push(String(desde).slice(0,10)); }
		if (hasta) { where.push('K.FECHA <= ?'); params.push(String(hasta).slice(0,10)); }

		const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
		const sql = `
			SELECT FIRST ${lim}
				K.KARDEXID, K.CODCOMP, K.CODPREFIJO, K.NUMERO,
				K.FECHA, K.CLIENTE, K.VENDEDOR, K.SUCID,
				K.VRBASE, K.VRIVA, K.TOTAL,
				K.FECASENTAD, K.HORAASEN
			FROM KARDEX K
			${whereSql}
			ORDER BY K.FECHA DESC, K.KARDEXID DESC
		`;

		const rows = await executeQuery(sql, params);
		return res.json({ success: true, data: rows, count: rows.length });
	} catch (error) {
		next(error);
	}
});


