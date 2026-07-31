import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import type {
  CrearPerfilUsuarioData,
  PerfilUsuario,
} from "../../domain/models/PerfilUsuario";

import { db } from "./firebaseConfig";

const COLECCION_USUARIOS = "usuarios";

export async function guardarPerfilUsuario(
  data: CrearPerfilUsuarioData
): Promise<PerfilUsuario> {
  const perfil: PerfilUsuario = {
    uid: data.uid,
    nombres: data.nombres.trim(),
    apellidos: data.apellidos.trim(),
    nombreUsuario: data.nombreUsuario
      .trim()
      .toLowerCase(),
    correo: data.correo.trim().toLowerCase(),
    fechaRegistro: new Date().toISOString(),
  };

  const referencia = doc(
    db,
    COLECCION_USUARIOS,
    perfil.uid
  );

  await setDoc(referencia, perfil);

  return perfil;
}

export async function obtenerPerfilUsuario(
  uid: string
): Promise<PerfilUsuario | null> {
  const referencia = doc(
    db,
    COLECCION_USUARIOS,
    uid
  );

  const resultado = await getDoc(referencia);

  if (!resultado.exists()) {
    return null;
  }

  return resultado.data() as PerfilUsuario;
}