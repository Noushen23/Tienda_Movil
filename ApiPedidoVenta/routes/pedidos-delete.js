/**
 * Rutas para eliminación de pedidos (KARDEX)
 * Endpoint base: /api/pedidos-delete
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeTransactionWithCallback } = require('../config/database');
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

// Verifica si el pedido tiene información de facturación en DEKARDEXSELF (tolerante a errores)
async function isPedidoFacturado(transaction, kardexId) {
	const runner = (query, params) => new Promise((resolve, reject) => {
		try {
			transaction.query(query, params, (err, result) => err ? reject(err) : resolve(result));
		} catch (err) {
			reject(err);
		}
	});
	// 1) Confirmar existencia de la tabla
	try {
		const rel = await runner(
			'SELECT COUNT(*) AS CNT FROM RDB$RELATIONS WHERE TRIM(UPPER(RDB$RELATION_NAME)) = ?',
			['DEKARDEXSELF']
		);
		const exists = Number(rel && rel[0] && (rel[0].CNT || rel[0].cnt) || 0) > 0;
		if (!exists) return false;
	} catch (e) {
		console.warn('[isPedidoFacturado] No se pudo consultar metadata de RDB$RELATIONS:', e && e.message);
		return false;
	}
	// 2) Consultar por KARDEXID
	try {
		const r1 = await runner('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE KARDEXID = ?', [kardexId]);
		const c1 = Number(r1 && r1[0] && (r1[0].CNT || r1[0].cnt) || 0);
		if (c1 > 0) return true;
	} catch (e) {
		console.warn('[isPedidoFacturado] Error consultando DEKARDEXSELF.KARDEXID:', e && e.message);
	}
	// 3) Consultar por PEDIDOID
	try {
		const r2 = await runner('SELECT COUNT(*) AS CNT FROM DEKARDEXSELF WHERE PEDIDOID = ?', [kardexId]);
		const c2 = Number(r2 && r2[0] && (r2[0].CNT || r2[0].cnt) || 0);
		if (c2 > 0) return true;
	} catch (e) {
		console.warn('[isPedidoFacturado] Error consultando DEKARDEXSELF.PEDIDOID:', e && e.message);
	}
	return false;
}

// DELETE /api/pedidos-delete/:id - Eliminar pedido completo (KARDEX + DEKARDEX)
/**
 * Eliminar un pedido completo (KARDEX + DEKARDEX)
 * DELETE /api/pedidos-delete/:id
 */
router.delete('/:id', async (req, res, next) => {
	let connection;
	try {
		const { id } = req.params;
		const idNum = parseInt(String(id), 10);
		if (!Number.isFinite(idNum) || idNum <= 0) {
			return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'El parámetro id debe ser numérico y mayor a cero' });
		}
		connection = await createConnection();

		const result = await executeTransactionWithCallback(connection, async (transaction) => {
			// Validar existencia y estado
			const rows = await executeQueryInTransaction(
				transaction,
				'SELECT KARDEXID, FECASENTAD, FECANULADO FROM KARDEX WHERE KARDEXID = ?',
				[idNum]
			);
			if (!rows || rows.length === 0) {
				const e = new Error('Pedido no encontrado');
				e.status = 404; throw e;
			}

			// Bloquear si está asentado o anulado
			if (rows[0].FECASENTAD) {
				const e = new Error('No se puede eliminar: pedido asentado');
				e.status = 400; e.code = 'PEDIDO_ASENTADO'; throw e;
			}
			if (rows[0].FECANULADO) {
				const e = new Error('No se puede eliminar: pedido anulado');
				e.status = 400; e.code = 'PEDIDO_ANULADO'; throw e;
			}

			// Bloquear si ya está facturado
			const fact = await isPedidoFacturado(transaction, idNum);
			if (fact) {
				const e = new Error('Pedido facturado: no se puede eliminar');
				e.status = 409; e.code = 'PEDIDO_FACTURADO'; throw e;
			}

			// Contar líneas antes de borrar
			let lineas = 0;
			try {
				const c = await executeQueryInTransaction(transaction, 'SELECT COUNT(*) AS CNT FROM DEKARDEX WHERE KARDEXID = ?', [idNum]);
				lineas = Number(c && c[0] && (c[0].CNT || c[0].cnt) || 0);
			} catch (_) {}

			// Eliminar líneas y encabezado
			await executeQueryInTransaction(transaction, 'DELETE FROM DEKARDEX WHERE KARDEXID = ?', [idNum]);
			await executeQueryInTransaction(transaction, 'DELETE FROM KARDEX WHERE KARDEXID = ?', [idNum]);

			return { kardexid: idNum, lineasEliminadas: lineas };
		});

		return res.json({ success: true, message: 'Pedido eliminado exitosamente', data: result });
	} catch (error) {
		if (error && (error.status === 404 || error.status === 400 || error.status === 409)) {
			return res.status(error.status).json({ success: false, error: error.code || 'ERROR', message: error.message });
		}
		next(error);
	} finally {
		if (connection) connection.detach();
	}
});

module.exports = router;

