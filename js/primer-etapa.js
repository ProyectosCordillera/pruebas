// ============================================
// CONFIGURACIÓN DE COORDENADAS Y VARIABLES
// ============================================

const PLANO_ANCHO_REAL = 1275;
const PLANO_ALTO_REAL = 1650;

const ZONA_VALIDA = {
    xMin: 50,
    xMax: 1225,
    yMin: 50,
    yMax: 1600
};

// Diccionario de coordenadas ajustado para casas 33-65
const coordenadasCasas = {};

// Coordenadas para las casas 33-47
for (let i = 33; i <= 47; i++) {
    coordenadasCasas[i] = {
        x: 455,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 1268 - (i - 33) * 60))
    };
}

// Coordenadas para las casas 48-65
for (let i = 48; i <= 65; i++) {
    coordenadasCasas[i] = {
        x: 145,
        y: Math.max(ZONA_VALIDA.yMin, Math.min(ZONA_VALIDA.yMax, 437 + (i - 48) * 60))
    };
}

// ============================================
// INICIALIZACIÓN Y CARGA DE DATOS
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Sistema Urbano - Primera Etapa v3.0 (SQLite)');
    console.log('📅 Fecha de carga:', new Date().toLocaleString('es-ES'));

    // Mostrar año en footer
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    verificarCoordenadas();
    cargarDatosCompletos();
});

function verificarCoordenadas() {
    console.log("Verificación de coordenadas - Primer Etapa:");
    console.log(`Dimensiones del plano: ${PLANO_ANCHO_REAL}x${PLANO_ALTO_REAL}`);

    for (const [casa, coord] of Object.entries(coordenadasCasas)) {
        const valida = (
            coord.x >= ZONA_VALIDA.xMin &&
            coord.x <= ZONA_VALIDA.xMax &&
            coord.y >= ZONA_VALIDA.yMin &&
            coord.y <= ZONA_VALIDA.yMax
        );

        if (!valida) {
            console.warn(`⚠ Casa ${casa} fuera de zona válida:`, coord);
        }
    }
}

// ============================================
// CARGA DE DATOS COMPLETOS (HISTÓRICOS + BASE DE DATOS)
// ============================================

async function cargarDatosCompletos() {
    try {
        // 1. Cargar datos de la base de datos
        await cargarMarcasDesdeBD();

        // 2. Intentar migrar datos históricos si existen
        await migrarDatosHistoricos();

        console.log('✅ Datos cargados completamente');
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        }
    }
}

// ============================================
// MIGRACIÓN DE DATOS HISTÓRICOS
// ============================================

