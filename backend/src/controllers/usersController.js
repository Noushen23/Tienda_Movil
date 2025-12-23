const { query } = require('../config/database');

class UsersController {
  // Obtener todos los usuarios con filtros y paginación (admin)
  static async getAllUsers(req, res) {
    try {
      const {
        search,
        rol,
        emailVerificado,
        activo,
        page = 1,
        limit = 25,
        sortBy = 'fecha_creacion',
        sortOrder = 'DESC'
      } = req.query;

      let sql = `
        SELECT 
          id, email, nombre_completo, telefono, direccion,
          tipo_identificacion, numero_identificacion, rol,
          email_verificado, activo, fecha_creacion, fecha_actualizacion, ultimo_acceso
        FROM usuarios
        WHERE 1=1
      `;
      
      const params = [];
      
      // Filtro de búsqueda
      if (search) {
        sql += ' AND (nombre_completo LIKE ? OR email LIKE ? OR telefono LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      // Filtro por rol
      if (rol && rol !== 'all') {
        sql += ' AND rol = ?';
        params.push(rol);
      }
      
      // Filtro por email verificado
      if (emailVerificado !== undefined && emailVerificado !== '') {
        sql += ' AND email_verificado = ?';
        params.push(emailVerificado === 'true' ? 1 : 0);
      }
      
      // Filtro por estado activo
      if (activo !== undefined && activo !== '') {
        sql += ' AND activo = ?';
        params.push(activo === 'true' ? 1 : 0);
      }
      
      // Ordenamiento
      const validSortFields = {
        'nombre': 'nombre_completo',
        'nombre_desc': 'nombre_completo',
        'email': 'email',
        'email_desc': 'email',
        'recientes': 'fecha_creacion',
        'recientes_desc': 'fecha_creacion'
      };
      
      const sortField = validSortFields[sortBy] || 'fecha_creacion';
      const order = sortBy.includes('_desc') || (sortBy === 'recientes' && sortOrder === 'DESC') ? 'DESC' : 'ASC';
      
      sql += ` ORDER BY ${sortField} ${order}`;
      
      // Contar total de registros
      const countSql = sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
      const [countResult] = await query(countSql, params);
      const total = countResult?.total || 0;
      
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const users = await query(sql, params);
      
      const totalPages = Math.ceil(total / parseInt(limit));
      
      res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: {
          users: users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            totalPages: totalPages,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener un usuario por ID (admin)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const sql = `
        SELECT 
          id, email, nombre_completo, telefono, direccion,
          tipo_identificacion, numero_identificacion, rol,
          email_verificado, activo, fecha_creacion, fecha_actualizacion, ultimo_acceso
        FROM usuarios
        WHERE id = ?
      `;
      
      const users = await query(sql, [id]);
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: {
          user: users[0]
        }
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Actualizar un usuario (admin)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre_completo,
        telefono,
        direccion,
        tipo_identificacion,
        numero_identificacion,
        rol,
        activo
      } = req.body;
      
      // Validar que el usuario existe
      const checkSql = 'SELECT id FROM usuarios WHERE id = ?';
      const [existingUser] = await query(checkSql, [id]);
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Construir query de actualización
      const updates = [];
      const values = [];
      
      if (nombre_completo !== undefined) {
        updates.push('nombre_completo = ?');
        values.push(nombre_completo);
      }
      if (telefono !== undefined) {
        updates.push('telefono = ?');
        values.push(telefono);
      }
      if (direccion !== undefined) {
        updates.push('direccion = ?');
        values.push(direccion);
      }
      if (tipo_identificacion !== undefined) {
        updates.push('tipo_identificacion = ?');
        values.push(tipo_identificacion);
      }
      if (numero_identificacion !== undefined) {
        updates.push('numero_identificacion = ?');
        values.push(numero_identificacion);
      }
      if (rol !== undefined) {
        updates.push('rol = ?');
        values.push(rol);
      }
      if (activo !== undefined) {
        updates.push('activo = ?');
        values.push(activo ? 1 : 0);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron datos para actualizar'
        });
      }
      
      updates.push('fecha_actualizacion = NOW()');
      values.push(id);
      
      const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
      await query(sql, values);
      
      // Obtener usuario actualizado
      const updatedUser = await query(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: {
          user: updatedUser[0]
        }
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar/desactivar un usuario (admin)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario existe
      const checkSql = 'SELECT id, nombre_completo, email FROM usuarios WHERE id = ?';
      const [existingUser] = await query(checkSql, [id]);
      
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Desactivar usuario en lugar de eliminar (soft delete)
      const sql = 'UPDATE usuarios SET activo = 0, fecha_actualizacion = NOW() WHERE id = ?';
      await query(sql, [id]);
      
      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        data: {
          id: id,
          nombre_completo: existingUser.nombre_completo,
          email: existingUser.email
        }
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de usuarios (admin)
  static async getUserStats(req, res) {
    try {
      const statsSql = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN rol = 'admin' THEN 1 ELSE 0 END) as total_admins,
          SUM(CASE WHEN rol = 'cliente' THEN 1 ELSE 0 END) as total_clients,
          SUM(CASE WHEN email_verificado = 1 THEN 1 ELSE 0 END) as verified_users,
          SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_users_week,
          SUM(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_users_month
        FROM usuarios
      `;
      
      const [stats] = await query(statsSql);
      
      res.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = UsersController;
