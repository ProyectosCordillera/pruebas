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

// Diccionario de coordenadas ajustado
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Urbano - Primera Etapa v2.0');
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
// CARGA DE DATOS COMPLETOS (HISTÓRICOS + NUEVOS)
// ============================================

function cargarDatosCompletos() {
    // 1. Intentar cargar datos históricos desde JSON
    cargarDatosHistoricos()
        .then(() => {
            // 2. Luego cargar datos de localStorage (nuevos registros)
            cargarMarcasDesdeStorage();
        })
        .catch(error => {
            console.error('❌ Error cargando datos históricos:', error);
            // Continuar con solo localStorage
            cargarMarcasDesdeStorage();
        });
}

function cargarDatosHistoricos() {
    return new Promise((resolve, reject) => {
        // Verificar si ya se cargaron datos históricos
        const datosCargados = localStorage.getItem('datosHistoricosCargados_primerEtapa');
        
        if (datosCargados === 'true') {
            console.log('ℹ️ Datos históricos ya cargados anteriormente');
            resolve();
            return;
        }
        
        console.log('📥 Cargando datos históricos de Access...');
        
        // RUTA CORRECTA: ../data/marcasCombinadas.json (desde paginas/)
        fetch('../data/marcasCombinadas.json?' + Date.now())
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error('Datos JSON no son un array válido');
                }
                
                // Filtrar solo casas de primera etapa (33-65)
                const casasPrimeraEtapa = data.filter(marca => 
                    marca.numeroCasa >= 33 && marca.numeroCasa <= 65
                );
                
                console.log(`✅ Encontradas ${casasPrimeraEtapa.length} casas de primera etapa en datos históricos`);
                
                if (casasPrimeraEtapa.length > 0) {
                    // Obtener datos existentes de localStorage
                    let marcasExistentes = [];
                    try {
                        const stored = localStorage.getItem('marcasPrimerEtapa');
                        if (stored) marcasExistentes = JSON.parse(stored);
                    } catch (e) {
                        console.warn('⚠️ Error leyendo localStorage:', e);
                    }
                    
                    // Combinar datos históricos con existentes (sin duplicados)
                    const todasMarcas = [...marcasExistentes];
                    let nuevasCargadas = 0;
                    
                    casasPrimeraEtapa.forEach(casaHistorica => {
                        // Verificar si ya existe
                        const existe = todasMarcas.some(m => m.numeroCasa === casaHistorica.numeroCasa);
                        
                        if (!existe) {
                            todasMarcas.push(casaHistorica);
                            nuevasCargadas++;
                        }
                    });
                    
                    // Guardar en localStorage
                    try {
                        localStorage.setItem('marcasPrimerEtapa', JSON.stringify(todasMarcas));
                        localStorage.setItem('datosHistoricosCargados_primerEtapa', 'true');
                        
                        console.log(`✅ Cargadas ${nuevasCargadas} casas históricas nuevas`);
                        console.log(`📊 Total de casas en localStorage: ${todasMarcas.length}`);
                        
                        // Mostrar mensaje de éxito
                        if (nuevasCargadas > 0 && typeof Swal !== 'undefined') {
                            setTimeout(() => {
                                Swal.fire({
                                    icon: 'info',
                                    title: 'Datos históricos cargados',
                                    html: `Se importaron <strong>${nuevasCargadas}</strong> casas registradas previamente`,
                                    timer: 2500,
                                    showConfirmButton: false,
                                    toast: true,
                                    position: 'top-end'
                                });
                            }, 500);
                        }
                    } catch (e) {
                        console.error('❌ Error guardando en localStorage:', e);
                        reject(e);
                    }
                }
                
                resolve();
            })
            .catch(error => {
                console.warn('⚠️ No se pudieron cargar datos históricos:', error.message);
                console.log('💡 Continuando con datos de localStorage...');
                resolve(); // No es fatal, continuamos
            });
    });
}

// ============================================
// CARGA DE DATOS DESDE STORAGE
// ============================================

