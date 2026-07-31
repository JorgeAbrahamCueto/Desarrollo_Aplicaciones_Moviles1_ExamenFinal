import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useSQLiteContext,
} from "expo-sqlite";

import type {
  Pedido,
} from "../../domain/models/Pedido";

import {
  obtenerPedidoPorId,
} from "../../infrastructure/database/PedidoRepository";

import {
  actualizarCantidadPedido,
  cancelarPedidoConStock,
  eliminarPedidoConStock,
} from "../../infrastructure/database/CompraRepository";

import {
  useAuth,
} from "../context/AuthContext";

const ESTADO_LABELS: Record<
  Pedido["estado"],
  string
> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function DetallePedidoScreen() {
  const database = useSQLiteContext();
  const { usuario } = useAuth();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [cantidad, setCantidad] =
    useState(1);

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [error, setError] =
    useState("");

  const cargarPedido = useCallback(
    async () => {
      const pedidoId = Number(id);

      if (
        !usuario ||
        !Number.isInteger(pedidoId) ||
        pedidoId <= 0
      ) {
        setError(
          "No se pudo identificar el pedido"
        );

        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const resultado =
          await obtenerPedidoPorId(
            database,
            pedidoId,
            usuario.uid
          );

        if (!resultado) {
          setError(
            "El pedido no existe o pertenece a otra cuenta"
          );

          return;
        }

        setPedido(resultado);
        setCantidad(resultado.cantidad);
      } catch (caughtError) {
        console.error(
          "Error al cargar pedido:",
          caughtError
        );

        setError(
          "No se pudo cargar el pedido"
        );
      } finally {
        setCargando(false);
      }
    },
    [
      database,
      id,
      usuario,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      cargarPedido();

      return undefined;
    }, [cargarPedido])
  );

  const puedeEditar =
    pedido?.estado === "PENDIENTE";

  const cantidadModificada =
    pedido !== null &&
    cantidad !== pedido.cantidad;

  function disminuirCantidad() {
    setCantidad((actual) =>
      Math.max(1, actual - 1)
    );
  }

  function aumentarCantidad() {
    setCantidad((actual) =>
      actual + 1
    );
  }

  async function guardarCantidad() {
    if (
      !pedido ||
      !usuario ||
      !puedeEditar
    ) {
      return;
    }

    try {
      setProcesando(true);

      const actualizado =
        await actualizarCantidadPedido(
          database,
          pedido.id,
          usuario.uid,
          cantidad
        );

      setPedido(actualizado);

      Alert.alert(
        "Pedido actualizado",
        "La cantidad se actualizó correctamente"
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el pedido";

      Alert.alert("Error", mensaje);
    } finally {
      setProcesando(false);
    }
  }

  function confirmarCancelacion() {
    if (
      !pedido ||
      !usuario ||
      pedido.estado !== "PENDIENTE"
    ) {
      return;
    }

    Alert.alert(
      "Cancelar pedido",
      "¿Seguro que deseas cancelar este pedido?",
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Cancelar pedido",
          style: "destructive",
          onPress: cancelarPedido,
        },
      ]
    );
  }

  async function cancelarPedido() {
    if (!pedido || !usuario) {
      return;
    }

    try {
      setProcesando(true);

      const actualizado =
        await cancelarPedidoConStock(
          database,
          pedido.id,
          usuario.uid
        );

      setPedido(actualizado);
      setCantidad(actualizado.cantidad);

      Alert.alert(
        "Pedido cancelado",
        "El pedido fue cancelado correctamente"
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cancelar el pedido";

      Alert.alert("Error", mensaje);
    } finally {
      setProcesando(false);
    }
  }

  function confirmarEliminacion() {
    if (!pedido || !usuario) {
      return;
    }

    Alert.alert(
      "Eliminar pedido",
      "Esta acción eliminará definitivamente el pedido del dispositivo.",
      [
        {
          text: "Conservar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: ejecutarEliminacion,
        },
      ]
    );
  }

  async function ejecutarEliminacion() {
    if (!pedido || !usuario) {
      return;
    }

    try {
      setProcesando(true);

      await eliminarPedidoConStock(
        database,
        pedido.id,
        usuario.uid
      );

      Alert.alert(
        "Pedido eliminado",
        "El pedido fue eliminado correctamente",
        [
          {
            text: "Volver a mis pedidos",
            onPress: () =>
              router.replace("/pedidos"),
          },
        ]
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el pedido";

      Alert.alert("Error", mensaje);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingText}>
            Cargando pedido...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pedido) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            Pedido no disponible
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace("/pedidos")
            }
          >
            <Text
              style={styles.primaryButtonText}
            >
              Volver a mis pedidos
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const total =
    cantidad * pedido.precio;

  const fecha = new Date(
    pedido.fechaRegistro
  ).toLocaleString("es-PE");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            disabled={procesando}
          >
            <Text style={styles.backText}>
              ‹ Mis pedidos
            </Text>
          </Pressable>

          <Text style={styles.headerIcon}>
            📦
          </Text>
        </View>

        <Text style={styles.title}>
          Pedido #{pedido.id}
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.productName}>
            {pedido.producto}
          </Text>

          <View
            style={[
              styles.statusBadge,
              pedido.estado ===
              "CANCELADO" &&
              styles.statusCancelled,
              pedido.estado ===
              "ENTREGADO" &&
              styles.statusDelivered,
            ]}
          >
            <Text style={styles.statusText}>
              {
                ESTADO_LABELS[
                pedido.estado
                ]
              }
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <DetailRow
            label="Cliente"
            value={pedido.clienteNombre}
          />

          <DetailRow
            label="Fecha"
            value={fecha}
          />

          <DetailRow
            label="Precio unitario"
            value={`S/ ${pedido.precio.toFixed(2)}`}
          />

          <DetailRow
            label="Almacenamiento"
            value={
              pedido.sincronizado
                ? "Sincronizado"
                : "Guardado localmente"
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Cantidad
          </Text>

          {puedeEditar ? (
            <>
              <Text style={styles.helpText}>
                Puedes modificar la cantidad mientras
                el pedido esté pendiente.
              </Text>

              <View
                style={styles.quantitySelector}
              >
                <Pressable
                  style={[
                    styles.quantityButton,
                    cantidad <= 1 &&
                    styles.disabledButton,
                  ]}
                  onPress={disminuirCantidad}
                  disabled={
                    cantidad <= 1 ||
                    procesando
                  }
                >
                  <Text
                    style={
                      styles.quantityButtonText
                    }
                  >
                    −
                  </Text>
                </Pressable>

                <Text
                  style={styles.quantityValue}
                >
                  {cantidad}
                </Text>

                <Pressable
                  style={styles.quantityButton}
                  onPress={aumentarCantidad}
                  disabled={procesando}
                >
                  <Text
                    style={
                      styles.quantityButtonText
                    }
                  >
                    +
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.readOnlyQuantity}>
              {pedido.cantidad} unidades
            </Text>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              S/ {total.toFixed(2)}
            </Text>
          </View>

          {puedeEditar &&
            cantidadModificada ? (
            <Pressable
              style={[
                styles.primaryButton,
                procesando &&
                styles.disabledButton,
              ]}
              onPress={guardarCantidad}
              disabled={procesando}
            >
              <Text
                style={styles.primaryButtonText}
              >
                Guardar nueva cantidad
              </Text>
            </Pressable>
          ) : null}
        </View>

        {pedido.estado === "PENDIENTE" ? (
          <Pressable
            style={styles.cancelButton}
            onPress={confirmarCancelacion}
            disabled={procesando}
          >
            <Text
              style={styles.cancelButtonText}
            >
              Cancelar pedido
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.deleteButton}
          onPress={confirmarEliminacion}
          disabled={procesando}
        >
          {procesando ? (
            <ActivityIndicator
              color="#B42318"
            />
          ) : (
            <Text
              style={styles.deleteButtonText}
            >
              Eliminar pedido del dispositivo
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 12,
    paddingBottom: 38,
  },

  loadingText: {
    marginTop: 13,
    color: "#68746F",
  },

  errorIcon: {
    fontSize: 48,
  },

  errorTitle: {
    marginTop: 14,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
  },

  errorText: {
    marginTop: 8,
    color: "#68746F",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backText: {
    color: "#176B5B",
    fontSize: 16,
    fontWeight: "600",
  },

  headerIcon: {
    fontSize: 31,
  },

  title: {
    marginTop: 18,
    color: "#176B5B",
    fontSize: 26,
    fontWeight: "bold",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  productName: {
    flex: 1,
    color: "#26332F",
    fontSize: 19,
    fontWeight: "bold",
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFF4CC",
  },

  statusCancelled: {
    backgroundColor: "#FDE2E1",
  },

  statusDelivered: {
    backgroundColor: "#DDF6E8",
  },

  statusText: {
    color: "#72520A",
    fontSize: 11,
    fontWeight: "bold",
  },

  card: {
    marginTop: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  detailLabel: {
    color: "#71807A",
    fontSize: 13,
  },

  detailValue: {
    maxWidth: "65%",
    color: "#35423E",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },

  sectionTitle: {
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  helpText: {
    marginTop: 5,
    color: "#71807A",
    fontSize: 12,
  },

  quantitySelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  quantityButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#176B5B",
  },

  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
  },

  quantityValue: {
    minWidth: 64,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  readOnlyQuantity: {
    marginTop: 14,
    color: "#35423E",
    fontSize: 16,
    fontWeight: "600",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E1E9E6",
  },

  totalLabel: {
    color: "#26332F",
    fontSize: 16,
    fontWeight: "bold",
  },

  totalValue: {
    color: "#176B5B",
    fontSize: 19,
    fontWeight: "bold",
  },

  primaryButton: {
    minHeight: 50,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  cancelButton: {
    minHeight: 51,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D78522",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  cancelButtonText: {
    color: "#A75D08",
    fontSize: 15,
    fontWeight: "bold",
  },

  deleteButton: {
    minHeight: 51,
    marginTop: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#B42318",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  deleteButtonText: {
    color: "#B42318",
    fontSize: 15,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.5,
  },
});