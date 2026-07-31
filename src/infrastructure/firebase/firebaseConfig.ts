import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";

import {
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";

/*
 * En Expo, TypeScript puede resolver las declaraciones web
 * aunque Metro utilice la implementación de React Native.
 */
// @ts-expect-error -- Firebase expone esta función para React Native.
import { getReactNativePersistence } from "firebase/auth";

function obtenerVariable(
  nombre: string,
  valor: string | undefined
): string {
  if (!valor) {
    throw new Error(
      `Falta configurar la variable ${nombre} en .env.local`
    );
  }

  return valor;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY
  ),

  authDomain: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  ),

  projectId: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  ),

  storageBucket: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),

  messagingSenderId: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),

  appId: obtenerVariable(
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
  ),
};

export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

function inicializarAuth(): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence:
        getReactNativePersistence(AsyncStorage),
    });
  } catch {
    /*
     * Con Fast Refresh, Firebase puede estar
     * inicializado previamente.
     */
    return getAuth(firebaseApp);
  }
}

export const auth = inicializarAuth();