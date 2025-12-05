const { query } = require('../config/database');

/**
 * Controlador para búsqueda y filtros
 */
class SearchController {

  /**
   * Obtener rangos de precio para filtros
   * GET /api/v1/search/price-range
   */
  async getPriceRange(req, res) {
    try {
      const { categoriaId } = req.query;
      
      let whereConditions = ['activo = TRUE'];
      let params = [];

      if (categoriaId) {
        whereConditions.push('categoria_id = ?');
        params.push(categoriaId);
      }

      // Eliminado filtro por marca

      const whereClause = whereConditions.join(' AND ');

      const [result] = await query(`
        SELECT 
          MIN(precio) as precio_min,
          MAX(precio) as precio_max,
          AVG(precio) as precio_promedio
        FROM productos
        WHERE ${whereClause}
      `, params);

      return res.status(200).json({
        success: true,
        data: {
          min: parseFloat(result.precio_min) || 0,
          max: parseFloat(result.precio_max) || 0,
          avg: parseFloat(result.precio_promedio) || 0
        }
      });

    } catch (error) {
      console.error('❌ Error al obtener rango de precios:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener rango de precios',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


  /**
   * Obtener sugerencias de búsqueda
   * GET /api/v1/search/suggestions?q=term
   */
  async getSearchSuggestions(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      const searchTerm = `%${q.trim()}%`;

      // Buscar en nombres de productos
      const productSuggestions = await query(`
        SELECT DISTINCT nombre
        FROM productos
        WHERE activo = TRUE
          AND nombre LIKE ?
        ORDER BY ventas_totales DESC, nombre ASC
        LIMIT 5
      `, [searchTerm]);

      // Buscar en categorías
      const categorySuggestions = await query(`
        SELECT nombre
        FROM categorias
        WHERE activa = TRUE
          AND nombre LIKE ?
        LIMIT 3
      `, [searchTerm]);

      const suggestions = [
        ...productSuggestions.map(p => ({ tipo: 'producto', texto: p.nombre })),
        ...categorySuggestions.map(c => ({ tipo: 'categoria', texto: c.nombre }))
      ];

      return res.status(200).json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('❌ Error al obtener sugerencias:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener sugerencias',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new SearchController();

