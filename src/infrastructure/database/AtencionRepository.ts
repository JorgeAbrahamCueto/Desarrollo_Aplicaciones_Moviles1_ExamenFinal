import type {
  SQLiteDatabase,
} from "expo-sqlite";

import type {
  ActualizarAtencionData,
  Atencion,
  CrearAtencionData,
  EspecieMascota,
  EstadoAtencion,
  TipoAtencion,
} from "../../domain/models/Atencion";

interface AtencionRow {
  id: number;
  usuarioUid: string;
  propietarioNombre: string;
  mascotaNombre: string;
  especie: string;
  tipoAtencion: string;
  fechaAtencion: string;
  horaAtencion: string;
  motivo: string;
  estado: string;
  fechaRegistro: string;
  fechaActualizacion: string;
}

function convertirAtencion(
  row: AtencionRow
): Atencion {
  return {
    id: row.id,
    usuarioUid: row.usuarioUid,
    propietarioNombre:
      row.propietarioNombre,
    mascotaNombre: row.mascotaNombre,
    especie:
      row.especie as EspecieMascota,
    tipoAtencion:
      row.tipoAtencion as TipoAtencion,
    fechaAtencion: row.fechaAtencion,
    horaAtencion: row.horaAtencion,
    motivo: row.motivo,
    estado:
      row.estado as EstadoAtencion,
    fechaRegistro: row.fechaRegistro,
    fechaActualizacion:
      row.fechaActualizacion,
  };
}

export async function crearAtencion(
  database: SQLiteDatabase,
  data: CrearAtencionData
): Promise<Atencion> {
  const fechaActual =
    new Date().toISOString();

  const resultado =
    await database.runAsync(
      `
        INSERT INTO atenciones (
          usuarioUid,
          propietarioNombre,
          mascotaNombre,
          especie,
          tipoAtencion,
          fechaAtencion,
          horaAtencion,
          motivo,
          estado,
          fechaRegistro,
          fechaActualizacion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.usuarioUid,
        data.propietarioNombre.trim(),
        data.mascotaNombre.trim(),
        data.especie,
        data.tipoAtencion,
        data.fechaAtencion,
        data.horaAtencion,
        data.motivo.trim(),
        "SOLICITADA",
        fechaActual,
        fechaActual,
      ]
    );

  const atencionCreada =
    await obtenerAtencionPorId(
      database,
      Number(resultado.lastInsertRowId),
      data.usuarioUid
    );

  if (!atencionCreada) {
    throw new Error(
      "La atención se registró, pero no pudo recuperarse"
    );
  }

  return atencionCreada;
}

export async function listarAtenciones(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<Atencion[]> {
  const filas =
    await database.getAllAsync<AtencionRow>(
      `
        SELECT
          id,
          usuarioUid,
          propietarioNombre,
          mascotaNombre,
          especie,
          tipoAtencion,
          fechaAtencion,
          horaAtencion,
          motivo,
          estado,
          fechaRegistro,
          fechaActualizacion
        FROM atenciones
        WHERE usuarioUid = ?
        ORDER BY
          fechaAtencion ASC,
          horaAtencion ASC,
          id DESC
      `,
      [usuarioUid]
    );

  return filas.map(convertirAtencion);
}

export async function obtenerAtencionPorId(
  database: SQLiteDatabase,
  atencionId: number,
  usuarioUid: string
): Promise<Atencion | null> {
  const fila =
    await database.getFirstAsync<AtencionRow>(
      `
        SELECT
          id,
          usuarioUid,
          propietarioNombre,
          mascotaNombre,
          especie,
          tipoAtencion,
          fechaAtencion,
          horaAtencion,
          motivo,
          estado,
          fechaRegistro,
          fechaActualizacion
        FROM atenciones
        WHERE id = ?
          AND usuarioUid = ?
      `,
      [
        atencionId,
        usuarioUid,
      ]
    );

  return fila
    ? convertirAtencion(fila)
    : null;
}

export async function actualizarAtencion(
  database: SQLiteDatabase,
  atencionId: number,
  usuarioUid: string,
  data: ActualizarAtencionData
): Promise<Atencion> {
  const fechaActualizacion =
    new Date().toISOString();

  const resultado =
    await database.runAsync(
      `
        UPDATE atenciones
        SET
          mascotaNombre = ?,
          especie = ?,
          tipoAtencion = ?,
          fechaAtencion = ?,
          horaAtencion = ?,
          motivo = ?,
          fechaActualizacion = ?
        WHERE id = ?
          AND usuarioUid = ?
          AND estado = 'SOLICITADA'
      `,
      [
        data.mascotaNombre.trim(),
        data.especie,
        data.tipoAtencion,
        data.fechaAtencion,
        data.horaAtencion,
        data.motivo.trim(),
        fechaActualizacion,
        atencionId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "Solo puedes editar una atención que todavía esté solicitada"
    );
  }

  const atencionActualizada =
    await obtenerAtencionPorId(
      database,
      atencionId,
      usuarioUid
    );

  if (!atencionActualizada) {
    throw new Error(
      "La atención se actualizó, pero no pudo recuperarse"
    );
  }

  return atencionActualizada;
}

export async function cancelarAtencion(
  database: SQLiteDatabase,
  atencionId: number,
  usuarioUid: string
): Promise<Atencion> {
  const fechaActualizacion =
    new Date().toISOString();

  const resultado =
    await database.runAsync(
      `
        UPDATE atenciones
        SET
          estado = 'CANCELADA',
          fechaActualizacion = ?
        WHERE id = ?
          AND usuarioUid = ?
          AND estado IN (
            'SOLICITADA',
            'CONFIRMADA'
          )
      `,
      [
        fechaActualizacion,
        atencionId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "Esta atención ya no puede cancelarse"
    );
  }

  const atencionCancelada =
    await obtenerAtencionPorId(
      database,
      atencionId,
      usuarioUid
    );

  if (!atencionCancelada) {
    throw new Error(
      "La atención se canceló, pero no pudo recuperarse"
    );
  }

  return atencionCancelada;
}

export async function eliminarAtencion(
  database: SQLiteDatabase,
  atencionId: number,
  usuarioUid: string
): Promise<void> {
  const resultado =
    await database.runAsync(
      `
        DELETE FROM atenciones
        WHERE id = ?
          AND usuarioUid = ?
          AND estado = 'CANCELADA'
      `,
      [
        atencionId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "Primero debes cancelar la atención antes de eliminarla"
    );
  }
}