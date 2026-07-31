import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "firebase/auth";

import type { PerfilUsuario } from "../../domain/models/PerfilUsuario";

import {
  observarSesionFirebase,
  obtenerUsuarioFirebaseActual,
} from "../../infrastructure/firebase/AuthService";

import {
  obtenerPerfilUsuario,
} from "../../infrastructure/firebase/PerfilService";

interface AuthContextValue {
  usuario: User | null;
  perfil: PerfilUsuario | null;
  cargandoSesion: boolean;
  recargarPerfil: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [perfil, setPerfil] =
    useState<PerfilUsuario | null>(null);

  const [
    cargandoSesion,
    setCargandoSesion,
  ] = useState(true);

  const cargarPerfil = useCallback(
    async (
      usuarioFirebase: User
    ): Promise<void> => {
      try {
        const perfilEncontrado =
          await obtenerPerfilUsuario(
            usuarioFirebase.uid
          );

        setPerfil(perfilEncontrado);
      } catch (error) {
        console.error(
          "No se pudo recuperar el perfil:",
          error
        );

        setPerfil(null);
      }
    },
    []
  );

  useEffect(() => {
    const cancelarObservacion =
      observarSesionFirebase(
        async (usuarioFirebase) => {
          try {
            setCargandoSesion(true);
            setUsuario(usuarioFirebase);

            if (!usuarioFirebase) {
              setPerfil(null);
              return;
            }

            await cargarPerfil(
              usuarioFirebase
            );
          } catch (error) {
            console.error(
              "Error al verificar sesión:",
              error
            );

            setPerfil(null);
          } finally {
            setCargandoSesion(false);
          }
        }
      );

    return cancelarObservacion;
  }, [cargarPerfil]);

  const recargarPerfil =
    useCallback(async () => {
      const usuarioActual =
        usuario ??
        obtenerUsuarioFirebaseActual();

      if (!usuarioActual) {
        setPerfil(null);
        return;
      }

      await cargarPerfil(usuarioActual);
    }, [usuario, cargarPerfil]);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        usuario,
        perfil,
        cargandoSesion,
        recargarPerfil,
      }),
      [
        usuario,
        perfil,
        cargandoSesion,
        recargarPerfil,
      ]
    );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth():
AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}