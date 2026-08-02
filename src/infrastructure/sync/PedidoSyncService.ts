import NetInfo from
  "@react-native-community/netinfo";

import type {
  SQLiteDatabase,
} from "expo-sqlite";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import {
  eliminarPedidoFirestore,
  guardarPedidoFirestore,
  obtenerPedidosFirestore,
  type PedidoRemoto,
} from "../firebase/PedidoFirebaseService";

interface PedidoRow {
  id: number;
  firebaseId: string | null;
  productoId: number | null;
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

interface EliminacionPendienteRow {
  id: number;
  firebaseId: string;
  usuarioUid: string;
}

export interface ResultadoSincronizacion {
  conectado: boolean;
  pedidosSincronizados: number;
  pedidosDescargados: number;
  pedidosEliminados: number;
  errores: number;
}

const sincronizacionesActivas =
  new Map<
    string,
    Promise<ResultadoSincronizacion>
  >();

function convertirPedidoRow(
  row: PedidoRow
): Pedido {
  return {
    id: row.id,
    firebaseId: row.firebaseId,
    productoId: row.productoId,
    usuarioUid: row.usuarioUid,
    clienteNombre: row.clienteNombre,
    producto: row.producto,
    cantidad: row.cantidad,
    precio: row.precio,
    estado: row.estado,
    fechaRegistro: row.fechaRegistro,
    fechaActualizacion:
      row.fechaActualizacion,
    sincronizado:
      row.sincronizado === 1,
  };
}

function generarFirebaseId(
  pedido: Pedido
): string {
  if (pedido.firebaseId) {
    return pedido.firebaseId;
  }

  const fecha = pedido.fechaRegistro
    .replace(/[^0-9]/g, "");

  return [
    "pedido",
    pedido.usuarioUid,
    pedido.id,
    fecha,
  ].join("_");
}

async function obtenerPedidosLocalesPendientes(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<Pedido[]> {
  const filas =
    await database.getAllAsync<PedidoRow>(
      `
        SELECT
          id,
          firebaseId,
          productoId,
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
        ORDER BY fechaRegistro ASC
      `,
      [usuarioUid]
    );

  return filas.map(convertirPedidoRow);
}

async function marcarPedidoSincronizado(
  database: SQLiteDatabase,
  pedidoId: number,
  firebaseId: string
): Promise<void> {
  await database.runAsync(
    `
      UPDATE pedidos
      SET
        firebaseId = ?,
        sincronizado = 1
      WHERE id = ?
    `,
    [firebaseId, pedidoId]
  );
}

async function productoExiste(
  database: SQLiteDatabase,
  productoId: number | null
): Promise<boolean> {
  if (productoId === null) {
    return false;
  }

  const resultado =
    await database.getFirstAsync<{
      cantidad: number;
    }>(
      `
        SELECT COUNT(*) AS cantidad
        FROM productos
        WHERE id = ?
      `,
      [productoId]
    );

  return (resultado?.cantidad ?? 0) > 0;
}

async function guardarPedidoRemotoLocal(
  database: SQLiteDatabase,
  pedido: PedidoRemoto
): Promise<"creado" | "actualizado" | "omitido"> {
  const existente =
    await database.getFirstAsync<{
      id: number;
      sincronizado: number;
      fechaActualizacion: string;
    }>(
      `
        SELECT
          id,
          sincronizado,
          fechaActualizacion
        FROM pedidos
        WHERE firebaseId = ?
        LIMIT 1
      `,
      [pedido.firebaseId]
    );

  const productoIdValido =
    (await productoExiste(
      database,
      pedido.productoId
    ))
      ? pedido.productoId
      : null;

  if (existente) {
    const fechaLocal = Date.parse(
      existente.fechaActualizacion
    );

    const fechaRemota = Date.parse(
      pedido.fechaActualizacion
    );

    const cambioLocalPendiente =
      existente.sincronizado === 0 &&
      Number.isFinite(fechaLocal) &&
      Number.isFinite(fechaRemota) &&
      fechaLocal > fechaRemota;

    if (cambioLocalPendiente) {
      return "omitido";
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
      `,
      [
        productoIdValido,
        pedido.clienteNombre,
        pedido.producto,
        pedido.cantidad,
        pedido.precio,
        pedido.estado,
        pedido.fechaRegistro,
        pedido.fechaActualizacion,
        existente.id,
      ]
    );

    return "actualizado";
  }

  await database.runAsync(
    `
      INSERT INTO pedidos (
        firebaseId,
        productoId,
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
      pedido.firebaseId,
      productoIdValido,
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

  return "creado";
}

async function tablaExiste(
  database: SQLiteDatabase,
  nombreTabla: string
): Promise<boolean> {
  const resultado =
    await database.getFirstAsync<{
      cantidad: number;
    }>(
      `
        SELECT COUNT(*) AS cantidad
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
      [nombreTabla]
    );

  return (resultado?.cantidad ?? 0) > 0;
}

async function obtenerEliminacionesPendientes(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<EliminacionPendienteRow[]> {
  const posiblesTablas = [
    "eliminaciones_pendientes",
    "pedidos_eliminaciones_pendientes",
  ];

  for (const tabla of posiblesTablas) {
    if (
      await tablaExiste(
        database,
        tabla
      )
    ) {
      return database.getAllAsync<
        EliminacionPendienteRow
      >(
        `
          SELECT
            id,
            firebaseId,
            usuarioUid
          FROM ${tabla}
          WHERE usuarioUid = ?
          ORDER BY id ASC
        `,
        [usuarioUid]
      );
    }
  }

  return [];
}

async function eliminarRegistroPendiente(
  database: SQLiteDatabase,
  id: number
): Promise<void> {
  const posiblesTablas = [
    "eliminaciones_pendientes",
    "pedidos_eliminaciones_pendientes",
  ];

  for (const tabla of posiblesTablas) {
    if (
      await tablaExiste(
        database,
        tabla
      )
    ) {
      await database.runAsync(
        `DELETE FROM ${tabla} WHERE id = ?`,
        [id]
      );

      return;
    }
  }
}

async function ejecutarSincronizacion(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<ResultadoSincronizacion> {
  const resultado:
    ResultadoSincronizacion = {
      conectado: true,
      pedidosSincronizados: 0,
      pedidosDescargados: 0,
      pedidosEliminados: 0,
      errores: 0,
    };

  const estadoRed = await NetInfo.fetch();

  const tieneConexion =
    estadoRed.isConnected === true &&
    estadoRed.isInternetReachable !== false;

  if (!tieneConexion) {
    return {
      ...resultado,
      conectado: false,
    };
  }

  /*
   * 1. Enviar pedidos locales pendientes.
   */
  const pedidosPendientes =
    await obtenerPedidosLocalesPendientes(
      database,
      usuarioUid
    );

  for (const pedido of pedidosPendientes) {
    try {
      const firebaseId =
        generarFirebaseId(pedido);

      await guardarPedidoFirestore(
        pedido,
        firebaseId
      );

      await marcarPedidoSincronizado(
        database,
        pedido.id,
        firebaseId
      );

      resultado.pedidosSincronizados += 1;
    } catch (error) {
      resultado.errores += 1;

      console.error(
        `No se pudo enviar el pedido ${pedido.id}:`,
        error
      );
    }
  }

  /*
   * 2. Procesar eliminaciones pendientes.
   */
  const eliminaciones =
    await obtenerEliminacionesPendientes(
      database,
      usuarioUid
    );

  for (const eliminacion of eliminaciones) {
    try {
      await eliminarPedidoFirestore(
        eliminacion.firebaseId
      );

      await eliminarRegistroPendiente(
        database,
        eliminacion.id
      );

      resultado.pedidosEliminados += 1;
    } catch (error) {
      resultado.errores += 1;

      console.error(
        "No se pudo sincronizar una eliminación:",
        error
      );
    }
  }

  /*
   * 3. Descargar pedidos existentes en Firestore.
   */
  try {
    const pedidosRemotos =
      await obtenerPedidosFirestore(
        usuarioUid
      );

    for (const pedidoRemoto of pedidosRemotos) {
      try {
        const accion =
          await guardarPedidoRemotoLocal(
            database,
            pedidoRemoto
          );

        if (
          accion === "creado" ||
          accion === "actualizado"
        ) {
          resultado.pedidosDescargados += 1;
        }
      } catch (error) {
        resultado.errores += 1;

        console.error(
          `No se pudo guardar localmente ${pedidoRemoto.firebaseId}:`,
          error
        );
      }
    }
  } catch (error) {
    resultado.errores += 1;

    console.error(
      "No se pudieron descargar los pedidos:",
      error
    );
  }

  console.log(
    "Sincronización terminada:",
    resultado
  );

  return resultado;
}

export function sincronizarPedidos(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<ResultadoSincronizacion> {
  const sincronizacionExistente =
    sincronizacionesActivas.get(
      usuarioUid
    );

  if (sincronizacionExistente) {
    return sincronizacionExistente;
  }

  const nuevaSincronizacion =
    ejecutarSincronizacion(
      database,
      usuarioUid
    ).finally(() => {
      sincronizacionesActivas.delete(
        usuarioUid
      );
    });

  sincronizacionesActivas.set(
    usuarioUid,
    nuevaSincronizacion
  );

  return nuevaSincronizacion;
}