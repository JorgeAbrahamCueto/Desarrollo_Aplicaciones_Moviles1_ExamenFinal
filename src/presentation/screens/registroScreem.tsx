import { router } from "expo-router";
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

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  registrarUsuarioFirebase,
} from "../../infrastructure/firebase/AuthService";

import {
  guardarPerfilUsuario,
} from "../../infrastructure/firebase/PerfilService";

import {
  formularioTieneErrores,
  validarRegistro,
} from "../../shared/validation/usuarioValidation";

import type {
  RegistroErrors,
  RegistroForm,
} from "../../shared/validation/usuarioValidation";

import {
  useAuth,
} from "../context/AuthContext";

const INITIAL_FORM: RegistroForm = {
  nombres: "",
  apellidos: "",
  nombreUsuario: "",
  correo: "",
  password: "",
  confirmarPassword: "",
};

export default function RegistroScreen() {
  const {
    recargarPerfil,
  } = useAuth();

  const [form, setForm] =
    useState<RegistroForm>(
      INITIAL_FORM
    );

  const [errores, setErrores] =
    useState<RegistroErrors>({});

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  function actualizarCampo(
    campo: keyof RegistroForm,
    valor: string
  ) {
    setForm((formActual) => ({
      ...formActual,
      [campo]: valor,
    }));

    setErrores(
      (erroresActuales) => ({
        ...erroresActuales,
        [campo]: undefined,
      })
    );
  }

  async function guardarUsuario() {
    const erroresEncontrados =
      validarRegistro(form);

    if (
      formularioTieneErrores(
        erroresEncontrados
      )
    ) {
      setErrores(
        erroresEncontrados
      );

      return;
    }

    try {
      setGuardando(true);

      const usuarioFirebase =
        await registrarUsuarioFirebase({
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo,
          password: form.password,
        });

      await guardarPerfilUsuario({
        uid: usuarioFirebase.uid,
        nombres: form.nombres,
        apellidos: form.apellidos,
        nombreUsuario:
          form.nombreUsuario,
        correo: form.correo,
      });

      await recargarPerfil();

      const primerNombre =
        form.nombres
          .trim()
          .split(/\s+/)[0];

      Alert.alert(
        "Registro exitoso",
        `Tu cuenta fue creada correctamente. Bienvenido, ${primerNombre}`,
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace(
                "/inicio"
              );
            },
          },
        ]
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la cuenta";

      Alert.alert(
        "Error al registrarse",
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() =>
              router.back()
            }
            disabled={guardando}
          >
            <Text
              style={styles.backText}
            >
              ‹ Volver
            </Text>
          </Pressable>

          <Text style={styles.logo}>
            🐶🐱
          </Text>

          <Text style={styles.title}>
            Crear una cuenta
          </Text>

          <Text
            style={styles.subtitle}
          >
            Regístrate para gestionar
            atenciones y pedidos de
            SumaqVet.
          </Text>

          <View style={styles.form}>
            <Campo
              label="Nombres"
              placeholder="Ejemplo: Juan Lucho"
              value={form.nombres}
              error={errores.nombres}
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "nombres",
                  value
                )
              }
            />

            <Campo
              label="Apellidos"
              placeholder="Ejemplo: Pérez López"
              value={form.apellidos}
              error={errores.apellidos}
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "apellidos",
                  value
                )
              }
            />

            <Campo
              label="Nombre de usuario"
              placeholder="Ejemplo: jperez"
              value={
                form.nombreUsuario
              }
              error={
                errores.nombreUsuario
              }
              autoCapitalize="none"
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "nombreUsuario",
                  value
                )
              }
            />

            <Campo
              label="Correo electrónico"
              placeholder="Ejemplo: jperez@gmail.com"
              value={form.correo}
              error={errores.correo}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "correo",
                  value
                )
              }
            />

            <Campo
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              error={errores.password}
              secureTextEntry={
                !mostrarPassword
              }
              autoCapitalize="none"
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "password",
                  value
                )
              }
            />

            <Campo
              label="Confirmar contraseña"
              placeholder="Repita su contraseña"
              value={
                form.confirmarPassword
              }
              error={
                errores.confirmarPassword
              }
              secureTextEntry={
                !mostrarPassword
              }
              autoCapitalize="none"
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "confirmarPassword",
                  value
                )
              }
            />

            <Pressable
              style={({ pressed }) => [
                styles.showPasswordButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                setMostrarPassword(
                  (valorActual) =>
                    !valorActual
                )
              }
              disabled={guardando}
            >
              <Text
                style={
                  styles.showPassword
                }
              >
                {mostrarPassword
                  ? "Ocultar contraseñas"
                  : "Mostrar contraseñas"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
                guardando &&
                  styles.buttonDisabled,
              ]}
              onPress={guardarUsuario}
              disabled={guardando}
            >
              {guardando ? (
                <View
                  style={
                    styles.loadingContent
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Creando cuenta...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Registrarme
                </Text>
              )}
            </Pressable>

            <View
              style={
                styles.loginContainer
              }
            >
              <Text
                style={
                  styles.loginQuestion
                }
              >
                ¿Ya tienes una cuenta?
              </Text>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.loginButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  router.replace(
                    "/login"
                  )
                }
                disabled={guardando}
              >
                <Text
                  style={
                    styles.loginText
                  }
                >
                  Iniciar sesión
                </Text>
              </Pressable>
            </View>
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
  editable?: boolean;

  autoCapitalize?:
    | "none"
    | "sentences"
    | "words";

  keyboardType?:
    | "default"
    | "email-address"
    | "numeric";

  onChangeText:
    (value: string) => void;
}

function Campo({
  label,
  placeholder,
  value,
  error,
  secureTextEntry,
  editable = true,
  autoCapitalize = "words",
  keyboardType = "default",
  onChangeText,
}: CampoProps) {
  return (
    <View
      style={
        styles.fieldContainer
      }
    >
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        style={[
          styles.input,

          error
            ? styles.inputError
            : undefined,

          !editable
            ? styles.inputDisabled
            : undefined,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#8A9692"
        value={value}
        editable={editable}
        secureTextEntry={
          secureTextEntry
        }
        autoCapitalize={
          autoCapitalize
        }
        autoCorrect={false}
        keyboardType={
          keyboardType
        }
        onChangeText={
          onChangeText
        }
      />

      {error ? (
        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
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
      paddingHorizontal: 4,
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
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 5,
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
      backgroundColor: "#FFF8F8",
    },

    inputDisabled: {
      opacity: 0.65,
    },

    errorText: {
      marginTop: 5,
      color: "#C62828",
      fontSize: 13,
    },

    showPasswordButton: {
      alignSelf: "flex-end",
      marginTop: -4,
      paddingVertical: 5,
    },

    showPassword: {
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

    loadingContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    loginContainer: {
      marginTop: 22,
      alignItems: "center",
    },

    loginQuestion: {
      color: "#64716D",
      fontSize: 14,
    },

    loginButton: {
      marginTop: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    loginText: {
      color: "#176B5B",
      fontSize: 15,
      fontWeight: "bold",
    },

    buttonPressed: {
      opacity: 0.8,
    },

    buttonDisabled: {
      opacity: 0.65,
    },
  });