/**
 * 062 — Ajustes → Apariencia
 */
import { z } from "zod";

export type Modo = "light" | "dark";

export const TEMA_IDS = ["menta", "noche"] as const;
export type TemaId = (typeof TEMA_IDS)[number];

export const LETRAS = {
  urbanist: { nombre: "Urbanist", variable: "--font-urbanist" },
  inter: { nombre: "Inter", variable: "--font-inter" },
} as const;
export type LetraId = keyof typeof LETRAS;

export const TAMANOS = {
  normal: { nombre: "Normal", escala: 1 },
} as const;
export type TamanoId = keyof typeof TAMANOS;

export const DENSIDADES = {
  normal: { nombre: "Normal", fila: "11px", hueco: "12px" },
} as const;
export type DensidadId = keyof typeof DENSIDADES;

export const aparienciaSchema = z.object({
  tema: z.enum(["menta", "noche", "propio"]),
  letra: z.enum(["urbanist", "inter"]),
  tamano: z.enum(["normal"]),
  densidad: z.enum(["normal"]),
});
export type Apariencia = z.infer<typeof aparienciaSchema>;

export const APARIENCIA_POR_DEFECTO: Apariencia = {
  tema: "menta",
  letra: "inter", // Gudlime default (was urbanist)
  tamano: "normal",
  densidad: "normal",
};
