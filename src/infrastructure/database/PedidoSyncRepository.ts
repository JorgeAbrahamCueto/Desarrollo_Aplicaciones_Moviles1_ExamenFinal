import type {
  SQLiteDatabase,
} from "expo-sqlite";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import type {
  PedidoRemoto,
} from "../firebase/PedidoFirebaseService";

interface PedidoRow {
  id: number;
  productoId: number | null;
  firebaseId: string | null;
  usuarioUid: string;
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: Pedido["estado"];
  fechaRegistro: string;
  fechaActualizacion: string;
  sincronizado: number;
}

export interface EliminacionPendiente {
  id: number;
  firebaseId: string;
  usuarioUid: string;
  fechaRegistro: string;
}

function convertirPedido(
  fila: PedidoRow
): Pedido {
  return {
    id: fila.id,
    productoId: fila.productoId,
    firebaseId: fila.firebaseId,
    usuarioUid: fila.usuarioUid,
    clienteNombre: fila.clienteNombre,
    producto: fila.producto,
    cantidad: fila.cantidad,
    precio: fila.precio,
    estado: fila.estado,
    fechaRegistro: fila.fechaRegistro,
    fechaActualizacion:
      fila.fechaActualizacion,
    sincronizado:
      fila.sincronizado === 1,
  };
}

/*
 * Genera un ID estable para Firestore.
 * El mismo pedido siempre producirá el mismo ID,
 * evitando duplicados durante los reintentos.
 */
export function crearFirebaseIdPedido(
  pedido: Pick<
    Pedido,
    | "id"
    | "usuarioUid"
    | "fechaRegistro"
  >
): string {
  const fechaLimpia =
    pedido.fechaRegistro.replace(
      /[^a-zA-Z0-9]/g,
      ""
    );

  return [
    "pedido",
    pedido.usuarioUid,
    pedido.id,
    fechaLimpia,
  ].join("_");
}

