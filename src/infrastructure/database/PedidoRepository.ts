import type { SQLiteDatabase } from "expo-sqlite";

import type {
  ActualizarPedidoData,
  CrearPedidoData,
  EstadoPedido,
  Pedido,
} from "../../domain/models/Pedido";

interface PedidoRow {
  id: number;
  firebaseId: string | null;
  usuarioUid: string;
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: EstadoPedido;
  fechaRegistro: string;
  fechaActualizacion: string;
  sincronizado: number;
}

function convertirRowAPedido(row: PedidoRow): Pedido {
  return {
    id: row.id,
    firebaseId: row.firebaseId,
    usuarioUid: row.usuarioUid,
    clienteNombre: row.clienteNombre,
    producto: row.producto,
    cantidad: row.cantidad,
    precio: row.precio,
    estado: row.estado,
    fechaRegistro: row.fechaRegistro,
    fechaActualizacion: row.fechaActualizacion,
    sincronizado: row.sincronizado === 1,
  };
}

/**
 * Registra un pedido localmente en SQLite.
 */
export async function crearPedido(
  database: SQLiteDatabase,
  data: CrearPedidoData
): Promise<Pedido> {
  const fechaActual = new Date().toISOString();

  const resultado = await database.runAsync(
    `
      INSERT INTO pedidos (
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
      VALUES (
        NULL,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        0
      )
    `,
    [
      data.usuarioUid,
      data.clienteNombre.trim(),
      data.producto.trim(),
      data.cantidad,
      data.precio,
      data.estado,
      fechaActual,
      fechaActual,
    ]
  );

  const pedidoCreado = await obtenerPedidoPorId(
    database,
    Number(resultado.lastInsertRowId),
    data.usuarioUid
  );

  if (!pedidoCreado) {
    throw new Error(
      "El pedido se guardó, pero no se pudo recuperar"
    );
  }

  return pedidoCreado;
}

/**
 * Lista únicamente los pedidos del usuario autenticado.
 * Los más recientes aparecen primero.
 */
export async function listarPedidos(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<Pedido[]> {
  const filas = await database.getAllAsync<PedidoRow>(
    `
      SELECT
        id,
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
      ORDER BY fechaRegistro DESC, id DESC
    `,
    [usuarioUid]
  );

  return filas.map(convertirRowAPedido);
}

/**
 * Obtiene un pedido por su ID local.
 * También verifica que pertenezca al usuario.
 */
export async function obtenerPedidoPorId(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<Pedido | null> {
  const fila = await database.getFirstAsync<PedidoRow>(
    `
      SELECT
        id,
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
      WHERE id = ?
        AND usuarioUid = ?
      LIMIT 1
    `,
    [pedidoId, usuarioUid]
  );

  return fila ? convertirRowAPedido(fila) : null;
}

/**
 * Actualiza un pedido local.
 * Al editarlo queda pendiente de sincronización.
 */
export async function actualizarPedido(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string,
  data: ActualizarPedidoData
): Promise<Pedido> {
  const fechaActualizacion = new Date().toISOString();

  const resultado = await database.runAsync(
    `
      UPDATE pedidos
      SET
        clienteNombre = ?,
        producto = ?,
        cantidad = ?,
        precio = ?,
        estado = ?,
        fechaActualizacion = ?,
        sincronizado = 0
      WHERE id = ?
        AND usuarioUid = ?
    `,
    [
      data.clienteNombre.trim(),
      data.producto.trim(),
      data.cantidad,
      data.precio,
      data.estado,
      fechaActualizacion,
      pedidoId,
      usuarioUid,
    ]
  );

  if (resultado.changes === 0) {
    throw new Error(
      "No se encontró el pedido que deseas actualizar"
    );
  }

  const pedidoActualizado = await obtenerPedidoPorId(
    database,
    pedidoId,
    usuarioUid
  );

  if (!pedidoActualizado) {
    throw new Error(
      "El pedido se actualizó, pero no se pudo recuperar"
    );
  }

  return pedidoActualizado;
}

/**
 * Elimina un pedido local.
 */
export async function eliminarPedido(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<void> {
  const resultado = await database.runAsync(
    `
      DELETE FROM pedidos
      WHERE id = ?
        AND usuarioUid = ?
    `,
    [pedidoId, usuarioUid]
  );

  if (resultado.changes === 0) {
    throw new Error(
      "No se encontró el pedido que deseas eliminar"
    );
  }
}