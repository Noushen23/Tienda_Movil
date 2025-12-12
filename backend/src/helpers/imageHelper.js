const config = require('../config/env');

/**
 * Helper para manejar URLs de imágenes de manera consistente
 */
class ImageHelper {
  /**
   * Valida y limpia una URL de imagen
   * @param {string} imagePath - Ruta o URL de la imagen
   * @returns {string|null} URL válida o null si es inválida
   */
  static validateAndCleanImageUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') {
      return null;
    }

    // Limpiar espacios y caracteres especiales
    const cleanedPath = imagePath.trim();
    
    if (cleanedPath === '') {
      return null;
    }

    // Si ya es una URL completa, validarla
    if (cleanedPath.startsWith('http://') || cleanedPath.startsWith('https://')) {
      try {
        new URL(cleanedPath);
        return cleanedPath;
      } catch (error) {
        console.warn('⚠️ URL de imagen malformada:', cleanedPath);
        return null;
      }
    }

    // Construir URL completa
    const baseUrl = config.apiBaseUrl || 'http://181.49.225.61:3001';
    const cleanPath = cleanedPath.startsWith('/') ? cleanedPath : `/${cleanedPath}`;
    const fullUrl = `${baseUrl}${cleanPath}`;
    
    try {
      new URL(fullUrl);
      return fullUrl;
    } catch (error) {
      console.warn('⚠️ URL construida malformada:', fullUrl);
      return null;
    }
  }

  /**
   * Construye la URL completa de una imagen
   * @param {string} imagePath - Ruta relativa de la imagen
   * @returns {string} URL completa de la imagen
   */
  static buildImageUrl(imagePath) {
    if (!imagePath) {
      return null;
    }

    // Si ya es una URL completa, devolverla tal como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Construir URL completa usando la configuración
    const baseUrl = config.apiBaseUrl || 'http://181.49.225.61:3001';
    
    // Asegurar que la ruta comience con /
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Construir URL final
    const finalUrl = `${baseUrl}${cleanPath}`;
    
    console.log(`🔗 ImageHelper: Construyendo URL de imagen: ${finalUrl}`);
    return finalUrl;
  }

  /**
   * Formatea un array de imágenes con URLs completas
   * @param {Array} images - Array de objetos imagen
   * @returns {Array} Array de imágenes con URLs formateadas
   */
  static formatImages(images) {
    if (!Array.isArray(images)) {
      return [];
    }

    return images.map(img => ({
      ...img,
      url: this.buildImageUrl(img.url || img.url_imagen)
    }));
  }

  /**
   * Formatea una imagen única con URL completa
   * @param {Object} image - Objeto imagen
   * @returns {Object|null} Imagen formateada o null
   */
  static formatSingleImage(image) {
    if (!image) {
      return null;
    }

    return {
      ...image,
      url: this.buildImageUrl(image.url || image.url_imagen)
    };
  }

  /**
   * Obtiene la primera imagen de un producto
   * @param {Array} images - Array de imágenes
   * @returns {Object|null} Primera imagen o null
   */
  static getFirstImage(images) {
    if (!Array.isArray(images) || images.length === 0) {
      return null;
    }

    return this.formatSingleImage(images[0]);
  }

  /**
   * Obtiene la imagen principal de un producto
   * @param {Array} images - Array de imágenes
   * @returns {Object|null} Imagen principal o null
   */
  static getMainImage(images) {
    if (!Array.isArray(images)) {
      return null;
    }

    const mainImage = images.find(img => img.es_principal === true || img.es_principal === 1);
    
    if (mainImage) {
      return this.formatSingleImage(mainImage);
    }

    // Si no hay imagen principal, devolver la primera
    return this.getFirstImage(images);
  }

  /**
   * Valida si una URL de imagen es válida
   * @param {string} url - URL a validar
   * @returns {boolean} True si es válida
   */
  static isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Verificar que sea una URL válida
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la URL base de la API
   * @returns {string} URL base
   */
  static getBaseUrl() {
    return config.apiBaseUrl || config.app.url || 'http://181.49.225.61:3001';
  }

  /**
   * Convierte una ruta de archivo en URL accesible
   * @param {string} filePath - Ruta del archivo
   * @returns {string} URL del archivo
   */
  static filePathToUrl(filePath) {
    if (!filePath) {
      return null;
    }

    // Convertir ruta de archivo a URL
    // Ejemplo: ./uploads/products/image.jpg -> /uploads/products/image.jpg
    const urlPath = filePath.replace(/^\./, '').replace(/\\/g, '/');
    
    return this.buildImageUrl(urlPath);
  }
}

module.exports = ImageHelper;
