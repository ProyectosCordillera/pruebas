// ============================================
// API ADAPTER - Con fallback automático de URLs
// Intenta múltiples combinaciones hasta conectar
// ============================================

// Lista de URLs a intentar en orden de prioridad
const API_URLS = [
    'http://170.84.108.45:8080/api-casas/api',  // 1. IP pública + puerto 8080 (internet)
    'http://192.168.1.69:8080/api-casas/api',   // 2. IP local + puerto 8080 (red local)
    'http://170.84.108.45/api-casas/api',       // 3. IP pública + puerto 80 (internet)
    'http://192.168.1.69/api-casas/api'         // 4. IP local + puerto 80 (red local)
];

// URL que está funcionando (se guarda en sessionStorage para persistir entre recargas)
let API_BASE = sessionStorage.getItem('apiBaseUrl') || null;

// ============================================
// FUNCIÓN PARA PROBAR UNA URL ESPECÍFICA
// ============================================
async function probarUrl(url, endpoint = '/casas') {
    try {
        // Timeout de 5 segundos para no esperar indefinidamente
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${url}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        // Si la respuesta es exitosa (200-299), la URL funciona
        if (response.ok) {
            return true;
        }
        return false;
        
    } catch (error) {
        // Cualquier error (timeout, CORS, network) significa que no funciona
        return false;
    }
}

// ============================================
// FUNCIÓN PARA ENCONTRAR LA URL FUNCIONAL
// ============================================
async function encontrarUrlFuncional() {
    console.log('🔄 Buscando URL de API funcional (fallback)...');
    
    for (const url of API_URLS) {
        console.log(`🔍 Probando: ${url}`);
        const funciona = await probarUrl(url);
        
        if (funciona) {
            console.log(`✅ URL funcional encontrada: ${url}`);
            // Guardar en sessionStorage para usar en futuras peticiones
            sessionStorage.setItem('apiBaseUrl', url);
            return url;
        }
    }
    
    console.error('❌ Ninguna URL de API funciona. Verifica:');
    console.error('   • Que IIS esté corriendo en el servidor');
    console.error('   • Que el puerto forwarding esté configurado');
    console.error('   • Que el firewall permita el tráfico');
    console.error('   • ⚠️ Si estás en HTTPS (GitHub Pages), el navegador bloqueará HTTP (Mixed Content)');
    
    return null;
}

// ============================================
// FUNCIÓN PRINCIPAL: Obtener URL base con caché
// ============================================
async function getApiBase() {
    // Si ya tenemos una URL que funciona, usarla directamente
    if (API_BASE) {
        return API_BASE;
    }
    
    // Intentar encontrar una URL funcional
    API_BASE = await encontrarUrlFuncional();
    return API_BASE;
}

// ============================================
// CREAR Database GLOBAL INMEDIATAMENTE
// ============================================
if (typeof window.Database === 'undefined') {
    window.Database = {};
    console.log('🔄 [ApiAdapter] Objeto Database creado inmediatamente');
}

// ============================================
// FUNCIONES QUE IMITAN TU Database.js
// ============================================

const ApiDatabase = {
    
    async getCasas() {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No se pudo conectar a ninguna URL de API');
            
            console.log(`🔄 [API] Obteniendo casas desde: ${baseUrl}`);
            const response = await fetch(`${baseUrl}/casas`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const casas = await response.json();
            
            // Adaptar formato de la API al que espera tu código
            return casas.map(casa => ({
                id: casa.id,
                numero_casa: casa.numeroCasa?.toString() || casa.numero_casa,
                coordenada_x: casa.coordenadaX ?? casa.coordenada_x,
                coordenada_y: casa.coordenadaY ?? casa.coordenada_y
            }));
            
        } catch (error) {
            console.error('❌ [API] Error al obtener casas:', error);
            throw error;
        }
    },

    async getClienteByCasa(numeroCasa) {
        try {
            console.log(`🔄 [API] Buscando cliente para casa ${numeroCasa}...`);
            // Temporal: sin clientes asociados (hasta que agregues el endpoint)
            return null;
        } catch (error) {
            console.warn('⚠️ [API] No se pudo obtener el cliente:', error);
            return null;
        }
    },

    async insertarCasaConCliente(numeroCasa, coordX, coordY, nombreCliente) {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No se pudo conectar a ninguna URL de API');
            
            console.log(`💾 [API] Guardando casa ${numeroCasa} en: ${baseUrl}`);
            
            const response = await fetch(`${baseUrl}/casas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroCasa: parseInt(numeroCasa),
                    coordenadaX: parseFloat(coordX),
                    coordenadaY: parseFloat(coordY)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ [API] Casa guardada con ID: ${result.id}`);
            return true;
            
        } catch (error) {
            console.error('❌ [API] Error al guardar:', error);
            throw error;
        }
    },

    async eliminarCasaConCliente(numeroCasa) {
        try {
            const baseUrl = await getApiBase();
            if (!baseUrl) throw new Error('No se pudo conectar a ninguna URL de API');
            
            console.log(`🗑️ [API] Eliminando casa ${numeroCasa} desde: ${baseUrl}`);
            
            const response = await fetch(`${baseUrl}/casas/${numeroCasa}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            console.log(`✅ [API] Casa ${numeroCasa} eliminada`);
            return true;
            
        } catch (error) {
            console.error('❌ [API] Error al eliminar:', error);
            throw error;
        }
    },

    async getCasaByNumero(numeroCasa) {
        try {
            const casas = await this.getCasas();
            return casas.find(c => c.numero_casa === numeroCasa.toString()) || null;
        } catch (error) {
            console.error('❌ [API] Error buscando casa:', error);
            return null;
        }
    }
};

// ✅ COPIAR funciones de ApiDatabase a Database INMEDIATAMENTE
Object.assign(window.Database, ApiDatabase);

// ✅ Verificación final
console.log('✅ ApiDatabase cargado - Sistema de fallback activo');
console.log('✅ URLs configuradas para intentar:', API_URLS.length);
console.log('✅ Database disponible con funciones:', Object.keys(window.Database));

// ✅ Exportar para compatibilidad con módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Database;
}
