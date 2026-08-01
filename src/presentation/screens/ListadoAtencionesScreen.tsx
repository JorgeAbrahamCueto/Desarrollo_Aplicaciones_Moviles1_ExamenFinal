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
  Atencion,
  EstadoAtencion,
  TipoAtencion,
} from "../../domain/models/Atencion";

import {
  listarAtenciones,
} from "../../infrastructure/database/AtencionRepository";

import {
  useAuth,
} from "../context/AuthContext";

export default function ListadoAtencionesScreen() {
  const database = useSQLiteContext();
  const { usuario } = useAuth();

  const [atenciones, setAtenciones] =
    useState<Atencion[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const cargarAtenciones = useCallback(
    async (
      mostrarCarga = true
    ): Promise<void> => {
      if (!usuario) {
        setAtenciones([]);
        setCargando(false);
        setActualizando(false);
        return;
      }

      try {
        if (mostrarCarga) {
          setCargando(true);
        }

        setError("");

        const resultado =
          await listarAtenciones(
            database,
            usuario.uid
          );

        setAtenciones(resultado);
      } catch (caughtError) {
        console.error(
          "Error al listar atenciones:",
          caughtError
        );

        setError(
          "No se pudieron cargar las atenciones."
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

  /*
   * Vuelve a consultar SQLite cada vez que esta
   * pantalla recupera el enfoque.
   *
   * Esto permite ver inmediatamente los cambios
   * realizados en crear, editar, cancelar o eliminar.
   */
  useFocusEffect(
    useCallback(() => {
      void cargarAtenciones();
    }, [cargarAtenciones])
  );

  async function actualizarListado():
  Promise<void> {
    setActualizando(true);

    await cargarAtenciones(false);
  }

  function abrirDetalle(
    atencionId: number
  ): void {
    router.push({
      pathname: "/atenciones/[id]",
      params: {
        id: String(atencionId),
      },
    });
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
            Cargando atenciones...
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
            No pudimos cargar tus atenciones
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
            onPress={() => {
              void cargarAtenciones();
            }}
          >
            <Text style={styles.retryText}>
              Reintentar
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.errorBackButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.errorBackText}>
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
          style={styles.headerInformation}
        >
          <Text style={styles.title}>
            Mis atenciones
          </Text>

          <Text style={styles.subtitle}>
            {atenciones.length === 1
              ? "1 atención registrada"
              : `${atenciones.length} atenciones registradas`}
          </Text>
        </View>

        <Text style={styles.headerIcon}>
          🩺
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          atenciones.length === 0 &&
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
        {atenciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🐾
            </Text>

            <Text style={styles.emptyTitle}>
              No tienes atenciones programadas
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              Solicita una cita veterinaria para
              cuidar la salud de tu mascota.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(
                  "/atenciones/crear"
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Solicitar atención
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {atenciones.map(
              (atencion) => (
                <Pressable
                  key={atencion.id}
                  style={({ pressed }) => [
                    styles.cardPressable,
                    pressed &&
                      styles.cardPressed,
                  ]}
                  onPress={() =>
                    abrirDetalle(
                      atencion.id
                    )
                  }
                >
                  <AtencionCard
                    atencion={atencion}
                  />
                </Pressable>
              )
            )}
          </View>
        )}
      </ScrollView>

      {atenciones.length > 0 ? (
        <Pressable
          style={({ pressed }) => [
            styles.floatingButton,
            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            router.push(
              "/atenciones/crear"
            )
          }
        >
          <Text style={styles.floatingIcon}>
            ＋
          </Text>

          <Text style={styles.floatingText}>
            Nueva atención
          </Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

interface AtencionCardProps {
  atencion: Atencion;
}

function AtencionCard({
  atencion,
}: AtencionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={styles.petIconContainer}
        >
          <Text style={styles.petIcon}>
            {obtenerIconoEspecie(
              atencion.especie
            )}
          </Text>
        </View>

        <View
          style={styles.cardTitleContainer}
        >
          <Text
            style={styles.petName}
            numberOfLines={1}
          >
            {atencion.mascotaNombre}
          </Text>

          <Text
            style={styles.serviceName}
            numberOfLines={1}
          >
            {obtenerServicio(
              atencion.tipoAtencion
            )}
          </Text>
        </View>

        <EstadoBadge
          estado={atencion.estado}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.dateRow}>
        <View style={styles.dateInformation}>
          <Text style={styles.dataIcon}>
            📅
          </Text>

          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>
              Fecha
            </Text>

            <Text style={styles.dataValue}>
              {formatearFecha(
                atencion.fechaAtencion
              )}
            </Text>
          </View>
        </View>

        <View style={styles.dateInformation}>
          <Text style={styles.dataIcon}>
            🕐
          </Text>

          <View style={styles.dataTextContainer}>
            <Text style={styles.dataLabel}>
              Hora
            </Text>

            <Text style={styles.dataValue}>
              {atencion.horaAtencion}
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={styles.reasonText}
        numberOfLines={2}
      >
        {atencion.motivo}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.localText}>
          📱 Guardado localmente
        </Text>

        <Text style={styles.detailLink}>
          Ver detalle ›
        </Text>
      </View>
    </View>
  );
}

interface EstadoBadgeProps {
  estado: EstadoAtencion;
}

function EstadoBadge({
  estado,
}: EstadoBadgeProps) {
  const configuracion = {
    SOLICITADA: {
      texto: "Solicitada",
      fondo: "#FFF4CC",
      color: "#855C00",
    },

    CONFIRMADA: {
      texto: "Confirmada",
      fondo: "#DCEEFF",
      color: "#175A8C",
    },

    ATENDIDA: {
      texto: "Atendida",
      fondo: "#DDF6E8",
      color: "#176B43",
    },

    CANCELADA: {
      texto: "Cancelada",
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

function obtenerServicio(
  tipo: TipoAtencion
): string {
  const servicios: Record<
    TipoAtencion,
    string
  > = {
    CONSULTA_GENERAL:
      "Consulta general",

    VACUNACION:
      "Vacunación",

    DESPARASITACION:
      "Desparasitación",

    CONTROL:
      "Control veterinario",

    EMERGENCIA:
      "Emergencia",
  };

  return servicios[tipo];
}

function obtenerIconoEspecie(
  especie: Atencion["especie"]
): string {
  if (especie === "PERRO") {
    return "🐶";
  }

  if (especie === "GATO") {
    return "🐱";
  }

  return "🐾";
}

function formatearFecha(
  fecha: string
): string {
  const partes = fecha
    .split("-")
    .map(Number);

  if (
    partes.length !== 3 ||
    partes.some(
      (parte) =>
        !Number.isFinite(parte)
    )
  ) {
    return fecha;
  }

  const resultado = new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  );

  return resultado.toLocaleDateString(
    "es-PE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
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
    color: "#68746F",
    fontSize: 15,
  },

  errorIcon: {
    fontSize: 48,
  },

  errorTitle: {
    marginTop: 15,
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  retryButton: {
    minHeight: 48,
    marginTop: 22,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#176B5B",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  errorBackButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    paddingTop: 10,
    paddingBottom: 16,
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
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 2,
    color: "#68746F",
    fontSize: 12,
  },

  headerIcon: {
    marginLeft: 8,
    fontSize: 33,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 105,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  emptyIcon: {
    fontSize: 67,
  },

  emptyTitle: {
    marginTop: 17,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  emptyDescription: {
    marginTop: 9,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 51,
    marginTop: 24,
    paddingHorizontal: 26,
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

  listContainer: {
    gap: 14,
  },

  cardPressable: {
    borderRadius: 17,
  },

  cardPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  card: {
    padding: 17,
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  petIconContainer: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#E4F2EE",
  },

  petIcon: {
    fontSize: 25,
  },

  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  petName: {
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  serviceName: {
    marginTop: 3,
    color: "#68746F",
    fontSize: 12,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: "#E5ECE9",
  },

  dateRow: {
    flexDirection: "row",
    gap: 20,
  },

  dateInformation: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  dataIcon: {
    marginRight: 8,
    fontSize: 18,
  },

  dataTextContainer: {
    flex: 1,
  },

  dataLabel: {
    color: "#7A8782",
    fontSize: 10,
  },

  dataValue: {
    marginTop: 2,
    color: "#35423E",
    fontSize: 12,
    fontWeight: "bold",
  },

  reasonText: {
    marginTop: 14,
    color: "#5E6B66",
    fontSize: 12,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5ECE9",
  },

  localText: {
    flex: 1,
    color: "#7A8782",
    fontSize: 11,
  },

  detailLink: {
    marginLeft: 10,
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  floatingIcon: {
    marginRight: 7,
    color: "#FFFFFF",
    fontSize: 22,
  },

  floatingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.78,
  },
});