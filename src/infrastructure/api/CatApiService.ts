import type {
  RazaGato,
} from "../../domain/models/RazaGato";

const API_URL =
  "https://api.thecatapi.com/v1/breeds";

const LIMITE_RAZAS = 30;

interface CatApiBreed {
  id: string;
  name: string;

  origin?: string;
  temperament?: string;
  description?: string;
  life_span?: string;
  wikipedia_url?: string;

  adaptability?: number;
  intelligence?: number;
  affection_level?: number;

  weight?: {
    metric?: string;
  };

  image?: {
    url?: string;
  };

  reference_image_id?: string;
}

function convertirRaza(
  item: CatApiBreed
): RazaGato {
  const imagenReferencia =
    item.reference_image_id
      ? `https://cdn2.thecatapi.com/images/${item.reference_image_id}.jpg`
      : null;

  return {
    id: item.id,

    nombre:
      item.name?.trim() ||
      "Raza sin nombre",

    origen:
      item.origin?.trim() ||
      "Origen no registrado",

    temperamento:
      item.temperament?.trim() ||
      "Sin información disponible",

    descripcion:
      item.description?.trim() ||
      "Sin descripción disponible",

    esperanzaVida:
      item.life_span?.trim() ||
      "Sin información disponible",

    pesoMetrico:
      item.weight?.metric?.trim() ||
      "Sin información disponible",

    adaptabilidad:
      item.adaptability ?? 0,

    inteligencia:
      item.intelligence ?? 0,

    nivelAfecto:
      item.affection_level ?? 0,

    imagenUrl:
      item.image?.url ??
      imagenReferencia,

    wikipediaUrl:
      item.wikipedia_url ?? null,
  };
}

export async function obtenerRazasGatos():
Promise<RazaGato[]> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(() => {
      controller.abort();
    }, 12000);

  const apiKey =
    process.env
      .EXPO_PUBLIC_CAT_API_KEY
      ?.trim();

  const headers: Record<
    string,
    string
  > = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] =
      apiKey;
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}?limit=${LIMITE_RAZAS}&page=0`,
      {
        method: "GET",
        headers,
        signal: controller.signal,
      }
    );
  } catch (error) {
    clearTimeout(timeoutId);

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "La solicitud tardó demasiado. Intenta nuevamente."
      );
    }

    throw new Error(
      "No se pudo conectar con la guía felina. Revisa tu conexión."
    );
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        "TheCatAPI rechazó la solicitud. Verifica la clave de API."
      );
    }

    throw new Error(
      `La API respondió con el código ${response.status}`
    );
  }

  let data: unknown;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "La respuesta de la API no tiene un formato válido"
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "TheCatAPI devolvió una respuesta inesperada"
    );
  }

  const razas =
    (data as CatApiBreed[])
      .filter(
        (item) =>
          typeof item.id === "string" &&
          typeof item.name === "string"
      )
      .map(convertirRaza)
      .sort(
        (a, b) =>
          a.nombre.localeCompare(
            b.nombre
          )
      );

  if (razas.length === 0) {
    throw new Error(
      "TheCatAPI no devolvió razas disponibles"
    );
  }

  return razas;
}