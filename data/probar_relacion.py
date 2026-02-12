import sqlite3

conn = sqlite3.connect('Urbano.db')
cursor = conn.cursor()

# ¡ACTIVAR FOREIGN KEYS! (obligatorio en cada conexión)
cursor.execute("PRAGMA foreign_keys = ON")
print("✅ Foreign keys ACTIVADAS")

# Verificar estado
cursor.execute("PRAGMA foreign_keys")
print(f"Estado actual de foreign_keys: {cursor.fetchone()[0]}")

# Insertar una casa de prueba
cursor.execute(
    "INSERT OR IGNORE INTO TablaCasas (numero_casa, Coordenada_X, Coordenada_Y) VALUES (?, ?, ?)",
    ('10A', 150.5, 200.3)
)
conn.commit()
print("\n✅ Casa '10A' insertada")

# Insertar un cliente para esa casa
cursor.execute(
    "INSERT INTO TablaClienteCasa (Nombre_Cliente, Casa_Numero) VALUES (?, ?)",
    ('Juan Pérez', '10A')
)
conn.commit()
print("✅ Cliente 'Juan Pérez' asociado a casa '10A'")

# Mostrar datos actuales
print("\n📋 Datos antes de eliminar:")
cursor.execute("SELECT * FROM TablaCasas WHERE numero_casa = '10A'")
print(f"  Casa: {cursor.fetchall()}")
cursor.execute("SELECT * FROM TablaClienteCasa WHERE Casa_Numero = '10A'")
print(f"  Cliente: {cursor.fetchall()}")

# ¡BORRAR LA CASA! (debería eliminar también al cliente por CASCADE)
cursor.execute("DELETE FROM TablaCasas WHERE numero_casa = '10A'")
conn.commit()
print("\n🗑️ Casa '10A' eliminada")

# Verificar que el cliente también se eliminó
cursor.execute("SELECT * FROM TablaClienteCasa WHERE Casa_Numero = '10A'")
clientes = cursor.fetchall()
if not clientes:
    print("✅ ¡ÉXITO! El cliente se eliminó automáticamente (CASCADE funcionando)")
else:
    print(f"❌ ERROR: El cliente NO se eliminó: {clientes}")

# Limpiar (por si quedó algún residuo)
cursor.execute("DELETE FROM TablaCasas WHERE numero_casa = '10A'")
cursor.execute("DELETE FROM TablaClienteCasa WHERE Casa_Numero = '10A'")
conn.commit()

conn.close()
print("\n✨ Prueba completada correctamente")