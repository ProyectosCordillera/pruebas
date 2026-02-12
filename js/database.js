/**
 * database.js
 * Conexión y gestión de base de datos SQLite
 * Proyecto: Sistema Urbano
 */

// ============================================
// CONFIGURACIÓN INICIAL
// ============================================

// Ruta de la base de datos
const DB_PATH = '../data/urbano.db';

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

        // Cargar sql.js
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Obtener archivo .db
        const response = await fetch(DB_PATH);

        if (!response.ok) {
            throw new Error(`Error al cargar base de datos: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        dbInstance = new SQL.Database(new Uint8Array(buffer));

        console.log('✅ Base de datos cargada exitosamente');
        return dbInstance;

    } catch (error) {
        console.error('❌ Error al cargar base de datos:', error);
        throw error;
    }
}

// ============================================
// FUNCIONES DE CONSULTA
// ============================================

/**
 * Ejecutar consulta SELECT
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros (opcional)
 * @returns {Array} Resultados
 */
async function executeQuery(query, params = []) {
    try {
        const db = await loadDatabase();
        const results = db.exec(query, params);
        return results;
    } catch (error) {
        console.error('❌ Error en consulta:', error);
        throw error;
    }
}

/**
 * Obtener todos los registros de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @returns {Array} Registros
 */
async function getAllRecords(tableName) {
    const query = `SELECT * FROM ${tableName}`;
    const results = await executeQuery(query);

    // Convertir resultados a formato más usable
    if (results && results.length > 0) {
        return results[0].values.map(row => {
            const obj = {};
            results[0].columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    }
    return [];
}

/**
 * Insertar registro en tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} data - Datos a insertar {columna: valor}
 * @returns {boolean} Éxito
 */
async function insertRecord(tableName, data) {
    try {
        const db = await loadDatabase();

        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

        db.run(query, values);

        console.log(`✅ Registro insertado en ${tableName}`);
        return true;
    } catch (error) {
        console.error('❌ Error al insertar registro:', error);
        return false;
    }
}

/**
 * Actualizar registro
 * @param {string} tableName - Nombre de la tabla
 * @param {Object} data - Datos a actualizar {columna: valor}
 * @param {string} whereClause - Condición WHERE
 * @param {Array} whereParams - Parámetros para WHERE
 * @returns {boolean} Éxito
 */
async function updateRecord(tableName, data, whereClause, whereParams = []) {
    try {
        const db = await loadDatabase();

        const setClause = Object.keys(data).map(col => `${col} = ?`).join(', ');
        const values = [...Object.values(data), ...whereParams];

        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;

        db.run(query, values);

        console.log(`✅ Registro actualizado en ${tableName}`);
        return true;
    } catch (error) {
        console.error('❌ Error al actualizar registro:', error);
        return false;
    }
}

/**
 * Eliminar registro
 * @param {string} tableName - Nombre de la tabla
 * @param {string} whereClause - Condición WHERE
 * @param {Array} whereParams - Parámetros para WHERE
 * @returns {boolean} Éxito
 */
async function deleteRecord(tableName, whereClause, whereParams = []) {
    try {
        const db = await loadDatabase();

        const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;

        db.run(query, whereParams);

        console.log(`✅ Registro eliminado de ${tableName}`);
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar registro:', error);
        return false;
    }
}

/**
 * Obtener clientes por etapa
 * @param {string} etapa - Nombre de la etapa
 * @returns {Array} Clientes
 */
async function getClientesByEtapa(etapa) {
    const query = `
        SELECT c.*, m.coordenada_x, m.coordenada_y
        FROM clientes c
        LEFT JOIN marcas_plano m ON c.id = m.cliente_id
        WHERE c.etapa = ?
        ORDER BY c.numero_casa
    `;

    const results = await executeQuery(query, [etapa]);

    if (results && results.length > 0) {
        return results[0].values.map(row => {
            const obj = {};
            results[0].columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    }
    return [];
}

/**
 * Guardar marca en plano
 * @param {string} numeroCasa - Número de casa
 * @param {number} x - Coordenada X
 * @param {number} y - Coordenada Y
 * @param {string} etapa - Etapa
 * @param {number} clienteId - ID del cliente (opcional)
 * @returns {boolean} Éxito
 */
async function guardarMarcaPlano(numeroCasa, x, y, etapa, clienteId = null) {
    try {
        const data = {
            numero_casa: numeroCasa,
            coordenada_x: x,
            coordenada_y: y,
            etapa: etapa
        };

        if (clienteId) {
            data.cliente_id = clienteId;
        }

        return await insertRecord('marcas_plano', data);
    } catch (error) {
        console.error('❌ Error al guardar marca:', error);
        return false;
    }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

// Para uso en navegador
window.Database = {
    loadDatabase,
    executeQuery,
    getAllRecords,
    insertRecord,
    updateRecord,
    deleteRecord,
    getClientesByEtapa,
    guardarMarcaPlano
};

console.log('✅ Módulo de base de datos cargado');