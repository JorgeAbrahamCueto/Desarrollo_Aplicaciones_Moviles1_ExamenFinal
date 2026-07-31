import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
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
  listarPedidos,
} from "../../infrastructure/database/PedidoRepository";

import {
  useAuth,
} from "../context/AuthContext";

export default function ListadoPedidosScreen() {
  const database = useSQLiteContext();
  const { usuario } = useAuth();

  const [pedidos, setPedidos] =
    useState<Pedido[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const cargarPedidos = useCallback(
    async (mostrarCarga = true) => {
      if (!usuario) {
        setPedidos([]);
        setCargando(false);
        return;
      }

      try {
        if (mostrarCarga) {
          setCargando(true);
        }

        setError("");

        const resultado =
          await listarPedidos(
            database,
            usuario.uid
          );

        setPedidos(resultado);
      } catch (caughtError) {
        console.error(
          "Error al listar pedidos:",
          caughtError
        );

        setError(
          "No se pudieron cargar tus pedidos"
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [
      database,
      usuario,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();

      return undefined;
    }, [cargarPedidos])
  );

  async function actualizarListado() {
    setActualizando(true);
    await cargarPedidos(false);
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingText}>
            Cargando tus pedidos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            No pudimos cargar tus pedidos
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              cargarPedidos()
            }
          >
            <Text
              style={styles.retryButtonText}
            >
              Reintentar
            </Text>
          </Pressable>

          <Pressable
            style={styles.backErrorButton}
            onPress={() => router.back()}
          >
            <Text
              style={styles.backErrorText}
            >
              Volver al inicio
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹ Volver
          </Text>
        </Pressable>

        <View
          style={
            styles.headerTextContainer
          }
        >
          <Text style={styles.title}>
            Mis pedidos
          </Text>

          <Text style={styles.subtitle}>
            {pedidos.length === 1
              ? "1 pedido registrado"
              : `${pedidos.length} pedidos registrados`}
          </Text>
        </View>

        <Text style={styles.headerIcon}>
          🛒
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          pedidos.length === 0 &&
            styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizarListado}
            colors={["#176B5B"]}
            tintColor="#176B5B"
          />
        }
      >
        {pedidos.length === 0 ? (
          <View
            style={styles.emptyContainer}
          >
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              Todavía no tienes pedidos
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Explora el catálogo de SumaqVet,
              selecciona un producto y realiza
              tu primer pedido.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.emptyButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                router.push("/productos")
              }
            >
              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Explorar productos
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={styles.listContainer}
          >
            {pedidos.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {pedidos.length > 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.floatingButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            router.push("/productos")
          }
        >
          <Text
            style={
              styles.floatingButtonIcon
            }
          >
            ＋
          </Text>

          <Text
            style={
              styles.floatingButtonText
            }
          >
            Comprar productos
          </Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

interface PedidoCardProps {
  pedido: Pedido;
}

function PedidoCard({
  pedido,
}: PedidoCardProps) {
  const total =
    pedido.cantidad * pedido.precio;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        router.push({
          pathname: "../pedidos/[id]",
          params: {
            id: pedido.id.toString(),
          },
        })
      }
    >
      <View style={styles.cardHeader}>
        <View
          style={
            styles.cardTitleContainer
          }
        >
          <Text
            style={styles.cardProduct}
            numberOfLines={1}
          >
            {pedido.producto}
          </Text>

          <Text style={styles.cardId}>
            Pedido #{pedido.id}
          </Text>
        </View>

        <EstadoBadge
          estado={pedido.estado}
        />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>
          Cliente
        </Text>

        <Text
          style={styles.cardValue}
          numberOfLines={1}
        >
          {pedido.clienteNombre}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>
          Cantidad
        </Text>

        <Text style={styles.cardValue}>
          {pedido.cantidad}
        </Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>
          Precio unitario
        </Text>

        <Text style={styles.cardValue}>
          S/ {pedido.precio.toFixed(2)}
        </Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          Total
        </Text>

        <Text style={styles.totalValue}>
          S/ {total.toFixed(2)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.syncText}>
          {pedido.sincronizado
            ? "☁️ Sincronizado"
            : "📱 Guardado localmente"}
        </Text>

        <Text style={styles.detailText}>
          Ver detalle ›
        </Text>
      </View>
    </Pressable>
  );
}

interface EstadoBadgeProps {
  estado: Pedido["estado"];
}

function EstadoBadge({
  estado,
}: EstadoBadgeProps) {
  const configuracion = {
    PENDIENTE: {
      texto: "Pendiente",
      fondo: "#FFF4CC",
      color: "#855C00",
    },

    EN_PROCESO: {
      texto: "En proceso",
      fondo: "#DCEEFF",
      color: "#175A8C",
    },

    ENTREGADO: {
      texto: "Entregado",
      fondo: "#DDF6E8",
      color: "#176B43",
    },

    CANCELADO: {
      texto: "Cancelado",
      fondo: "#FDE2E1",
      color: "#A12822",
    },
  }[estado];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            configuracion.fondo,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color:
              configuracion.color,
          },
        ]}
      >
        {configuracion.texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingText: {
    marginTop: 14,
    color: "#5D6865",
    fontSize: 15,
  },

  errorIcon: {
    fontSize: 48,
  },

  errorTitle: {
    marginTop: 16,
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    color: "#66726E",
    fontSize: 15,
    textAlign: "center",
  },

  retryButton: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#176B5B",
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  backErrorButton: {
    marginTop: 14,
    padding: 8,
  },

  backErrorText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 17,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },

  backText: {
    color: "#176B5B",
    fontSize: 16,
    fontWeight: "600",
  },

  headerTextContainer: {
    flex: 1,
  },

  title: {
    color: "#176B5B",
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 2,
    color: "#68746F",
    fontSize: 13,
  },

  headerIcon: {
    marginLeft: 10,
    fontSize: 36,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 70,
  },

  emptyIcon: {
    fontSize: 67,
  },

  emptyTitle: {
    marginTop: 18,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 10,
    color: "#68746F",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  emptyButton: {
    minHeight: 51,
    marginTop: 25,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  listContainer: {
    gap: 14,
  },

  card: {
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  cardPressed: {
    opacity: 0.76,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  cardProduct: {
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  cardId: {
    marginTop: 3,
    color: "#7B8783",
    fontSize: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  cardDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: "#E5ECE9",
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  cardLabel: {
    color: "#71807A",
    fontSize: 13,
  },

  cardValue: {
    maxWidth: "62%",
    color: "#35423E",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5ECE9",
  },

  totalLabel: {
    color: "#26332F",
    fontSize: 15,
    fontWeight: "bold",
  },

  totalValue: {
    color: "#176B5B",
    fontSize: 17,
    fontWeight: "bold",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
  },

  syncText: {
    color: "#71807A",
    fontSize: 12,
  },

  detailText: {
    color: "#176B5B",
    fontSize: 12,
    fontWeight: "bold",
  },

  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: "#176B5B",
    elevation: 6,
  },

  floatingButtonIcon: {
    marginRight: 7,
    color: "#FFFFFF",
    fontSize: 23,
  },

  floatingButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.78,
  },
});