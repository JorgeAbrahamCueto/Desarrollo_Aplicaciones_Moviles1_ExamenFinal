import type { SQLiteDatabase } from "expo-sqlite";

import type {
  RegistrarUsuarioData,
  Usuario,
} from "../../domain/models/Usuario";

import {
  comprobarPassword,
  generarPasswordHash,
  generarSalt,
} from "../../shared/security/password";

interface UsuarioExistenteRow {
  cantidad: number;
}

export async function existeNombreUsuario(
  database: SQLiteDatabase,
  nombreUsuario: string
): Promise<boolean> {
  const resultado =
    await database.getFirstAsync<UsuarioExistenteRow>(
      `
        SELECT COUNT(*) AS cantidad
        FROM usuarios
        WHERE nombreUsuario = ? COLLATE NOCASE
      `,
      [nombreUsuario.trim()]
    );

  return (resultado?.cantidad ?? 0) > 0;
}

export async function registrarUsuario(
  database: SQLiteDatabase,
  data: RegistrarUsuarioData
): Promise<Usuario> {
  const nombres = data.nombres.trim();
  const apellidos = data.apellidos.trim();

  const nombreUsuario = data.nombreUsuario
    .trim()
    .toLowerCase();

  const usuarioExiste = await existeNombreUsuario(
    database,
    nombreUsuario
  );

  if (usuarioExiste) {
    throw new Error(
      "El nombre de usuario ya está registrado"
    );
  }

  const passwordSalt = await generarSalt();

  const passwordHash = await generarPasswordHash(
    data.password,
    passwordSalt
  );

  const fechaRegistro = new Date().toISOString();

  const resultado = await database.runAsync(
    `
      INSERT INTO usuarios (
        nombres,
        apellidos,
        nombreUsuario,
        passwordHash,
        passwordSalt,
        fechaRegistro
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      nombres,
      apellidos,
      nombreUsuario,
      passwordHash,
      passwordSalt,
      fechaRegistro,
    ]
  );

  return {
    id: Number(resultado.lastInsertRowId),
    nombres,
    apellidos,
    nombreUsuario,
    passwordHash,
    passwordSalt,
    fechaRegistro,
  };
}

export async function buscarUsuarioPorNombre(
  database: SQLiteDatabase,
  nombreUsuario: string
): Promise<Usuario | null> {
  const nombreUsuarioLimpio = nombreUsuario
    .trim()
    .toLowerCase();

  const usuario =
    await database.getFirstAsync<Usuario>(
      `
        SELECT
          id,
          nombres,
          apellidos,
          nombreUsuario,
          passwordHash,
          passwordSalt,
          fechaRegistro
        FROM usuarios
        WHERE nombreUsuario = ? COLLATE NOCASE
      `,
      [nombreUsuarioLimpio]
    );

  return usuario ?? null;
}

export async function autenticarUsuario(
  database: SQLiteDatabase,
  nombreUsuario: string,
  password: string
): Promise<Usuario> {
  const usuario = await buscarUsuarioPorNombre(
    database,
    nombreUsuario
  );

  if (!usuario) {
    throw new Error(
      "El nombre de usuario no está registrado"
    );
  }

  const passwordCorrecto = await comprobarPassword(
    password,
    usuario.passwordSalt,
    usuario.passwordHash
  );

  if (!passwordCorrecto) {
    throw new Error("La contraseña es incorrecta");
  }

  return usuario;
}