function cargarMarcasDesdeStorage() {
    try {
        const marcasJSON = localStorage.getItem('marcasPrimerEtapa');
        const marcas = JSON.parse(marcasJSON) || [];
        
        const ddlMarcas = document.getElementById('ddlMarcas');
        if (!ddlMarcas) {
            console.error('❌ Elemento ddlMarcas no encontrado');
            return;
        }
        
        ddlMarcas.innerHTML = '<option value="0">Seleccione una marca</option>';
        
        // Ordenar por número de casa
        marcas.sort((a, b) => a.numeroCasa - b.numeroCasa);
        
        marcas.forEach(marca => {
            const option = document.createElement('option');
            option.value = marca.numeroCasa;
            option.textContent = `Casa ${marca.numeroCasa} - ${marca.cliente}`;
            ddlMarcas.appendChild(option);
        });
        
        console.log(`✅ Cargadas ${marcas.length} marcas desde localStorage`);
    } catch (error) {
        console.error('❌ Error cargando marcas:', error);
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
        imgPlano.onload = function() {
            agregarMarcador(numeroCasa, originalX, originalY);
        };
        return;
    }
    
    const scaleX = imgPlano.clientWidth / PLANO_ANCHO_REAL;
    const scaleY = imgPlano.clientHeight / PLANO_ALTO_REAL;
    
    const x = originalX * scaleX;
    const y = originalY * scaleY;
    
    if (x < 0 || x > imgPlano.clientWidth || y < 0 || y > imgPlano.clientHeight) {
        console.error('⚠ Coordenadas fuera del plano visible:', {numeroCasa, x, y});
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

function cargarMarcaSeleccionada() {
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
            
            // Buscar cliente en localStorage
            try {
                const marcas = JSON.parse(localStorage.getItem('marcasPrimerEtapa')) || [];
                const marca = marcas.find(m => m.numeroCasa == numeroCasa);
                if (marca) {
                    const txtCliente = document.getElementById('txtCliente');
                    if (txtCliente) {
                        txtCliente.value = marca.cliente || '';
                    }
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
// GUARDADO SEGURO EN STORAGE
// ============================================

function guardarMarcaEnStorage(numeroCasa, cliente, x, y) {
    return new Promise((resolve, reject) => {
        try {
            let marcas = [];
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            const existe = marcas.some(m => m.numeroCasa == numeroCasa);
            if (existe) {
                reject(`La casa ${numeroCasa} ya está registrada`);
                return;
            }
            
            marcas.push({
                numeroCasa: parseInt(numeroCasa),
                cliente: cliente.trim() || 'Cliente no especificado',
                coordenadas: { x: x, y: y },
                fecha: new Date().toISOString()
            });
            
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify(marcas));
            
            console.log(`✅ Marca ${numeroCasa} guardada exitosamente`);
            resolve();
            
        } catch (error) {
            console.error('❌ Error guardando en localStorage:', error);
            reject('Error al guardar los datos: ' + error.message);
        }
    });
}

// ============================================
// FUNCIÓN PRINCIPAL DE GUARDADO
// ============================================

function marcarEnPlano() {
    const txtNumeroCasa = document.getElementById('txtNumeroCasa');
    const numeroCasaRaw = txtNumeroCasa.value.trim();
    const txtCliente = document.getElementById('txtCliente').value.trim();
    const marcadoresContainer = document.getElementById('marcadoresContainer');
    const ddlMarcas = document.getElementById('ddlMarcas');

    const numeroCasa = validarNumeroCasa(numeroCasaRaw);
    if (numeroCasa === null) return;

    if (!txtCliente) {
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

    guardarMarcaEnStorage(numeroCasa, txtCliente, coords.x, coords.y)
        .then(() => {
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
            
            setTimeout(() => {
                cargarMarcasDesdeStorage();
                if (ddlMarcas) {
                    ddlMarcas.value = numeroCasa.toString();
                }
            }, 300);
            
        })
        .catch(error => {
            if (marcadoresContainer) {
                marcadoresContainer.innerHTML = '';
            }
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al guardar',
                    text: error || 'No se pudo guardar la marca. Intente nuevamente.'
                });
            } else {
                alert(`Error al guardar: ${error}`);
            }
        });
}

// ============================================
// ELIMINACIÓN DE MARCAS
// ============================================

function eliminarMarca() {
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
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarMarcaDeStorage(numeroCasa)
                    .then(() => {
                        limpiarFormulario();
                        cargarMarcasDesdeStorage();
                        Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: `Casa ${numeroCasa} eliminada correctamente`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al eliminar',
                            text: error || 'No se pudo eliminar la marca'
                        });
                    });
            }
        });
    } else {
        if (confirm(`¿Eliminar la casa número ${numeroCasa} permanentemente?`)) {
            eliminarMarcaDeStorage(numeroCasa)
                .then(() => {
                    limpiarFormulario();
                    cargarMarcasDesdeStorage();
                    alert(`Casa ${numeroCasa} eliminada correctamente`);
                })
                .catch(error => {
                    alert(`Error al eliminar: ${error}`);
                });
        }
    }
}

function eliminarMarcaDeStorage(numeroCasa) {
    return new Promise((resolve, reject) => {
        try {
            let marcas = [];
            const storedData = localStorage.getItem('marcasPrimerEtapa');
            
            if (storedData) {
                marcas = JSON.parse(storedData);
            }
            
            const nuevasMarcas = marcas.filter(marca => marca.numeroCasa != numeroCasa);
            
            if (marcas.length === nuevasMarcas.length) {
                reject('La marca no fue encontrada para eliminar');
                return;
            }
            
            localStorage.setItem('marcasPrimerEtapa', JSON.stringify(nuevasMarcas));
            resolve();
        } catch (error) {
            reject(error.message);
        }
    });
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
