import type {
  EspecieMascota,
  TipoAtencion,
} from "../../domain/models/Atencion";

export interface AtencionForm {
  mascotaNombre: string;
  especie: EspecieMascota | "";
  tipoAtencion: TipoAtencion | "";
  fechaAtencion: string;
  horaAtencion: string;
  motivo: string;
}

export type AtencionErrors =
  Partial<
    Record<keyof AtencionForm, string>
  >;

export function validarAtencion(
  form: AtencionForm
): AtencionErrors {
  const errores: AtencionErrors = {};

  const mascotaNombre =
    form.mascotaNombre.trim();

  const motivo =
    form.motivo.trim();

  if (!mascotaNombre) {
    errores.mascotaNombre =
      "Ingrese el nombre de la mascota";
  } else if (mascotaNombre.length < 2) {
    errores.mascotaNombre =
      "El nombre debe tener al menos 2 caracteres";
  }

  if (!form.especie) {
    errores.especie =
      "Seleccione la especie";
  }

  if (!form.tipoAtencion) {
    errores.tipoAtencion =
      "Seleccione el servicio";
  }

  if (!form.fechaAtencion) {
    errores.fechaAtencion =
      "Seleccione una fecha";
  }

  if (!form.horaAtencion) {
    errores.horaAtencion =
      "Seleccione un horario";
  }

  if (!motivo) {
    errores.motivo =
      "Explique brevemente el motivo";
  } else if (motivo.length < 10) {
    errores.motivo =
      "El motivo debe tener al menos 10 caracteres";
  } else if (motivo.length > 300) {
    errores.motivo =
      "El motivo no puede superar 300 caracteres";
  }

  return errores;
}

export function atencionTieneErrores(
  errores: AtencionErrors
): boolean {
  return Object.keys(errores).length > 0;
}