async function migrarDatosHistoricos() {
    try {
        // Verificar si ya se migraron datos históricos
        const datosMigrados = localStorage.getItem('datosHistoricosMigrados_primerEtapa');

        if (datosMigrados === 'true') {
            console.log('ℹ️ Datos históricos ya migrados anteriormente');
            return;
        }

        console.log('📥 Migrando datos históricos de Access...');

        // RUTA CORRECTA: ../data/marcasCombinadas.json (desde paginas/)
        const response = await fetch('../data/marcasCombinadas.json?' + Date.now());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Datos JSON no son un array válido');
        }

        // Filtrar solo casas de primera etapa (33-65)
        const casasPrimeraEtapa = data.filter(marca =>
            marca.numeroCasa >= 33 && marca.numeroCasa <= 65
        );

        console.log(`✅ Encontradas ${casasPrimeraEtapa.length} casas de primera etapa en datos históricos`);

        if (casasPrimeraEtapa.length > 0) {
            let migradas = 0;
            let errores = 0;

            // Migrar cada casa a la base de datos
            for (const casa of casasPrimeraEtapa) {
                try {
                    const numeroCasa = casa.numeroCasa.toString();
                    const nombreCliente = casa.cliente || 'Cliente no especificado';

                    // Verificar si ya existe en la BD
                    const casaExistente = await Database.getCasaByNumero(numeroCasa);

                    if (!casaExistente) {
                        // Obtener coordenadas
                        const coords = coordenadasCasas[parseInt(numeroCasa)];

                        if (coords) {
                            // Insertar casa y cliente
                            const exito = await Database.insertarCasaConCliente(
                                numeroCasa,
                                coords.x,
                                coords.y,
                                nombreCliente
                            );

                            if (exito) {
                                migradas++;
                            } else {
                                errores++;
                            }
                        } else {
                            console.warn(`⚠ Coordenadas no encontradas para casa ${numeroCasa}`);
                            errores++;
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error migrando casa ${casa.numeroCasa}:`, error);
                    errores++;
                }
            }

            // Marcar como migrados
            localStorage.setItem('datosHistoricosMigrados_primerEtapa', 'true');

            console.log(`✅ Migración completada: ${migradas} casas migradas, ${errores} errores`);

            // Mostrar mensaje de éxito
            if (migradas > 0 && typeof Swal !== 'undefined') {
                setTimeout(() => {
                    Swal.fire({
                        icon: 'info',
                        title: 'Migración completada',
                        html: `Se migraron <strong>${migradas}</strong> casas históricas a la base de datos`,
                        timer: 3000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                }, 500);
            }

            // Recargar dropdown
            await cargarMarcasDesdeBD();
        }

    } catch (error) {
        console.warn('⚠️ No se pudieron migrar datos históricos:', error.message);
        console.log('💡 Continuando con datos de la base de datos...');
    }
}

// ============================================
// CARGA DE DATOS DESDE BASE DE DATOS
// ============================================

async function cargarMarcasDesdeBD() {
    try {
        // Cargar todas las casas con sus clientes
        const casas = await Database.getCasas();
        const ddlMarcas = document.getElementById('ddlMarcas');

        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }

        // Limpiar dropdown
        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';

        // Ordenar por número de casa
        casas.sort((a, b) => {
            const numA = parseInt(a.numero_casa);
            const numB = parseInt(b.numero_casa);
            return numA - numB;
        });

        // Cargar casas en dropdown
        for (const casa of casas) {
            // Obtener cliente asociado
            const cliente = await Database.getClienteByCasa(casa.numero_casa);

            const option = document.createElement('option');
            option.value = casa.numero_casa;
            option.textContent = `Casa ${casa.numero_casa} - ${cliente ? cliente.Nombre_Cliente : 'Sin cliente'}`;
            ddlMarcas.appendChild(option);
        }

        console.log(`✅ Cargadas ${casas.length} marcas desde la base de datos`);
    } catch (error) {
        console.error('❌ Error cargando marcas desde BD:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'No se pudieron cargar las marcas existentes', 'error');
        }
    }
}

// ============================================
// VALIDACIÓN DE ENTRADA
// ============================================

function validarNumeroCasa(numero) {
    const num = numero.trim();

    if (!/^\d+$/.test(num)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Advertencia', 'El número de casa debe ser numérico', 'warning');
        } else {
            alert('Advertencia: El número de casa debe ser numérico');
        }
        return null;
    }

    const numeroInt = parseInt(num, 10);

    if (numeroInt < 33 || numeroInt > 65) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Número fuera de rango',
                text: `La primera etapa solo incluye casas del 33 al 65. Casa ${numeroInt} no existe en este plano.`
            });
        } else {
            alert(`Número fuera de rango: La primera etapa solo incluye casas del 33 al 65. Casa ${numeroInt} no existe.`);
        }
        return null;
    }

    if (!coordenadasCasas.hasOwnProperty(numeroInt)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Casa no encontrada',
                text: `No se encontraron coordenadas para la casa ${numeroInt} en el plano de primera etapa.`
            });
        } else {
            alert(`Casa no encontrada: No se encontraron coordenadas para la casa ${numeroInt}`);
        }
        return null;
    }

    return numeroInt;
}

// ============================================
// FUNCIONES DE MANEJO DE FORMULARIO
// ============================================

function habilitarNumeroCasa() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    if (txtNumeroCasa) {
        txtNumeroCasa.value = '';
        txtNumeroCasa.disabled = false;
        txtNumeroCasa.focus();
    }

    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer) {
        marcadoresContainer.innerHTML = '';
    }

    const txtCliente = document.getElementById('txtCliente');
    if (txtCliente) {
        txtCliente.value = '';
    }
}

function limpiarFormulario() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const ddlMarcas = document.getElementById('ddlMarcas');
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const txtCliente = document.getElementById('txtCliente');

    if (txtNumeroCasa) txtNumeroCasa.value = '';
    if (ddlMarcas) ddlMarcas.value = '0';
    if (marcadoresContainer) marcadoresContainer.innerHTML = '';
    if (txtCliente) txtCliente.value = '';
}

// ============================================
// FUNCIONES DE MARCADORES
// ============================================

function agregarMarcador(numeroCasa, originalX, originalY) {
    const imgPlano = document.getElementById('imgPlano');
    const marcadoresContainer = document.getElementById('marcadoresContainer');

    if (!marcadoresContainer || !imgPlano) {
        console.error('❌ Elementos no encontrados para agregar marcador');
        return;
    }

    marcadoresContainer.innerHTML = '';

    if (!imgPlano.complete) {
        imgPlano.onload = function () {
            agregarMarcador(numeroCasa, originalX, originalY);
        };
        return;
    }

    const scaleX = imgPlano.clientWidth / PLANO_ANCHO_REAL;
    const scaleY = imgPlano.clientHeight / PLANO_ALTO_REAL;

    const x = originalX * scaleX;
    const y = originalY * scaleY;

    if (x < 0 || x > imgPlano.clientWidth || y < 0 || y > imgPlano.clientHeight) {
        console.error('⚠ Coordenadas fuera del plano visible:', { numeroCasa, x, y });
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', `La casa ${numeroCasa} no puede mostrarse (fuera del área visible)`, 'error');
        }
        return;
    }

    const marcador = document.createElement('div');
    marcador.className = 'marcador';
    marcador.style.left = x + 'px';
    marcador.style.top = y + 'px';
    marcador.textContent = numeroCasa;
    marcadoresContainer.appendChild(marcador);

    console.log(`✅ Marcador ${numeroCasa} posicionado en: X=${x.toFixed(1)}, Y=${y.toFixed(1)}`);
}

async function cargarMarcaSeleccionada() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;

    const numeroCasa = ddlMarcas.value;

    if (numeroCasa > 0) {
        const txtNumeroCasa = document.getElementById('txtNumeroCasa');
        if (txtNumeroCasa) {
            txtNumeroCasa.value = numeroCasa;
            txtNumeroCasa.disabled = true;
        }

        if (coordenadasCasas.hasOwnProperty(numeroCasa)) {
            const marcadoresContainer = document.getElementById('marcadoresContainer');
            if (marcadoresContainer) {
                marcadoresContainer.innerHTML = '';
            }

            const coords = coordenadasCasas[numeroCasa];
            agregarMarcador(numeroCasa, coords.x, coords.y);

            // Buscar cliente en la base de datos
            try {
                const cliente = await Database.getClienteByCasa(numeroCasa);
                const txtCliente = document.getElementById('txtCliente');
                if (txtCliente) {
                    txtCliente.value = cliente ? cliente.Nombre_Cliente : '';
                }
            } catch (e) {
                console.warn('No se pudo cargar el cliente:', e);
            }
        } else {
            if (typeof Swal !== 'undefined') {
                Swal.fire('Error', `No se encontraron coordenadas para la casa ${numeroCasa}`, 'error');
            }
        }
    }
}

// ============================================
// FUNCIÓN PRINCIPAL DE GUARDADO
// ============================================

async function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const numeroCasaRaw = txtNumeroCasa.value.trim();
    const txtCliente = document.getElementById('txtCliente').value.trim();
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const ddlMarcas = document.getElementById('ddlMarcas');

    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;

    if (!txtCliente || txtCliente.trim() === '') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Cliente requerido',
                text: 'Por favor ingrese el nombre del cliente'
            });
        } else {
            alert('Cliente requerido: Por favor ingrese el nombre del cliente');
        }
        return;
    }

    // Verificar si ya existe en el dropdown
    for (let i = 0; i < ddlMarcas.options.length; i++) {
        if (ddlMarcas.options[i].value == numeroCasa) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Casa ya registrada',
                    text: `La casa número ${numeroCasa} ya está registrada en el sistema`
                });
            } else {
                alert(`Casa ya registrada: La casa número ${numeroCasa} ya está registrada`);
            }
            return;
        }
    }

    const coords = coordenadasCasas[numeroCasa];
    if (!coords) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', `Coordenadas no encontradas para la casa ${numeroCasa}`, 'error');
        } else {
            alert(`Error: Coordenadas no encontradas para la casa ${numeroCasa}`);
        }
        return;
    }

    agregarMarcador(numeroCasa, coords.x, coords.y);

    try {
        // Guardar en base de datos
        const exito = await Database.insertarCasaConCliente(
            numeroCasa.toString(),
            coords.x,
            coords.y,
            txtCliente
        );

        if (exito) {
            txtNumeroCasa.value = '';
            txtNumeroCasa.disabled = true;
            document.getElementById('txtCliente').value = '';

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Guardado exitoso!',
                    text: `Casa ${numeroCasa} asignada a ${txtCliente}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }

            setTimeout(async () => {
                await cargarMarcasDesdeBD();
                if (ddlMarcas) {
                    ddlMarcas.value = numeroCasa.toString();
                }
            }, 300);
        }
    } catch (error) {
        if (marcadoresContainer) {
            marcadoresContainer.innerHTML = '';
        }
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: error.message || 'No se pudo guardar la marca. Intente nuevamente.'
            });
        } else {
            alert(`Error al guardar: ${error.message}`);
        }
    }
}

