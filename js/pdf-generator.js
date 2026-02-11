// ============================================
// FUNCIÓN PARA GENERAR PDF
// ============================================

function saveAsPDF() {
    // Mostrar feedback al usuario
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Generando PDF...';
    btn.disabled = true;
    
    // Obtener el elemento a convertir
    const element = document.getElementById('Hoja1');
    
    // Opciones de configuración para formato carta y saltos de página
    const opt = {
        margin: [5, 2, 5, 2], // [top, right, bottom, left] en mm
        filename: 'recibo-reserva.pdf',
        image: {
            type: 'jpeg',
            quality: 0.98
        },
        html2canvas: {
             scale: 1.3, // Reduce la escala para que quepa mejor
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: false
        },
        jsPDF: {
            unit: 'mm',
            format: 'letter', // Usa 'letter' directamente
            orientation: 'portrait'
        },
        pagebreak: {
            mode: ['css'],
            before: '#pagina2, #pagina3'
        }
    };
    
    // Generar y descargar PDF
    html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
            // Restaurar botón
            btn.innerHTML = originalText;
            btn.disabled = false;
        })
        .catch(error => {
            console.error('Error al generar PDF:', error);
            alert('Ocurrió un error al generar el PDF:\n' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}
