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
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  cerrarSesionFirebase,
} from "../../infrastructure/firebase/AuthService";

import {
  useAuth,
} from "../context/AuthContext";

export default function PerfilScreen() {
  const {
    usuario,
    perfil,
    cargandoSesion,
    recargarPerfil,
  } = useAuth();

  const [actualizando, setActualizando] =
    useState(false);

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);

  useEffect(() => {
    if (!cargandoSesion && !usuario) {
      router.replace("/");
    }
  }, [cargandoSesion, usuario]);

  async function actualizarPerfil() {
    try {
      setActualizando(true);
      await recargarPerfil();
    } catch (error) {
      console.error(
        "Error al actualizar perfil:",
        error
      );

      Alert.alert(
        "Error",
        "No se pudo actualizar la información del perfil"
      );
    } finally {
      setActualizando(false);
    }
  }

  async function ejecutarCierreSesion() {
    try {
      setCerrandoSesion(true);

      await cerrarSesionFirebase();

      router.replace("/");
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la sesión";

      Alert.alert("Error", mensaje);
    } finally {
      setCerrandoSesion(false);
    }
  }

  function confirmarCerrarSesion() {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que deseas cerrar tu sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: ejecutarCierreSesion,
        },
      ]
    );
  }

  if (cargandoSesion || !usuario) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingText}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!perfil) {
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

          <Text style={styles.headerTitle}>
            Perfil
          </Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            No pudimos cargar tu perfil
          </Text>

          <Text style={styles.errorMessage}>
            Comprueba tu conexión a Internet e
            inténtalo nuevamente.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={actualizarPerfil}
            disabled={actualizando}
          >
            {actualizando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.retryButtonText}>
                Reintentar
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const nombresCompletos =
    `${perfil.nombres} ${perfil.apellidos}`.trim();

  const iniciales = obtenerIniciales(
    perfil.nombres,
    perfil.apellidos
  );

  const fechaRegistro = formatearFecha(
    perfil.fechaRegistro
  );

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

        <Text style={styles.headerTitle}>
          Mi perfil
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={actualizarPerfil}
          disabled={actualizando}
        >
          {actualizando ? (
            <ActivityIndicator
              size="small"
              color="#176B5B"
            />
          ) : (
            <Text style={styles.refreshText}>
              ↻
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {iniciales}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {nombresCompletos}
          </Text>

          <Text style={styles.username}>
            @{perfil.nombreUsuario}
          </Text>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />

            <Text style={styles.activeText}>
              Cuenta activa
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Información de la cuenta
        </Text>

        <View style={styles.informationCard}>
          <InformationRow
            icon="👤"
            label="Nombres"
            value={perfil.nombres}
          />

          <Divider />

          <InformationRow
            icon="👥"
            label="Apellidos"
            value={perfil.apellidos}
          />

          <Divider />

          <InformationRow
            icon="🏷️"
            label="Nombre de usuario"
            value={`@${perfil.nombreUsuario}`}
          />

          <Divider />

          <InformationRow
            icon="✉️"
            label="Correo electrónico"
            value={perfil.correo}
          />

          <Divider />

          <InformationRow
            icon="📅"
            label="Fecha de registro"
            value={fechaRegistro}
          />
        </View>

        <Text style={styles.sectionTitle}>
          Acerca de la aplicación
        </Text>

        <View style={styles.applicationCard}>
          <View style={styles.applicationHeader}>
            <View style={styles.applicationIcon}>
              <Text style={styles.applicationEmoji}>
                🐾
              </Text>
            </View>

            <View style={styles.applicationTitleContainer}>
              <Text style={styles.applicationTitle}>
                Veterinaria SumaqVet
              </Text>

              <Text style={styles.applicationVersion}>
                Versión preliminar 1.0.0
              </Text>
            </View>
          </View>

          <Text style={styles.applicationDescription}>
            Aplicación móvil universitaria para
            gestionar pedidos de productos,
            controlar el inventario y consultar
            información relacionada con mascotas.
          </Text>

          <View style={styles.featureContainer}>
            <Feature text="Pedidos persistentes con SQLite" />
            <Feature text="Usuarios y perfiles con Firebase" />
            <Feature text="Sincronización con Cloud Firestore" />
            <Feature text="Catálogo comercial y control de stock" />
            <Feature text="Guía felina mediante TheCatAPI" />
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>
            🔒
          </Text>

          <View style={styles.privacyInformation}>
            <Text style={styles.privacyTitle}>
              Información protegida
            </Text>

            <Text style={styles.privacyDescription}>
              Tus pedidos locales están asociados a
              tu cuenta y se separan de los pedidos
              de otros usuarios.
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
            cerrandoSesion &&
              styles.disabledButton,
          ]}
          onPress={confirmarCerrarSesion}
          disabled={cerrandoSesion}
        >
          {cerrandoSesion ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator
                size="small"
                color="#B42318"
              />

              <Text style={styles.logoutButtonText}>
                Cerrando sesión...
              </Text>
            </View>
          ) : (
            <Text style={styles.logoutButtonText}>
              Cerrar sesión
            </Text>
          )}
        </Pressable>

        <Text style={styles.footerText}>
          Proyecto académico · SumaqVet
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InformationRowProps {
  icon: string;
  label: string;
  value: string;
}