// ============================================
// ELIMINACIÓN DE MARCAS
// ============================================

async function eliminarMarca() {
    const ddlMarcas = document.getElementById('ddlMarcas');
    if (!ddlMarcas) return;

    const numeroCasa = ddlMarcas.value;

    if (numeroCasa == '0') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Seleccione una marca',
                text: 'Debe seleccionar una casa del dropdown para eliminar'
            });
        } else {
            alert('Seleccione una marca: Debe seleccionar una casa del dropdown para eliminar');
        }
        return;
    }

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¿Eliminar esta marca?',
            html: `La casa número <strong>${numeroCasa}</strong> será eliminada permanentemente`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Eliminar de la base de datos (CASCADE eliminará automáticamente el cliente)
                    const exito = await Database.eliminarCasaConCliente(numeroCasa);

                    if (exito) {
                        limpiarFormulario();
                        await cargarMarcasDesdeBD();
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: `Casa ${numeroCasa} eliminada correctamente`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al eliminar',
                        text: error.message || 'No se pudo eliminar la marca'
                    });
                }
            }
        });
    } else {
        if (confirm(`¿Eliminar la casa número ${numeroCasa} permanentemente?`)) {
            try {
                const exito = await Database.eliminarCasaConCliente(numeroCasa);
                if (exito) {
                    limpiarFormulario();
                    await cargarMarcasDesdeBD();
                    alert(`Casa ${numeroCasa} eliminada correctamente`);
                }
            } catch (error) {
                alert(`Error al eliminar: ${error.message}`);
            }
        }
    }
}

