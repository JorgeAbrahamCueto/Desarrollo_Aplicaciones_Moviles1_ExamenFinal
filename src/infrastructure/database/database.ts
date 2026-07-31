import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 2;

interface DatabaseVersionRow {
  user_version: number;
}

export async function initializeDatabase(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionResult =
    await database.getFirstAsync<DatabaseVersionRow>(
      "PRAGMA user_version"
    );

  const currentVersion =
    versionResult?.user_version ?? 0;

  /*
   * Migración inicial:
   * conserva las tablas de autenticación local
   * que construimos al inicio del proyecto.
   */
  if (currentVersion < 1) {
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

  /*
   * Migración versión 2:
   * crea el almacenamiento local de pedidos.
   */
  if (currentVersion < 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

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
          CHECK (sincronizado IN (0, 1))
      );

      CREATE INDEX IF NOT EXISTS
        idx_pedidos_usuarioUid
      ON pedidos(usuarioUid);

      CREATE INDEX IF NOT EXISTS
        idx_pedidos_estado
      ON pedidos(estado);

      CREATE INDEX IF NOT EXISTS
        idx_pedidos_sincronizado
      ON pedidos(sincronizado);
    `);
  }

  await database.execAsync(
    `PRAGMA user_version = ${DATABASE_VERSION}`
  );

  console.log(
    `Base de datos inicializada en versión ${DATABASE_VERSION}`
  );
}