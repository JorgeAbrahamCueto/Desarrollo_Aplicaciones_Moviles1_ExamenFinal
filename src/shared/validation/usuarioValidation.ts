export interface RegistroForm {
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  password: string;
  confirmarPassword: string;
}

export type RegistroErrors =
  Partial<
    Record<keyof RegistroForm, string>
  >;

export interface LoginForm {
  correo: string;
  password: string;
}

export type LoginErrors =
  Partial<
    Record<keyof LoginForm, string>
  >;

export function validarRegistro(
  form: RegistroForm
): RegistroErrors {
  const errores: RegistroErrors = {};

  const nombres =
    form.nombres.trim();

  const apellidos =
    form.apellidos.trim();

  const nombreUsuario =
    form.nombreUsuario.trim();

  const correo =
    form.correo
      .trim()
      .toLowerCase();

  if (!nombres) {
    errores.nombres =
      "Ingrese sus nombres";
  } else if (nombres.length < 2) {
    errores.nombres =
      "Los nombres deben tener al menos 2 caracteres";
  }

  if (!apellidos) {
    errores.apellidos =
      "Ingrese sus apellidos";
  } else if (apellidos.length < 2) {
    errores.apellidos =
      "Los apellidos deben tener al menos 2 caracteres";
  }

  if (!nombreUsuario) {
    errores.nombreUsuario =
      "Ingrese un nombre de usuario";
  } else if (
    nombreUsuario.length < 4
  ) {
    errores.nombreUsuario =
      "El usuario debe tener al menos 4 caracteres";
  } else if (
    !/^[a-zA-Z0-9._]+$/.test(
      nombreUsuario
    )
  ) {
    errores.nombreUsuario =
      "Use solo letras, números, punto o guion bajo";
  }

  if (!correo) {
    errores.correo =
      "Ingrese su correo electrónico";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    )
  ) {
    errores.correo =
      "Ingrese un correo electrónico válido";
  }

  if (!form.password) {
    errores.password =
      "Ingrese una contraseña";
  } else if (
    form.password.length < 6
  ) {
    errores.password =
      "La contraseña debe tener al menos 6 caracteres";
  }

  if (!form.confirmarPassword) {
    errores.confirmarPassword =
      "Confirme su contraseña";
  } else if (
    form.confirmarPassword !==
    form.password
  ) {
    errores.confirmarPassword =
      "Las contraseñas no coinciden";
  }

  return errores;
}

export function validarLogin(
  form: LoginForm
): LoginErrors {
  const errores: LoginErrors = {};

  const correo =
    form.correo
      .trim()
      .toLowerCase();

  if (!correo) {
    errores.correo =
      "Ingrese su correo electrónico";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    )
  ) {
    errores.correo =
      "Ingrese un correo electrónico válido";
  }

  if (!form.password) {
    errores.password =
      "Ingrese su contraseña";
  }

  return errores;
}

export function formularioTieneErrores(
  errores:
    | RegistroErrors
    | LoginErrors
): boolean {
  return Object.keys(errores).length > 0;
}