// ============================================
// IMPRESIÓN
// ============================================

function imprimirPlano() {
    const marcadores = document.getElementById('marcadoresContainer').children;

    if (marcadores.length === 0) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Sin marcadores',
                text: 'Primero aplique un número de casa para marcar en el plano'
            });
        } else {
            alert('Sin marcadores: Primero aplique un número de casa para marcar en el plano');
        }
        return false;
    }

    const imgPlano = document.getElementById('imgPlano');
    const marcador = marcadores[0];
    const numeroCasa = marcador.textContent;

    const casa = parseInt(numeroCasa, 10);
    if (!coordenadasCasas.hasOwnProperty(casa)) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', 'Coordenadas no encontradas para la impresión', 'error');
        }
        return false;
    }

    const coordsOriginales = coordenadasCasas[casa];
    const coordX = coordsOriginales.x;
    const coordY = coordsOriginales.y;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Preparando impresión',
            html: `<div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p>Calculando posición exacta del marcador...</p>
                    <small class="text-muted">Casa ${numeroCasa} en coordenadas (${coordX}, ${coordY})</small>
                </div>`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading(null);

                setTimeout(() => {
                    const imgWidth = imgPlano.naturalWidth || PLANO_ANCHO_REAL;
                    const imgHeight = imgPlano.naturalHeight || PLANO_ALTO_REAL;

                    const pageWidth = 8.5 * 96;
                    const pageHeight = 11 * 96;
                    const margin = 40;

                    const scaleX = (pageWidth - 2 * margin) / imgWidth;
                    const scaleY = (pageHeight - 2 * margin) / imgHeight;
                    const scale = Math.min(scaleX, scaleY);

                    const printWidth = imgWidth * scale;
                    const printHeight = imgHeight * scale;

                    const markerX = (coordX / imgWidth) * printWidth;
                    const markerY = (coordY / imgHeight) * printHeight;

                    const markerSize = 42;
                    const fontSize = 20;

                    const printWindow = window.open('', '_blank', 'width=800,height=1000');

                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Plano - Casa ${numeroCasa}</title>
                            <style>
                                @page {
                                    size: letter portrait;
                                    margin: 0;
                                }
                                body {
                                    margin: ${margin}px;
                                    padding: 0;
                                    width: ${pageWidth - 2 * margin}px;
                                    height: ${pageHeight - 2 * margin}px;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    background: white;
                                }
                                .print-container {
                                    position: relative;
                                    width: ${printWidth}px;
                                    height: ${printHeight}px;
                                }
                                .print-image {
                                    width: 100%;
                                    height: 100%;
                                    display: block;
                                }
                                .print-marker {
                                    position: absolute;
                                    left: ${markerX}px;
                                    top: ${markerY}px;
                                    width: ${markerSize}px;
                                    height: ${markerSize}px;
                                    background-color: #dc3545;
                                    color: white;
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    font-size: ${fontSize}px;
                                    transform: translate(-50%, -50%);
                                    -webkit-print-color-adjust: exact;
                                    print-color-adjust: exact;
                                    box-shadow: 0 0 5px rgba(0,0,0,0.5);
                                }
                            </style>
                        </head>
                        <body onload="setTimeout(function(){ window.print(); setTimeout(function(){ window.close(); }, 100); }, 200);">
                            <div class="print-container">
                                <img class="print-image" src="${imgPlano.src}" alt="Plano">
                                <div class="print-marker">${numeroCasa}</div>
                            </div>
                        </body>
                        </html>
                    `);

                    printWindow.document.close();
                    Swal.close();
                }, 300);
            }
        });
    } else {
        window.print();
    }

    return false;
}

// ============================================
// FUNCIÓN DE REDIMENSIONAMIENTO
// ============================================

let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(recalcularPosiciones, 200);
});

function recalcularPosiciones() {
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    if (marcadoresContainer && marcadoresContainer.children.length > 0) {
        const numeroCasa = document.getElementById('txtNumeroCasa').value.trim();
        const numValido = parseInt(numeroCasa, 10);
        if (numeroCasa && !isNaN(numValido) && coordenadasCasas.hasOwnProperty(numValido)) {
            const coords = coordenadasCasas[numValido];
            marcadoresContainer.innerHTML = '';
            agregarMarcador(numValido, coords.x, coords.y);
        }
    }
}