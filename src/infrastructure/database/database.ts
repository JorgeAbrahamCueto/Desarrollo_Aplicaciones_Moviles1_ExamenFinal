import type {
  SQLiteDatabase,
} from "expo-sqlite";

const DATABASE_VERSION = 9;

interface DatabaseVersionRow {
  user_version: number;
}

interface TableInfoRow {
  name: string;
}

interface ProductoInicial {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  activo: number;
}

/*
 * Los identificadores son fijos porque los pedidos
 * guardan la relación mediante productoId.
 */
const PRODUCTOS_INICIALES: ProductoInicial[] = [
  {
    id: 1,
    codigo: "ALI-001",
    nombre: "Royal Canin Adulto",
    descripcion:
      "Alimento balanceado para perros adultos. Presentación de 3 kg.",
    categoria: "ALIMENTOS",
    precio: 75.5,
    stock: 20,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 2,
    codigo: "ALI-002",
    nombre: "Alimento para gatos",
    descripcion:
      "Alimento completo para gatos adultos. Presentación de 1 kg.",
    categoria: "ALIMENTOS",
    precio: 32.9,
    stock: 18,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 3,
    codigo: "SAL-001",
    nombre: "Antipulgas Bravecto",
    descripcion:
      "Tratamiento antipulgas y garrapatas para perros.",
    categoria: "SALUD",
    precio: 110,
    stock: 12,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 4,
    codigo: "SAL-002",
    nombre: "Vitaminas para mascotas",
    descripcion:
      "Suplemento vitamínico para perros y gatos.",
    categoria: "SALUD",
    precio: 39.9,
    stock: 25,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 5,
    codigo: "HIG-001",
    nombre: "Shampoo medicado",
    descripcion:
      "Shampoo para el cuidado de la piel y el pelaje.",
    categoria: "HIGIENE",
    precio: 36.9,
    stock: 15,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 6,
    codigo: "HIG-002",
    nombre: "Arena para gatos",
    descripcion:
      "Arena absorbente para mantener limpia la caja sanitaria.",
    categoria: "HIGIENE",
    precio: 27.5,
    stock: 22,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 7,
    codigo: "ACC-001",
    nombre: "Collar regulable",
    descripcion:
      "Collar cómodo y regulable para perros medianos.",
    categoria: "ACCESORIOS",
    precio: 24.5,
    stock: 16,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 8,
    codigo: "ACC-002",
    nombre: "Plato de acero inoxidable",
    descripcion:
      "Plato resistente para alimento o agua.",
    categoria: "ACCESORIOS",
    precio: 22.9,
    stock: 14,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 9,
    codigo: "JUG-001",
    nombre: "Juguete mordedor",
    descripcion:
      "Juguete resistente para entretenimiento y cuidado dental.",
    categoria: "JUGUETES",
    precio: 18.5,
    stock: 30,
    imagenUrl: null,
    activo: 1,
  },
  {
    id: 10,
    codigo: "JUG-002",
    nombre: "Pelota para mascotas",
    descripcion:
      "Pelota liviana y resistente para perros.",
    categoria: "JUGUETES",
    precio: 14.9,
    stock: 28,
    imagenUrl: null,
    activo: 1,
  },
];

async function obtenerVersionDatabase(
  database: SQLiteDatabase
): Promise<number> {
  const resultado =
    await database.getFirstAsync<DatabaseVersionRow>(
      "PRAGMA user_version"
    );

  return resultado?.user_version ?? 0;
}

async function existeColumna(
  database: SQLiteDatabase,
  tabla: string,
  columna: string
): Promise<boolean> {
  const columnas =
    await database.getAllAsync<TableInfoRow>(
      `PRAGMA table_info(${tabla})`
    );

  return columnas.some(
    (informacion) =>
      informacion.name === columna
  );
}

async function prepararTablasPrincipales(
  database: SQLiteDatabase
): Promise<void> {
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
      id INTEGER PRIMARY KEY CHECK (id = 1),
      usuarioId INTEGER NOT NULL,
      fechaInicio TEXT NOT NULL,

      FOREIGN KEY (usuarioId)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
    );
  `);
}

async function prepararTablaProductos(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL
        UNIQUE COLLATE NOCASE,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      categoria TEXT NOT NULL,
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

    CREATE INDEX IF NOT EXISTS
      idx_productos_categoria
    ON productos(categoria);

    CREATE INDEX IF NOT EXISTS
      idx_productos_nombre
    ON productos(nombre);

    CREATE INDEX IF NOT EXISTS
      idx_productos_activo
    ON productos(activo);
  `);
}

