import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** La semilla del alta: nombres de GudLime y anclas que no se tocan. */
describe("etapas semilla", () => {
  const src = readFileSync("src/server/auth/on-signup.ts", "utf8");

  it("siembra Recibido → Contactado → Descubrimiento → Propuesta → Cliente (ganada) → Perdido", () => {
    const inicio = src.indexOf("const SEED_STAGES");
    const fin = src.indexOf("];", inicio);
    const bloque = src.slice(inicio, fin);
    const etapas = [...bloque.matchAll(/name: "([^"]+)", kind: "(open|won|lost)"/g)].map((m) => ({
      name: m[1],
      kind: m[2],
    }));
    expect(etapas).toEqual([
      { name: "Recibido", kind: "open" },
      { name: "Contactado", kind: "open" },
      { name: "Descubrimiento", kind: "open" },
      { name: "Propuesta", kind: "open" },
      { name: "Cliente", kind: "won" },
      { name: "Perdido", kind: "lost" },
    ]);
  });
});
