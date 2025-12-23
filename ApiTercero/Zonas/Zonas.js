const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /api/zonas - Obtener todas las zonas con paginación y búsqueda
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;
        
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
        const offset = (pageNum - 1) * limitNum;
        
        let whereConditions = [];
        let params = [];
        
        if (search) {
            const searchTerm = search.trim();
            const searchConditions = [];
            
            // Búsqueda en NOMBRE (VARCHAR 40)
            if (searchTerm.length <= 38) { // 40 - 2 (para los %)
                searchConditions.push("NOMBRE LIKE ?");
                params.push(`%${searchTerm}%`);
            }
            
            // Búsqueda en CODIGO (VARCHAR 8)
            if (searchTerm.length <= 6) { // 8 - 2 (para los %)
                searchConditions.push("CODIGO LIKE ?");
                params.push(`%${searchTerm}%`);
            } else if (searchTerm.length <= 8) {
                // Búsqueda exacta sin wildcards si es muy largo
                searchConditions.push("CODIGO = ?");
                params.push(searchTerm);
            }
            
            if (searchConditions.length > 0) {
                whereConditions.push(`(${searchConditions.join(' OR ')})`);
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM ZONAS ${whereClause}`;
        const totalResult = await executeQuery(countQuery, params);
        const total = totalResult[0].TOTAL;
        
        // Query principal
        const query = `
            SELECT FIRST ${limitNum} SKIP ${offset}
                ZONAID, CODIGO, NOMBRE
            FROM ZONAS
            ${whereClause}
            ORDER BY NOMBRE ASC
        `;
        
        const zonas = await executeQuery(query, params);
        
        const totalPages = Math.ceil(total / limitNum);
        
        res.set('Cache-Control', 'public, max-age=300');
        res.json({
            success: true,
            data: zonas,
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
        console.error('Error obteniendo zonas:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo zonas',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/zonas/:id - Obtener zona por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const idNum = parseInt(id);
        if (!idNum || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        
        const query = `
            SELECT ZONAID, CODIGO, NOMBRE
            FROM ZONAS
            WHERE ZONAID = ?
        `;
        
        const zona = await executeQuery(query, [idNum]);
        
        if (!zona || zona.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zona no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: zona[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo zona:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo zona'
        });
    }
});

// GET /api/zonas/codigo/:codigo - Obtener zona por código
router.get('/codigo/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const codigoTrim = codigo.trim();
        if (!codigoTrim || codigoTrim === '') {
            return res.status(400).json({
                success: false,
                message: 'Código inválido'
            });
        }
        
        if (codigoTrim.length > 8) {
            return res.status(400).json({
                success: false,
                message: 'Código demasiado largo (máximo 8 caracteres)'
            });
        }
        
        const query = `
            SELECT ZONAID, CODIGO, NOMBRE
            FROM ZONAS
            WHERE UPPER(CODIGO) = UPPER(?)
        `;
        
        const zona = await executeQuery(query, [codigoTrim]);
        
        if (!zona || zona.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zona no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: zona[0]
        });
        
    } catch (error) {
        console.error('Error obteniendo zona:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo zona'
        });
    }
});

// POST /api/zonas - Crear nueva zona
router.post('/', async (req, res) => {
    try {
        const { codigo, nombre } = req.body;
        
        // Validaciones
        if (!codigo || codigo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El código es requerido'
            });
        }
        
        if (codigo.trim().length > 8) {
            return res.status(400).json({
                success: false,
                message: 'El código no puede tener más de 8 caracteres'
            });
        }
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        if (nombre.trim().length > 40) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede tener más de 40 caracteres'
            });
        }
        
        const codigoTrim = codigo.trim().toUpperCase();
        const nombreTrim = nombre.trim();
        
        // Verificar que el código no exista
        const existingQuery = `SELECT ZONAID FROM ZONAS WHERE UPPER(CODIGO) = ?`;
        const existing = await executeQuery(existingQuery, [codigoTrim]);
        
        if (existing && existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una zona con este código'
            });
        }
        
        // Verificar que el nombre no exista
        const existingNameQuery = `SELECT ZONAID FROM ZONAS WHERE UPPER(NOMBRE) = UPPER(?)`;
        const existingName = await executeQuery(existingNameQuery, [nombreTrim]);
        
        if (existingName && existingName.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una zona con este nombre'
            });
        }
        
        // Obtener el siguiente ID
        const maxIdQuery = `SELECT MAX(ZONAID) as MAX_ID FROM ZONAS`;
        const maxIdResult = await executeQuery(maxIdQuery);
        const nextId = (maxIdResult[0].MAX_ID || 0) + 1;
        
        // Insertar nuevo registro
        const insertQuery = `
            INSERT INTO ZONAS (ZONAID, CODIGO, NOMBRE)
            VALUES (?, ?, ?)
        `;
        
        await executeQuery(insertQuery, [nextId, codigoTrim, nombreTrim]);
        
        // Obtener el registro creado
        const newZona = await executeQuery(
            `SELECT ZONAID, CODIGO, NOMBRE FROM ZONAS WHERE ZONAID = ?`,
            [nextId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Zona creada exitosamente',
            data: newZona[0]
        });
        
    } catch (error) {
        console.error('Error creando zona:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando zona'
        });
    }
});

// PUT /api/zonas/:id - Actualizar zona
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, nombre } = req.body;
        
        const idNum = parseInt(id);
        if (!idNum || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }
        
        // Verificar que el registro existe
        const existsQuery = `SELECT ZONAID FROM ZONAS WHERE ZONAID = ?`;
        const exists = await executeQuery(existsQuery, [idNum]);
        
        if (!exists || exists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Zona no encontrada'
            });
        }
        
        // Validaciones
        if (!codigo || codigo.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El código es requerido'
            });
        }
        
        if (codigo.trim().length > 8) {
            return res.status(400).json({
                success: false,
                message: 'El código no puede tener más de 8 caracteres'
            });
        }
        
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        if (nombre.trim().length > 40) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede tener más de 40 caracteres'
            });
        }
        
        const codigoTrim = codigo.trim().toUpperCase();
        const nombreTrim = nombre.trim();
        
        // Verificar que el código no exista en otro registro
        const duplicateQuery = `SELECT ZONAID FROM ZONAS WHERE UPPER(CODIGO) = ? AND ZONAID != ?`;
        const duplicate = await executeQuery(duplicateQuery, [codigoTrim, idNum]);
        
        if (duplicate && duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otra zona con este código'
            });
        }
        
        // Verificar que el nombre no exista en otro registro
        const duplicateNameQuery = `SELECT ZONAID FROM ZONAS WHERE UPPER(NOMBRE) = UPPER(?) AND ZONAID != ?`;
        const duplicateName = await executeQuery(duplicateNameQuery, [nombreTrim, idNum]);
        
        if (duplicateName && duplicateName.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otra zona con este nombre'
            });
        }
        
        // Actualizar registro
        const updateQuery = `
            UPDATE ZONAS 
            SET CODIGO = ?, NOMBRE = ?
            WHERE ZONAID = ?
        `;
        
        await executeQuery(updateQuery, [codigoTrim, nombreTrim, idNum]);
        
        // Obtener el registro actualizado
        const updatedZona = await executeQuery(
            `SELECT ZONAID, CODIGO, NOMBRE FROM ZONAS WHERE ZONAID = ?`,
            [idNum]
        );
        
        res.json({
            success: true,
            message: 'Zona actualizada exitosamente',
            data: updatedZona[0]
        });
        
    } catch (error) {
        console.error('Error actualizando zona:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando zona'
        });
    }
});

// DELETE /api/zonas/:id - Eliminar zona
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = Number(id);

        if (!idNum || isNaN(idNum) || idNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        // Verificar existencia de la zona
        const [zona] = await executeQuery(
            `SELECT ZONAID, CODIGO, NOMBRE FROM ZONAS WHERE ZONAID = ?`,
            [idNum]
        );
        if (!zona) {
            return res.status(404).json({
                success: false,
                message: 'Zona no encontrada'
            });
        }

        // Verificar dependencias en terceros
        const [{ TOTAL: totalTerceros }] = await executeQuery(
            `SELECT COUNT(*) AS TOTAL FROM TERCEROS WHERE ZONAID = ?`,
            [idNum]
        );
        if (totalTerceros > 0) {
            return res.status(409).json({
                success: false,
                message: 'No se puede eliminar la zona porque tiene terceros asociados'
            });
        }

        // Eliminar zona
        await executeQuery(`DELETE FROM ZONAS WHERE ZONAID = ?`, [idNum]);

        res.json({
            success: true,
            message: 'Zona eliminada exitosamente',
            data: zona
        });
    } catch (error) {
        console.error('Error eliminando zona:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando zona'
        });
    }
});

module.exports = router;
