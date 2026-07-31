export const CATEGORIAS_PRODUCTO = [
  "ALIMENTOS",
  "SALUD",
  "HIGIENE",
  "ACCESORIOS",
  "JUGUETES",
] as const;

export type CategoriaProducto =
  (typeof CATEGORIAS_PRODUCTO)[number];

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  activo: boolean;
}

export interface CrearProductoData {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
}