  // Función para actualizar el reloj
        function updateClock() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            document.getElementById('digitalClock').textContent = `${hours}:${minutes}:${seconds}`;
        }
        
        // Actualizar el reloj inmediatamente y luego cada segundo
        updateClock();
        setInterval(updateClock, 1000);
        
        // Actualizar año en el footer
        document.getElementById('currentYear').textContent = new Date().getFullYear();