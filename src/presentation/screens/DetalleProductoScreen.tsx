import {
  useEffect,
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
  useLocalSearchParams,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useSQLiteContext,
} from "expo-sqlite";

import type {
  Producto,
} from "../../domain/models/Producto";

import {
  obtenerProductoPorId,
} from "../../infrastructure/database/ProductoRepository";

import {
  crearPedidoDesdeProducto,
} from "../../infrastructure/database/CompraRepository";

import {
  useAuth,
} from "../context/AuthContext";

const CATEGORIA_LABELS = {
  ALIMENTOS: "Alimentos",
  SALUD: "Salud",
  HIGIENE: "Higiene",
  ACCESORIOS: "Accesorios",
  JUGUETES: "Juguetes",
} as const;

const CATEGORIA_ICONOS = {
  ALIMENTOS: "🥣",
  SALUD: "💊",
  HIGIENE: "🧴",
  ACCESORIOS: "🦮",
  JUGUETES: "🎾",
} as const;

export default function DetalleProductoScreen() {
  const database = useSQLiteContext();

  const {
    usuario,
    perfil,
  } = useAuth();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [producto, setProducto] =
    useState<Producto | null>(null);

  const [cantidad, setCantidad] =
    useState(1);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let pantallaActiva = true;

    async function cargarProducto() {
      const productoId = Number(id);

      if (
        !Number.isInteger(productoId) ||
        productoId <= 0
      ) {
        setError(
          "El identificador del producto no es válido"
        );

        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const resultado =
          await obtenerProductoPorId(
            database,
            productoId
          );

        if (!pantallaActiva) {
          return;
        }

        if (!resultado) {
          setError(
            "El producto no existe o ya no está disponible"
          );

          return;
        }

        setProducto(resultado);
      } catch (caughtError) {
        console.error(
          "Error al obtener producto:",
          caughtError
        );

        if (pantallaActiva) {
          setError(
            "No se pudo cargar el producto"
          );
        }
      } finally {
        if (pantallaActiva) {
          setCargando(false);
        }
      }
    }

    cargarProducto();

    return () => {
      pantallaActiva = false;
    };
  }, [
    database,
    id,
  ]);

  function disminuirCantidad() {
    setCantidad((valorActual) =>
      Math.max(1, valorActual - 1)
    );
  }

  function aumentarCantidad() {
    if (!producto) {
      return;
    }

    setCantidad((valorActual) =>
      Math.min(
        producto.stock,
        valorActual + 1
      )
    );
  }

  async function confirmarPedido() {
    if (!usuario) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión para realizar un pedido"
      );

      router.replace("/");
      return;
    }

    if (!producto) {
      return;
    }

    if (producto.stock <= 0) {
      Alert.alert(
        "Producto agotado",
        "Este producto no tiene existencias disponibles"
      );

      return;
    }

    const nombreCliente =
      perfil
        ? `${perfil.nombres} ${perfil.apellidos}`.trim()
        : usuario.displayName?.trim() ||
        usuario.email ||
        "Cliente SumaqVet";

    const total =
      producto.precio * cantidad;

    Alert.alert(
      "Confirmar pedido",
      [
        `Producto: ${producto.nombre}`,
        `Cantidad: ${cantidad}`,
        `Total: S/ ${total.toFixed(2)}`,
        "",
        "¿Deseas registrar este pedido?",
      ].join("\n"),
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: guardarPedido,
        },
      ]
    );

    async function guardarPedido() {
      try {
        setGuardando(true);

        const pedido =
          await crearPedidoDesdeProducto(
            database,
            usuario!.uid,
            nombreCliente,
            producto!.id,
            cantidad
          );

        Alert.alert(
          "Pedido realizado",
          `Tu pedido #${pedido.id} fue guardado correctamente.`,
          [
            {
              text: "Ver mis pedidos",
              onPress: () => {
                router.replace("/pedidos");
              },
            },
          ]
        );
      } catch (caughtError) {
        console.error(
          "Error al registrar pedido:",
          caughtError
        );

        const mensaje =
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo registrar el pedido";

        Alert.alert(
          "Error al realizar pedido",
          mensaje
        );
      } finally {
        setGuardando(false);
      }
    }
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
            Cargando producto...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !producto) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            Producto no disponible
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.backCatalogButton}
            onPress={() =>
              router.replace("../productos")
            }
          >
            <Text
              style={
                styles.backCatalogButtonText
              }
            >
              Volver al catálogo
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const total =
    producto.precio * cantidad;

  const sinStock =
    producto.stock <= 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
              styles.buttonPressed,
            ]}
            onPress={() => router.back()}
            disabled={guardando}
          >
            <Text style={styles.backText}>
              ‹ Catálogo
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Detalle
          </Text>

          <Text style={styles.headerCart}>
            🛒
          </Text>
        </View>

        <View style={styles.productImage}>
          <Text style={styles.productIcon}>
            {
              CATEGORIA_ICONOS[
              producto.categoria
              ]
            }
          </Text>
        </View>

        <View style={styles.productCard}>
          <View style={styles.categoryRow}>
            <Text style={styles.category}>
              {
                CATEGORIA_LABELS[
                producto.categoria
                ]
              }
            </Text>

            <Text style={styles.code}>
              {producto.codigo}
            </Text>
          </View>

          <Text style={styles.productName}>
            {producto.nombre}
          </Text>

          <Text style={styles.description}>
            {producto.descripcion}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>
                Precio unitario
              </Text>

              <Text style={styles.price}>
                S/ {producto.precio.toFixed(2)}
              </Text>
            </View>

            <View
              style={[
                styles.stockBadge,
                sinStock &&
                styles.stockBadgeEmpty,
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  sinStock &&
                  styles.stockTextEmpty,
                ]}
              >
                {sinStock
                  ? "Sin stock"
                  : `${producto.stock} disponibles`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.quantityCard}>
          <View style={styles.quantityInformation}>
            <Text style={styles.quantityTitle}>
              Cantidad
            </Text>

            <Text style={styles.quantityHelp}>
              Selecciona cuántas unidades deseas
            </Text>
          </View>

          <View style={styles.quantitySelector}>
            <Pressable
              style={({ pressed }) => [
                styles.quantityButton,
                cantidad <= 1 &&
                styles.quantityButtonDisabled,
                pressed &&
                styles.buttonPressed,
              ]}
              onPress={disminuirCantidad}
              disabled={
                cantidad <= 1 ||
                guardando
              }
            >
              <Text
                style={styles.quantityButtonText}
              >
                −
              </Text>
            </Pressable>

            <Text style={styles.quantityValue}>
              {cantidad}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.quantityButton,
                cantidad >= producto.stock &&
                styles.quantityButtonDisabled,
                pressed &&
                styles.buttonPressed,
              ]}
              onPress={aumentarCantidad}
              disabled={
                cantidad >= producto.stock ||
                guardando
              }
            >
              <Text
                style={styles.quantityButtonText}
              >
                +
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Resumen del pedido
          </Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Producto
            </Text>

            <Text
              style={styles.summaryValue}
              numberOfLines={1}
            >
              {producto.nombre}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Cantidad
            </Text>

            <Text style={styles.summaryValue}>
              {cantidad}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Precio unitario
            </Text>

            <Text style={styles.summaryValue}>
              S/ {producto.precio.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalValue}>
              S/ {total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>
            ℹ️
          </Text>

          <Text style={styles.noticeText}>
            El pedido se registrará inicialmente
            como pendiente y se guardará localmente
            en tu dispositivo.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.orderButton,
            pressed &&
            styles.buttonPressed,
            (guardando || sinStock) &&
            styles.orderButtonDisabled,
          ]}
          onPress={confirmarPedido}
          disabled={
            guardando ||
            sinStock
          }
        >
          {guardando ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={styles.orderButtonText}
              >
                Registrando pedido...
              </Text>
            </View>
          ) : (
            <Text
              style={styles.orderButtonText}
            >
              {sinStock
                ? "Producto agotado"
                : `Realizar pedido · S/ ${total.toFixed(2)}`}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 36,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingText: {
    marginTop: 14,
    color: "#68746F",
    fontSize: 15,
  },

  errorIcon: {
    fontSize: 50,
  },

  errorTitle: {
    marginTop: 15,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
  },

  errorText: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 15,
    textAlign: "center",
  },

  backCatalogButton: {
    minHeight: 49,
    marginTop: 23,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#176B5B",
  },

  backCatalogButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  header: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
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

  headerTitle: {
    flex: 1,
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },

  headerCart: {
    width: 55,
    fontSize: 25,
    textAlign: "right",
  },

  productImage: {
    height: 170,
    marginTop: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#DFF0EB",
  },

  productIcon: {
    fontSize: 82,
  },

  productCard: {
    marginTop: 17,
    padding: 19,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  category: {
    color: "#176B5B",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  code: {
    color: "#87938F",
    fontSize: 12,
  },

  productName: {
    marginTop: 10,
    color: "#26332F",
    fontSize: 22,
    fontWeight: "bold",
  },

  description: {
    marginTop: 8,
    color: "#66736E",
    fontSize: 14,
    lineHeight: 21,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 19,
  },

  priceLabel: {
    color: "#7B8783",
    fontSize: 12,
  },

  price: {
    marginTop: 3,
    color: "#176B5B",
    fontSize: 23,
    fontWeight: "bold",
  },

  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#DDF6E8",
  },

  stockBadgeEmpty: {
    backgroundColor: "#FDE2E1",
  },

  stockText: {
    color: "#176B43",
    fontSize: 11,
    fontWeight: "bold",
  },

  stockTextEmpty: {
    color: "#A12822",
  },

  quantityCard: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  quantityInformation: {
    flex: 1,
  },

  quantityTitle: {
    color: "#26332F",
    fontSize: 16,
    fontWeight: "bold",
  },

  quantityHelp: {
    marginTop: 3,
    color: "#7B8783",
    fontSize: 11,
  },

  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#176B5B",
  },

  quantityButtonDisabled: {
    backgroundColor: "#B8C7C2",
  },

  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  quantityValue: {
    minWidth: 45,
    color: "#26332F",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  summaryCard: {
    marginTop: 15,
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  summaryTitle: {
    marginBottom: 14,
    color: "#26332F",
    fontSize: 16,
    fontWeight: "bold",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  summaryLabel: {
    color: "#71807A",
    fontSize: 13,
  },

  summaryValue: {
    maxWidth: "62%",
    color: "#35423E",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },

  divider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: "#E1E9E6",
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

  notice: {
    flexDirection: "row",
    marginTop: 15,
    padding: 13,
    borderRadius: 13,
    backgroundColor: "#EDF4FF",
  },

  noticeIcon: {
    marginRight: 9,
    fontSize: 18,
  },

  noticeText: {
    flex: 1,
    color: "#40556C",
    fontSize: 12,
    lineHeight: 18,
  },

  orderButton: {
    minHeight: 55,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#176B5B",
  },

  orderButtonDisabled: {
    opacity: 0.6,
  },

  orderButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonPressed: {
    opacity: 0.78,
  },
});