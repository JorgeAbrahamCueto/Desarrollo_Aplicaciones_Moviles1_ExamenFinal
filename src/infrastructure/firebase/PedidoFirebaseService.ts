import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import {
  db,
} from "./firebaseConfig";

export interface PedidoRemoto {
  firebaseId: string;
  productoId: number | null;
  usuarioUid: string;
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: Pedido["estado"];
  fechaRegistro: string;
  fechaActualizacion: string;
}

const ESTADOS_PEDIDO: Pedido["estado"][] = [
  "PENDIENTE",
  "EN_PROCESO",
  "ENTREGADO",
  "CANCELADO",
];

function esEstadoPedido(
  valor: unknown
): valor is Pedido["estado"] {
  return (
    typeof valor === "string" &&
    ESTADOS_PEDIDO.includes(
      valor as Pedido["estado"]
    )
  );
}

function convertirDocumento(
  documento:
    QueryDocumentSnapshot<DocumentData>
): PedidoRemoto | null {
  const datos = documento.data();

  const cantidad = Number(datos.cantidad);
  const precio = Number(datos.precio);

  if (
    typeof datos.usuarioUid !== "string" ||
    typeof datos.clienteNombre !== "string" ||
    typeof datos.producto !== "string" ||
    typeof datos.fechaRegistro !== "string" ||
    typeof datos.fechaActualizacion !== "string" ||
    !esEstadoPedido(datos.estado) ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0 ||
    !Number.isFinite(precio) ||
    precio < 0
  ) {
    console.warn(
      `Pedido remoto inválido: ${documento.id}`
    );

    return null;
  }

  const productoId =
    typeof datos.productoId === "number" &&
    Number.isInteger(datos.productoId)
      ? datos.productoId
      : null;

  return {
    firebaseId: documento.id,
    productoId,
    usuarioUid: datos.usuarioUid,
    clienteNombre: datos.clienteNombre,
    producto: datos.producto,
    cantidad,
    precio,
    estado: datos.estado,
    fechaRegistro: datos.fechaRegistro,
    fechaActualizacion:
      datos.fechaActualizacion,
  };
}

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
      localId: pedido.id,
      productoId: pedido.productoId,
      usuarioUid: pedido.usuarioUid,
      clienteNombre: pedido.clienteNombre,
      producto: pedido.producto,
      cantidad: pedido.cantidad,
      precio: pedido.precio,
      total:
        pedido.cantidad * pedido.precio,
      estado: pedido.estado,
      fechaRegistro: pedido.fechaRegistro,
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

export async function obtenerPedidosFirestore(
  usuarioUid: string
): Promise<PedidoRemoto[]> {
  const consulta = query(
    collection(db, "pedidos"),
    where(
      "usuarioUid",
      "==",
      usuarioUid
    )
  );

  const resultado =
    await getDocs(consulta);

  return resultado.docs
    .map(convertirDocumento)
    .filter(
      (
        pedido
      ): pedido is PedidoRemoto =>
        pedido !== null
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