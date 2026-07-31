import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

import {
  CATEGORIAS_PRODUCTO,
  type CategoriaProducto,
  type Producto,
} from "../../domain/models/Producto";

import {
  listarProductos,
} from "../../infrastructure/database/ProductoRepository";

type FiltroCategoria =
  | "TODOS"
  | CategoriaProducto;

const CATEGORIA_LABELS: Record<
  FiltroCategoria,
  string
> = {
  TODOS: "Todos",
  ALIMENTOS: "Alimentos",
  SALUD: "Salud",
  HIGIENE: "Higiene",
  ACCESORIOS: "Accesorios",
  JUGUETES: "Juguetes",
};

const CATEGORIA_ICONOS: Record<
  CategoriaProducto,
  string
> = {
  ALIMENTOS: "🥣",
  SALUD: "💊",
  HIGIENE: "🧴",
  ACCESORIOS: "🦮",
  JUGUETES: "🎾",
};

export default function CatalogoProductosScreen() {
  const database = useSQLiteContext();

  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [textoBusqueda, setTextoBusqueda] =
    useState("");

  const [categoria, setCategoria] =
    useState<FiltroCategoria>("TODOS");

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
          await listarProductos(database);

        setProductos(resultado);
      } catch (caughtError) {
        console.error(
          "Error al cargar productos:",
          caughtError
        );

        setError(
          "No se pudo cargar el catálogo"
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [database]
  );

  useFocusEffect(
    useCallback(() => {
      cargarProductos();

      return undefined;
    }, [cargarProductos])
  );

  const productosFiltrados =
    useMemo(() => {
      const busqueda = textoBusqueda
        .trim()
        .toLowerCase();

      return productos.filter(
        (producto) => {
          const coincideCategoria =
            categoria === "TODOS" ||
            producto.categoria === categoria;

          const coincideBusqueda =
            !busqueda ||
            producto.nombre
              .toLowerCase()
              .includes(busqueda) ||
            producto.descripcion
              .toLowerCase()
              .includes(busqueda) ||
            producto.codigo
              .toLowerCase()
              .includes(busqueda);

          return (
            coincideCategoria &&
            coincideBusqueda
          );
        }
      );
    }, [
      productos,
      textoBusqueda,
      categoria,
    ]);

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

          <Text style={styles.loadingText}>
            Cargando productos...
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
            Ocurrió un problema
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              cargarProductos()
            }
          >
            <Text
              style={styles.retryButtonText}
            >
              Reintentar
            </Text>
          </Pressable>

          <Pressable
            style={styles.errorBackButton}
            onPress={() => router.back()}
          >
            <Text
              style={styles.errorBackText}
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

        <View style={styles.headerInformation}>
          <Text style={styles.title}>
            Productos
          </Text>

          <Text style={styles.subtitle}>
            Catálogo SumaqVet
          </Text>
        </View>

        <Text style={styles.headerIcon}>
          🛍️
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor="#87938F"
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {textoBusqueda ? (
            <Pressable
              style={styles.clearButton}
              onPress={() =>
                setTextoBusqueda("")
              }
            >
              <Text style={styles.clearText}>
                ×
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.categoriesContainer
          }
        >
          {(
            [
              "TODOS",
              ...CATEGORIAS_PRODUCTO,
            ] as FiltroCategoria[]
          ).map((item) => {
            const seleccionado =
              categoria === item;

            return (
              <Pressable
                key={item}
                style={({ pressed }) => [
                  styles.categoryButton,
                  seleccionado &&
                    styles.categoryButtonSelected,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  setCategoria(item)
                }
              >
                <Text
                  style={[
                    styles.categoryText,
                    seleccionado &&
                      styles.categoryTextSelected,
                  ]}
                >
                  {CATEGORIA_LABELS[item]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.productsContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizarCatalogo}
            colors={["#176B5B"]}
            tintColor="#176B5B"
          />
        }
      >
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {productosFiltrados.length === 1
              ? "1 producto encontrado"
              : `${productosFiltrados.length} productos encontrados`}
          </Text>
        </View>

        {productosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🔎
            </Text>

            <Text style={styles.emptyTitle}>
              No encontramos productos
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              Prueba con otra búsqueda o
              selecciona una categoría distinta.
            </Text>

            <Pressable
              style={styles.resetButton}
              onPress={() => {
                setTextoBusqueda("");
                setCategoria("TODOS");
              }}
            >
              <Text style={styles.resetText}>
                Ver todo el catálogo
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productsList}>
            {productosFiltrados.map(
              (producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                />
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ProductoCardProps {
  producto: Producto;
}

function ProductoCard({
  producto,
}: ProductoCardProps) {
  const sinStock = producto.stock <= 0;

  function abrirProducto() {
    if (sinStock) {
      return;
    }

    router.push({
      pathname: "../productos/[id]",
      params: {
        id: producto.id.toString(),
      },
    });
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.productCard,
        pressed &&
          !sinStock &&
          styles.productCardPressed,
        sinStock &&
          styles.productCardDisabled,
      ]}
      onPress={abrirProducto}
      disabled={sinStock}
    >
      <View style={styles.productIconContainer}>
        <Text style={styles.productIcon}>
          {
            CATEGORIA_ICONOS[
              producto.categoria
            ]
          }
        </Text>
      </View>

      <View style={styles.productInformation}>
        <View style={styles.productTopRow}>
          <Text
            style={styles.productName}
            numberOfLines={1}
          >
            {producto.nombre}
          </Text>

          <Text style={styles.productArrow}>
            ›
          </Text>
        </View>

        <Text style={styles.productCode}>
          {producto.codigo} ·{" "}
          {
            CATEGORIA_LABELS[
              producto.categoria
            ]
          }
        </Text>

        <Text
          style={styles.productDescription}
          numberOfLines={2}
        >
          {producto.descripcion}
        </Text>

        <View style={styles.productBottomRow}>
          <Text style={styles.productPrice}>
            S/ {producto.precio.toFixed(2)}
          </Text>

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
                : `Stock: ${producto.stock}`}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
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

  retryButton: {
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 28,
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

  errorBackButton: {
    marginTop: 12,
    padding: 8,
  },

  errorBackText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: 14,
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

  headerInformation: {
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
    fontSize: 35,
  },

  searchSection: {
    paddingBottom: 13,
  },

  searchContainer: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  searchIcon: {
    marginLeft: 14,
    fontSize: 17,
  },

  searchInput: {
    minHeight: 48,
    flex: 1,
    paddingHorizontal: 10,
    color: "#26332F",
    fontSize: 15,
  },

  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  clearText: {
    color: "#6C7974",
    fontSize: 25,
  },

  categoriesContainer: {
    gap: 9,
    paddingHorizontal: 20,
    paddingTop: 13,
  },

  categoryButton: {
    minHeight: 37,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },

  categoryButtonSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#176B5B",
  },

  categoryText: {
    color: "#61706A",
    fontSize: 13,
    fontWeight: "600",
  },

  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  productsContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  resultsHeader: {
    marginBottom: 12,
  },

  resultsText: {
    color: "#6B7773",
    fontSize: 13,
  },

  productsList: {
    gap: 13,
  },

  productCard: {
    flexDirection: "row",
    padding: 15,
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

  productCardPressed: {
    opacity: 0.78,
  },

  productCardDisabled: {
    opacity: 0.55,
  },

  productIconContainer: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#E8F3F0",
  },

  productIcon: {
    fontSize: 29,
  },

  productInformation: {
    flex: 1,
    marginLeft: 13,
  },

  productTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  productName: {
    flex: 1,
    color: "#26332F",
    fontSize: 16,
    fontWeight: "bold",
  },

  productArrow: {
    marginLeft: 8,
    color: "#176B5B",
    fontSize: 27,
  },

  productCode: {
    marginTop: 2,
    color: "#80908A",
    fontSize: 11,
  },

  productDescription: {
    marginTop: 6,
    color: "#65726E",
    fontSize: 12,
    lineHeight: 17,
  },

  productBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  productPrice: {
    color: "#176B5B",
    fontSize: 17,
    fontWeight: "bold",
  },

  stockBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: "#DDF6E8",
  },

  stockBadgeEmpty: {
    backgroundColor: "#FDE2E1",
  },

  stockText: {
    color: "#176B43",
    fontSize: 10,
    fontWeight: "bold",
  },

  stockTextEmpty: {
    color: "#A12822",
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 55,
  },

  emptyTitle: {
    marginTop: 16,
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
  },

  emptyDescription: {
    marginTop: 9,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  resetButton: {
    marginTop: 20,
    padding: 10,
  },

  resetText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.78,
  },
});