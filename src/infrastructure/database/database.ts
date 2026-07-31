import type {
  SQLiteDatabase,
} from "expo-sqlite";

const DATABASE_VERSION = 6;

interface TableInfoRow {
  name: string;
}

export async function initializeDatabase(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  /*
   * Las sentencias CREATE TABLE IF NOT EXISTS
   * son seguras: no eliminan tablas ni datos.
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      nombres TEXT NOT NULL,

      apellidos TEXT NOT NULL,

      nombreUsuario TEXT NOT NULL
        UNIQUE COLLATE NOCASE,

      passwordHash TEXT NOT NULL,

      passwordSalt TEXT NOT NULL,

      fechaRegistro TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      id INTEGER PRIMARY KEY
        CHECK (id = 1),

      usuarioId INTEGER NOT NULL,

      fechaInicio TEXT NOT NULL,

      FOREIGN KEY (usuarioId)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      codigo TEXT NOT NULL
        UNIQUE COLLATE NOCASE,

      nombre TEXT NOT NULL,

      descripcion TEXT NOT NULL,

      categoria TEXT NOT NULL
        CHECK (
          categoria IN (
            'ALIMENTOS',
            'SALUD',
            'HIGIENE',
            'ACCESORIOS',
            'JUGUETES'
          )
        ),

      precio REAL NOT NULL
        CHECK (precio >= 0),

      stock INTEGER NOT NULL
        DEFAULT 0
        CHECK (stock >= 0),

      imagenUrl TEXT,

      activo INTEGER NOT NULL
        DEFAULT 1
        CHECK (activo IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      productoId INTEGER,

      firebaseId TEXT UNIQUE,

      usuarioUid TEXT NOT NULL,

      clienteNombre TEXT NOT NULL,

      producto TEXT NOT NULL,

      cantidad INTEGER NOT NULL
        CHECK (cantidad > 0),

      precio REAL NOT NULL
        CHECK (precio >= 0),

      estado TEXT NOT NULL
        CHECK (
          estado IN (
            'PENDIENTE',
            'EN_PROCESO',
            'ENTREGADO',
            'CANCELADO'
          )
        ),

      fechaRegistro TEXT NOT NULL,

      fechaActualizacion TEXT NOT NULL,

      sincronizado INTEGER NOT NULL
        DEFAULT 0
        CHECK (sincronizado IN (0, 1)),

      FOREIGN KEY (productoId)
        REFERENCES productos(id)
    );
  `);

  /*
   * CREATE TABLE IF NOT EXISTS no agrega columnas
   * nuevas a tablas existentes. Por eso comprobamos
   * directamente la estructura real de pedidos.
   */
  const columnasPedidos =
    await database.getAllAsync<TableInfoRow>(
      "PRAGMA table_info(pedidos)"
    );

  const tieneProductoId =
    columnasPedidos.some(
      (columna) =>
        columna.name.toLowerCase() ===
        "productoid"
    );

  if (!tieneProductoId) {
    console.log(
      "Reparando columna productoId en pedidos..."
    );

    await database.execAsync(`
      ALTER TABLE pedidos
      ADD COLUMN productoId INTEGER
        REFERENCES productos(id);
    `);
  }

  /*
   * Verificación posterior: si la columna todavía no
   * existe, se informa antes de abrir las pantallas.
   */
  const columnasVerificadas =
    await database.getAllAsync<TableInfoRow>(
      "PRAGMA table_info(pedidos)"
    );

  const productoIdConfirmado =
    columnasVerificadas.some(
      (columna) =>
        columna.name.toLowerCase() ===
        "productoid"
    );

  if (!productoIdConfirmado) {
    throw new Error(
      "No se pudo agregar productoId a la tabla pedidos"
    );
  }

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS
      idx_pedidos_usuarioUid
    ON pedidos(usuarioUid);

    CREATE INDEX IF NOT EXISTS
      idx_pedidos_estado
    ON pedidos(estado);

    CREATE INDEX IF NOT EXISTS
      idx_pedidos_sincronizado
    ON pedidos(sincronizado);

    CREATE INDEX IF NOT EXISTS
      idx_pedidos_productoId
    ON pedidos(productoId);

    CREATE INDEX IF NOT EXISTS
      idx_productos_categoria
    ON productos(categoria);

    CREATE INDEX IF NOT EXISTS
      idx_productos_activo
    ON productos(activo);
  `);

  /*
   * Catálogo inicial. INSERT OR IGNORE evita
   * duplicar productos en cada arranque.
   */
  await database.execAsync(`
    INSERT OR IGNORE INTO productos (
      codigo,
      nombre,
      descripcion,
      categoria,
      precio,
      stock,
      imagenUrl,
      activo
    )
    VALUES
      (
        'ALI-001',
        'Royal Canin Adulto',
        'Alimento balanceado para perros adultos. Presentación de 3 kg.',
        'ALIMENTOS',
        75.50,
        20,
        NULL,
        1
      ),
      (
        'ALI-002',
        'Alimento para gatos',
        'Alimento completo para gatos adultos. Presentación de 1 kg.',
        'ALIMENTOS',
        32.90,
        18,
        NULL,
        1
      ),
      (
        'SAL-001',
        'Antipulgas Bravecto',
        'Tableta antipulgas y antigarrapatas para perros.',
        'SALUD',
        110.00,
        12,
        NULL,
        1
      ),
      (
        'SAL-002',
        'Vitaminas para mascotas',
        'Suplemento multivitamínico para perros y gatos.',
        'SALUD',
        39.90,
        16,
        NULL,
        1
      ),
      (
        'HIG-001',
        'Shampoo medicado',
        'Shampoo dermatológico para el cuidado de piel y pelaje.',
        'HIGIENE',
        28.90,
        25,
        NULL,
        1
      ),
      (
        'HIG-002',
        'Arena para gatos',
        'Arena sanitaria absorbente y con control de olores.',
        'HIGIENE',
        32.00,
        22,
        NULL,
        1
      ),
      (
        'ACC-001',
        'Collar regulable',
        'Collar cómodo y regulable para perros medianos.',
        'ACCESORIOS',
        24.50,
        15,
        NULL,
        1
      ),
      (
        'ACC-002',
        'Plato de acero inoxidable',
        'Plato resistente para alimento o agua.',
        'ACCESORIOS',
        22.90,
        14,
        NULL,
        1
      ),
      (
        'JUG-001',
        'Juguete mordedor',
        'Juguete resistente para entretenimiento y cuidado dental.',
        'JUGUETES',
        18.50,
        30,
        NULL,
        1
      ),
      (
        'JUG-002',
        'Pelota para mascotas',
        'Pelota liviana y resistente para perros.',
        'JUGUETES',
        14.90,
        28,
        NULL,
        1
      );
  `);

  await database.execAsync(
    `PRAGMA user_version = ${DATABASE_VERSION}`
  );

  console.log(
    `Base de datos inicializada en versión ${DATABASE_VERSION}`
  );
}