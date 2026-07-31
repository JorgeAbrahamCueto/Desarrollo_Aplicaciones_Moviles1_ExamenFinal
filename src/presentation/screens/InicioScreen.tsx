import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { cerrarSesionFirebase } from "../../infrastructure/firebase/AuthService";
import { useAuth } from "../context/AuthContext";

export default function InicioScreen() {
  const {
    usuario,
    perfil,
    cargandoSesion,
  } = useAuth();

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);

  useEffect(() => {
    if (!cargandoSesion && !usuario) {
      router.replace("/");
    }
  }, [cargandoSesion, usuario]);

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
            Recuperando sesión...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const primerNombre =
    perfil?.nombres
      ?.trim()
      .split(/\s+/)[0] ??
    usuario.displayName
      ?.trim()
      .split(/\s+/)[0] ??
    "Usuario";

  const identificador = perfil?.nombreUsuario
    ? `@${perfil.nombreUsuario}`
    : usuario.email ?? "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerInformation}>
            <Text style={styles.greeting}>
              Bienvenido, {primerNombre}
            </Text>

            <Text style={styles.username}>
              {identificador}
            </Text>
          </View>

          <Text style={styles.logo}>🐾</Text>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            SumaqVet
          </Text>

          <Text style={styles.welcomeDescription}>
            Gestiona atenciones veterinarias, pedidos y
            productos para mascotas.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Módulos principales
        </Text>

        <View style={styles.modulesContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.moduleCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push("../pedidos");
            }}
          >
            <Text style={styles.moduleIcon}>🛒</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Mis Pedidos
              </Text>

              <Text style={styles.moduleDescription}>
                Registrar, consultar, actualizar y eliminar
                pedidos.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.moduleCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              // Posteriormente abrirá atenciones.
            }}
          >
            <Text style={styles.moduleIcon}>🩺</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Atenciones
              </Text>

              <Text style={styles.moduleDescription}>
                Gestionar las atenciones de las mascotas.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.moduleCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              router.push("../productos");
            }}
          >
            <Text style={styles.moduleIcon}>
              🛍️
            </Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Productos
              </Text>

              <Text style={styles.moduleDescription}>
                Explorar productos y realizar pedidos.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.moduleCard,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              // Posteriormente abrirá el perfil.
            }}
          >
            <Text style={styles.moduleIcon}>👤</Text>

            <View style={styles.moduleInformation}>
              <Text style={styles.moduleTitle}>
                Perfil
              </Text>

              <Text style={styles.moduleDescription}>
                Consultar los datos de la cuenta.
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
            cerrandoSesion && styles.buttonDisabled,
          ]}
          onPress={confirmarCerrarSesion}
          disabled={cerrandoSesion}
        >
          {cerrandoSesion ? (
            <View style={styles.loadingButtonContent}>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerInformation: {
    flex: 1,
    paddingRight: 12,
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
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
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
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

  arrow: {
    marginLeft: 8,
    color: "#176B5B",
    fontSize: 29,
    fontWeight: "400",
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

  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonPressed: {
    opacity: 0.78,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});