function InformationRow({
  icon,
  label,
  value,
}: InformationRowProps) {
  return (
    <View style={styles.informationRow}>
      <View style={styles.informationIcon}>
        <Text style={styles.informationEmoji}>
          {icon}
        </Text>
      </View>

      <View style={styles.informationContent}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text style={styles.informationValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View style={styles.divider} />
  );
}

interface FeatureProps {
  text: string;
}

function Feature({
  text,
}: FeatureProps) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureCheck}>
        ✓
      </Text>

      <Text style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
}

function obtenerIniciales(
  nombres: string,
  apellidos: string
): string {
  const primeraInicial =
    nombres.trim().charAt(0);

  const segundaInicial =
    apellidos.trim().charAt(0);

  return (
    `${primeraInicial}${segundaInicial}`
      .toUpperCase() || "US"
  );
}

function formatearFecha(
  fecha: string
): string {
  const resultado = new Date(fecha);

  if (Number.isNaN(resultado.getTime())) {
    return "No disponible";
  }

  return resultado.toLocaleDateString(
    "es-PE",
    {
      day: "2-digit",
      month: "long",
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
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    color: "#68746F",
    fontSize: 15,
  },

  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    minWidth: 76,
    paddingVertical: 8,
  },

  backText: {
    color: "#176B5B",
    fontSize: 16,
    fontWeight: "600",
  },

  headerTitle: {
    flex: 1,
    color: "#176B5B",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },

  headerSpace: {
    width: 76,
  },

  refreshButton: {
    width: 76,
    alignItems: "flex-end",
    paddingVertical: 8,
  },

  refreshText: {
    color: "#176B5B",
    fontSize: 25,
    fontWeight: "bold",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  profileCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#176B5B",
    elevation: 3,
  },

  avatar: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: 41,
    backgroundColor: "#E1F3ED",
  },

  avatarText: {
    color: "#176B5B",
    fontSize: 27,
    fontWeight: "bold",
  },

  profileName: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },

  username: {
    marginTop: 5,
    color: "#D6EAE5",
    fontSize: 14,
  },

  activeBadge: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
  },

  activeDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: 4,
    backgroundColor: "#219653",
  },

  activeText: {
    color: "#176B5B",
    fontSize: 11,
    fontWeight: "bold",
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  informationCard: {
    paddingHorizontal: 17,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  informationRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },

  informationIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#E5F2EE",
  },

  informationEmoji: {
    fontSize: 19,
  },

  informationContent: {
    flex: 1,
    marginLeft: 13,
  },

  informationLabel: {
    color: "#71807A",
    fontSize: 12,
  },

  informationValue: {
    marginTop: 4,
    color: "#26332F",
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginLeft: 55,
    backgroundColor: "#E5ECE9",
  },

  applicationCard: {
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  applicationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  applicationIcon: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#DDF1EB",
  },

  applicationEmoji: {
    fontSize: 27,
  },

  applicationTitleContainer: {
    flex: 1,
    marginLeft: 13,
  },

  applicationTitle: {
    color: "#176B5B",
    fontSize: 17,
    fontWeight: "bold",
  },

  applicationVersion: {
    marginTop: 3,
    color: "#7A8782",
    fontSize: 12,
  },

  applicationDescription: {
    marginTop: 15,
    color: "#586660",
    fontSize: 14,
    lineHeight: 21,
  },

  featureContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5ECE9",
    gap: 9,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  featureCheck: {
    width: 22,
    color: "#176B5B",
    fontSize: 15,
    fontWeight: "bold",
  },

  featureText: {
    flex: 1,
    color: "#53615C",
    fontSize: 13,
  },

  privacyCard: {
    marginTop: 18,
    flexDirection: "row",
    padding: 16,
    borderRadius: 15,
    backgroundColor: "#E4F0FF",
  },

  privacyIcon: {
    marginRight: 12,
    fontSize: 24,
  },

  privacyInformation: {
    flex: 1,
  },

  privacyTitle: {
    color: "#175A8C",
    fontSize: 14,
    fontWeight: "bold",
  },

  privacyDescription: {
    marginTop: 5,
    color: "#41657D",
    fontSize: 12,
    lineHeight: 18,
  },

  logoutButton: {
    minHeight: 52,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D92D20",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  logoutButtonText: {
    color: "#B42318",
    fontSize: 15,
    fontWeight: "bold",
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  footerText: {
    marginTop: 20,
    color: "#84908C",
    fontSize: 12,
    textAlign: "center",
  },

  errorIcon: {
    fontSize: 50,
  },

  errorTitle: {
    marginTop: 16,
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 9,
    color: "#68746F",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },

  retryButton: {
    minHeight: 49,
    marginTop: 23,
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

  buttonPressed: {
    opacity: 0.78,
  },
});