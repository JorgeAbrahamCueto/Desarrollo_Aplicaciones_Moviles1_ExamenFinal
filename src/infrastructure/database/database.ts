import type {
  SQLiteDatabase,
} from "expo-sqlite";

const DATABASE_VERSION = 8;

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
 * Reservas de atenciones veterinarias.
 * Cada atención pertenece a una cuenta Firebase.
 */
await database.execAsync(`
  CREATE TABLE IF NOT EXISTS atenciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    usuarioUid TEXT NOT NULL,

    propietarioNombre TEXT NOT NULL,

    mascotaNombre TEXT NOT NULL,

    especie TEXT NOT NULL
      CHECK (
        especie IN (
          'PERRO',
          'GATO',
          'OTRO'
        )
      ),

    tipoAtencion TEXT NOT NULL
      CHECK (
        tipoAtencion IN (
          'CONSULTA_GENERAL',
          'VACUNACION',
          'DESPARASITACION',
          'CONTROL',
          'EMERGENCIA'
        )
      ),

    fechaAtencion TEXT NOT NULL,

    horaAtencion TEXT NOT NULL,

    motivo TEXT NOT NULL,

    estado TEXT NOT NULL
      DEFAULT 'SOLICITADA'
      CHECK (
        estado IN (
          'SOLICITADA',
          'CONFIRMADA',
          'ATENDIDA',
          'CANCELADA'
        )
      ),

    fechaRegistro TEXT NOT NULL,

    fechaActualizacion TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS
    idx_atenciones_usuario
  ON atenciones(usuarioUid);

  CREATE INDEX IF NOT EXISTS
    idx_atenciones_estado
  ON atenciones(estado);

  CREATE INDEX IF NOT EXISTS
    idx_atenciones_fecha
  ON atenciones(fechaAtencion);
`);

  await database.execAsync(
    `PRAGMA user_version = ${DATABASE_VERSION}`
  );

  console.log(
    `Base de datos inicializada en versión ${DATABASE_VERSION}`
  );
}