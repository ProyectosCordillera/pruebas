import sqlite3

conn = sqlite3.connect('Urbano.db')
cursor = conn.cursor()

# Ver schema de TablaClienteCasa
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='TablaClienteCasa'")
resultado = cursor.fetchone()

if resultado:
    print("	Schema actual de TablaClienteCasa:")
    print(resultado[0])
else:
    print("❌ Tabla 'TablaClienteCasa' no encontrada")

conn.close()