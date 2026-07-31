import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 1;

export async function initializeDatabase(
  database: SQLiteDatabase
): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const versionResult = await database.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");

  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombres TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        nombreUsuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
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

  await database.execAsync(
    `PRAGMA user_version = ${DATABASE_VERSION}`
  );

  console.log("Base de datos inicializada correctamente");
}