// ============================================
// SCRIPT GENERAL PARA TODAS LAS PÁGINAS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Script general cargado');
    
    // 1. Actualizar año en el footer
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        // Solo actualizar si está vacío (para no sobreescribir si ya fue seteado)
        if (!currentYearElement.textContent) {
            currentYearElement.textContent = new Date().getFullYear();
        }
    }
    
    // 2. Inicializar tooltips (opcional - solo si se usan)
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // 3. Evento para links del menú (navegación normal)
    const navLinks = document.querySelectorAll('.dropdown-item');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Permitir navegación normal (no prevenir default)
            // Esto permite que los links funcionen correctamente
        });
    });
    
    // 4. Prevenir envío de formularios vacíos (mejora UX)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Puedes agregar validaciones aquí si es necesario
        });
    });
    
    // 5. Console log para debugging
    console.log('✅ Script general inicializado completamente');
});

// ============================================
// FUNCIONES DE UTILIDAD (opcionales)
// ============================================

// Función para formatear fechas
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC'
    }).format(amount);
}

// Función para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

// Capturar errores no manejados
window.addEventListener('error', function(e) {
    console.error('❌ Error global:', e.message, e.filename, e.lineno);
    
    // Opcional: Mostrar mensaje al usuario
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error en la aplicación',
            text: 'Ocurrió un error inesperado. Por favor, recargue la página.',
            footer: `<small>${e.message}</small>`
        });
    }
});

// Capturar errores de promesas no manejadas
window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promesa no manejada:', e.reason);
    e.preventDefault(); // Prevenir que el error se propague
});