export async function listarPedidosPendientes(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<Pedido[]> {
  const filas =
    await database.getAllAsync<PedidoRow>(
      `
        SELECT
          id,
          productoId,
          firebaseId,
          usuarioUid,
          clienteNombre,
          producto,
          cantidad,
          precio,
          estado,
          fechaRegistro,
          fechaActualizacion,
          sincronizado
        FROM pedidos
        WHERE usuarioUid = ?
          AND sincronizado = 0
        ORDER BY fechaActualizacion ASC
      `,
      [usuarioUid]
    );

  return filas.map(convertirPedido);
}

export async function asignarFirebaseId(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string,
  firebaseId: string
): Promise<void> {
  const resultado =
    await database.runAsync(
      `
        UPDATE pedidos
        SET firebaseId = ?
        WHERE id = ?
          AND usuarioUid = ?
      `,
      [
        firebaseId,
        pedidoId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "No se pudo asignar el identificador de sincronización"
    );
  }
}

export async function asegurarFirebaseId(
  database: SQLiteDatabase,
  pedido: Pedido
): Promise<string> {
  if (pedido.firebaseId) {
    return pedido.firebaseId;
  }

  const firebaseId =
    crearFirebaseIdPedido(pedido);

  await asignarFirebaseId(
    database,
    pedido.id,
    pedido.usuarioUid,
    firebaseId
  );

  return firebaseId;
}

export async function marcarPedidoSincronizado(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<void> {
  const resultado =
    await database.runAsync(
      `
        UPDATE pedidos
        SET sincronizado = 1
        WHERE id = ?
          AND usuarioUid = ?
      `,
      [
        pedidoId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "No se pudo confirmar la sincronización local"
    );
  }
}

export async function marcarPedidoPendiente(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<void> {
  const resultado =
    await database.runAsync(
      `
        UPDATE pedidos
        SET sincronizado = 0
        WHERE id = ?
          AND usuarioUid = ?
      `,
      [
        pedidoId,
        usuarioUid,
      ]
    );

  if (resultado.changes === 0) {
    throw new Error(
      "No se pudo marcar el pedido como pendiente"
    );
  }
}

export async function registrarEliminacionPendiente(
  database: SQLiteDatabase,
  firebaseId: string,
  usuarioUid: string
): Promise<void> {
  await database.runAsync(
    `
      INSERT OR IGNORE INTO
        eliminaciones_pendientes (
          firebaseId,
          usuarioUid,
          fechaRegistro
        )
      VALUES (?, ?, ?)
    `,
    [
      firebaseId,
      usuarioUid,
      new Date().toISOString(),
    ]
  );
}

export async function listarEliminacionesPendientes(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<EliminacionPendiente[]> {
  return database.getAllAsync<EliminacionPendiente>(
    `
      SELECT
        id,
        firebaseId,
        usuarioUid,
        fechaRegistro
      FROM eliminaciones_pendientes
      WHERE usuarioUid = ?
      ORDER BY fechaRegistro ASC
    `,
    [usuarioUid]
  );
}

export type ResultadoPedidoRemoto =
  | "insertado"
  | "actualizado"
  | "sinCambios"
  | "omitido";

async function resolverProductoId(
  database: SQLiteDatabase,
  productoId: number | null
): Promise<number | null> {
  if (productoId === null) {
    return null;
  }

  const producto =
    await database.getFirstAsync<{
      id: number;
    }>(
      `
        SELECT id
        FROM productos
        WHERE id = ?
      `,
      [productoId]
    );

  /*
   * Evita errores de clave foránea si el producto
   * remoto no existe en el catálogo local.
   */
  return producto?.id ?? null;
}

export async function guardarPedidoRemotoEnSQLite(
  database: SQLiteDatabase,
  pedido: PedidoRemoto
): Promise<ResultadoPedidoRemoto> {
  const existente =
    await database.getFirstAsync<PedidoRow>(
      `
        SELECT
          id,
          productoId,
          firebaseId,
          usuarioUid,
          clienteNombre,
          producto,
          cantidad,
          precio,
          estado,
          fechaRegistro,
          fechaActualizacion,
          sincronizado
        FROM pedidos
        WHERE firebaseId = ?
          AND usuarioUid = ?
        LIMIT 1
      `,
      [
        pedido.firebaseId,
        pedido.usuarioUid,
      ]
    );

  /*
   * Si existe una modificación local pendiente,
   * no la reemplazamos con la versión remota.
   */
  if (
    existente &&
    existente.sincronizado === 0
  ) {
    return "omitido";
  }

  const productoId =
    await resolverProductoId(
      database,
      pedido.productoId
    );

  if (!existente) {
    await database.runAsync(
      `
        INSERT INTO pedidos (
          productoId,
          firebaseId,
          usuarioUid,
          clienteNombre,
          producto,
          cantidad,
          precio,
          estado,
          fechaRegistro,
          fechaActualizacion,
          sincronizado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        productoId,
        pedido.firebaseId,
        pedido.usuarioUid,
        pedido.clienteNombre,
        pedido.producto,
        pedido.cantidad,
        pedido.precio,
        pedido.estado,
        pedido.fechaRegistro,
        pedido.fechaActualizacion,
      ]
    );

    return "insertado";
  }

  const sinCambios =
    existente.productoId === productoId &&
    existente.clienteNombre ===
      pedido.clienteNombre &&
    existente.producto === pedido.producto &&
    existente.cantidad === pedido.cantidad &&
    existente.precio === pedido.precio &&
    existente.estado === pedido.estado &&
    existente.fechaRegistro ===
      pedido.fechaRegistro &&
    existente.fechaActualizacion ===
      pedido.fechaActualizacion;

  if (sinCambios) {
    return "sinCambios";
  }

  await database.runAsync(
    `
      UPDATE pedidos
      SET
        productoId = ?,
        clienteNombre = ?,
        producto = ?,
        cantidad = ?,
        precio = ?,
        estado = ?,
        fechaRegistro = ?,
        fechaActualizacion = ?,
        sincronizado = 1
      WHERE id = ?
        AND usuarioUid = ?
    `,
    [
      productoId,
      pedido.clienteNombre,
      pedido.producto,
      pedido.cantidad,
      pedido.precio,
      pedido.estado,
      pedido.fechaRegistro,
      pedido.fechaActualizacion,
      existente.id,
      pedido.usuarioUid,
    ]
  );

  return "actualizado";
}

export async function completarEliminacionPendiente(
  database: SQLiteDatabase,
  eliminacionId: number,
  usuarioUid: string
): Promise<void> {
  await database.runAsync(
    `
      DELETE FROM eliminaciones_pendientes
      WHERE id = ?
        AND usuarioUid = ?
    `,
    [
      eliminacionId,
      usuarioUid,
    ]
  );
}