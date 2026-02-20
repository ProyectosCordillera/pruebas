// Función para detectar si estamos en red local
function estaEnRedLocal() {
    const hostname = window.location.hostname;
    // Si el dominio es localhost, 192.168.x.x, 10.x.x.x, o 172.16-31.x.x
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' ||
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.startsWith('172.16.') ||
           hostname.startsWith('172.17.') ||
           hostname.startsWith('172.18.') ||
           hostname.startsWith('172.19.') ||
           hostname.startsWith('172.2') ||
           hostname.startsWith('172.30.') ||
           hostname.startsWith('172.31.');
}

// Seleccionar la URL base según la red
const API_BASE = estaEnRedLocal() 
    ? 'http://192.168.1.69/api-casas/api'        // 🔹 Red local: IP privada, puerto 80
    : 'http://170.84.108.45:8080/api-casas/api';  // 🔹 Internet: IP pública, puerto 8080

console.log(`🌐 API Base seleccionada: ${API_BASE} (red: ${estaEnRedLocal() ? 'LOCAL' : 'INTERNET'})`);

// ✅ CREAR Database GLOBAL INMEDIATAMENTE
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
            console.log('🔄 [API] Obteniendo casas...');
            const response = await fetch(`${API_BASE}/casas`);
            
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
            console.log(`💾 [API] Guardando casa ${numeroCasa}...`);
            
            const response = await fetch(`${API_BASE}/casas`, {
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
            console.log(`🗑️ [API] Eliminando casa ${numeroCasa}...`);
            
            const response = await fetch(`${API_BASE}/casas/${numeroCasa}`, {
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
console.log('✅ ApiDatabase cargado - Conectado a:', API_BASE);
console.log('✅ Database disponible con funciones:', Object.keys(window.Database));

// ✅ Exportar para compatibilidad con módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Database;
}
