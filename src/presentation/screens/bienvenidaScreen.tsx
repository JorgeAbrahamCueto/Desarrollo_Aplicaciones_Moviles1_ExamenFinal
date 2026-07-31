import { useEffect } from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";

export default function BienvenidaScreen() {
  const {
    usuario,
    cargandoSesion,
  } = useAuth();

  useEffect(() => {
    if (!cargandoSesion && usuario) {
      router.replace("/inicio");
    }
  }, [cargandoSesion, usuario]);

  if (cargandoSesion || usuario) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingLogo}>🐾</Text>

          <ActivityIndicator
            size="large"
            color="#176B5B"
          />

          <Text style={styles.loadingText}>
            Verificando sesión...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>🐾</Text>

          <Text style={styles.title}>
            Veterinaria SumaqVet
          </Text>

          <Text style={styles.subtitle}>
            Donde cuidamos a nuestros amiguitos peludos
            como ellos nos cuidan.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/registro")}
          >
            <Text style={styles.primaryButtonText}>
              Crear cuenta
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryButtonText}>
              Iniciar sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogo: {
    marginBottom: 24,
    fontSize: 65,
  },

  loadingText: {
    marginTop: 13,
    color: "#5D6865",
    fontSize: 15,
  },

  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 90,
    paddingBottom: 38,
  },

  content: {
    alignItems: "center",
  },

  logo: {
    fontSize: 82,
  },

  title: {
    marginTop: 20,
    color: "#176B5B",
    fontSize: 31,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 16,
    color: "#596762",
    fontSize: 17,
    lineHeight: 25,
    textAlign: "center",
  },

  actions: {
    gap: 14,
  },

  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  secondaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#176B5B",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#176B5B",
    fontSize: 17,
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.8,
  },
});