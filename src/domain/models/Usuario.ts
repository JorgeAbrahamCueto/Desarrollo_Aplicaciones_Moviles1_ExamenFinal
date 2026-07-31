export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  passwordHash: string;
  passwordSalt: string;
  fechaRegistro: string;
}

export interface RegistrarUsuarioData {
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  password: string;
}