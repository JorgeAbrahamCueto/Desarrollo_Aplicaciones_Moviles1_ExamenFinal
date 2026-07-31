import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import {
  db,
} from "./firebaseConfig";

export async function guardarPedidoFirestore(
  pedido: Pedido,
  firebaseId: string
): Promise<void> {
  const referencia = doc(
    db,
    "pedidos",
    firebaseId
  );

  await setDoc(
    referencia,
    {
      firebaseId,

      localId:
        pedido.id,

      productoId:
        pedido.productoId,

      usuarioUid:
        pedido.usuarioUid,

      clienteNombre:
        pedido.clienteNombre,

      producto:
        pedido.producto,

      cantidad:
        pedido.cantidad,

      precio:
        pedido.precio,

      total:
        pedido.cantidad *
        pedido.precio,

      estado:
        pedido.estado,

      fechaRegistro:
        pedido.fechaRegistro,

      fechaActualizacion:
        pedido.fechaActualizacion,

      fechaSincronizacion:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export async function eliminarPedidoFirestore(
  firebaseId: string
): Promise<void> {
  const referencia = doc(
    db,
    "pedidos",
    firebaseId
  );

  await deleteDoc(referencia);
}