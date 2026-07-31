import type {
  EstadoPedido,
} from "../../domain/models/Pedido";

export interface PedidoForm {
  clienteNombre: string;
  producto: string;
  cantidad: string;
  precio: string;
  estado: EstadoPedido;
}

export type PedidoFormErrors = Partial<
  Record<keyof PedidoForm, string>
>;

export function validarPedido(
  form: PedidoForm
): PedidoFormErrors {
  const errores: PedidoFormErrors = {};

  const clienteNombre = form.clienteNombre.trim();
  const producto = form.producto.trim();

  const cantidad = Number(form.cantidad);
  const precio = Number(
    form.precio.replace(",", ".")
  );

  if (!clienteNombre) {
    errores.clienteNombre =
      "Ingrese el nombre del cliente";
  } else if (clienteNombre.length < 3) {
    errores.clienteNombre =
      "El nombre debe tener al menos 3 caracteres";
  }

  if (!producto) {
    errores.producto =
      "Ingrese el nombre del producto";
  } else if (producto.length < 2) {
    errores.producto =
      "El producto debe tener al menos 2 caracteres";
  }

  if (!form.cantidad.trim()) {
    errores.cantidad = "Ingrese la cantidad";
  } else if (
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    errores.cantidad =
      "La cantidad debe ser un número entero mayor que 0";
  }

  if (!form.precio.trim()) {
    errores.precio = "Ingrese el precio";
  } else if (
    !Number.isFinite(precio) ||
    precio < 0
  ) {
    errores.precio =
      "Ingrese un precio válido mayor o igual que 0";
  }

  if (!form.estado) {
    errores.estado =
      "Seleccione el estado del pedido";
  }

  return errores;
}

export function pedidoTieneErrores(
  errores: PedidoFormErrors
): boolean {
  return Object.keys(errores).length > 0;
}