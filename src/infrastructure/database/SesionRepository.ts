import type { SQLiteDatabase } from "expo-sqlite";

import type { Usuario } from "../../domain/models/Usuario";

/**
 * Guarda una única sesión activa.
 *
 * La tabla sesiones utiliza siempre el ID 1.
 * Si ya existe una sesión, se actualiza.
 */
export async function guardarSesion(
  database: SQLiteDatabase,
  usuarioId: number
): Promise<void> {
  const fechaInicio = new Date().toISOString();

  await database.runAsync(
    `
      INSERT INTO sesiones (
        id,
        usuarioId,
        fechaInicio
      )
      VALUES (1, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        usuarioId = excluded.usuarioId,
        fechaInicio = excluded.fechaInicio
    `,
    [usuarioId, fechaInicio]
  );
}

/**
 * Obtiene el usuario relacionado con la sesión activa.
 */
export async function obtenerUsuarioSesion(
  database: SQLiteDatabase
): Promise<Usuario | null> {
  const usuario = await database.getFirstAsync<Usuario>(
    `
      SELECT
        u.id,
        u.nombres,
        u.apellidos,
        u.nombreUsuario,
        u.passwordHash,
        u.passwordSalt,
        u.fechaRegistro
      FROM sesiones AS s

      INNER JOIN usuarios AS u
        ON u.id = s.usuarioId

      WHERE s.id = 1
      LIMIT 1
    `
  );

  return usuario ?? null;
}

/**
 * Elimina la sesión activa, pero conserva el usuario.
 */
export async function cerrarSesion(
  database: SQLiteDatabase
): Promise<void> {
  await database.runAsync(
    `
      DELETE FROM sesiones
      WHERE id = 1
    `
  );
}