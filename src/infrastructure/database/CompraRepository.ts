import type {
  SQLiteDatabase,
} from "expo-sqlite";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import {
  actualizarPedido,
  crearPedido,
  eliminarPedido,
  obtenerPedidoPorId,
} from "./PedidoRepository";

import {
  obtenerProductoPorId,
} from "./ProductoRepository";

import {
  crearFirebaseIdPedido,
} from "./PedidoSyncRepository";

interface ResultadoPedido {
  value: Pedido | null;
}

export async function crearPedidoDesdeProducto(
  database: SQLiteDatabase,
  usuarioUid: string,
  clienteNombre: string,
  productoId: number,
  cantidad: number
): Promise<Pedido> {
  if (
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    throw new Error(
      "La cantidad debe ser mayor que cero"
    );
  }

  const resultado: ResultadoPedido = {
    value: null,
  };

  await database.withTransactionAsync(
    async () => {
      const producto =
        await obtenerProductoPorId(
          database,
          productoId
        );

      if (!producto) {
        throw new Error(
          "El producto ya no está disponible"
        );
      }

      if (producto.stock < cantidad) {
        throw new Error(
          `Solo quedan ${producto.stock} unidades disponibles`
        );
      }

      const actualizacionStock =
        await database.runAsync(
          `
            UPDATE productos
            SET stock = stock - ?
            WHERE id = ?
              AND activo = 1
              AND stock >= ?
          `,
          [
            cantidad,
            producto.id,
            cantidad,
          ]
        );

      if (
        actualizacionStock.changes === 0
      ) {
        throw new Error(
          "No existe stock suficiente"
        );
      }

      resultado.value =
        await crearPedido(
          database,
          {
            productoId: producto.id,
            usuarioUid,
            clienteNombre,
            producto: producto.nombre,
            cantidad,
            precio: producto.precio,
            estado: "PENDIENTE",
          }
        );
    }
  );

  if (!resultado.value) {
    throw new Error(
      "No se pudo registrar el pedido"
    );
  }

  return resultado.value;
}

export async function actualizarCantidadPedido(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string,
  nuevaCantidad: number
): Promise<Pedido> {
  if (
    !Number.isInteger(nuevaCantidad) ||
    nuevaCantidad <= 0
  ) {
    throw new Error(
      "La cantidad debe ser mayor que cero"
    );
  }

  const resultado: ResultadoPedido = {
    value: null,
  };

  await database.withTransactionAsync(
    async () => {
      const pedido =
        await obtenerPedidoPorId(
          database,
          pedidoId,
          usuarioUid
        );

      if (!pedido) {
        throw new Error(
          "No se encontró el pedido"
        );
      }

      if (
        pedido.estado !== "PENDIENTE"
      ) {
        throw new Error(
          "Solo puedes modificar pedidos pendientes"
        );
      }

      if (!pedido.productoId) {
        throw new Error(
          "Este pedido antiguo no está relacionado con el catálogo"
        );
      }

      const diferencia =
        nuevaCantidad -
        pedido.cantidad;

      if (diferencia > 0) {
        const descuento =
          await database.runAsync(
            `
              UPDATE productos
              SET stock = stock - ?
              WHERE id = ?
                AND activo = 1
                AND stock >= ?
            `,
            [
              diferencia,
              pedido.productoId,
              diferencia,
            ]
          );

        if (descuento.changes === 0) {
          throw new Error(
            "No existe stock suficiente para aumentar la cantidad"
          );
        }
      }

      if (diferencia < 0) {
        await database.runAsync(
          `
            UPDATE productos
            SET stock = stock + ?
            WHERE id = ?
          `,
          [
            Math.abs(diferencia),
            pedido.productoId,
          ]
        );
      }

      resultado.value =
        await actualizarPedido(
          database,
          pedido.id,
          usuarioUid,
          {
            clienteNombre:
              pedido.clienteNombre,

            producto:
              pedido.producto,

            cantidad:
              nuevaCantidad,

            precio:
              pedido.precio,

            estado:
              pedido.estado,
          }
        );
    }
  );

  if (!resultado.value) {
    throw new Error(
      "No se pudo actualizar el pedido"
    );
  }

  return resultado.value;
}

export async function cancelarPedidoConStock(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<Pedido> {
  const resultado: ResultadoPedido = {
    value: null,
  };

  await database.withTransactionAsync(
    async () => {
      const pedido =
        await obtenerPedidoPorId(
          database,
          pedidoId,
          usuarioUid
        );

      if (!pedido) {
        throw new Error(
          "No se encontró el pedido"
        );
      }

      if (
        pedido.estado !== "PENDIENTE"
      ) {
        throw new Error(
          "Solo puedes cancelar pedidos pendientes"
        );
      }

      if (pedido.productoId) {
        await database.runAsync(
          `
            UPDATE productos
            SET stock = stock + ?
            WHERE id = ?
          `,
          [
            pedido.cantidad,
            pedido.productoId,
          ]
        );
      }

      resultado.value =
        await actualizarPedido(
          database,
          pedido.id,
          usuarioUid,
          {
            clienteNombre:
              pedido.clienteNombre,

            producto:
              pedido.producto,

            cantidad:
              pedido.cantidad,

            precio:
              pedido.precio,

            estado:
              "CANCELADO",
          }
        );
    }
  );

  if (!resultado.value) {
    throw new Error(
      "No se pudo cancelar el pedido"
    );
  }

  return resultado.value;
}

export async function eliminarPedidoConStock(
  database: SQLiteDatabase,
  pedidoId: number,
  usuarioUid: string
): Promise<void> {
  await database.withTransactionAsync(
    async () => {
      const pedido =
        await obtenerPedidoPorId(
          database,
          pedidoId,
          usuarioUid
        );

      if (!pedido) {
        throw new Error(
          "No se encontró el pedido"
        );
      }

      if (
        pedido.estado === "EN_PROCESO" ||
        pedido.estado === "ENTREGADO"
      ) {
        throw new Error(
          "No puedes eliminar un pedido en proceso o entregado"
        );
      }

      /*
       * Si continúa pendiente, restauramos el stock.
       * Si ya estaba cancelado, el stock fue
       * restaurado durante la cancelación.
       */
      if (
        pedido.estado === "PENDIENTE" &&
        pedido.productoId
      ) {
        await database.runAsync(
          `
            UPDATE productos
            SET stock = stock + ?
            WHERE id = ?
          `,
          [
            pedido.cantidad,
            pedido.productoId,
          ]
        );
      }

      /*
       * El mismo identificador utilizado al subir
       * el pedido servirá para borrarlo de Firestore.
       */
      const firebaseId =
        pedido.firebaseId ??
        crearFirebaseIdPedido(pedido);

      /*
       * Registramos la eliminación antes de borrar
       * el pedido local. Al estar dentro de la misma
       * transacción, ambas operaciones se completan
       * juntas o se revierten juntas.
       */
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

      await eliminarPedido(
        database,
        pedido.id,
        usuarioUid
      );
    }
  );
}