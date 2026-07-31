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
  iniciarSesionFirebase,
} from "../../infrastructure/firebase/AuthService";

import {
  validarLogin,
} from "../../shared/validation/usuarioValidation";

import type {
  LoginErrors,
  LoginForm,
} from "../../shared/validation/usuarioValidation";

const INITIAL_FORM: LoginForm = {
  correo: "",
  password: "",
};

export default function LoginScreen() {
  const [form, setForm] =
    useState<LoginForm>(
      INITIAL_FORM
    );

  const [errores, setErrores] =
    useState<LoginErrors>({});

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  function actualizarCampo(
    campo: keyof LoginForm,
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

  async function iniciarSesion() {
    const erroresEncontrados =
      validarLogin(form);

    if (
      Object.keys(
        erroresEncontrados
      ).length > 0
    ) {
      setErrores(
        erroresEncontrados
      );

      return;
    }

    try {
      setCargando(true);

      const usuario =
        await iniciarSesionFirebase(
          form.correo,
          form.password
        );

      const primerNombre =
        usuario.displayName
          ?.trim()
          .split(/\s+/)[0] ??
        "Usuario";

      Alert.alert(
        "Inicio de sesión correcto",
        `Bienvenido, ${primerNombre}`,
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
          : "No se pudo iniciar sesión";

      Alert.alert(
        "Error al iniciar sesión",
        mensaje
      );
    } finally {
      setCargando(false);
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
            disabled={cargando}
          >
            <Text
              style={styles.backText}
            >
              ‹ Volver
            </Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>
              🐾
            </Text>

            <Text style={styles.title}>
              Iniciar sesión
            </Text>

            <Text
              style={styles.subtitle}
            >
              Ingresa con el correo y la
              contraseña que registraste.
            </Text>
          </View>

          <View style={styles.form}>
            <View
              style={
                styles.fieldContainer
              }
            >
              <Text
                style={styles.label}
              >
                Correo electrónico
              </Text>

              <TextInput
                style={[
                  styles.input,

                  errores.correo
                    ? styles.inputError
                    : undefined,
                ]}
                placeholder="Ejemplo: jperez@gmail.com"
                placeholderTextColor="#8A9692"
                value={form.correo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!cargando}
                onChangeText={(
                  valor
                ) =>
                  actualizarCampo(
                    "correo",
                    valor
                  )
                }
              />

              {errores.correo ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errores.correo}
                </Text>
              ) : null}
            </View>

            <View
              style={
                styles.fieldContainer
              }
            >
              <Text
                style={styles.label}
              >
                Contraseña
              </Text>

              <TextInput
                style={[
                  styles.input,

                  errores.password
                    ? styles.inputError
                    : undefined,
                ]}
                placeholder="Ingrese su contraseña"
                placeholderTextColor="#8A9692"
                value={form.password}
                secureTextEntry={
                  !mostrarPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                editable={!cargando}
                onSubmitEditing={
                  iniciarSesion
                }
                onChangeText={(
                  valor
                ) =>
                  actualizarCampo(
                    "password",
                    valor
                  )
                }
              />

              {errores.password ? (
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {errores.password}
                </Text>
              ) : null}
            </View>

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
              disabled={cargando}
            >
              <Text
                style={
                  styles.showPasswordText
                }
              >
                {mostrarPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
                cargando &&
                  styles.buttonDisabled,
              ]}
              onPress={iniciarSesion}
              disabled={cargando}
            >
              {cargando ? (
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
                    Ingresando...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Ingresar
                </Text>
              )}
            </Pressable>

            <View
              style={
                styles.registerContainer
              }
            >
              <Text
                style={
                  styles.registerQuestion
                }
              >
                ¿Todavía no tienes una
                cuenta?
              </Text>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.registerButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  router.push(
                    "/registro"
                  )
                }
                disabled={cargando}
              >
                <Text
                  style={
                    styles.registerText
                  }
                >
                  Regístrate
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      paddingVertical: 10,
    },

    backText: {
      color: "#176B5B",
      fontSize: 16,
      fontWeight: "600",
    },

    header: {
      alignItems: "center",
      marginTop: 30,
    },

    logo: {
      fontSize: 60,
    },

    title: {
      marginTop: 16,
      color: "#176B5B",
      fontSize: 29,
      fontWeight: "bold",
      textAlign: "center",
    },

    subtitle: {
      maxWidth: 330,
      marginTop: 10,
      color: "#5D6865",
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },

    form: {
      marginTop: 34,
      padding: 22,
      borderRadius: 20,
      backgroundColor: "#FFFFFF",
      elevation: 3,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 5,
    },

    fieldContainer: {
      marginBottom: 18,
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

    showPasswordText: {
      color: "#176B5B",
      fontSize: 14,
      fontWeight: "600",
    },

    primaryButton: {
      minHeight: 52,
      marginTop: 22,
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

    registerContainer: {
      marginTop: 24,
      alignItems: "center",
    },

    registerQuestion: {
      color: "#64716D",
      fontSize: 14,
    },

    registerButton: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    registerText: {
      color: "#176B5B",
      fontSize: 15,
      fontWeight: "bold",
    },

    buttonPressed: {
      opacity: 0.78,
    },

    buttonDisabled: {
      opacity: 0.65,
    },
  });