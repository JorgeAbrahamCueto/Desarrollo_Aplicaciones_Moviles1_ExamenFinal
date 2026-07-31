import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  AppState,
  type AppStateStatus,
} from "react-native";

import NetInfo from
  "@react-native-community/netinfo";

import {
  useSQLiteContext,
} from "expo-sqlite";

import {
  sincronizarPedidos,
} from "../../infrastructure/sync/PedidoSyncService";

import {
  useAuth,
} from "./AuthContext";

export default function SyncManager() {
  const database =
    useSQLiteContext();

  const {
    usuario,
    cargandoSesion,
  } = useAuth();

  const aplicacionActiva =
    useRef(true);

  const ejecutarSincronizacion =
    useCallback(async () => {
      if (
        cargandoSesion ||
        !usuario
      ) {
        return;
      }

      try {
        const resultado =
          await sincronizarPedidos(
            database,
            usuario.uid
          );

        if (!aplicacionActiva.current) {
          return;
        }

        if (!resultado.conectado) {
          console.log(
            "Sin conexión: sincronización pendiente"
          );

          return;
        }

        if (
          resultado.pedidosSincronizados > 0 ||
          resultado.pedidosEliminados > 0 ||
          resultado.errores > 0
        ) {
          console.log(
            "Resultado de sincronización:",
            {
              enviados:
                resultado
                  .pedidosSincronizados,

              eliminados:
                resultado
                  .pedidosEliminados,

              errores:
                resultado.errores,
            }
          );
        }
      } catch (error) {
        console.error(
          "Error general de sincronización:",
          error
        );
      }
    }, [
      database,
      usuario,
      cargandoSesion,
    ]);

  /*
   * Sincroniza cuando Firebase termina de
   * recuperar una sesión válida.
   */
  useEffect(() => {
    aplicacionActiva.current = true;

    if (
      !cargandoSesion &&
      usuario
    ) {
      void ejecutarSincronizacion();
    }

    return () => {
      aplicacionActiva.current = false;
    };
  }, [
    usuario,
    cargandoSesion,
    ejecutarSincronizacion,
  ]);

  /*
   * Escucha cambios de conectividad.
   * Cuando Internet regresa, intenta enviar
   * todos los cambios pendientes.
   */
  useEffect(() => {
    const cancelarEscucha =
      NetInfo.addEventListener(
        (estado) => {
          const tieneConexion =
            estado.isConnected === true &&
            estado.isInternetReachable
              !== false;

          if (
            tieneConexion &&
            usuario &&
            !cargandoSesion
          ) {
            void ejecutarSincronizacion();
          }
        }
      );

    return cancelarEscucha;
  }, [
    usuario,
    cargandoSesion,
    ejecutarSincronizacion,
  ]);

  /*
   * También sincroniza cuando el usuario
   * vuelve a abrir la aplicación desde
   * segundo plano.
   */
  useEffect(() => {
    function manejarCambioEstado(
      estado: AppStateStatus
    ) {
      if (
        estado === "active" &&
        usuario &&
        !cargandoSesion
      ) {
        void ejecutarSincronizacion();
      }
    }

    const suscripcion =
      AppState.addEventListener(
        "change",
        manejarCambioEstado
      );

    return () => {
      suscripcion.remove();
    };
  }, [
    usuario,
    cargandoSesion,
    ejecutarSincronizacion,
  ]);

  /*
   * Este componente no muestra interfaz.
   * Solamente administra la sincronización.
   */
  return null;
}