import sqlite3

conn = sqlite3.connect('Urbano.db')
cursor = conn.cursor()
cursor.execute("PRAGMA foreign_keys = ON")

print("🧪 Probando CASCADE...")

# Insertar casa
cursor.execute("INSERT INTO TablaCasas (numero_casa, Coordenada_X, Coordenada_Y) VALUES (?, ?, ?)", 
               ('99Z', 500.0, 600.0))
casa_id = cursor.lastrowid
print(f"✅ Casa insertada (ID: {casa_id})")

# Insertar cliente
cursor.execute("INSERT INTO TablaClienteCasa (Nombre_Cliente, Casa_Numero) VALUES (?, ?)", 
               ('Carlos Mora', '99Z'))
cliente_id = cursor.lastrowid
print(f"✅ Cliente insertado (ID: {cliente_id})")

conn.commit()

# Verificar existencia
cursor.execute("SELECT COUNT(*) FROM TablaClienteCasa WHERE Casa_Numero = '99Z'")
count_before = cursor.fetchone()[0]
print(f"\n📊 Antes de eliminar: {count_before} cliente(s) para casa '99Z'")

# ¡Eliminar casa!
cursor.execute("DELETE FROM TablaCasas WHERE numero_casa = '99Z'")
conn.commit()
print("🗑️  Casa eliminada")

# Verificar CASCADE
cursor.execute("SELECT COUNT(*) FROM TablaClienteCasa WHERE Casa_Numero = '99Z'")
count_after = cursor.fetchone()[0]
print(f"📊 Después de eliminar: {count_after} cliente(s) para casa '99Z'")

if count_after == 0:
    print("\n✅ ¡ÉXITO! CASCADE funcionando correctamente")
else:
    print(f"\n❌ FALLÓ: {count_after} cliente(s) aún existen")

# Limpiar residuos si quedaron
cursor.execute("DELETE FROM TablaCasas WHERE numero_casa = '99Z'")
cursor.execute("DELETE FROM TablaClienteCasa WHERE Casa_Numero = '99Z'")
conn.commit()

conn.close()
print("✨ Prueba completada")