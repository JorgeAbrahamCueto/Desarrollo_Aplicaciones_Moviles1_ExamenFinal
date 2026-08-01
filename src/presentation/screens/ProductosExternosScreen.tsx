import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import type {
  ProductoExterno,
} from "../../domain/models/ProductoExterno";

import {
  obtenerProductosExternos,
} from "../../infrastructure/api/ProductoApiService";

export default function ProductosExternosScreen() {
  const [productos, setProductos] =
    useState<ProductoExterno[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const cargarProductos = useCallback(
    async (mostrarCarga = true) => {
      try {
        if (mostrarCarga) {
          setCargando(true);
        }

        setError("");

        const resultado =
          await obtenerProductosExternos();

        setProductos(resultado);
      } catch (caughtError) {
        console.error(
          "Error al cargar productos externos:",
          caughtError
        );

        const mensaje =
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el catálogo";

        setError(mensaje);
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return productos;
    }

    return productos.filter((producto) => {
      return (
        producto.nombre
          .toLowerCase()
          .includes(texto) ||
        producto.marca
          .toLowerCase()
          .includes(texto) ||
        producto.categorias
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [busqueda, productos]);

  async function actualizarCatalogo() {
    setActualizando(true);
    await cargarProductos(false);
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingTitle}>
            Cargando productos reales...
          </Text>

          <Text style={styles.loadingDescription}>
            Consultando Open Pet Food Facts
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorHeader}>
          <Pressable
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              ‹ Volver
            </Text>
          </Pressable>
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            No se pudo cargar el catálogo
          </Text>

          <Text style={styles.errorDescription}>
            {error}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => cargarProductos()}
          >
            <Text style={styles.retryButtonText}>
              Reintentar
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹ Volver
          </Text>
        </Pressable>

        <View style={styles.headerInformation}>
          <Text style={styles.title}>
            Productos reales
          </Text>

          <Text style={styles.subtitle}>
            Información de Open Pet Food Facts
          </Text>
        </View>

        <Text style={styles.headerIcon}>
          🥫
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>
          🔎
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto o marca..."
          placeholderTextColor="#8A9692"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
        />

        {busqueda.length > 0 ? (
          <Pressable
            style={styles.clearButton}
            onPress={() => setBusqueda("")}
          >
            <Text style={styles.clearText}>
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          {productosFiltrados.length === 1
            ? "1 producto encontrado"
            : `${productosFiltrados.length} productos encontrados`}
        </Text>

        <Pressable
          onPress={actualizarCatalogo}
          disabled={actualizando}
        >
          <Text style={styles.updateText}>
            {actualizando
              ? "Actualizando..."
              : "Actualizar"}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={productosFiltrados}
        keyExtractor={(producto) =>
          producto.id
        }
        renderItem={({ item }) => (
          <ProductoCard producto={item} />
        )}
        contentContainerStyle={[
          styles.listContent,
          productosFiltrados.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizarCatalogo}
            colors={["#176B5B"]}
            tintColor="#176B5B"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🔍
            </Text>

            <Text style={styles.emptyTitle}>
              No encontramos productos
            </Text>

            <Text style={styles.emptyDescription}>
              Intenta buscar usando otro nombre
              o marca.
            </Text>

            <Pressable
              onPress={() => setBusqueda("")}
            >
              <Text style={styles.clearSearchText}>
                Limpiar búsqueda
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          productosFiltrados.length > 0 ? (
            <View style={styles.sourceContainer}>
              <Text style={styles.sourceText}>
                Datos obtenidos mediante una
                petición REST GET a Open Pet
                Food Facts.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

interface ProductoCardProps {
  producto: ProductoExterno;
}

function ProductoCard({
  producto,
}: ProductoCardProps) {
  const [
    imagenConError,
    setImagenConError,
  ] = useState(false);

  async function abrirFuente() {
    const url =
      `https://world.openpetfoodfacts.org/product/${producto.id}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "No se pudo abrir el producto:",
        error
      );

      Alert.alert(
        "No se pudo abrir",
        "No fue posible abrir la página del producto."
      );
    }
  }

  const mostrarImagen =
    Boolean(producto.imagenUrl) &&
    !imagenConError;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {mostrarImagen ? (
          <Image
            source={{
              uri: producto.imagenUrl ?? "",
            }}
            style={styles.productImage}
            resizeMode="contain"
            onError={() =>
              setImagenConError(true)
            }
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackIcon}>
              🐾
            </Text>

            <Text style={styles.imageFallbackText}>
              Sin imagen
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardInformation}>
        <Text
          style={styles.productName}
          numberOfLines={2}
        >
          {producto.nombre}
        </Text>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>
            Marca
          </Text>

          <Text
            style={styles.dataValue}
            numberOfLines={1}
          >
            {producto.marca ||
              "No especificada"}
          </Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>
            Presentación
          </Text>

          <Text
            style={styles.dataValue}
            numberOfLines={1}
          >
            {producto.cantidad ||
              "No especificada"}
          </Text>
        </View>

        {producto.categorias ? (
          <Text
            style={styles.categories}
            numberOfLines={2}
          >
            {producto.categorias}
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.sourceButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={abrirFuente}
        >
          <Text style={styles.sourceButtonText}>
            Ver fuente ↗
          </Text>
        </Pressable>
      </View>
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
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 16,
    color: "#176B5B",
    fontSize: 18,
    fontWeight: "bold",
  },

  loadingDescription: {
    marginTop: 6,
    color: "#68746F",
    fontSize: 14,
  },

  errorHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  errorIcon: {
    fontSize: 52,
  },

  errorTitle: {
    marginTop: 17,
    color: "#B42318",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  errorDescription: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 21,
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },

  backText: {
    color: "#176B5B",
    fontSize: 15,
    fontWeight: "600",
  },

  headerInformation: {
    flex: 1,
  },

  title: {
    color: "#176B5B",
    fontSize: 23,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 2,
    color: "#73807B",
    fontSize: 11,
  },

  headerIcon: {
    marginLeft: 8,
    fontSize: 29,
  },

  searchContainer: {
    minHeight: 48,
    marginHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D9E4E0",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#26332F",
    fontSize: 14,
  },

  clearButton: {
    padding: 5,
  },

  clearText: {
    color: "#75817D",
    fontSize: 14,
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 13,
    marginBottom: 10,
  },

  resultText: {
    color: "#6B7773",
    fontSize: 12,
  },

  updateText: {
    color: "#176B5B",
    fontSize: 12,
    fontWeight: "bold",
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 35,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  card: {
    width: "100%",
    minHeight: 150,
    marginBottom: 13,
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E9E6",
    borderRadius: 16,
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

  imageContainer: {
    width: 92,
    height: 126,
    marginRight: 13,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EDF6F3",
  },

  productImage: {
    width: 92,
    height: 126,
  },

  imageFallback: {
    width: 92,
    height: 126,
    alignItems: "center",
    justifyContent: "center",
  },

  imageFallbackIcon: {
    fontSize: 29,
  },

  imageFallbackText: {
    marginTop: 6,
    color: "#7A8782",
    fontSize: 10,
  },

  cardInformation: {
    flex: 1,
    minWidth: 0,
  },

  productName: {
    marginBottom: 9,
    color: "#26332F",
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 19,
  },

  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  dataLabel: {
    color: "#77847F",
    fontSize: 11,
  },

  dataValue: {
    flex: 1,
    marginLeft: 8,
    color: "#3E4A46",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
  },

  categories: {
    marginTop: 3,
    color: "#68746F",
    fontSize: 10,
    lineHeight: 14,
  },

  sourceButton: {
    alignSelf: "flex-end",
    marginTop: "auto",
    paddingHorizontal: 6,
    paddingVertical: 7,
  },

  sourceButtonText: {
    color: "#176B5B",
    fontSize: 12,
    fontWeight: "bold",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 70,
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    marginTop: 15,
    color: "#26332F",
    fontSize: 19,
    fontWeight: "bold",
  },

  emptyDescription: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 14,
    textAlign: "center",
  },

  clearSearchText: {
    marginTop: 19,
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "bold",
  },

  sourceContainer: {
    marginTop: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#E6F2EE",
  },

  sourceText: {
    color: "#596762",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  buttonPressed: {
    opacity: 0.75,
  },
});