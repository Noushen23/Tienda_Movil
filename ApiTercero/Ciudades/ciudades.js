/**
 * CRUD Completo para Ciudades (CIUDANE)
 * Manejo completo de ciudades del sistema TNS
 */

const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Middleware de validación para autenticación
const validateAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token requerido para esta operación' 
        });
    }
    next();
};

// ===== ENDPOINTS CRUD CIUDANE =====

// GET /api/ciudades - Obtener todas las ciudades con paginación y búsqueda
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 50, search, departamento } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        let whereConditions = [];
        let params = [];
        
        // Filtro por búsqueda en nombre o código
        if (search) {
            const searchTerm = search.trim();
            if (searchTerm.length > 0) {
                whereConditions.push("(UPPER(NOMBRE) LIKE UPPER(?) OR UPPER(CODIGO) LIKE UPPER(?))");
                params.push(`%${searchTerm}%`, `%${searchTerm}%`);
            }
        }
        
        // Filtro por departamento
        if (departamento) {
            const deptoTerm = departamento.trim();
            if (deptoTerm.length > 0) {
                whereConditions.push("UPPER(DEPARTAMENTO) LIKE UPPER(?)");
                params.push(`%${deptoTerm}%`);
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM CIUDANE ${whereClause}`;
        const totalResult = await executeQuery(countQuery, params);
        const total = totalResult[0].TOTAL;
        
        // Query principal con paginación
        const query = `
            SELECT FIRST ${limitNum} SKIP ${offset}
                CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO
            FROM CIUDANE
            ${whereClause}
            ORDER BY DEPARTAMENTO ASC, NOMBRE ASC
        `;
        
        const ciudades = await executeQuery(query, params);
        
        const totalPages = Math.ceil(total / limitNum);
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: ciudades,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo ciudades:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al obtener ciudades';
        next(error);
    }
});

// GET /api/ciudades/:id - Obtener ciudad por ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const idNum = parseInt(id);
        if (!idNum || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de ciudad inválido'
            });
        }
        
        const query = `
            SELECT CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO
            FROM CIUDANE
            WHERE CIUDANEID = ?
        `;
        
        const ciudad = await executeQuery(query, [idNum]);
        
        if (!ciudad || ciudad.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ciudad no encontrada'
            });
        }
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: ciudad[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo ciudad:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al obtener ciudad';
        next(error);
    }
});

// GET /api/ciudades/codigo/:codigo - Obtener ciudad por código
router.get('/codigo/:codigo', async (req, res, next) => {
    try {
        const { codigo } = req.params;
        
        const codigoTrim = codigo.trim();
        if (!codigoTrim || codigoTrim === '') {
            return res.status(400).json({
                success: false,
                message: 'Código de ciudad inválido'
            });
        }
        
        const query = `
            SELECT CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO
            FROM CIUDANE
            WHERE UPPER(CODIGO) = UPPER(?)
        `;
        
        const ciudad = await executeQuery(query, [codigoTrim]);
        
        if (!ciudad || ciudad.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ciudad no encontrada'
            });
        }
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: ciudad[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo ciudad por código:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al obtener ciudad';
        next(error);
    }
});

// POST /api/ciudades - Crear nueva ciudad (requiere autenticación)
router.post('/', validateAuth, async (req, res, next) => {
    try {
        const { codigo, nombre, departamento } = req.body;
        
        // Validaciones
        if (!codigo || codigo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El código de ciudad es requerido'
            });
        }
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la ciudad es requerido'
            });
        }
        
        if (!departamento || departamento.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El departamento es requerido'
            });
        }
        
        if (codigo.trim().length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código no puede tener más de 20 caracteres'
            });
        }
        
        if (nombre.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede tener más de 50 caracteres'
            });
        }
        
        if (departamento.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El departamento no puede tener más de 50 caracteres'
            });
        }
        
        const codigoTrim = codigo.trim().toUpperCase();
        const nombreTrim = nombre.trim();
        const departamentoTrim = departamento.trim();
        
        // Verificar que el código no exista
        const existingQuery = `SELECT CIUDANEID FROM CIUDANE WHERE UPPER(CODIGO) = ?`;
        const existing = await executeQuery(existingQuery, [codigoTrim]);
        
        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una ciudad con este código'
            });
        }
        
        // Obtener el siguiente ID
        const maxIdQuery = `SELECT MAX(CIUDANEID) as MAX_ID FROM CIUDANE`;
        const maxIdResult = await executeQuery(maxIdQuery);
        const nextId = (maxIdResult[0].MAX_ID || 0) + 1;
        
        // Insertar nuevo registro
        const insertQuery = `
            INSERT INTO CIUDANE (CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO)
            VALUES (?, ?, ?, ?)
        `;
        
        await executeQuery(insertQuery, [nextId, codigoTrim, nombreTrim, departamentoTrim]);
        
        // Obtener el registro creado
        const newCiudad = await executeQuery(
            `SELECT CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO FROM CIUDANE WHERE CIUDANEID = ?`,
            [nextId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Ciudad creada exitosamente',
            data: newCiudad[0]
        });
        
    } catch (error) {
        console.error('Error creando ciudad:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al crear ciudad';
        next(error);
    }
});

// PUT /api/ciudades/:id - Actualizar ciudad (requiere autenticación)
router.put('/:id', validateAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { codigo, nombre, departamento } = req.body;
        
        const idNum = parseInt(id);
        if (!idNum || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de ciudad inválido'
            });
        }
        
        // Verificar que el registro existe
        const existsQuery = `SELECT CIUDANEID FROM CIUDANE WHERE CIUDANEID = ?`;
        const exists = await executeQuery(existsQuery, [idNum]);
        
        if (!exists || exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ciudad no encontrada'
            });
        }
        
        // Validaciones
        if (!codigo || codigo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El código de ciudad es requerido'
            });
        }
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la ciudad es requerido'
            });
        }
        
        if (!departamento || departamento.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El departamento es requerido'
            });
        }
        
        if (codigo.trim().length > 20) {
            return res.status(400).json({
                success: false,
                message: 'El código no puede tener más de 20 caracteres'
            });
        }
        
        if (nombre.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede tener más de 50 caracteres'
            });
        }
        
        if (departamento.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El departamento no puede tener más de 50 caracteres'
            });
        }
        
        const codigoTrim = codigo.trim().toUpperCase();
        const nombreTrim = nombre.trim();
        const departamentoTrim = departamento.trim();
        
        // Verificar que el código no exista en otro registro
        const duplicateQuery = `SELECT CIUDANEID FROM CIUDANE WHERE UPPER(CODIGO) = ? AND CIUDANEID != ?`;
        const duplicate = await executeQuery(duplicateQuery, [codigoTrim, idNum]);
        
        if (duplicate && duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otra ciudad con este código'
            });
        }
        
        // Actualizar registro
        const updateQuery = `
            UPDATE CIUDANE 
            SET CODIGO = ?, NOMBRE = ?, DEPARTAMENTO = ?
            WHERE CIUDANEID = ?
        `;
        
        await executeQuery(updateQuery, [codigoTrim, nombreTrim, departamentoTrim, idNum]);
        
        // Obtener el registro actualizado
        const updatedCiudad = await executeQuery(
            `SELECT CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO FROM CIUDANE WHERE CIUDANEID = ?`,
            [idNum]
        );
        
        res.json({
            success: true,
            message: 'Ciudad actualizada exitosamente',
            data: updatedCiudad[0]
        });
        
    } catch (error) {
        console.error('Error actualizando ciudad:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al actualizar ciudad';
        next(error);
    }
});

// DELETE /api/ciudades/:id - Eliminar ciudad (requiere autenticación)
router.delete('/:id', validateAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const idNum = parseInt(id);
        if (!idNum || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID de ciudad inválido'
            });
        }
        
        // Verificar que el registro existe
        const existsQuery = `SELECT CIUDANEID, CODIGO, NOMBRE, DEPARTAMENTO FROM CIUDANE WHERE CIUDANEID = ?`;
        const exists = await executeQuery(existsQuery, [idNum]);
        
        if (!exists || exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ciudad no encontrada'
            });
        }
        
        // Verificar si hay terceros asociados a esta ciudad
        const tercerosQuery = `SELECT COUNT(*) as total FROM TERCEROS WHERE CIUDANEID = ?`;
        const tercerosResult = await executeQuery(tercerosQuery, [idNum]);
        
        if (tercerosResult[0].TOTAL > 0) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar la ciudad porque tiene terceros asociados'
            });
        }
        
        // Eliminar registro
        const deleteQuery = `DELETE FROM CIUDANE WHERE CIUDANEID = ?`;
        await executeQuery(deleteQuery, [idNum]);
        
        res.json({
            success: true,
            message: 'Ciudad eliminada exitosamente',
            data: exists[0]
        });
        
    } catch (error) {
        console.error('Error eliminando ciudad:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al eliminar ciudad';
        next(error);
    }
});

// GET /api/ciudades/departamentos/lista - Obtener lista única de departamentos
router.get('/departamentos/lista', async (req, res, next) => {
    try {
        const query = `
            SELECT DISTINCT DEPARTAMENTO
            FROM CIUDANE
            WHERE DEPARTAMENTO IS NOT NULL
            ORDER BY DEPARTAMENTO ASC
        `;
        
        const departamentos = await executeQuery(query);
        
        res.set('Cache-Control', 'public, max-age=600'); // Cache por 10 minutos
        res.json({
            success: true,
            data: departamentos.map(d => d.DEPARTAMENTO)
        });
        
    } catch (error) {
        console.error('Error obteniendo departamentos:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Error al obtener departamentos';
        next(error);
    }
});

module.exports = router;
