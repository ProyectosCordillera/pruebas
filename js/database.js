/**
 * database.js
 * Conexión y gestión de base de datos SQLite
 * Proyecto: Sistema Urbano
 * Base de datos: Urbano.db
 * Tablas: TablaCasas, TablaClienteCasa
 */

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Ruta de la base de datos - AJUSTA SEGÚN TU ESTRUCTURA
// Si usas Live Server desde la raíz del proyecto: 'data/Urbano.db'
// Si la página está en /paginas/: '../data/Urbano.db'
const DB_PATH = '../data/Urbano.db'; // ⚠️ Cambia a '../data/Urbano.db' si es necesario

// Variable global para la base de datos
let dbInstance = null;

// ============================================
// FUNCIÓN PARA CARGAR LA BASE DE DATOS
// ============================================

async function loadDatabase() {
    try {
        // Si ya está cargada, retornarla
        if (dbInstance) {
            return dbInstance;
        }

        // Verificar que sql.js esté disponible
        if (typeof initSqlJs === 'undefined') {
            throw new Error('sql.js no está cargado. Verifica que el script sql-wasm.js esté incluido en el HTML.');
        }

        console.log('📥 Cargando sql.js...');

        // Cargar sql.js - CORREGIDO: eliminar espacios extra en la URL
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        console.log(`📥 Cargando base de datos desde: ${DB_PATH}`);

        // Obtener archivo .db
        const response = await fetch(DB_PATH);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Base de datos no encontrada en: ${DB_PATH}\n\n` +
                    `💡 Posibles soluciones:\n` +
                    `1. Verifica que el archivo 'Urbano.db' exista en la carpeta 'data/'\n` +
                    `2. Si tu página está en /paginas/, cambia DB_PATH a '../data/Urbano.db'\n` +
                    `3. Usa Live Server (no abras el HTML directamente)\n` +
                    `4. Verifica la estructura de carpetas:\n` +
                    `   proyecto/\n` +
                    `   ├── data/\n` +
                    `   │   └── Urbano.db\n` +
                    `   ├── paginas/\n` +
                    `   │   └── primer-etapa.html\n` +
                    `   └── js/\n` +
                    `       └── database.js`);
            }
            throw new Error(`Error al cargar base de datos: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        dbInstance = new SQL.Database(new Uint8Array(buffer));

        // ¡IMPORTANTE! Activar claves foráneas en cada conexión
        dbInstance.run("PRAGMA foreign_keys = ON;");
        console.log('✅ Foreign keys activadas');

        console.log('✅ Base de datos cargada exitosamente');
        return dbInstance;

    } catch (error) {
        console.error('❌ Error al cargar base de datos:', error);

        // Mostrar error amigable al usuario
        mostrarErrorBD(error.message || error.toString());

        throw error;
    }
}

// ============================================
// FUNCIÓN AUXILIAR PARA MOSTRAR ERRORES
// ============================================

function mostrarErrorBD(mensaje) {
    // Verificar si SweetAlert2 está disponible
    if (typeof Swal !== 'undefined' && Swal.fire) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Base de Datos',
            html: `<pre style="text-align: left; max-height: 300px; overflow-y: auto;">${mensaje}</pre>`,
            footer: '<strong>🔑 Solución rápida:</strong> Abre el proyecto con <strong>Live Server</strong>',
            width: '600px'
        });
    } else {
        // Fallback con alert nativo
        alert(`❌ Error de Base de Datos:\n\n${mensaje}\n\n💡 Usa Live Server para evitar errores CORS`);
    }
}

// ============================================
// FUNCIONES ESPECÍFICAS PARA TABLAS
// ============================================

/**
 * Obtener todas las casas de TablaCasas
 * @returns {Array} Lista de casas con sus coordenadas
 */
async function getCasas() {
    try {
        const db = await loadDatabase();
        const results = db.exec('SELECT * FROM TablaCasas ORDER BY numero_casa');

        if (results && results.length > 0) {
            return results[0].values.map(row => ({
                id: row[0],
                numero_casa: row[1],
                Coordenada_X: row[2],
                Coordenada_Y: row[3]
            }));
        }
        return [];
    } catch (error) {
        console.error('❌ Error al obtener casas:', error);
        return [];
    }
}

/**
 * Obtener una casa por su número
 * @param {string} numeroCasa - Número de la casa
 * @returns {Object|null} Datos de la casa o null
 */
