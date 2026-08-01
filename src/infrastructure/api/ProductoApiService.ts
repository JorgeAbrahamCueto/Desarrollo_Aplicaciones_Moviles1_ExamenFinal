import type {
  ProductoExterno,
} from "../../domain/models/ProductoExterno";

const API_URL =
  "https://world.openpetfoodfacts.org/api/v2/search";

interface ProductoApiRaw {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  image_front_url?: string;
  image_front_small_url?: string;
}

interface RespuestaProductosApi {
  count?: number;
  page?: number;
  page_count?: number;
  page_size?: number;
  products?: ProductoApiRaw[];
}

function convertirProducto(
  producto: ProductoApiRaw
): ProductoExterno | null {
  const id =
    producto.code?.trim() ?? "";

  const nombre =
    producto.product_name_es?.trim() ||
    producto.product_name?.trim() ||
    producto.product_name_en?.trim() ||
    "";

  if (!id || !nombre) {
    return null;
  }

  return {
    id,
    nombre,

    marca:
      producto.brands?.trim() ||
      "Marca no especificada",

    cantidad:
      producto.quantity?.trim() ||
      "Presentación no especificada",

    categorias:
      producto.categories?.trim() ||
      "Alimento para mascotas",

    imagenUrl:
      producto.image_front_url?.trim() ||
      producto.image_front_small_url?.trim() ||
      null,
  };
}

export async function obtenerProductosExternos():
Promise<ProductoExterno[]> {
  const controller =
    new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const parametros =
      new URLSearchParams({
        page: "1",
        page_size: "24",
        sort_by: "last_modified_t",
        fields: [
          "code",
          "product_name",
          "product_name_es",
          "product_name_en",
          "brands",
          "quantity",
          "categories",
          "image_front_url",
          "image_front_small_url",
        ].join(","),
      });

    const response = await fetch(
      `${API_URL}?${parametros.toString()}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
          "User-Agent":
            "SumaqVet/1.0 (academic mobile application)",
        },

        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `El servicio respondió con el código ${response.status}`
      );
    }

    const data =
      (await response.json()) as
        RespuestaProductosApi;

    if (!Array.isArray(data.products)) {
      throw new Error(
        "La respuesta del catálogo no es válida"
      );
    }

    const productos =
      data.products
        .map(convertirProducto)
        .filter(
          (
            producto
          ): producto is ProductoExterno =>
            producto !== null
        );

    /*
     * Evita productos repetidos que puedan
     * compartir el mismo código.
     */
    const productosUnicos =
      Array.from(
        new Map(
          productos.map((producto) => [
            producto.id,
            producto,
          ])
        ).values()
      );

    if (productosUnicos.length === 0) {
      throw new Error(
        "El servicio no devolvió productos disponibles"
      );
    }

    return productosUnicos;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "La consulta tardó demasiado. Revisa tu conexión"
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "No se pudo conectar con el catálogo de productos"
    );
  } finally {
    clearTimeout(timeoutId);
  }
}