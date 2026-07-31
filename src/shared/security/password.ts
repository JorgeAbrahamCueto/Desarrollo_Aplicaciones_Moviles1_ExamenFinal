import * as Crypto from "expo-crypto";

export async function generarSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export async function generarPasswordHash(
  password: string,
  salt: string
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`
  );
}

export async function comprobarPassword(
  password: string,
  salt: string,
  hashGuardado: string
): Promise<boolean> {
  const hashIngresado = await generarPasswordHash(
    password,
    salt
  );

  return hashIngresado === hashGuardado;
}