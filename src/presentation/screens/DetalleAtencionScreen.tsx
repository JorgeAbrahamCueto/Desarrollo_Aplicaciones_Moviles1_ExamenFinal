import {
  useCallback,
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
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  useSQLiteContext,
} from "expo-sqlite";

import type {
  Atencion,
  EspecieMascota,
  TipoAtencion,
} from "../../domain/models/Atencion";

import {
  actualizarAtencion,
  cancelarAtencion,
  eliminarAtencion,
  obtenerAtencionPorId,
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

export default function DetalleAtencionScreen() {
  const database = useSQLiteContext();
  const { usuario } = useAuth();

  const parametros =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const idTexto =
    Array.isArray(parametros.id)
      ? parametros.id[0]
      : parametros.id;

  const atencionId = Number(idTexto);

  const [atencion, setAtencion] =
    useState<Atencion | null>(null);

  const [form, setForm] =
    useState<AtencionForm | null>(null);

  const [errores, setErrores] =
    useState<AtencionErrors>({});

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState(false);

  const [modoEdicion, setModoEdicion] =
    useState(false);

  const [error, setError] =
    useState("");

  const cargarAtencion = useCallback(
    async () => {
      if (
        !usuario ||
        !Number.isInteger(atencionId) ||
        atencionId <= 0
      ) {
        setError(
          "La atención solicitada no es válida"
        );
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const resultado =
          await obtenerAtencionPorId(
            database,
            atencionId,
            usuario.uid
          );

        if (!resultado) {
          setError(
            "La atención no existe o pertenece a otra cuenta"
          );
          setAtencion(null);
          return;
        }

        setAtencion(resultado);

        setForm({
          mascotaNombre:
            resultado.mascotaNombre,
          especie:
            resultado.especie,
          tipoAtencion:
            resultado.tipoAtencion,
          fechaAtencion:
            resultado.fechaAtencion,
          horaAtencion:
            resultado.horaAtencion,
          motivo:
            resultado.motivo,
        });
      } catch (caughtError) {
        console.error(
          "Error al cargar atención:",
          caughtError
        );

        setError(
          "No se pudo cargar el detalle de la atención"
        );
      } finally {
        setCargando(false);
      }
    },
    [
      atencionId,
      database,
      usuario,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      cargarAtencion();

      return undefined;
    }, [cargarAtencion])
  );

  const fechasDisponibles = useMemo(
    () =>
      crearFechasDisponibles(
        14,
        atencion?.fechaAtencion
      ),
    [atencion?.fechaAtencion]
  );

  function actualizarCampo(
    campo: keyof AtencionForm,
    value: string
  ) {
    setForm((actual) => {
      if (!actual) {
        return actual;
      }

      return {
        ...actual,
        [campo]: value,
      };
    });

    setErrores((actual) => ({
      ...actual,
      [campo]: undefined,
    }));
  }

  function iniciarEdicion() {
    if (!atencion) {
      return;
    }

    setForm({
      mascotaNombre:
        atencion.mascotaNombre,
      especie:
        atencion.especie,
      tipoAtencion:
        atencion.tipoAtencion,
      fechaAtencion:
        atencion.fechaAtencion,
      horaAtencion:
        atencion.horaAtencion,
      motivo:
        atencion.motivo,
    });

    setErrores({});
    setModoEdicion(true);
  }

  function cancelarEdicion() {
    setModoEdicion(false);
    setErrores({});
  }

  async function guardarCambios() {
    if (
      !usuario ||
      !atencion ||
      !form
    ) {
      return;
    }

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

    try {
      setProcesando(true);

      const resultado =
        await actualizarAtencion(
          database,
          atencion.id,
          usuario.uid,
          {
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
            motivo:
              form.motivo,
          }
        );

      setAtencion(resultado);
      setModoEdicion(false);
      setErrores({});

      Alert.alert(
        "Atención actualizada",
        "Los cambios fueron guardados correctamente."
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la atención";

      Alert.alert(
        "Error al actualizar",
        mensaje
      );
    } finally {
      setProcesando(false);
    }
  }

  function confirmarCancelacion() {
    if (!atencion) {
      return;
    }

    Alert.alert(
      "Cancelar atención",
      `¿Seguro que deseas cancelar la atención de ${atencion.mascotaNombre}?`,
      [
        {
          text: "Conservar",
          style: "cancel",
        },
        {
          text: "Cancelar atención",
          style: "destructive",
          onPress: ejecutarCancelacion,
        },
      ]
    );
  }

  async function ejecutarCancelacion() {
    if (!usuario || !atencion) {
      return;
    }

    try {
      setProcesando(true);

      const resultado =
        await cancelarAtencion(
          database,
          atencion.id,
          usuario.uid
        );

      setAtencion(resultado);
      setModoEdicion(false);

      Alert.alert(
        "Atención cancelada",
        "La reserva fue cancelada correctamente."
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cancelar la atención";

      Alert.alert(
        "Error al cancelar",
        mensaje
      );
    } finally {
      setProcesando(false);
    }
  }

  function confirmarEliminacion() {
    if (!atencion) {
      return;
    }

    Alert.alert(
      "Eliminar atención",
      "Esta acción eliminará definitivamente la reserva cancelada del dispositivo.",
      [
        {
          text: "Conservar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: ejecutarEliminacion,
        },
      ]
    );
  }

  async function ejecutarEliminacion() {
    if (!usuario || !atencion) {
      return;
    }

    try {
      setProcesando(true);

      await eliminarAtencion(
        database,
        atencion.id,
        usuario.uid
      );

      Alert.alert(
        "Atención eliminada",
        "La reserva fue eliminada correctamente.",
        [
          {
            text: "Continuar",
            onPress: () => {
              router.replace("/atenciones");
            },
          },
        ]
      );
    } catch (caughtError) {
      const mensaje =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar la atención";

      Alert.alert(
        "Error al eliminar",
        mensaje
      );
    } finally {
      setProcesando(false);
    }
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
            Cargando atención...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !atencion || !form) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>
            ⚠️
          </Text>

          <Text style={styles.errorTitle}>
            No pudimos abrir la atención
          </Text>

          <Text style={styles.errorMessage}>
            {error}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace("/atenciones")
            }
          >
            <Text style={styles.primaryButtonText}>
              Volver a Mis atenciones
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
            style={styles.backButton}
            onPress={() => {
              if (modoEdicion) {
                cancelarEdicion();
              } else {
                router.back();
              }
            }}
            disabled={procesando}
          >
            <Text style={styles.backText}>
              ‹ {modoEdicion
                ? "Cancelar"
                : "Volver"}
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            {modoEdicion
              ? "Editar atención"
              : "Detalle"}
          </Text>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {modoEdicion ? (
            <FormularioEdicion
              form={form}
              errores={errores}
              fechas={fechasDisponibles}
              procesando={procesando}
              actualizarCampo={actualizarCampo}
            />
          ) : (
            <DetalleAtencion
              atencion={atencion}
            />
          )}

          {modoEdicion ? (
            <View style={styles.actionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.buttonPressed,
                  procesando &&
                    styles.disabledButton,
                ]}
                onPress={guardarCambios}
                disabled={procesando}
              >
                {procesando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.saveText}>
                    Guardar cambios
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={cancelarEdicion}
                disabled={procesando}
              >
                <Text style={styles.secondaryText}>
                  Descartar cambios
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              {atencion.estado ===
              "SOLICITADA" ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                  onPress={iniciarEdicion}
                  disabled={procesando}
                >
                  <Text style={styles.saveText}>
                    Editar atención
                  </Text>
                </Pressable>
              ) : null}

              {atencion.estado ===
                "SOLICITADA" ||
              atencion.estado ===
                "CONFIRMADA" ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                  onPress={confirmarCancelacion}
                  disabled={procesando}
                >
                  <Text style={styles.cancelText}>
                    Cancelar atención
                  </Text>
                </Pressable>
              ) : null}

              {atencion.estado ===
              "CANCELADA" ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                  onPress={confirmarEliminacion}
                  disabled={procesando}
                >
                  <Text style={styles.deleteText}>
                    Eliminar definitivamente
                  </Text>
                </Pressable>
              ) : null}

              {procesando ? (
                <ActivityIndicator
                  style={styles.actionLoader}
                  color="#176B5B"
                />
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface DetalleAtencionProps {
  atencion: Atencion;
}

function DetalleAtencion({
  atencion,
}: DetalleAtencionProps) {
  return (
    <>
      <View style={styles.petCard}>
        <View style={styles.petAvatar}>
          <Text style={styles.petEmoji}>
            {obtenerEspecieIcono(
              atencion.especie
            )}
          </Text>
        </View>

        <Text style={styles.petName}>
          {atencion.mascotaNombre}
        </Text>

        <Text style={styles.petSpecies}>
          {obtenerEspecieNombre(
            atencion.especie
          )}
        </Text>

        <EstadoBadge
          estado={atencion.estado}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Información de la reserva
      </Text>

      <View style={styles.detailCard}>
        <DetailRow
          icon="🩺"
          label="Servicio"
          value={obtenerServicio(
            atencion.tipoAtencion
          )}
        />

        <Divider />

        <DetailRow
          icon="📅"
          label="Fecha"
          value={formatearFecha(
            atencion.fechaAtencion
          )}
        />

        <Divider />

        <DetailRow
          icon="🕐"
          label="Horario"
          value={atencion.horaAtencion}
        />

        <Divider />

        <DetailRow
          icon="👤"
          label="Propietario"
          value={atencion.propietarioNombre}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Motivo de la atención
      </Text>

      <View style={styles.reasonCard}>
        <Text style={styles.reasonText}>
          {atencion.motivo}
        </Text>
      </View>

      <View style={styles.localCard}>
        <Text style={styles.localIcon}>
          📱
        </Text>

        <View style={styles.localInformation}>
          <Text style={styles.localTitle}>
            Guardado localmente
          </Text>

          <Text style={styles.localDescription}>
            Registrado el{" "}
            {formatearFechaHora(
              atencion.fechaRegistro
            )}
          </Text>
        </View>
      </View>
    </>
  );
}

interface FormularioEdicionProps {
  form: AtencionForm;
  errores: AtencionErrors;
  fechas: FechaDisponible[];
  procesando: boolean;
  actualizarCampo: (
    campo: keyof AtencionForm,
    value: string
  ) => void;
}

function FormularioEdicion({
  form,
  errores,
  fechas,
  procesando,
  actualizarCampo,
}: FormularioEdicionProps) {
  return (
    <>
      <View style={styles.formCard}>
        <Text style={styles.sectionTitleInside}>
          Mascota
        </Text>

        <Text style={styles.label}>
          Nombre
        </Text>

        <TextInput
          style={[
            styles.input,
            errores.mascotaNombre &&
              styles.inputError,
          ]}
          value={form.mascotaNombre}
          editable={!procesando}
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
              form.especie === especie.value;

            return (
              <Pressable
                key={especie.value}
                style={[
                  styles.speciesOption,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  actualizarCampo(
                    "especie",
                    especie.value
                  )
                }
                disabled={procesando}
              >
                <Text style={styles.optionIcon}>
                  {especie.icon}
                </Text>

                <Text
                  style={[
                    styles.optionText,
                    selected &&
                      styles.optionSelectedText,
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
        <Text style={styles.sectionTitleInside}>
          Servicio
        </Text>

        <View style={styles.servicesContainer}>
          {SERVICIOS.map((servicio) => {
            const selected =
              form.tipoAtencion ===
              servicio.value;

            return (
              <Pressable
                key={servicio.value}
                style={[
                  styles.serviceOption,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  actualizarCampo(
                    "tipoAtencion",
                    servicio.value
                  )
                }
                disabled={procesando}
              >
                <Text style={styles.serviceIcon}>
                  {servicio.icon}
                </Text>

                <Text
                  style={[
                    styles.serviceText,
                    selected &&
                      styles.optionSelectedText,
                  ]}
                >
                  {servicio.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ErrorText
          message={errores.tipoAtencion}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitleInside}>
          Fecha y horario
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesContainer}
        >
          {fechas.map((fecha) => {
            const selected =
              form.fechaAtencion ===
              fecha.value;

            return (
              <Pressable
                key={fecha.value}
                style={[
                  styles.dateOption,
                  selected &&
                    styles.dateSelected,
                ]}
                onPress={() =>
                  actualizarCampo(
                    "fechaAtencion",
                    fecha.value
                  )
                }
                disabled={procesando}
              >
                <Text
                  style={[
                    styles.dateWeekday,
                    selected &&
                      styles.dateSelectedText,
                  ]}
                >
                  {fecha.weekday}
                </Text>

                <Text
                  style={[
                    styles.dateDay,
                    selected &&
                      styles.dateSelectedText,
                  ]}
                >
                  {fecha.day}
                </Text>

                <Text
                  style={[
                    styles.dateMonth,
                    selected &&
                      styles.dateSelectedText,
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
          Horario
        </Text>

        <View style={styles.timesContainer}>
          {HORARIOS.map((hora) => {
            const selected =
              form.horaAtencion === hora;

            return (
              <Pressable
                key={hora}
                style={[
                  styles.timeOption,
                  selected &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  actualizarCampo(
                    "horaAtencion",
                    hora
                  )
                }
                disabled={procesando}
              >
                <Text
                  style={[
                    styles.timeText,
                    selected &&
                      styles.optionSelectedText,
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
        <Text style={styles.sectionTitleInside}>
          Motivo
        </Text>

        <TextInput
          style={[
            styles.textArea,
            errores.motivo &&
              styles.inputError,
          ]}
          value={form.motivo}
          editable={!procesando}
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

        <View style={styles.textFooter}>
          <ErrorText
            message={errores.motivo}
          />

          <Text style={styles.characterCount}>
            {form.motivo.length}/300
          </Text>
        </View>
      </View>
    </>
  );
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
}

function DetailRow({
  icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Text style={styles.detailEmoji}>
          {icon}
        </Text>
      </View>

      <View style={styles.detailInformation}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
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

function ErrorText({
  message,
}: {
  message?: string;
}) {
  return message ? (
    <Text style={styles.fieldError}>
      {message}
    </Text>
  ) : null;
}

function EstadoBadge({
  estado,
}: {
  estado: Atencion["estado"];
}) {
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

interface FechaDisponible {
  value: string;
  weekday: string;
  day: string;
  month: string;
}

function crearFechasDisponibles(
  cantidad: number,
  fechaActual?: string
): FechaDisponible[] {
  const fechas = Array.from(
    { length: cantidad },
    (_, index) => {
      const fecha = new Date();

      fecha.setDate(
        fecha.getDate() + index + 1
      );

      return convertirFechaDisponible(
        fecha
      );
    }
  );

  if (
    fechaActual &&
    !fechas.some(
      (fecha) =>
        fecha.value === fechaActual
    )
  ) {
    const partes =
      fechaActual.split("-").map(Number);

    const fechaGuardada = new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

    fechas.unshift(
      convertirFechaDisponible(
        fechaGuardada
      )
    );
  }

  return fechas;
}

function convertirFechaDisponible(
  fecha: Date
): FechaDisponible {
  const year = fecha.getFullYear();

  const month =
    String(fecha.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(fecha.getDate())
      .padStart(2, "0");

  return {
    value: `${year}-${month}-${day}`,

    weekday:
      fecha
        .toLocaleDateString(
          "es-PE",
          { weekday: "short" }
        )
        .replace(".", ""),

    day,

    month:
      fecha
        .toLocaleDateString(
          "es-PE",
          { month: "short" }
        )
        .replace(".", ""),
  };
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

function obtenerEspecieNombre(
  especie: EspecieMascota
): string {
  const especies: Record<
    EspecieMascota,
    string
  > = {
    PERRO: "Perro",
    GATO: "Gato",
    OTRO: "Otra mascota",
  };

  return especies[especie];
}

function obtenerEspecieIcono(
  especie: EspecieMascota
): string {
  const iconos: Record<
    EspecieMascota,
    string
  > = {
    PERRO: "🐶",
    GATO: "🐱",
    OTRO: "🐾",
  };

  return iconos[especie];
}

function formatearFecha(
  fecha: string
): string {
  const partes =
    fecha.split("-").map(Number);

  return new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  ).toLocaleDateString(
    "es-PE",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatearFechaHora(
  fecha: string
): string {
  const resultado = new Date(fecha);

  if (Number.isNaN(resultado.getTime())) {
    return "fecha no disponible";
  }

  return resultado.toLocaleString(
    "es-PE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 90,
    paddingVertical: 8,
  },

  backText: {
    color: "#176B5B",
    fontSize: 15,
    fontWeight: "600",
  },

  headerTitle: {
    flex: 1,
    color: "#176B5B",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },

  headerSpace: {
    width: 90,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  petCard: {
    alignItems: "center",
    padding: 22,
    borderRadius: 19,
    backgroundColor: "#176B5B",
  },

  petAvatar: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 38,
    backgroundColor: "#FFFFFF",
  },

  petEmoji: {
    fontSize: 39,
  },

  petName: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  petSpecies: {
    marginTop: 3,
    marginBottom: 12,
    color: "#D8EBE6",
    fontSize: 13,
  },

  badge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    color: "#26332F",
    fontSize: 17,
    fontWeight: "bold",
  },

  detailCard: {
    paddingHorizontal: 17,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  detailRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#E4F2EE",
  },

  detailEmoji: {
    fontSize: 19,
  },

  detailInformation: {
    flex: 1,
    marginLeft: 12,
  },

  detailLabel: {
    color: "#7A8782",
    fontSize: 11,
  },

  detailValue: {
    marginTop: 3,
    color: "#35423E",
    fontSize: 14,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    marginLeft: 52,
    backgroundColor: "#E5ECE9",
  },

  reasonCard: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  reasonText: {
    color: "#52605B",
    fontSize: 14,
    lineHeight: 21,
  },

  localCard: {
    marginTop: 17,
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#E4F0FF",
  },

  localIcon: {
    marginRight: 11,
    fontSize: 22,
  },

  localInformation: {
    flex: 1,
  },

  localTitle: {
    color: "#175A8C",
    fontSize: 13,
    fontWeight: "bold",
  },

  localDescription: {
    marginTop: 3,
    color: "#41657D",
    fontSize: 11,
  },

  actionsContainer: {
    marginTop: 22,
    gap: 11,
  },

  saveButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#176B5B",
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  secondaryButton: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#176B5B",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  secondaryText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "bold",
  },

  cancelButton: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D97706",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  cancelText: {
    color: "#B35A00",
    fontSize: 14,
    fontWeight: "bold",
  },

  deleteButton: {
    minHeight: 49,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D92D20",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  deleteText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "bold",
  },

  actionLoader: {
    marginTop: 5,
  },

  formCard: {
    marginBottom: 16,
    padding: 17,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    elevation: 2,
  },

  sectionTitleInside: {
    marginBottom: 13,
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
    marginTop: 16,
    marginBottom: 8,
    color: "#53615C",
    fontSize: 13,
    fontWeight: "600",
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 13,
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

  fieldError: {
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
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 12,
  },

  optionSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#E1F3ED",
  },

  optionIcon: {
    fontSize: 24,
  },

  optionText: {
    marginTop: 4,
    color: "#65726D",
    fontSize: 12,
  },

  optionSelectedText: {
    color: "#176B5B",
    fontWeight: "bold",
  },

  servicesContainer: {
    gap: 8,
  },

  serviceOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 11,
  },

  serviceIcon: {
    width: 34,
    fontSize: 19,
  },

  serviceText: {
    color: "#53615C",
    fontSize: 13,
    fontWeight: "600",
  },

  datesContainer: {
    gap: 8,
  },

  dateOption: {
    width: 62,
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 12,
  },

  dateSelected: {
    borderColor: "#176B5B",
    backgroundColor: "#176B5B",
  },

  dateWeekday: {
    color: "#71807A",
    fontSize: 10,
    textTransform: "capitalize",
  },

  dateDay: {
    marginVertical: 3,
    color: "#26332F",
    fontSize: 20,
    fontWeight: "bold",
  },

  dateMonth: {
    color: "#71807A",
    fontSize: 10,
    textTransform: "capitalize",
  },

  dateSelectedText: {
    color: "#FFFFFF",
  },

  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  timeOption: {
    width: "22%",
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D5DFDC",
    borderRadius: 10,
  },

  timeText: {
    color: "#53615C",
    fontSize: 12,
  },

  textArea: {
    minHeight: 110,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CBD8D4",
    borderRadius: 12,
    color: "#26332F",
    backgroundColor: "#FAFCFB",
    fontSize: 14,
    lineHeight: 20,
  },

  textFooter: {
    flexDirection: "row",
  },

  characterCount: {
    marginTop: 6,
    color: "#87928E",
    fontSize: 11,
  },

  errorIcon: {
    fontSize: 49,
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
    textAlign: "center",
  },

  primaryButton: {
    minHeight: 49,
    marginTop: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#176B5B",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  buttonPressed: {
    opacity: 0.78,
  },

  disabledButton: {
    opacity: 0.6,
  },
});