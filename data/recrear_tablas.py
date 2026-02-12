import sqlite3

conn = sqlite3.connect('Urbano.db')
cursor = conn.cursor()
cursor.execute("PRAGMA foreign_keys = ON")

print("🔧 Recreando tablas...")

# Eliminar tablas en orden inverso (primero la hija, luego la padre)
cursor.execute("DROP TABLE IF EXISTS TablaClienteCasa")
print("  ✅ TablaClienteCasa eliminada")
cursor.execute("DROP TABLE IF EXISTS TablaCasas")
print("  ✅ TablaCasas eliminada")

# Crear TablaCasas
cursor.execute('''
    CREATE TABLE TablaCasas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_casa TEXT NOT NULL UNIQUE,
        Coordenada_X REAL NOT NULL,
        Coordenada_Y REAL NOT NULL
    )
''')
print("  ✅ TablaCasas creada")

# Crear TablaClienteCasa CON CASCADE explícito
cursor.execute('''
    CREATE TABLE TablaClienteCasa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre_Cliente TEXT NOT NULL,
        Casa_Numero TEXT NOT NULL,
        FOREIGN KEY (Casa_Numero) 
            REFERENCES TablaCasas(numero_casa) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
    )
''')
print("  ✅ TablaClienteCasa creada con CASCADE")

conn.commit()

# Verificar schema
print("\n🔍 Verificando schema de TablaClienteCasa:")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='TablaClienteCasa'")
schema = cursor.fetchone()[0]
print(schema)

# Verificar foreign keys
print("\n🔑 Verificando foreign keys:")
cursor.execute("PRAGMA foreign_key_list(TablaClienteCasa)")
fks = cursor.fetchall()
if fks:
    for fk in fks:
        print(f"  ID:{fk[0]}, Tabla:{fk[2]}, Local:{fk[3]}, Remota:{fk[4]}, OnDelete:{fk[5]}, OnUpdate:{fk[6]}")
else:
    print("  ⚠️  No se detectan foreign keys en metadatos (pero CASCADE puede funcionar)")

conn.close()
print("\n✨ ¡Tablas recreadas correctamente!")