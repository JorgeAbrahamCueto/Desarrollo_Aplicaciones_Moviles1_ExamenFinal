import {
  useState,
} from "react";

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
  type KeyboardTypeOptions,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useSQLiteContext,
} from "expo-sqlite";

import {
  ESTADOS_PEDIDO,
  type EstadoPedido,
} from "../../domain/models/Pedido";

import {
  crearPedido,
} from "../../infrastructure/database/PedidoRepository";

import {
  pedidoTieneErrores,
  validarPedido,
  type PedidoForm,
  type PedidoFormErrors,
} from "../../shared/validation/pedidoValidation";

import {
  useAuth,
} from "../context/AuthContext";

const INITIAL_FORM: PedidoForm = {
  clienteNombre: "",
  producto: "",
  cantidad: "",
  precio: "",
  estado: "PENDIENTE",
};

const ESTADO_LABELS: Record<
  EstadoPedido,
  string
> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export default function CrearPedidoScreen() {
  const database = useSQLiteContext();
  const { usuario } = useAuth();

  const [form, setForm] =
    useState<PedidoForm>(INITIAL_FORM);

  const [errores, setErrores] =
    useState<PedidoFormErrors>({});

  const [guardando, setGuardando] =
    useState(false);

  function actualizarCampo(
    campo: keyof PedidoForm,
    valor: string
  ) {
    setForm((formActual) => ({
      ...formActual,
      [campo]: valor,
    }));

    setErrores((erroresActuales) => ({
      ...erroresActuales,
      [campo]: undefined,
    }));
  }

  function seleccionarEstado(
    estado: EstadoPedido
  ) {
    setForm((formActual) => ({
      ...formActual,
      estado,
    }));

    setErrores((erroresActuales) => ({
      ...erroresActuales,
      estado: undefined,
    }));
  }

  async function guardarPedido() {
    const erroresEncontrados =
      validarPedido(form);

    if (
      pedidoTieneErrores(
        erroresEncontrados
      )
    ) {
      setErrores(erroresEncontrados);
      return;
    }

    if (!usuario) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión para registrar pedidos"
      );

      router.replace("/");
      return;
    }

    const cantidad = Number(
      form.cantidad
    );

    const precio = Number(
      form.precio.replace(",", ".")
    );

    try {
      setGuardando(true);

      const pedido = await crearPedido(
        database,
        {
          usuarioUid: usuario.uid,
          clienteNombre:
            form.clienteNombre,
          producto: form.producto,
          cantidad,
          precio,
          estado: form.estado,
        }
      );

      Alert.alert(
        "Pedido registrado",
        `El pedido #${pedido.id} se guardó correctamente en SQLite.`,
        [
          {
            text: "Ver pedidos",
            onPress: () => {
              router.replace("../pedidos");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Error al crear pedido:",
        error
      );

      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el pedido";

      Alert.alert(
        "Error al guardar",
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  }

  function confirmarSalida() {
    const formularioModificado =
      form.clienteNombre.trim() !== "" ||
      form.producto.trim() !== "" ||
      form.cantidad.trim() !== "" ||
      form.precio.trim() !== "" ||
      form.estado !== "PENDIENTE";

    if (!formularioModificado) {
      router.back();
      return;
    }

    Alert.alert(
      "Descartar cambios",
      "¿Deseas salir sin guardar el pedido?",
      [
        {
          text: "Continuar editando",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  }

  const cantidadNumerica =
    Number(form.cantidad) || 0;

  const precioNumerico =
    Number(
      form.precio.replace(",", ".")
    ) || 0;

  const total =
    cantidadNumerica * precioNumerico;

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={confirmarSalida}
              disabled={guardando}
            >
              <Text style={styles.backText}>
                ‹ Volver
              </Text>
            </Pressable>

            <Text style={styles.headerIcon}>
              🛒
            </Text>
          </View>

          <Text style={styles.title}>
            Nuevo pedido
          </Text>

          <Text style={styles.subtitle}>
            Completa la información para
            registrar el pedido localmente.
          </Text>

          <View style={styles.formCard}>
            <CampoFormulario
              label="Nombre del cliente"
              placeholder="Ejemplo: María López"
              value={form.clienteNombre}
              error={errores.clienteNombre}
              editable={!guardando}
              autoCapitalize="words"
              onChangeText={(valor) =>
                actualizarCampo(
                  "clienteNombre",
                  valor
                )
              }
            />

            <CampoFormulario
              label="Producto"
              placeholder="Ejemplo: Alimento para perro"
              value={form.producto}
              error={errores.producto}
              editable={!guardando}
              autoCapitalize="sentences"
              onChangeText={(valor) =>
                actualizarCampo(
                  "producto",
                  valor
                )
              }
            />

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <CampoFormulario
                  label="Cantidad"
                  placeholder="1"
                  value={form.cantidad}
                  error={errores.cantidad}
                  editable={!guardando}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  onChangeText={(valor) => {
                    const valorLimpio =
                      valor.replace(
                        /[^0-9]/g,
                        ""
                      );

                    actualizarCampo(
                      "cantidad",
                      valorLimpio
                    );
                  }}
                />
              </View>

              <View style={styles.column}>
                <CampoFormulario
                  label="Precio unitario"
                  placeholder="0.00"
                  value={form.precio}
                  error={errores.precio}
                  editable={!guardando}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  prefix="S/"
                  onChangeText={(valor) => {
                    const valorLimpio =
                      valor.replace(
                        /[^0-9.,]/g,
                        ""
                      );

                    actualizarCampo(
                      "precio",
                      valorLimpio
                    );
                  }}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Estado
              </Text>

              <Text style={styles.fieldHelp}>
                Selecciona el estado inicial
                del pedido.
              </Text>

              <View
                style={
                  styles.statesContainer
                }
              >
                {ESTADOS_PEDIDO.map(
                  (estado) => {
                    const seleccionado =
                      form.estado === estado;

                    return (
                      <Pressable
                        key={estado}
                        style={({
                          pressed,
                        }) => [
                          styles.stateButton,
                          seleccionado &&
                            styles.stateButtonSelected,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                        onPress={() =>
                          seleccionarEstado(
                            estado
                          )
                        }
                        disabled={guardando}
                      >
                        <Text
                          style={[
                            styles.stateButtonText,
                            seleccionado &&
                              styles.stateButtonTextSelected,
                          ]}
                        >
                          {
                            ESTADO_LABELS[
                              estado
                            ]
                          }
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {errores.estado ? (
                <Text
                  style={styles.errorText}
                >
                  {errores.estado}
                </Text>
              ) : null}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                Resumen
              </Text>

              <View style={styles.summaryRow}>
                <Text
                  style={styles.summaryLabel}
                >
                  Cantidad
                </Text>

                <Text
                  style={styles.summaryValue}
                >
                  {cantidadNumerica}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text
                  style={styles.summaryLabel}
                >
                  Precio unitario
                </Text>

                <Text
                  style={styles.summaryValue}
                >
                  S/ {precioNumerico.toFixed(2)}
                </Text>
              </View>

              <View style={styles.totalDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>
                  Total
                </Text>

                <Text style={styles.totalValue}>
                  S/ {total.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.localNotice}>
              <Text style={styles.localIcon}>
                📱
              </Text>

              <Text style={styles.localText}>
                El pedido se guardará primero
                en SQLite y permanecerá
                disponible aunque cierres la
                aplicación.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed &&
                  styles.buttonPressed,
                guardando &&
                  styles.buttonDisabled,
              ]}
              onPress={guardarPedido}
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
                      styles.saveButtonText
                    }
                  >
                    Guardando pedido...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Guardar pedido
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface CampoFormularioProps {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  editable?: boolean;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?:
    | "none"
    | "sentences"
    | "words";
  onChangeText: (valor: string) => void;
}

function CampoFormulario({
  label,
  placeholder,
  value,
  error,
  editable = true,
  prefix,
  keyboardType = "default",
  autoCapitalize = "sentences",
  onChangeText,
}: CampoFormularioProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          error
            ? styles.inputContainerError
            : undefined,
          !editable
            ? styles.inputDisabled
            : undefined,
        ]}
      >
        {prefix ? (
          <Text style={styles.inputPrefix}>
            {prefix}
          </Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#8A9692"
          value={value}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onChangeText={onChangeText}
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error}
        </Text>
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
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 38,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    paddingVertical: 9,
    paddingRight: 12,
  },

  backText: {
    color: "#176B5B",
    fontSize: 16,
    fontWeight: "600",
  },

  headerIcon: {
    fontSize: 35,
  },

  title: {
    marginTop: 14,
    color: "#176B5B",
    fontSize: 27,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 7,
    color: "#68746F",
    fontSize: 15,
    lineHeight: 22,
  },

  formCard: {
    marginTop: 22,
    padding: 20,
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
    marginBottom: 19,
  },

  label: {
    marginBottom: 7,
    color: "#26332F",
    fontSize: 14,
    fontWeight: "600",
  },

  fieldHelp: {
    marginTop: -3,
    marginBottom: 10,
    color: "#7A8682",
    fontSize: 12,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 12,
    backgroundColor: "#FAFCFB",
  },

  inputContainerError: {
    borderColor: "#C62828",
    backgroundColor: "#FFF8F8",
  },

  inputDisabled: {
    opacity: 0.65,
  },

  inputPrefix: {
    marginLeft: 13,
    marginRight: 5,
    color: "#4F5C58",
    fontSize: 16,
    fontWeight: "600",
  },

  input: {
    minHeight: 49,
    flex: 1,
    paddingHorizontal: 13,
    color: "#1E2926",
    fontSize: 16,
  },

  errorText: {
    marginTop: 5,
    color: "#C62828",
    fontSize: 12,
    lineHeight: 17,
  },

  twoColumns: {
    flexDirection: "row",
    gap: 12,
  },

  column: {
    flex: 1,
  },

  statesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  stateButton: {
    minHeight: 39,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 20,
    backgroundColor: "#FAFCFB",
  },

  stateButtonSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#DFF0EB",
  },

  stateButtonText: {
    color: "#64716D",
    fontSize: 13,
    fontWeight: "600",
  },

  stateButtonTextSelected: {
    color: "#176B5B",
    fontWeight: "bold",
  },

  summaryCard: {
    marginTop: 3,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#F1F8F6",
  },

  summaryTitle: {
    marginBottom: 12,
    color: "#26332F",
    fontSize: 15,
    fontWeight: "bold",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  summaryLabel: {
    color: "#68746F",
    fontSize: 13,
  },

  summaryValue: {
    color: "#35423E",
    fontSize: 13,
    fontWeight: "600",
  },

  totalDivider: {
    height: 1,
    marginTop: 3,
    marginBottom: 12,
    backgroundColor: "#D6E4DF",
  },

  totalLabel: {
    color: "#26332F",
    fontSize: 16,
    fontWeight: "bold",
  },

  totalValue: {
    color: "#176B5B",
    fontSize: 18,
    fontWeight: "bold",
  },

  localNotice: {
    flexDirection: "row",
    marginTop: 18,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#EDF4FF",
  },

  localIcon: {
    marginRight: 10,
    fontSize: 20,
  },

  localText: {
    flex: 1,
    color: "#40556C",
    fontSize: 12,
    lineHeight: 18,
  },

  saveButton: {
    minHeight: 53,
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonPressed: {
    opacity: 0.78,
  },

  buttonDisabled: {
    opacity: 0.65,
  },
});