async function prepararTablaPedidos(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      firebaseId TEXT UNIQUE,

      productoId INTEGER,

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
        ON DELETE SET NULL
    );
  `);

  /*
   * Repara instalaciones que crearon pedidos antes
   * de incorporar la relación con productos.
   */
  const tieneProductoId = await existeColumna(
    database,
    "pedidos",
    "productoId"
  );

  if (!tieneProductoId) {
    await database.execAsync(`
      ALTER TABLE pedidos
      ADD COLUMN productoId INTEGER
        REFERENCES productos(id)
        ON DELETE SET NULL;
    `);
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

    CREATE UNIQUE INDEX IF NOT EXISTS
      idx_pedidos_firebaseId
    ON pedidos(firebaseId)
    WHERE firebaseId IS NOT NULL;
  `);
}

async function prepararEliminacionesPendientes(
  database: SQLiteDatabase
): Promise<void> {
  /*
   * Esta tabla conserva las eliminaciones realizadas
   * sin conexión hasta poder comunicarlas a Firestore.
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS
      eliminaciones_pendientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebaseId TEXT NOT NULL UNIQUE,
        usuarioUid TEXT NOT NULL,
        fechaRegistro TEXT,
        fechaEliminacion TEXT
      );

    CREATE INDEX IF NOT EXISTS
      idx_eliminaciones_usuarioUid
    ON eliminaciones_pendientes(usuarioUid);
  `);

  /*
   * Se conserva también este nombre para mantener
   * compatibilidad con versiones anteriores.
   */
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS
      pedidos_eliminados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebaseId TEXT NOT NULL UNIQUE,
        usuarioUid TEXT NOT NULL,
        fechaRegistro TEXT,
        fechaEliminacion TEXT
      );

    CREATE INDEX IF NOT EXISTS
      idx_pedidos_eliminados_usuarioUid
    ON pedidos_eliminados(usuarioUid);
  `);
}

async function prepararTablaAtenciones(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS atenciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      usuarioUid TEXT NOT NULL,

      mascotaNombre TEXT NOT NULL,

      mascotaTipo TEXT NOT NULL,

      servicio TEXT NOT NULL,

      fecha TEXT NOT NULL,

      hora TEXT NOT NULL,

      motivo TEXT NOT NULL,

      estado TEXT NOT NULL,

      fechaRegistro TEXT NOT NULL,

      fechaActualizacion TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS
      idx_atenciones_usuarioUid
    ON atenciones(usuarioUid);

    CREATE INDEX IF NOT EXISTS
      idx_atenciones_estado
    ON atenciones(estado);

    CREATE INDEX IF NOT EXISTS
      idx_atenciones_fecha
    ON atenciones(fecha);
  `);
}

async function insertarCatalogoInicial(
  database: SQLiteDatabase
): Promise<void> {
  /*
   * INSERT OR IGNORE solamente agrega productos
   * faltantes. No restaura ni modifica el stock de
   * productos que ya existen.
   */
  for (const producto of PRODUCTOS_INICIALES) {
    await database.runAsync(
      `
        INSERT OR IGNORE INTO productos (
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          imagenUrl,
          activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        producto.id,
        producto.codigo,
        producto.nombre,
        producto.descripcion,
        producto.categoria,
        producto.precio,
        producto.stock,
        producto.imagenUrl,
        producto.activo,
      ]
    );
  }
}

export async function initializeDatabase(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  const versionAnterior =
    await obtenerVersionDatabase(database);

  try {
    /*
     * Las comprobaciones no dependen únicamente de
     * user_version. Esto permite reparar una base que
     * tenga la versión registrada pero alguna tabla o
     * columna faltante.
     */
    await prepararTablasPrincipales(database);
    await prepararTablaProductos(database);
    await prepararTablaPedidos(database);
    await prepararEliminacionesPendientes(database);
    await prepararTablaAtenciones(database);

    /*
     * Se ejecuta siempre de forma segura para que una
     * instalación nueva del APK reciba el catálogo.
     */
    await insertarCatalogoInicial(database);

    await database.execAsync(
      `PRAGMA user_version = ${DATABASE_VERSION}`
    );

    console.log(
      `Base de datos inicializada en versión ${DATABASE_VERSION}`,
      {
        versionAnterior,
      }
    );
  } catch (error) {
    console.error(
      "Error al inicializar la base de datos:",
      error
    );

    throw error;
  }
}