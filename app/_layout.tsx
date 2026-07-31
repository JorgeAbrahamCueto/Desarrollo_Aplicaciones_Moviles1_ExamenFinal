import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "../src/infrastructure/database/database";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="veterinaria_patitas.db"
      onInit={initializeDatabase}
      onError={(error) => {
        console.error("Error al inicializar SQLite:", error);
      }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SQLiteProvider>
  );
}