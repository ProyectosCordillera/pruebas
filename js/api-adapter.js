// ============================================
// API ADAPTER - Conecta con tu API en IIS
// Reemplaza las funciones de Database.js
// ============================================

const API_BASE = 'http://192.168.1.69/api-casas/api';

// ============================================
// FUNCIONES QUE IMITAN TU Database.js
// ============================================

const ApiDatabase = {
    
    // 📥 Obtener todas las casas (reemplaza Database.getCasas)
    async getCasas() {
        try {
            console.log('🔄 [API] Obteniendo casas...');
            const response = await fetch(`${API_BASE}/casas`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const casas = await response.json();
            
            // 🔧 Adaptar formato de la API al que espera tu código
            // La API devuelve: {id, numeroCasa, coordenadaX, coordenadaY}
            // Tu código espera: {id, numero_casa, coordenada_x, coordenada_y}
            return casas.map(casa => ({
                id: casa.id,
                numero_casa: casa.numeroCasa.toString(),
                coordenada_x: casa.coordenadaX,
                coordenada_y: casa.coordenadaY
            }));
            
        } catch (error) {
            console.error('❌ [API] Error al obtener casas:', error);
            throw error;
        }
    },

    // 👤 Obtener cliente por número de casa (reemplaza Database.getClienteByCasa)
    async getClienteByCasa(numeroCasa) {
        try {
            console.log(`🔄 [API] Buscando cliente para casa ${numeroCasa}...`);
            
            // 🔧 NOTA: Tu API actual no tiene endpoint para clientes aún
            // Esta es una solución temporal que devuelve null
            // Después podemos agregar el endpoint en la API si lo necesitas
            
            return null; // Temporal: sin clientes asociados
            
            // ✅ Cuando tengas el endpoint en la API, usa esto:
            /*
            const response = await fetch(`${API_BASE}/clientes/casa/${numeroCasa}`);
            if (!response.ok) return null;
            return await response.json();
            */
            
        } catch (error) {
            console.warn('⚠️ [API] No se pudo obtener el cliente:', error);
            return null;
        }
    },

    // ➕ Insertar casa con cliente (reemplaza Database.insertarCasaConCliente)
    async insertarCasaConCliente(numeroCasa, coordX, coordY, nombreCliente) {
        try {
            console.log(`💾 [API] Guardando casa ${numeroCasa}...`);
            
            // 1. Guardar la casa
            const responseCasa = await fetch(`${API_BASE}/casas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numeroCasa: parseInt(numeroCasa),
                    coordenadaX: parseFloat(coordX),
                    coordenadaY: parseFloat(coordY)
                })
            });
            
            if (!responseCasa.ok) {
                const errorData = await responseCasa.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${responseCasa.status}`);
            }
            
            const resultCasa = await responseCasa.json();
            console.log(`✅ [API] Casa guardada con ID: ${resultCasa.id}`);
            
            // 2. 🔧 Guardar el cliente (cuando tengas el endpoint en la API)
            // Por ahora, solo guardamos la casa
            /*
            if (nombreCliente && nombreCliente.trim() !== '') {
                await fetch(`${API_BASE}/clientes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombreCliente: nombreCliente.trim(),
                        casaNumero: parseInt(numeroCasa)
                    })
                });
            }
            */
            
            return true;
            
        } catch (error) {
            console.error('❌ [API] Error al guardar:', error);
            throw error;
        }
    },

    // 🗑️ Eliminar casa con cliente (reemplaza Database.eliminarCasaConCliente)
    async eliminarCasaConCliente(numeroCasa) {
        try {
            console.log(`🗑️ [API] Eliminando casa ${numeroCasa}...`);
            
            // 🔧 Primero eliminar clientes asociados (cuando tengas el endpoint)
            // await fetch(`${API_BASE}/clientes/casa/${numeroCasa}`, { method: 'DELETE' });
            
            // Luego eliminar la casa
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

    // 🔍 Obtener casa por número (reemplaza Database.getCasaByNumero)
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

// ============================================
// EXPORTAR PARA USAR EN TU CÓDIGO
// ============================================

// Opción A: Reemplazar globalmente el objeto Database (más fácil)
if (typeof Database !== 'undefined') {
    console.log('🔄 Reemplazando Database con ApiDatabase');
    // Copiar todas las funciones de ApiDatabase a Database
    Object.assign(Database, ApiDatabase);
}

// Opción B: Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiDatabase;
}

console.log('✅ ApiDatabase cargado - Conectado a:', API_BASE);
