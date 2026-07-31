import {
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
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
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import type {
  RazaGato,
} from "../../domain/models/RazaGato";

import {
  obtenerRazasGatos,
} from "../../infrastructure/api/CatApiService";

export default function GuiaFelinaScreen() {
  const [razas, setRazas] =
    useState<RazaGato[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  const [actualizando, setActualizando] =
    useState(false);

  const [solicitudRealizada, setSolicitudRealizada] =
    useState(false);

  const [error, setError] =
    useState("");

  const razasFiltradas = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return razas;
    }

    return razas.filter((raza) => {
      return (
        raza.nombre
          .toLowerCase()
          .includes(texto) ||
        raza.origen
          .toLowerCase()
          .includes(texto) ||
        raza.temperamento
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [busqueda, razas]);

  async function cargarRazas(
    esActualizacion = false
  ) {
    try {
      if (esActualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError("");

      const resultado =
        await obtenerRazasGatos();

      setRazas(resultado);
      setSolicitudRealizada(true);
    } catch (caughtError) {
      console.error(
        "Error al obtener razas:",
        caughtError
      );

      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo consultar TheCatAPI";

      setError(mensaje);
      setSolicitudRealizada(true);
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹ Volver
          </Text>
        </Pressable>

        <View style={styles.headerInformation}>
          <Text style={styles.title}>
            Guía felina
          </Text>

          <Text style={styles.headerSubtitle}>
            Información obtenida de TheCatAPI
          </Text>
        </View>

        <Text style={styles.headerIcon}>
          🐱
        </Text>
      </View>

      {!solicitudRealizada && !cargando ? (
        <View style={styles.centerContainer}>
          <Text style={styles.initialIcon}>
            🐈
          </Text>

          <Text style={styles.initialTitle}>
            Conoce las razas de gatos
          </Text>

          <Text style={styles.initialDescription}>
            Consulta información real sobre razas,
            origen, temperamento, peso y esperanza
            de vida.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => cargarRazas()}
          >
            <Text style={styles.primaryButtonText}>
              Cargar razas
            </Text>
          </Pressable>

          <Text style={styles.apiText}>
            Datos externos proporcionados por
            TheCatAPI
          </Text>
        </View>
      ) : null}

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingTitle}>
            Consultando TheCatAPI...
          </Text>

          <Text style={styles.loadingDescription}>
            Estamos obteniendo información de las
            razas felinas.
          </Text>
        </View>
      ) : null}

      {!cargando && error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            No se pudo cargar la guía
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => cargarRazas()}
          >
            <Text style={styles.primaryButtonText}>
              Reintentar
            </Text>
          </Pressable>

          <Text style={styles.errorHelp}>
            Comprueba la conexión a Internet y
            vuelve a intentarlo.
          </Text>
        </View>
      ) : null}

      {!cargando &&
      !error &&
      solicitudRealizada ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={() => cargarRazas(true)}
              colors={["#176B5B"]}
              tintColor="#176B5B"
            />
          }
        >
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>
              🔎
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar raza, origen..."
              placeholderTextColor="#84908C"
              value={busqueda}
              onChangeText={setBusqueda}
              autoCorrect={false}
              returnKeyType="search"
            />

            {busqueda ? (
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
              {razasFiltradas.length === 1
                ? "1 raza encontrada"
                : `${razasFiltradas.length} razas encontradas`}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.reloadButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => cargarRazas()}
            >
              <Text style={styles.reloadText}>
                Actualizar
              </Text>
            </Pressable>
          </View>

          {razasFiltradas.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>
                🔍
              </Text>

              <Text style={styles.noResultsTitle}>
                No encontramos resultados
              </Text>

              <Text style={styles.noResultsDescription}>
                Prueba escribiendo otra raza,
                temperamento o país de origen.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {razasFiltradas.map((raza) => (
                <RazaCard
                  key={raza.id}
                  raza={raza}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

interface RazaCardProps {
  raza: RazaGato;
}

function RazaCard({
  raza,
}: RazaCardProps) {
  return (
    <View style={styles.card}>
      {raza.imagenUrl ? (
        <Image
          style={styles.cardImage}
          source={{
            uri: raza.imagenUrl,
          }}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>
            🐱
          </Text>

          <Text style={styles.placeholderText}>
            Imagen no disponible
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>
              {raza.nombre}
            </Text>

            <Text style={styles.cardOrigin}>
              📍 {raza.origen}
            </Text>
          </View>

          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>
              Raza
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          {raza.descripcion}
        </Text>

        <View style={styles.informationContainer}>
          <View style={styles.informationItem}>
            <Text style={styles.informationLabel}>
              Esperanza de vida
            </Text>

            <Text style={styles.informationValue}>
              {raza.esperanzaVida}
            </Text>
          </View>

          <View style={styles.informationItem}>
            <Text style={styles.informationLabel}>
              Peso
            </Text>

            <Text style={styles.informationValue}>
              {raza.pesoMetrico} kg
            </Text>
          </View>
        </View>

        <View style={styles.temperamentContainer}>
          <Text style={styles.temperamentLabel}>
            Temperamento
          </Text>

          <Text style={styles.temperamentText}>
            {raza.temperamento}
          </Text>
        </View>

        <View style={styles.levelsContainer}>
          <Nivel
            label="Adaptabilidad"
            value={raza.adaptabilidad}
          />

          <Nivel
            label="Inteligencia"
            value={raza.inteligencia}
          />

          <Nivel
            label="Afecto"
            value={raza.nivelAfecto}
          />
        </View>
      </View>
    </View>
  );
}

interface NivelProps {
  label: string;
  value: number;
}

function Nivel({
  label,
  value,
}: NivelProps) {
  const nivel = Math.max(
    0,
    Math.min(5, Math.round(value))
  );

  return (
    <View style={styles.levelRow}>
      <Text style={styles.levelLabel}>
        {label}
      </Text>

      <Text style={styles.levelValue}>
        {"★".repeat(nivel)}
        {"☆".repeat(5 - nivel)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#F1F8F6",
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
    fontSize: 25,
    fontWeight: "bold",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#68746F",
    fontSize: 12,
  },

  headerIcon: {
    marginLeft: 10,
    fontSize: 34,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },

  initialIcon: {
    fontSize: 76,
  },

  initialTitle: {
    marginTop: 20,
    color: "#26332F",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },

  initialDescription: {
    marginTop: 11,
    color: "#66736E",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 51,
    marginTop: 25,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  apiText: {
    marginTop: 17,
    color: "#80908A",
    fontSize: 12,
    textAlign: "center",
  },

  loadingTitle: {
    marginTop: 18,
    color: "#26332F",
    fontSize: 18,
    fontWeight: "bold",
  },

  loadingDescription: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 14,
    textAlign: "center",
  },

  errorIcon: {
    fontSize: 52,
  },

  errorTitle: {
    marginTop: 17,
    color: "#A12822",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 9,
    color: "#66736E",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  errorHelp: {
    marginTop: 15,
    color: "#80908A",
    fontSize: 12,
    textAlign: "center",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  searchContainer: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CAD8D3",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  searchIcon: {
    marginRight: 9,
    fontSize: 16,
  },

  searchInput: {
    flex: 1,
    color: "#26332F",
    fontSize: 15,
  },

  clearButton: {
    padding: 6,
  },

  clearText: {
    color: "#68746F",
    fontSize: 14,
  },

  resultHeader: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  resultText: {
    color: "#68746F",
    fontSize: 13,
  },

  reloadButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  reloadText: {
    color: "#176B5B",
    fontSize: 13,
    fontWeight: "bold",
  },

  noResultsContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 70,
  },

  noResultsIcon: {
    fontSize: 50,
  },

  noResultsTitle: {
    marginTop: 15,
    color: "#26332F",
    fontSize: 19,
    fontWeight: "bold",
  },

  noResultsDescription: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  listContainer: {
    gap: 17,
  },

  card: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  cardImage: {
    width: "100%",
    height: 205,
    backgroundColor: "#E5EFEC",
  },

  imagePlaceholder: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDECE7",
  },

  placeholderIcon: {
    fontSize: 55,
  },

  placeholderText: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 12,
  },

  cardContent: {
    padding: 17,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  cardTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
  },

  cardOrigin: {
    marginTop: 5,
    color: "#68746F",
    fontSize: 13,
  },

  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#DDF2EB",
  },

  catBadgeText: {
    color: "#176B5B",
    fontSize: 11,
    fontWeight: "bold",
  },

  cardDescription: {
    marginTop: 14,
    color: "#55635E",
    fontSize: 14,
    lineHeight: 21,
  },

  informationContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  informationItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F1F8F6",
  },

  informationLabel: {
    color: "#71807A",
    fontSize: 11,
  },

  informationValue: {
    marginTop: 4,
    color: "#26332F",
    fontSize: 13,
    fontWeight: "bold",
  },

  temperamentContainer: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
  },

  temperamentLabel: {
    color: "#855C00",
    fontSize: 12,
    fontWeight: "bold",
  },

  temperamentText: {
    marginTop: 5,
    color: "#655224",
    fontSize: 13,
    lineHeight: 19,
  },

  levelsContainer: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E3EBE8",
  },

  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  levelLabel: {
    color: "#68746F",
    fontSize: 13,
  },

  levelValue: {
    color: "#E09B24",
    fontSize: 14,
    letterSpacing: 1,
  },

  buttonPressed: {
    opacity: 0.78,
  },
});