async function getCasaByNumero(numeroCasa) {
    try {
        const db = await loadDatabase();
        const results = db.exec(
            'SELECT * FROM TablaCasas WHERE numero_casa = ?',
            [numeroCasa]
        );

        if (results && results.length > 0 && results[0].values.length > 0) {
            const row = results[0].values[0];
            return {
                id: row[0],
                numero_casa: row[1],
                Coordenada_X: row[2],
                Coordenada_Y: row[3]
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error al obtener casa:', error);
        return null;
    }
}

/**
 * Insertar nueva casa en TablaCasas
 * @param {string} numeroCasa - Número de la casa
 * @param {number} coordX - Coordenada X
 * @param {number} coordY - Coordenada Y
 * @returns {boolean} Éxito
 */
async function insertarCasa(numeroCasa, coordX, coordY) {
    try {
        const db = await loadDatabase();

        db.run(
            'INSERT INTO TablaCasas (numero_casa, Coordenada_X, Coordenada_Y) VALUES (?, ?, ?)',
            [numeroCasa, coordX, coordY]
        );

        console.log(`✅ Casa ${numeroCasa} insertada correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al insertar casa:', error);
        // Verificar si es error de UNIQUE constraint
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Casa existente',
                    text: `La casa "${numeroCasa}" ya existe en la base de datos`
                });
            } else {
                alert(`⚠️ Casa existente: La casa "${numeroCasa}" ya existe`);
            }
        }
        return false;
    }
}

/**
 * Actualizar coordenadas de una casa
 * @param {string} numeroCasa - Número de la casa
 * @param {number} coordX - Nueva coordenada X
 * @param {number} coordY - Nueva coordenada Y
 * @returns {boolean} Éxito
 */
async function actualizarCasa(numeroCasa, coordX, coordY) {
    try {
        const db = await loadDatabase();

        db.run(
            'UPDATE TablaCasas SET Coordenada_X = ?, Coordenada_Y = ? WHERE numero_casa = ?',
            [coordX, coordY, numeroCasa]
        );

        console.log(`✅ Casa ${numeroCasa} actualizada correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al actualizar casa:', error);
        return false;
    }
}

/**
 * Eliminar casa de TablaCasas (automáticamente elimina cliente relacionado por CASCADE)
 * @param {string} numeroCasa - Número de la casa
 * @returns {boolean} Éxito
 */
async function eliminarCasa(numeroCasa) {
    try {
        const db = await loadDatabase();

        db.run(
            'DELETE FROM TablaCasas WHERE numero_casa = ?',
            [numeroCasa]
        );

        console.log(`✅ Casa ${numeroCasa} eliminada correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar casa:', error);
        return false;
    }
}

// ============================================
// FUNCIONES PARA TABLA CLIENTES
// ============================================

/**
 * Obtener todos los clientes con información de sus casas
 * @returns {Array} Lista de clientes con datos de casa
 */
async function getClientes() {
    try {
        const db = await loadDatabase();
        const results = db.exec(`
            SELECT 
                c.id,
                c.Nombre_Cliente,
                c.Casa_Numero,
                t.Coordenada_X,
                t.Coordenada_Y
            FROM TablaClienteCasa c
            LEFT JOIN TablaCasas t ON c.Casa_Numero = t.numero_casa
            ORDER BY c.Nombre_Cliente
        `);

        if (results && results.length > 0) {
            return results[0].values.map(row => ({
                id: row[0],
                Nombre_Cliente: row[1],
                Casa_Numero: row[2],
                Coordenada_X: row[3],
                Coordenada_Y: row[4]
            }));
        }
        return [];
    } catch (error) {
        console.error('❌ Error al obtener clientes:', error);
        return [];
    }
}

/**
 * Obtener cliente por número de casa
 * @param {string} numeroCasa - Número de la casa
 * @returns {Object|null} Datos del cliente o null
 */
async function getClienteByCasa(numeroCasa) {
    try {
        const db = await loadDatabase();
        const results = db.exec(
            'SELECT * FROM TablaClienteCasa WHERE Casa_Numero = ?',
            [numeroCasa]
        );

        if (results && results.length > 0 && results[0].values.length > 0) {
            const row = results[0].values[0];
            return {
                id: row[0],
                Nombre_Cliente: row[1],
                Casa_Numero: row[2]
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error al obtener cliente:', error);
        return null;
    }
}

/**
 * Insertar nuevo cliente en TablaClienteCasa
 * @param {string} nombreCliente - Nombre del cliente
 * @param {string} numeroCasa - Número de casa (debe existir en TablaCasas)
 * @returns {boolean} Éxito
 */
async function insertarCliente(nombreCliente, numeroCasa) {
    try {
        const db = await loadDatabase();

        // Verificar que la casa exista
        const casa = await getCasaByNumero(numeroCasa);
        if (!casa) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `La casa "${numeroCasa}" no existe. Debes crearla primero.`
                });
            } else {
                alert(`❌ Error: La casa "${numeroCasa}" no existe`);
            }
            return false;
        }

        db.run(
            'INSERT INTO TablaClienteCasa (Nombre_Cliente, Casa_Numero) VALUES (?, ?)',
            [nombreCliente, numeroCasa]
        );

        console.log(`✅ Cliente "${nombreCliente}" insertado correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al insertar cliente:', error);
        if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de relación',
                    text: 'La casa seleccionada no existe en la base de datos'
                });
            } else {
                alert('❌ Error de relación: La casa no existe');
            }
        }
        return false;
    }
}