/**
 * Documentación y ejemplos de uso para eliminar pedidos
 * 
 * ENDPOINT: DELETE /api/pedidos-delete/:id
 * 
 * Descripción:
 * Elimina completamente un pedido del sistema, incluyendo todas sus líneas.
 * Solo permite eliminar pedidos que NO estén asentados, anulados o facturados.
 * 
 * Parámetros:
 * - id: KARDEXID del pedido a eliminar
 * 
 * Validaciones:
 * - El pedido debe existir
 * - No debe estar asentado (FECASENTAD = null)
 * - No debe estar anulado (FECANULADO = null)
 * - No debe estar facturado (sin registros en DEKARDEXSELF)
 * 
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "message": "Pedido eliminado exitosamente",
 *   "data": {
 *     "kardexid": 12345,
 *     "lineasEliminadas": 3
 *   }
 * }
 * 
 * Respuestas de error:
 * 
 * 1. Pedido no encontrado (404):
 * {
 *   "success": false,
 *   "error": "ERROR",
 *   "message": "Pedido no encontrado"
 * }
 * 
 * 2. Pedido asentado (400):
 * {
 *   "success": false,
 *   "error": "ERROR",
 *   "message": "No se puede eliminar: pedido asentado"
 * }
 * 
 * 3. Pedido anulado (400):
 * {
 *   "success": false,
 *   "error": "ERROR",
 *   "message": "No se puede eliminar: pedido anulado"
 * }
 * 
 * 4. Pedido facturado (409):
 * {
 *   "success": false,
 *   "error": "PEDIDO_FACTURADO",
 *   "message": "Pedido facturado: no se puede eliminar"
 * }
 * 
 * EJEMPLOS DE USO CON CURL:
 * 
 * 1. Eliminar pedido exitosamente:
 * curl -X DELETE "http://localhost:51250/api/pedidos-delete/12345" \
 *   -H "Content-Type: application/json"
 * 
 * 2. Intentar eliminar pedido que no existe:
 * curl -X DELETE "http://localhost:51250/api/pedidos-delete/99999" \
 *   -H "Content-Type: application/json"
 * 
 * 3. Intentar eliminar pedido asentado:
 * curl -X DELETE "http://localhost:51250/api/pedidos-delete/12346" \
 *   -H "Content-Type: application/json"
 * 
 * EJEMPLOS DE RESPUESTA EN POSTMAN:
 * 
 * GET Request URL: DELETE {{base_url}}/api/pedidos-delete/12345
 * Headers:
 * Content-Type: application/json
 * 
 * Test Script (Postman):
 * pm.test("Status code is 200", function () {
 *     pm.response.to.have.status(200);
 * });
 * 
 * pm.test("Response has success true", function () {
 *     var jsonData = pm.response.json();
 *     pm.expect(jsonData.success).to.eql(true);
 * });
 * 
 * pm.test("Response contains kardexid", function () {
 *     var jsonData = pm.response.json();
 *     pm.expect(jsonData.data).to.have.property('kardexid');
 * });
 * 
 * TESTING CON JEST:
 * 
 * const request = require('supertest');
 * const app = require('../app');
 * 
 * describe('DELETE /api/pedidos-delete/:id', () => {
 *   test('Debe eliminar pedido válido', async () => {
 *     const response = await request(app)
 *       .delete('/api/pedidos-delete/12345')
 *       .expect(200);
 *     
 *     expect(response.body.success).toBe(true);
 *     expect(response.body.data.kardexid).toBe(12345);
 *   });
 * 
 *   test('Debe retornar 404 para pedido inexistente', async () => {
 *     const response = await request(app)
 *       .delete('/api/pedidos-delete/99999')
 *       .expect(404);
 *     
 *     expect(response.body.success).toBe(false);
 *     expect(response.body.message).toBe('Pedido no encontrado');
 *   });
 * 
 *   test('Debe retornar 400 para pedido asentado', async () => {
 *     const response = await request(app)
 *       .delete('/api/pedidos-delete/12346')
 *       .expect(400);
 *     
 *     expect(response.body.success).toBe(false);
 *     expect(response.body.message).toBe('No se puede eliminar: pedido asentado');
 *   });
 * 
 *   test('Debe retornar 409 para pedido facturado', async () => {
 *     const response = await request(app)
 *       .delete('/api/pedidos-delete/12347')
 *       .expect(409);
 *     
 *     expect(response.body.success).toBe(false);
 *     expect(response.body.error).toBe('PEDIDO_FACTURADO');
 *   });
 * });
 * 
 * CONSIDERACIONES DE SEGURIDAD:
 * - Validar permisos de usuario antes de eliminar
 * - Usar transacciones para mantener integridad
 * - Loggear todas las eliminaciones para auditoría
 * - Considerar soft delete en lugar de hard delete
 * 
 * OPTIMIZACIÓN TNS/FIREBIRD:
 * - La eliminación se hace en transacción para evitar inconsistencias
 * - Se eliminan primero las líneas (DEKARDEX) y luego el encabezado (KARDEX)
 * - Se cuenta las líneas antes de eliminar para informar al usuario
 */


