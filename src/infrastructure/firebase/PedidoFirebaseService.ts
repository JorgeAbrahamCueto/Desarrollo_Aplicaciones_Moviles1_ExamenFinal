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

import { db } from "./firebaseConfig";

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

function convertirFecha(
  valor: unknown
): string | null {
  if (
    typeof valor === "string" &&
    valor.trim()
  ) {
    return valor;
  }

  if (
    valor &&
    typeof valor === "object" &&
    "toDate" in valor &&
    typeof (
      valor as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    const fecha = (
      valor as {
        toDate: () => Date;
      }
    ).toDate();

    return fecha.toISOString();
  }

  return null;
}

function convertirDocumento(
  documento:
    QueryDocumentSnapshot<DocumentData>
): PedidoRemoto | null {
  const datos = documento.data();

  const cantidad = Number(datos.cantidad);
  const precio = Number(datos.precio);

  const fechaRegistro =
    convertirFecha(datos.fechaRegistro);

  const fechaActualizacion =
    convertirFecha(
      datos.fechaActualizacion
    ) ?? fechaRegistro;

  if (
    typeof datos.usuarioUid !== "string" ||
    typeof datos.clienteNombre !== "string" ||
    typeof datos.producto !== "string" ||
    !fechaRegistro ||
    !fechaActualizacion ||
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

  const productoIdNumerico =
    Number(datos.productoId);

  const productoId =
    Number.isInteger(productoIdNumerico) &&
    productoIdNumerico > 0
      ? productoIdNumerico
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
    fechaRegistro,
    fechaActualizacion,
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
  const usuarioNormalizado =
    usuarioUid.trim();

  if (!usuarioNormalizado) {
    return [];
  }

  const consulta = query(
    collection(db, "pedidos"),
    where(
      "usuarioUid",
      "==",
      usuarioNormalizado
    )
  );

  const resultado =
    await getDocs(consulta);

  const pedidos = resultado.docs
    .map(convertirDocumento)
    .filter(
      (
        pedido
      ): pedido is PedidoRemoto =>
        pedido !== null
    );

  console.log(
    `${pedidos.length} pedidos descargados desde Firestore`
  );

  return pedidos;
}

export async function eliminarPedidoFirestore(
  firebaseId: string
): Promise<void> {
  if (!firebaseId.trim()) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      "pedidos",
      firebaseId
    )
  );
}