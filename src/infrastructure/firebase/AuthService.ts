import { FirebaseError } from "firebase/app";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth } from "./firebaseConfig";

export interface RegistroFirebaseData {
  nombres: string;
  apellidos: string;
  correo: string;
  password: string;
}

function traducirErrorFirebase(
  error: unknown
): string {
  if (!(error instanceof FirebaseError)) {
    console.error("Error desconocido:", error);

    return "Ocurrió un error inesperado";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "El correo electrónico ya está registrado";

    case "auth/invalid-email":
      return "El correo electrónico no es válido";

    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres";

    case "auth/invalid-credential":
      return "El correo o la contraseña son incorrectos";

    case "auth/user-disabled":
      return "Esta cuenta se encuentra deshabilitada";

    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisa tu conexión a Internet";

    case "auth/too-many-requests":
      return "Se realizaron demasiados intentos. Intenta nuevamente más tarde";

    default:
      console.error(
        "Error de Firebase:",
        error.code,
        error.message
      );

      return "No se pudo completar la operación";
  }
}

export async function registrarUsuarioFirebase(
  data: RegistroFirebaseData
): Promise<User> {
  try {
    const correo = data.correo
      .trim()
      .toLowerCase();

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        correo,
        data.password
      );

    const nombreCompleto =
      `${data.nombres.trim()} ${data.apellidos.trim()}`;

    await updateProfile(credencial.user, {
      displayName: nombreCompleto,
    });

    return credencial.user;
  } catch (error) {
    throw new Error(
      traducirErrorFirebase(error)
    );
  }
}

export async function iniciarSesionFirebase(
  correo: string,
  password: string
): Promise<User> {
  try {
    const credencial =
      await signInWithEmailAndPassword(
        auth,
        correo.trim().toLowerCase(),
        password
      );

    return credencial.user;
  } catch (error) {
    throw new Error(
      traducirErrorFirebase(error)
    );
  }
}

export async function cerrarSesionFirebase():
Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(
      traducirErrorFirebase(error)
    );
  }
}

export function observarSesionFirebase(
  callback: (usuario: User | null) => void
): () => void {
  return onAuthStateChanged(
    auth,
    callback
  );
}

export function obtenerUsuarioFirebaseActual():
User | null {
  return auth.currentUser;
}