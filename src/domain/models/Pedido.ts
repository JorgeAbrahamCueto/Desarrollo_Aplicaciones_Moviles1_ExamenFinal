export const ESTADOS_PEDIDO = [
  "PENDIENTE",
  "EN_PROCESO",
  "ENTREGADO",
  "CANCELADO",
] as const;

export type EstadoPedido =
  (typeof ESTADOS_PEDIDO)[number];

export interface Pedido {
  id: number;
  productoId: number | null;
  firebaseId: string | null;
  usuarioUid: string;
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: EstadoPedido;
  fechaRegistro: string;
  fechaActualizacion: string;
  sincronizado: boolean;
}

export interface CrearPedidoData {
  productoId?: number | null;
  usuarioUid: string;
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: EstadoPedido;
}

export interface ActualizarPedidoData {
  clienteNombre: string;
  producto: string;
  cantidad: number;
  precio: number;
  estado: EstadoPedido;
}