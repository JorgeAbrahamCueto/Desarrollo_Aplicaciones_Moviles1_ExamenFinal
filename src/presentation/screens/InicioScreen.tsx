import {
  useCallback,
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

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import type { Usuario } from "../../domain/models/Usuario";

import {
  cerrarSesion,
  obtenerUsuarioSesion,
} from "../../infrastructure/database/SesionRepository";

export default function InicioScreen() {
  const database = useSQLiteContext();

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarSesion = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      const usuarioSesion =
        await obtenerUsuarioSesion(database);

      if (!usuarioSesion) {
        router.replace("/");
        return;
      }

      setUsuario(usuarioSesion);
    } catch (caughtError) {
      console.error(
        "Error al recuperar la sesión:",
        caughtError
      );

      setError(
        "No se pudo recuperar la información del usuario"
      );
    } finally {
      setCargando(false);
    }
  }, [database]);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

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
          onPress: async () => {
            try {
              await cerrarSesion(database);

              router.replace("/");
            } catch (caughtError) {
              console.error(
                "Error al cerrar sesión:",
                caughtError
              );

              Alert.alert(
                "Error",
                "No se pudo cerrar la sesión"
              );
            }
          },
        },
      ]
    );
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
            Recuperando sesión...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>
            Ocurrió un problema
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={cargarSesion}
          >
            <Text style={styles.retryButtonText}>
              Reintentar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const primerNombre =
    usuario?.nombres.trim().split(/\s+/)[0] ?? "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bienvenido, {primerNombre}
            </Text>

            <Text style={styles.username}>
              @{usuario?.nombreUsuario}
            </Text>
          </View>

          <Text style={styles.logo}>🐾</Text>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Veterinaria Patitas
          </Text>

          <Text style={styles.welcomeDescription}>
            Gestiona las atenciones veterinarias y los
            pedidos de productos para mascotas.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Módulos principales
        </Text>

        <View style={styles.modulesContainer}>
          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🛒</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Pedidos
              </Text>

              <Text style={styles.moduleDescription}>
                Registrar, consultar, editar y eliminar
                pedidos.
              </Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🩺</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Atenciones
              </Text>

              <Text style={styles.moduleDescription}>
                Gestionar las atenciones de las mascotas.
              </Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>🐶</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Catálogo
              </Text>

              <Text style={styles.moduleDescription}>
                Consultar información externa desde una
                API REST.
              </Text>
            </View>
          </View>

          <View style={styles.moduleCard}>
            <Text style={styles.moduleIcon}>👤</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Perfil
              </Text>

              <Text style={styles.moduleDescription}>
                Ver los datos del usuario registrado.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={confirmarCerrarSesion}
        >
          <Text style={styles.logoutButtonText}>
            Cerrar sesión
          </Text>
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
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 14,
    color: "#5D6865",
    fontSize: 15,
  },

  errorTitle: {
    color: "#B42318",
    fontSize: 21,
    fontWeight: "bold",
  },

  errorText: {
    marginTop: 10,
    color: "#5D6865",
    fontSize: 15,
    lineHeight: 22,
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  greeting: {
    color: "#176B5B",
    fontSize: 25,
    fontWeight: "bold",
  },

  username: {
    marginTop: 4,
    color: "#67746F",
    fontSize: 14,
  },

  logo: {
    fontSize: 42,
  },

  welcomeCard: {
    marginTop: 26,
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#176B5B",
    elevation: 3,
  },

  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
  },

  welcomeDescription: {
    marginTop: 9,
    color: "#E4F2EE",
    fontSize: 15,
    lineHeight: 22,
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 14,
    color: "#26332F",
    fontSize: 19,
    fontWeight: "bold",
  },

  modulesContainer: {
    gap: 13,
  },

  moduleCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  moduleIcon: {
    width: 53,
    fontSize: 32,
    textAlign: "center",
  },

  moduleInformation: {
    flex: 1,
    marginLeft: 12,
  },

  moduleTitle: {
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  moduleDescription: {
    marginTop: 4,
    color: "#68746F",
    fontSize: 13,
    lineHeight: 19,
  },

  logoutButton: {
    minHeight: 51,
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#B42318",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  logoutButtonText: {
    color: "#B42318",
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.78,
  },
});