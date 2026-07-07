import type { NextConfig } from "next";

// Para proyectar la demo desde otra máquina de la red: el dev server de Next
// bloquea por default el acceso cross-origin a /_next/*. Los hosts permitidos
// se pasan por env para no fijar IPs en el repo (ver .env.example).
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length ? { allowedDevOrigins } : {}),
};

export default nextConfig;
