export interface PerfilUsuario {
  uid: string;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
  fechaRegistro: string;
}

export interface CrearPerfilUsuarioData {
  uid: string;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  correo: string;
}