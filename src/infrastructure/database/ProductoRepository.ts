import type {
  SQLiteDatabase,
} from "expo-sqlite";

import type {
  CategoriaProducto,
  Producto,
} from "../../domain/models/Producto";

interface ProductoRow {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  activo: number;
}

function convertirRowAProducto(
  row: ProductoRow
): Producto {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion,
    categoria: row.categoria,
    precio: row.precio,
    stock: row.stock,
    imagenUrl: row.imagenUrl,
    activo: row.activo === 1,
  };
}

/**
 * Lista todos los productos activos.
 */
export async function listarProductos(
  database: SQLiteDatabase
): Promise<Producto[]> {
  const filas =
    await database.getAllAsync<ProductoRow>(
      `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          imagenUrl,
          activo
        FROM productos
        WHERE activo = 1
        ORDER BY categoria ASC, nombre ASC
      `
    );

  return filas.map(convertirRowAProducto);
}

/**
 * Obtiene un producto mediante su ID.
 */
export async function obtenerProductoPorId(
  database: SQLiteDatabase,
  productoId: number
): Promise<Producto | null> {
  const fila =
    await database.getFirstAsync<ProductoRow>(
      `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          imagenUrl,
          activo
        FROM productos
        WHERE id = ?
          AND activo = 1
        LIMIT 1
      `,
      [productoId]
    );

  return fila
    ? convertirRowAProducto(fila)
    : null;
}

/**
 * Busca productos por nombre, descripción
 * o código.
 */
export async function buscarProductos(
  database: SQLiteDatabase,
  texto: string
): Promise<Producto[]> {
  const busqueda = `%${texto.trim()}%`;

  const filas =
    await database.getAllAsync<ProductoRow>(
      `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          imagenUrl,
          activo
        FROM productos
        WHERE activo = 1
          AND (
            nombre LIKE ? COLLATE NOCASE
            OR descripcion LIKE ? COLLATE NOCASE
            OR codigo LIKE ? COLLATE NOCASE
          )
        ORDER BY categoria ASC, nombre ASC
      `,
      [
        busqueda,
        busqueda,
        busqueda,
      ]
    );

  return filas.map(convertirRowAProducto);
}

/**
 * Filtra los productos por categoría.
 */
export async function listarProductosPorCategoria(
  database: SQLiteDatabase,
  categoria: CategoriaProducto
): Promise<Producto[]> {
  const filas =
    await database.getAllAsync<ProductoRow>(
      `
        SELECT
          id,
          codigo,
          nombre,
          descripcion,
          categoria,
          precio,
          stock,
          imagenUrl,
          activo
        FROM productos
        WHERE activo = 1
          AND categoria = ?
        ORDER BY nombre ASC
      `,
      [categoria]
    );

  return filas.map(convertirRowAProducto);
}