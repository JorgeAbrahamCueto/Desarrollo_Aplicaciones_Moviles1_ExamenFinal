import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import { registrarUsuario } from "../../infrastructure/database/UsuarioRepository";
import { guardarSesion } from "../../infrastructure/database/SesionRepository";
import {
  formularioTieneErrores,
  RegistroErrors,
  RegistroForm,
  validarRegistro,
} from "../../shared/validation/usuarioValidation";

const INITIAL_FORM: RegistroForm = {
  nombres: "",
  apellidos: "",
  nombreUsuario: "",
  password: "",
  confirmarPassword: "",
};

export default function RegistroScreen() {
  const database = useSQLiteContext();

  const [form, setForm] =
    useState<RegistroForm>(INITIAL_FORM);

  const [errores, setErrores] =
    useState<RegistroErrors>({});

  const [guardando, setGuardando] = useState(false);
  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  function actualizarCampo(
    campo: keyof RegistroForm,
    valor: string
  ) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setErrores((actual) => ({
      ...actual,
      [campo]: undefined,
    }));
  }

async function guardarUsuario() {
  const erroresEncontrados = validarRegistro(form);

  if (formularioTieneErrores(erroresEncontrados)) {
    setErrores(erroresEncontrados);
    return;
  }

  try {
    setGuardando(true);

    const usuario = await registrarUsuario(database, {
      nombres: form.nombres,
      apellidos: form.apellidos,
      nombreUsuario: form.nombreUsuario,
      password: form.password,
    });

    await guardarSesion(database, usuario.id);

    const primerNombre =
      usuario.nombres.trim().split(/\s+/)[0];

    Alert.alert(
      "Registro exitoso",
      `Cuenta creada correctamente. Bienvenido, ${primerNombre}`,
      [
        {
          text: "Continuar",
          onPress: () => {
            router.replace("../inicio");
          },
        },
      ]
    );
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No se pudo registrar el usuario";

    Alert.alert("Error", mensaje);
  } finally {
    setGuardando(false);
  }
}

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Volver</Text>
          </Pressable>

          <Text style={styles.logo}>🐾</Text>

          <Text style={styles.title}>
            Crear una cuenta
          </Text>

          <Text style={styles.subtitle}>
            Regístrate para gestionar las atenciones y
            pedidos de Veterinaria Patitas.
          </Text>

          <View style={styles.form}>
            <Campo
              label="Nombres"
              placeholder="Ejemplo: Juan Pedro"
              value={form.nombres}
              error={errores.nombres}
              onChangeText={(value) =>
                actualizarCampo("nombres", value)
              }
            />

            <Campo
              label="Apellidos"
              placeholder="Ejemplo: Perez López"
              value={form.apellidos}
              error={errores.apellidos}
              onChangeText={(value) =>
                actualizarCampo("apellidos", value)
              }
            />

            <Campo
              label="Nombre de usuario"
              placeholder="Ejemplo: jperez"
              value={form.nombreUsuario}
              error={errores.nombreUsuario}
              autoCapitalize="none"
              onChangeText={(value) =>
                actualizarCampo("nombreUsuario", value)
              }
            />

            <Campo
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              error={errores.password}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              onChangeText={(value) =>
                actualizarCampo("password", value)
              }
            />

            <Campo
              label="Confirmar contraseña"
              placeholder="Repita su contraseña"
              value={form.confirmarPassword}
              error={errores.confirmarPassword}
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              onChangeText={(value) =>
                actualizarCampo(
                  "confirmarPassword",
                  value
                )
              }
            />

            <Pressable
              onPress={() =>
                setMostrarPassword((actual) => !actual)
              }
            >
              <Text style={styles.showPassword}>
                {mostrarPassword
                  ? "Ocultar contraseñas"
                  : "Mostrar contraseñas"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                guardando && styles.buttonDisabled,
              ]}
              onPress={guardarUsuario}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Registrarme
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface CampoProps {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  onChangeText: (value: string) => void;
}

function Campo({
  label,
  placeholder,
  value,
  error,
  secureTextEntry,
  autoCapitalize = "words",
  onChangeText,
}: CampoProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : undefined,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#8A9692"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F8F6",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  backText: {
    color: "#176B5B",
    fontSize: 16,
    fontWeight: "600",
  },
  logo: {
    marginTop: 12,
    fontSize: 52,
    textAlign: "center",
  },
  title: {
    marginTop: 12,
    color: "#176B5B",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "#5D6865",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    marginTop: 26,
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 17,
  },
  label: {
    marginBottom: 7,
    color: "#26332F",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 12,
    color: "#1E2926",
    backgroundColor: "#FAFCFB",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#C62828",
  },
  errorText: {
    marginTop: 5,
    color: "#C62828",
    fontSize: 13,
  },
  showPassword: {
    marginTop: -4,
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});