/**
 * Actualizar nombre de cliente
 * @param {string} numeroCasa - Número de casa del cliente
 * @param {string} nuevoNombre - Nuevo nombre del cliente
 * @returns {boolean} Éxito
 */
async function actualizarCliente(numeroCasa, nuevoNombre) {
    try {
        const db = await loadDatabase();

        db.run(
            'UPDATE TablaClienteCasa SET Nombre_Cliente = ? WHERE Casa_Numero = ?',
            [nuevoNombre, numeroCasa]
        );

        console.log(`✅ Cliente de casa ${numeroCasa} actualizado correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al actualizar cliente:', error);
        return false;
    }
}

/**
 * Eliminar cliente por número de casa
 * @param {string} numeroCasa - Número de casa
 * @returns {boolean} Éxito
 */
async function eliminarCliente(numeroCasa) {
    try {
        const db = await loadDatabase();

        db.run(
            'DELETE FROM TablaClienteCasa WHERE Casa_Numero = ?',
            [numeroCasa]
        );

        console.log(`✅ Cliente de casa ${numeroCasa} eliminado correctamente`);
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar cliente:', error);
        return false;
    }
}

// ============================================
// FUNCIONES COMBINADAS PARA LA INTERFAZ
// ============================================

/**
 * Insertar casa y cliente simultáneamente
 * @param {string} numeroCasa - Número de casa
 * @param {number} coordX - Coordenada X
 * @param {number} coordY - Coordenada Y
 * @param {string} nombreCliente - Nombre del cliente (opcional)
 * @returns {boolean} Éxito
 */
async function insertarCasaConCliente(numeroCasa, coordX, coordY, nombreCliente = '') {
    try {
        // Insertar casa primero
        const casaInsertada = await insertarCasa(numeroCasa, coordX, coordY);

        if (!casaInsertada) {
            return false;
        }

        // Si hay nombre de cliente, insertarlo
        if (nombreCliente && nombreCliente.trim() !== '') {
            const clienteInsertado = await insertarCliente(nombreCliente.trim(), numeroCasa);

            if (!clienteInsertado) {
                // Si falla el cliente, eliminar la casa para mantener consistencia
                await eliminarCasa(numeroCasa);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Error al insertar casa con cliente:', error);
        return false;
    }
}

/**
 * Actualizar casa y cliente simultáneamente
 * @param {string} numeroCasa - Número de casa
 * @param {number} coordX - Nueva coordenada X
 * @param {number} coordY - Nueva coordenada Y
 * @param {string} nombreCliente - Nuevo nombre del cliente (opcional)
 * @returns {boolean} Éxito
 */
async function actualizarCasaConCliente(numeroCasa, coordX, coordY, nombreCliente = '') {
    try {
        // Actualizar casa
        await actualizarCasa(numeroCasa, coordX, coordY);

        // Si hay nombre de cliente, actualizarlo o insertarlo
        if (nombreCliente && nombreCliente.trim() !== '') {
            const clienteExistente = await getClienteByCasa(numeroCasa);

            if (clienteExistente) {
                await actualizarCliente(numeroCasa, nombreCliente.trim());
            } else {
                await insertarCliente(nombreCliente.trim(), numeroCasa);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Error al actualizar casa con cliente:', error);
        return false;
    }
}

/**
 * Eliminar casa y su cliente automáticamente (CASCADE)
 * @param {string} numeroCasa - Número de casa
 * @returns {boolean} Éxito
 */
async function eliminarCasaConCliente(numeroCasa) {
    try {
        // Solo eliminar la casa, el cliente se elimina automáticamente por CASCADE
        return await eliminarCasa(numeroCasa);
    } catch (error) {
        console.error('❌ Error al eliminar casa con cliente:', error);
        return false;
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

// Para uso en navegador
window.Database = {
    // Funciones generales
    loadDatabase,

    // Funciones para TablaCasas
    getCasas,
    getCasaByNumero,
    insertarCasa,
    actualizarCasa,
    eliminarCasa,

    // Funciones para TablaClienteCasa
    getClientes,
    getClienteByCasa,
    insertarCliente,
    actualizarCliente,
    eliminarCliente,

    // Funciones combinadas
    insertarCasaConCliente,
    actualizarCasaConCliente,
    eliminarCasaConCliente
};

console.log('✅ Módulo de base de datos cargado');
console.log('📊 Tablas disponibles: TablaCasas, TablaClienteCasa');
console.log('💡 Recuerda: Usa Live Server para evitar errores CORS');