import NetInfo from
  "@react-native-community/netinfo";

import type {
  SQLiteDatabase,
} from "expo-sqlite";

import {
  asegurarFirebaseId,
  completarEliminacionPendiente,
  listarEliminacionesPendientes,
  listarPedidosPendientes,
  marcarPedidoSincronizado,
} from "../database/PedidoSyncRepository";

import {
  eliminarPedidoFirestore,
  guardarPedidoFirestore,
} from "../firebase/PedidoFirebaseService";

export interface ResultadoSincronizacion {
  conectado: boolean;
  pedidosSincronizados: number;
  pedidosEliminados: number;
  errores: number;
}

/*
 * Evita que el mismo usuario ejecute varias
 * sincronizaciones simultáneamente.
 */
const sincronizacionesActivas =
  new Map<
    string,
    Promise<ResultadoSincronizacion>
  >();

async function comprobarConexion():
Promise<boolean> {
  const estado = await NetInfo.fetch();

  if (!estado.isConnected) {
    return false;
  }

  /*
   * isInternetReachable puede ser null mientras
   * NetInfo termina de comprobar la conexión.
   * Solo consideramos desconectado el valor false.
   */
  return estado.isInternetReachable !== false;
}

async function ejecutarSincronizacion(
  database: SQLiteDatabase,
  usuarioUid: string
): Promise<ResultadoSincronizacion> {
  const resultado: ResultadoSincronizacion = {
    conectado: false,
    pedidosSincronizados: 0,
    pedidosEliminados: 0,
    errores: 0,
  };

  const conectado =
    await comprobarConexion();

  if (!conectado) {
    console.log(
      "Sin conexión: los pedidos permanecen guardados localmente"
    );

    return resultado;
  }

  resultado.conectado = true;

  /*
   * Primero procesamos las eliminaciones.
   * Esto evita volver a subir un pedido que el
   * usuario ya eliminó localmente.
   */
  const eliminaciones =
    await listarEliminacionesPendientes(
      database,
      usuarioUid
    );

  for (const eliminacion of eliminaciones) {
    try {
      await eliminarPedidoFirestore(
        eliminacion.firebaseId
      );

      await completarEliminacionPendiente(
        database,
        eliminacion.id,
        usuarioUid
      );

      resultado.pedidosEliminados += 1;
    } catch (error) {
      resultado.errores += 1;

      console.error(
        `No se pudo sincronizar la eliminación ${eliminacion.firebaseId}:`,
        error
      );
    }
  }

  /*
   * Después enviamos los pedidos creados o
   * modificados que tengan sincronizado = 0.
   */
  const pedidosPendientes =
    await listarPedidosPendientes(
      database,
      usuarioUid
    );

  for (const pedido of pedidosPendientes) {
    try {
      /*
       * El identificador se guarda primero en
       * SQLite y siempre será el mismo durante
       * los reintentos.
       */
      const firebaseId =
        await asegurarFirebaseId(
          database,
          pedido
        );

      await guardarPedidoFirestore(
        {
          ...pedido,
          firebaseId,
        },
        firebaseId
      );

      await marcarPedidoSincronizado(
        database,
        pedido.id,
        usuarioUid
      );

      resultado.pedidosSincronizados += 1;
    } catch (error) {
      resultado.errores += 1;

      console.error(
        `No se pudo sincronizar el pedido local #${pedido.id}:`,
        error
      );
    }
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