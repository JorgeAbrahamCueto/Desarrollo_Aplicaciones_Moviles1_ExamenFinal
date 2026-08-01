export const ESPECIES_MASCOTA = [
  "PERRO",
  "GATO",
  "OTRO",
] as const;

export type EspecieMascota =
  (typeof ESPECIES_MASCOTA)[number];

export const TIPOS_ATENCION = [
  "CONSULTA_GENERAL",
  "VACUNACION",
  "DESPARASITACION",
  "CONTROL",
  "EMERGENCIA",
] as const;

export type TipoAtencion =
  (typeof TIPOS_ATENCION)[number];

export const ESTADOS_ATENCION = [
  "SOLICITADA",
  "CONFIRMADA",
  "ATENDIDA",
  "CANCELADA",
] as const;

export type EstadoAtencion =
  (typeof ESTADOS_ATENCION)[number];

export interface Atencion {
  id: number;
  usuarioUid: string;
  propietarioNombre: string;
  mascotaNombre: string;
  especie: EspecieMascota;
  tipoAtencion: TipoAtencion;
  fechaAtencion: string;
  horaAtencion: string;
  motivo: string;
  estado: EstadoAtencion;
  fechaRegistro: string;
  fechaActualizacion: string;
}

export interface CrearAtencionData {
  usuarioUid: string;
  propietarioNombre: string;
  mascotaNombre: string;
  especie: EspecieMascota;
  tipoAtencion: TipoAtencion;
  fechaAtencion: string;
  horaAtencion: string;
  motivo: string;
}

export interface ActualizarAtencionData {
  mascotaNombre: string;
  especie: EspecieMascota;
  tipoAtencion: TipoAtencion;
  fechaAtencion: string;
  horaAtencion: string;
  motivo: string;
}