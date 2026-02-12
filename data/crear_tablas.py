import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('Urbano.db')
cursor = conn.cursor()

# Activar claves foráneas
cursor.execute("PRAGMA foreign_keys = ON")

# Crear TablaCasas
cursor.execute('''
    CREATE TABLE IF NOT EXISTS TablaCasas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero_casa TEXT NOT NULL UNIQUE,
        Coordenada_X REAL NOT NULL,
        Coordenada_Y REAL NOT NULL
    )
''')

# Crear TablaClienteCasa con relación
cursor.execute('''
    CREATE TABLE IF NOT EXISTS TablaClienteCasa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre_Cliente TEXT NOT NULL,
        Casa_Numero TEXT NOT NULL,
        FOREIGN KEY (Casa_Numero) REFERENCES TablaCasas(numero_casa) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE
    )
''')

# Confirmar cambios
conn.commit()

# Verificar que las tablas se crearon
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tablas = cursor.fetchall()
print("_Tablas creadas:_")
for tabla in tablas:
    print(f"  - {tabla[0]}")

# Mostrar estructura de TablaCasas
print("\n_Estructura de TablaCasas:_")
cursor.execute("PRAGMA table_info(TablaCasas);")
for col in cursor.fetchall():
    print(f"  {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''} {'PK' if col[5] else ''}")

# Mostrar estructura de TablaClienteCasa
print("\n_Estructura de TablaClienteCasa:_")
cursor.execute("PRAGMA table_info(TablaClienteCasa);")
for col in cursor.fetchall():
    print(f"  {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''} {'PK' if col[5] else ''}")

# Verificar foreign keys
print("\n_Relaciones (Foreign Keys) en TablaClienteCasa:_")
cursor.execute("PRAGMA foreign_key_list(TablaClienteCasa);")
fk = cursor.fetchall()
if fk:
    for row in fk:
        print(f"  Referencia: {row[2]}.{row[4]} ← {row[3]} (ON DELETE: {row[5]}, ON UPDATE: {row[6]})")
else:
    print("  ❌ No se encontraron foreign keys (posible problema)")

# Cerrar conexión
conn.close()

print("\n✅ ¡Tablas creadas correctamente!")