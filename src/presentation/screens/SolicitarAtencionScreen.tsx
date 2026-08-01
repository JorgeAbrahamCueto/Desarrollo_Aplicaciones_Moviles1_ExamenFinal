import {
  useMemo,
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

import type {
  EspecieMascota,
  TipoAtencion,
} from "../../domain/models/Atencion";

import {
  crearAtencion,
} from "../../infrastructure/database/AtencionRepository";

import {
  atencionTieneErrores,
  validarAtencion,
} from "../../shared/validation/atencionValidation";

import type {
  AtencionErrors,
  AtencionForm,
} from "../../shared/validation/atencionValidation";

import {
  useAuth,
} from "../context/AuthContext";

const INITIAL_FORM: AtencionForm = {
  mascotaNombre: "",
  especie: "",
  tipoAtencion: "",
  fechaAtencion: "",
  horaAtencion: "",
  motivo: "",
};

const ESPECIES: {
  value: EspecieMascota;
  label: string;
  icon: string;
}[] = [
  {
    value: "PERRO",
    label: "Perro",
    icon: "🐶",
  },
  {
    value: "GATO",
    label: "Gato",
    icon: "🐱",
  },
  {
    value: "OTRO",
    label: "Otro",
    icon: "🐾",
  },
];

const SERVICIOS: {
  value: TipoAtencion;
  label: string;
  icon: string;
}[] = [
  {
    value: "CONSULTA_GENERAL",
    label: "Consulta general",
    icon: "🩺",
  },
  {
    value: "VACUNACION",
    label: "Vacunación",
    icon: "💉",
  },
  {
    value: "DESPARASITACION",
    label: "Desparasitación",
    icon: "💊",
  },
  {
    value: "CONTROL",
    label: "Control",
    icon: "📋",
  },
  {
    value: "EMERGENCIA",
    label: "Emergencia",
    icon: "🚑",
  },
];

const HORARIOS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export default function SolicitarAtencionScreen() {
  const database = useSQLiteContext();

  const {
    usuario,
    perfil,
  } = useAuth();

  const [form, setForm] =
    useState<AtencionForm>(INITIAL_FORM);

  const [errores, setErrores] =
    useState<AtencionErrors>({});

  const [guardando, setGuardando] =
    useState(false);

  const fechasDisponibles = useMemo(
    () => crearFechasDisponibles(14),
    []
  );

  function actualizarCampo(
    campo: keyof AtencionForm,
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

  async function guardarAtencion() {
    const erroresEncontrados =
      validarAtencion(form);

    if (
      atencionTieneErrores(
        erroresEncontrados
      )
    ) {
      setErrores(erroresEncontrados);
      return;
    }

    if (!usuario) {
      Alert.alert(
        "Sesión requerida",
        "Debes iniciar sesión nuevamente"
      );
      return;
    }

    const propietarioNombre =
      perfil
        ? `${perfil.nombres} ${perfil.apellidos}`.trim()
        : usuario.displayName ??
          "Usuario SumaqVet";

    try {
      setGuardando(true);

      await crearAtencion(
        database,
        {
          usuarioUid: usuario.uid,
          propietarioNombre,
          mascotaNombre:
            form.mascotaNombre,
          especie:
            form.especie as EspecieMascota,
          tipoAtencion:
            form.tipoAtencion as TipoAtencion,
          fechaAtencion:
            form.fechaAtencion,
          horaAtencion:
            form.horaAtencion,
          motivo: form.motivo,
        }
      );

      Alert.alert(
        "Solicitud registrada",
        "La atención veterinaria fue guardada correctamente en el dispositivo.",
        [
          {
            text: "Ver mis atenciones",
            onPress: () => {
              router.replace("../atenciones");
            },
          },
        ]
      );
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la atención";

      Alert.alert(
        "Error al registrar",
        mensaje
      );
    } finally {
      setGuardando(false);
    }
  }

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
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed &&
                styles.buttonPressed,
            ]}
            onPress={() => router.back()}
            disabled={guardando}
          >
            <Text style={styles.backText}>
              ‹ Volver
            </Text>
          </Pressable>

          <View style={styles.headerInformation}>
            <Text style={styles.title}>
              Solicitar atención
            </Text>

            <Text style={styles.subtitle}>
              Reserva una cita para tu mascota
            </Text>
          </View>

          <Text style={styles.headerIcon}>
            🩺
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.ownerCard}>
            <Text style={styles.ownerIcon}>
              👤
            </Text>

            <View style={styles.ownerInformation}>
              <Text style={styles.ownerLabel}>
                Propietario
              </Text>

              <Text style={styles.ownerName}>
                {perfil
                  ? `${perfil.nombres} ${perfil.apellidos}`
                  : usuario?.displayName ??
                    "Usuario"}
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Datos de la mascota
            </Text>

            <Text style={styles.label}>
              Nombre de la mascota
            </Text>

            <TextInput
              style={[
                styles.input,
                errores.mascotaNombre &&
                  styles.inputError,
              ]}
              placeholder="Ejemplo: Panchito"
              placeholderTextColor="#89938F"
              value={form.mascotaNombre}
              editable={!guardando}
              onChangeText={(value) =>
                actualizarCampo(
                  "mascotaNombre",
                  value
                )
              }
            />

            <ErrorText
              message={errores.mascotaNombre}
            />

            <Text style={styles.labelWithMargin}>
              Especie
            </Text>

            <View style={styles.optionsRow}>
              {ESPECIES.map((especie) => {
                const selected =
                  form.especie ===
                  especie.value;

                return (
                  <Pressable
                    key={especie.value}
                    style={({ pressed }) => [
                      styles.speciesOption,
                      selected &&
                        styles.optionSelected,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      actualizarCampo(
                        "especie",
                        especie.value
                      )
                    }
                    disabled={guardando}
                  >
                    <Text style={styles.optionIcon}>
                      {especie.icon}
                    </Text>

                    <Text
                      style={[
                        styles.optionText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {especie.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ErrorText
              message={errores.especie}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Servicio veterinario
            </Text>

            <View style={styles.servicesContainer}>
              {SERVICIOS.map((servicio) => {
                const selected =
                  form.tipoAtencion ===
                  servicio.value;

                return (
                  <Pressable
                    key={servicio.value}
                    style={({ pressed }) => [
                      styles.serviceOption,
                      selected &&
                        styles.optionSelected,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      actualizarCampo(
                        "tipoAtencion",
                        servicio.value
                      )
                    }
                    disabled={guardando}
                  >
                    <Text style={styles.serviceIcon}>
                      {servicio.icon}
                    </Text>

                    <Text
                      style={[
                        styles.serviceText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {servicio.label}
                    </Text>

                    <View
                      style={[
                        styles.radio,
                        selected &&
                          styles.radioSelected,
                      ]}
                    >
                      {selected ? (
                        <View
                          style={styles.radioDot}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <ErrorText
              message={errores.tipoAtencion}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Fecha y horario
            </Text>

            <Text style={styles.helpText}>
              Selecciona uno de los próximos días disponibles.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesContainer}
            >
              {fechasDisponibles.map((fecha) => {
                const selected =
                  form.fechaAtencion ===
                  fecha.value;

                return (
                  <Pressable
                    key={fecha.value}
                    style={({ pressed }) => [
                      styles.dateOption,
                      selected &&
                        styles.dateSelected,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      actualizarCampo(
                        "fechaAtencion",
                        fecha.value
                      )
                    }
                    disabled={guardando}
                  >
                    <Text
                      style={[
                        styles.dateWeekday,
                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {fecha.weekday}
                    </Text>

                    <Text
                      style={[
                        styles.dateDay,
                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {fecha.day}
                    </Text>

                    <Text
                      style={[
                        styles.dateMonth,
                        selected &&
                          styles.dateTextSelected,
                      ]}
                    >
                      {fecha.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ErrorText
              message={errores.fechaAtencion}
            />

            <Text style={styles.labelWithMargin}>
              Horario disponible
            </Text>

            <View style={styles.timesContainer}>
              {HORARIOS.map((hora) => {
                const selected =
                  form.horaAtencion === hora;

                return (
                  <Pressable
                    key={hora}
                    style={({ pressed }) => [
                      styles.timeOption,
                      selected &&
                        styles.optionSelected,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      actualizarCampo(
                        "horaAtencion",
                        hora
                      )
                    }
                    disabled={guardando}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selected &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {hora}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ErrorText
              message={errores.horaAtencion}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Motivo de la atención
            </Text>

            <TextInput
              style={[
                styles.textArea,
                errores.motivo &&
                  styles.inputError,
              ]}
              placeholder="Describe los síntomas o el motivo de la consulta..."
              placeholderTextColor="#89938F"
              value={form.motivo}
              editable={!guardando}
              multiline
              maxLength={300}
              textAlignVertical="top"
              onChangeText={(value) =>
                actualizarCampo(
                  "motivo",
                  value
                )
              }
            />

            <View style={styles.textAreaFooter}>
              <ErrorText
                message={errores.motivo}
              />

              <Text style={styles.characterCount}>
                {form.motivo.length}/300
              </Text>
            </View>
          </View>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeIcon}>
              ℹ️
            </Text>

            <Text style={styles.noticeText}>
              La solicitud se guardará inicialmente
              con estado Solicitada. Podrás editarla
              o cancelarla desde Mis atenciones.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed &&
                styles.buttonPressed,
              guardando &&
                styles.buttonDisabled,
            ]}
            onPress={guardarAtencion}
            disabled={guardando}
          >
            {guardando ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text style={styles.submitText}>
                  Registrando...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitText}>
                Confirmar solicitud
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ErrorTextProps {
  message?: string;
}

function ErrorText({
  message,
}: ErrorTextProps) {
  if (!message) {
    return null;
  }

  return (
    <Text style={styles.errorText}>
      {message}
    </Text>
  );
}

interface FechaDisponible {
  value: string;
  weekday: string;
  day: string;
  month: string;
}

function crearFechasDisponibles(
  cantidad: number
): FechaDisponible[] {
  return Array.from(
    { length: cantidad },
    (_, index) => {
      const fecha = new Date();

      fecha.setDate(
        fecha.getDate() + index + 1
      );

      const year =
        fecha.getFullYear();

      const monthNumber =
        String(fecha.getMonth() + 1)
          .padStart(2, "0");

      const dayNumber =
        String(fecha.getDate())
          .padStart(2, "0");

      return {
        value:
          `${year}-${monthNumber}-${dayNumber}`,

        weekday:
          fecha
            .toLocaleDateString(
              "es-PE",
              { weekday: "short" }
            )
            .replace(".", ""),

        day: dayNumber,

        month:
          fecha
            .toLocaleDateString(
              "es-PE",
              { month: "short" }
            )
            .replace(".", ""),
      };
    }
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    fontSize: 23,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 2,
    color: "#68746F",
    fontSize: 12,
  },

  headerIcon: {
    fontSize: 32,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#DDF1EB",
  },

  ownerIcon: {
    marginRight: 12,
    fontSize: 27,
  },

  ownerInformation: {
    flex: 1,
  },

  ownerLabel: {
    color: "#71807A",
    fontSize: 11,
  },

  ownerName: {
    marginTop: 3,
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "bold",
  },

  formCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  sectionTitle: {
    marginBottom: 14,
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  label: {
    marginBottom: 7,
    color: "#53615C",
    fontSize: 13,
    fontWeight: "600",
  },

  labelWithMargin: {
    marginTop: 17,
    marginBottom: 9,
    color: "#53615C",
    fontSize: 13,
    fontWeight: "600",
  },

  input: {
    minHeight: 49,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 12,
    color: "#26332F",
    backgroundColor: "#FAFCFB",
    fontSize: 15,
  },

  inputError: {
    borderColor: "#C62828",
    backgroundColor: "#FFF8F8",
  },

  errorText: {
    flex: 1,
    marginTop: 5,
    color: "#C62828",
    fontSize: 12,
  },

  optionsRow: {
    flexDirection: "row",
    gap: 9,
  },

  speciesOption: {
    flex: 1,
    minHeight: 75,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 13,
    backgroundColor: "#FAFCFB",
  },

  optionSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#E1F3ED",
  },

  optionIcon: {
    fontSize: 25,
  },

  optionText: {
    marginTop: 5,
    color: "#65726D",
    fontSize: 12,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#176B5B",
    fontWeight: "bold",
  },

  servicesContainer: {
    gap: 9,
  },

  serviceOption: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 12,
    backgroundColor: "#FAFCFB",
  },

  serviceIcon: {
    width: 34,
    fontSize: 20,
  },

  serviceText: {
    flex: 1,
    color: "#53615C",
    fontSize: 14,
    fontWeight: "600",
  },

  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#AAB7B2",
    borderRadius: 10,
  },

  radioSelected: {
    borderColor: "#176B5B",
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#176B5B",
  },

  helpText: {
    marginTop: -7,
    marginBottom: 12,
    color: "#71807A",
    fontSize: 12,
  },

  datesContainer: {
    gap: 9,
    paddingBottom: 3,
  },

  dateOption: {
    width: 64,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 13,
    backgroundColor: "#FAFCFB",
  },

  dateSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#176B5B",
  },

  dateWeekday: {
    color: "#71807A",
    fontSize: 11,
    textTransform: "capitalize",
  },

  dateDay: {
    marginVertical: 3,
    color: "#26332F",
    fontSize: 21,
    fontWeight: "bold",
  },

  dateMonth: {
    color: "#71807A",
    fontSize: 11,
    textTransform: "capitalize",
  },

  dateTextSelected: {
    color: "#FFFFFF",
  },

  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  timeOption: {
    width: "22%",
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 10,
    backgroundColor: "#FAFCFB",
  },

  timeText: {
    color: "#53615C",
    fontSize: 13,
    fontWeight: "600",
  },

  textArea: {
    minHeight: 115,
    padding: 13,
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 12,
    color: "#26332F",
    backgroundColor: "#FAFCFB",
    fontSize: 14,
    lineHeight: 20,
  },

  textAreaFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  characterCount: {
    marginTop: 6,
    color: "#87928E",
    fontSize: 11,
  },

  noticeCard: {
    marginTop: 16,
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#E4F0FF",
  },

  noticeIcon: {
    marginRight: 10,
    fontSize: 20,
  },

  noticeText: {
    flex: 1,
    color: "#41657D",
    fontSize: 12,
    lineHeight: 18,
  },

  submitButton: {
    minHeight: 53,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  submitText: {
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
    opacity: 0.6,
  },
});