/**
 * Self-test E2E — 060b: el marco de tarjetas y la Bandeja rediseñada, en
 * claro y oscuro, a 1280 y 390 px. Spec: specs/060b-diseno-sin-rea/spec.md.
 *
 * Requiere la app viva con WA_MOCK_ENABLED=true. Inicia sesión UNA vez (el
 * login tiene tope de intentos) y reusa el `storageState` en cada contexto.
 *
 * - `CAPTURAS_DIR`: dónde dejar las capturas (por defecto `.tmp/060b`).
 * - `SOLO_CAPTURAS=1`: solo captura, sin afirmar nada del diseño nuevo. Es
 *   para el «antes»: el mismo guion contra el commit anterior.
 *
 * Uso: node --env-file=<env> scripts/e2e-diseno-060b.mjs
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL ?? "e2e-diseno-060b@vocero.test";
const PASSWORD = process.env.E2E_PASSWORD ?? "password-e2e-diseno-060b";
const SALIDA = process.env.CAPTURAS_DIR ?? ".tmp/060b";
const SOLO_CAPTURAS = process.env.SOLO_CAPTURAS === "1";
const S = Date.now().toString(36);
const PN = `PN-DIS-${S}`;

let failures = 0;
let checks = 0;
function ok(name, cond, extra = "") {
  if (SOLO_CAPTURAS) return;
  checks++;
  if (cond) console.log(`  OK  ${name}`);
  else {
    failures++;
    console.log(`  FALLA  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function hasta(fn, ms = 10000) {
  const fin = Date.now() + ms;
  for (;;) {
    const v = await fn().catch(() => null);
    if (v || Date.now() > fin) return v;
    await espera(200);
  }
}

/** ¿Algo se sale por la derecha? La página y cada sección de la Bandeja. */
async function desborde(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const fuera = [...document.querySelectorAll("main section, main header, header")]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
    return { pagina: doc.scrollWidth > window.innerWidth + 1, fuera };
  });
}

mkdirSync(SALIDA, { recursive: true });
mkdirSync(".tmp", { recursive: true });
// La sesión va a .tmp (gitignored), nunca junto a las capturas: CAPTURAS_DIR
// puede apuntar a docs/.
const STATE = ".tmp/e2e-060b-state.json";
const browser = await chromium.launch();
const errores = [];

try {
  console.log("== Preparación ==");
  const ctx0 = await browser.newContext();
  const api = (p, init = {}) =>
    ctx0.request.fetch(`${BASE}${p}`, { ...init, headers: { origin: BASE, ...(init.headers ?? {}) } });
  let r = await api("/api/auth/sign-up/email", {
    method: "POST",
    data: { email: EMAIL, password: PASSWORD, name: "Dueña Diseño" },
  });
  if (!r.ok())
    r = await api("/api/auth/sign-in/email", { method: "POST", data: { email: EMAIL, password: PASSWORD } });
  if (!r.ok()) throw new Error(`login: ${r.status()} ${await r.text()}`);
  await api("/api/settings/whatsapp", {
    method: "PUT",
    data: { wabaId: "WABA-DIS", phoneNumberId: PN, token: "tok-dis" },
  });

  const NOMBRES = [`Mariana López ${S}`, `Taller Ruiz ${S}`, `Sofía Herrera ${S}`];
  const textos = [
    "Hola, ¿tienen disponibilidad para el sábado por la mañana?",
    "Buenas tardes, quería saber el precio del servicio completo",
    "Gracias por la info, lo platico y les confirmo",
  ];
  const ahora = Math.floor(Date.now() / 1000);
  const rnd = () => Math.floor(10000 + Math.random() * 89999);
  for (const [i, name] of NOMBRES.entries()) {
    await api("/api/dev/wa-mock/inbound", {
      method: "POST",
      data: {
        phoneNumberId: PN,
        from: `5215556${rnd()}${i}`,
        name,
        text: textos[i],
        timestamp: ahora - (NOMBRES.length - i) * 300,
      },
    });
  }
  const convs = await hasta(async () => {
    const l = (await (await api("/api/conversations")).json()).conversations ?? [];
    const m = NOMBRES.map((n) => l.find((c) => c.contact.name === n));
    return m.every(Boolean) ? m : null;
  }, 30000);
  if (!convs) throw new Error("las conversaciones no aparecieron");
  // Una respuesta del CRM, para que el hilo tenga burbuja de salida.
  await api(`/api/conversations/${convs[0].id}/messages`, {
    method: "POST",
    data: { text: "¡Hola Mariana! Sí, el sábado tenemos lugar de 9 a 12. ¿Te aparto un horario?" },
  });
  await ctx0.storageState({ path: STATE });
  await ctx0.close();
  console.log("  listo: sesión, número de prueba y tres conversaciones");

  for (const tema of ["light", "dark"]) {
    console.log(`\n== ${tema === "light" ? "Claro" : "Oscuro"} · 1280 ==`);
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      storageState: STATE,
      locale: "es-MX",
      timezoneId: "America/Mexico_City",
      reducedMotion: "reduce",
    });
    await ctx.addCookies([{ name: "vocero-theme", value: tema, url: BASE }]);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errores.push(`${tema}: ${e.message}`));
    await page.goto(`${BASE}/inbox`);
    const fila = page.getByRole("button").filter({ hasText: NOMBRES[0] }).first();
    await fila.waitFor({ timeout: 60000 });
    await espera(400);
    ok("el tema llega por la cookie", (await page.locator("html").getAttribute("data-theme")) === tema);
    await page.screenshot({ path: `${SALIDA}/bandeja-${tema}-1280.png` });

    const marco = await page.evaluate(() => {
      const win = document.querySelector(".app-window");
      const aside = document.querySelector("aside");
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const root = getComputedStyle(document.documentElement);
      return {
        ventana: win ? cs(win).borderTopLeftRadius : null,
        lateral: aside?.className.includes("app-sidebar") ?? false,
        fondoLateral: cs(aside)?.backgroundColor ?? "",
        esperado: root.getPropertyValue("--sidebar-bg").trim(),
        separados: win && aside ? win.getBoundingClientRect().left - aside.getBoundingClientRect().right : -1,
      };
    });
    ok("el contenido es una tarjeta de 24 px", marco.ventana === "24px", JSON.stringify(marco));
    ok("el menú es la tarjeta clara del tema (no el azul marino fijo)", marco.lateral);
    ok("menú y contenido van separados por el lienzo", marco.separados >= 8, String(marco.separados));
    ok("sin desborde a 1280", !(await desborde(page)).pagina);

    // Barra superior: el buscador abre Ctrl+K.
    const buscador = page.getByRole("button", { name: "Buscar (Ctrl+K)" });
    ok("la barra superior trae el buscador", await buscador.isVisible().catch(() => false));
    if (!SOLO_CAPTURAS) {
      await buscador.click();
      const barra = page.getByRole("dialog", { name: "Barra de comandos" });
      ok("el buscador abre la barra Ctrl+K", await hasta(() => barra.isVisible(), 5000));
      await page.keyboard.press("Escape");
      ok("y Escape la cierra", (await barra.count()) === 0);
    }

    // Pestañas en píldora.
    const todas = page.getByRole("tab", { name: /^Todas/ });
    const radio = await todas.evaluate((el) => getComputedStyle(el).borderTopLeftRadius).catch(() => "");
    ok("«Todas» es una píldora", parseFloat(radio) >= 999, radio);
    ok("«Todas» sigue marcada como pestaña elegida", (await todas.getAttribute("aria-selected")) === "true");

    // Secciones plegables.
    const seccion = page.getByRole("button", { name: /^A · Trabajo/ });
    if (!SOLO_CAPTURAS) {
      ok("la sección A nace abierta", (await seccion.getAttribute("aria-expanded")) === "true");
      const pipeline = page.getByRole("link", { name: "Pipeline" });
      await seccion.click();
      // Plegada, la fila de la rejilla mide 0: Playwright llama «visible» a un
      // enlace recortado, así que se mide el alto de su contenedor.
      const altoSeccion = () =>
        pipeline.evaluate((el) => el.closest(".grid")?.getBoundingClientRect().height ?? -1);
      ok("al plegarla se esconde Pipeline", await hasta(async () => (await altoSeccion()) < 1, 3000));
      ok("y lo dice aria-expanded", (await seccion.getAttribute("aria-expanded")) === "false");
      await seccion.click();
      ok("al desplegarla vuelve", await hasta(async () => (await altoSeccion()) > 20, 3000));
    }

    // El hilo.
    await fila.click();
    const cabecera = page.locator("main header").filter({ hasText: NOMBRES[0] });
    await cabecera.waitFor({ timeout: 20000 });
    await page.getByText("¿Te aparto un horario?").last().waitFor({ timeout: 20000 }).catch(() => {});
    await espera(500);
    await page.screenshot({ path: `${SALIDA}/hilo-${tema}-1280.png` });
    ok("la cabecera del hilo lleva el filo en degradado", (await cabecera.locator(".bg-gradient-to-r").count()) === 1);
    ok("sin desborde con el hilo abierto", !(await desborde(page)).pagina);

    console.log(`\n== ${tema === "light" ? "Claro" : "Oscuro"} · 390 ==`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/inbox`);
    await fila.waitFor({ timeout: 30000 });
    await espera(400);
    await page.screenshot({ path: `${SALIDA}/bandeja-${tema}-390.png` });
    let d = await desborde(page);
    ok("la lista cabe a 390 (sin scroll horizontal)", !d.pagina && d.fuera.length === 0, JSON.stringify(d));
    ok("la barra de escritorio no se ve en el teléfono", !(await page.getByRole("button", { name: "Buscar (Ctrl+K)" }).isVisible()));

    await fila.click();
    await page.getByRole("button", { name: "Volver a las conversaciones" }).waitFor({ timeout: 20000 });
    await espera(500);
    await page.screenshot({ path: `${SALIDA}/hilo-${tema}-390.png` });
    d = await desborde(page);
    ok("el hilo cabe a 390", !d.pagina && d.fuera.length === 0, JSON.stringify(d));
    const caja = await page.getByPlaceholder("Escribe una respuesta…").boundingBox();
    ok("el compositor queda dentro de la pantalla", caja && caja.x >= 0 && caja.x + caja.width <= 390 && caja.y + caja.height <= 844, JSON.stringify(caja));

    await page.getByRole("button", { name: "Volver a las conversaciones" }).click();
    await page.getByRole("button", { name: "Abrir el menú" }).click();
    await espera(400);
    const cajon = await page.evaluate(() => {
      const a = document.querySelector("aside")?.getBoundingClientRect();
      return a ? { left: Math.round(a.left), right: Math.round(a.right) } : null;
    });
    await page.screenshot({ path: `${SALIDA}/menu-${tema}-390.png` });
    ok("el menú entra como cajón desde la izquierda", cajon && cajon.left === 0 && cajon.right <= 390, JSON.stringify(cajon));
    await page.keyboard.press("Escape");
    await ctx.close();
  }

  ok("sin errores de JavaScript en la página", errores.length === 0, errores.join(" | "));
} catch (e) {
  failures++;
  console.log(`  FALLA  el guion se cortó — ${e instanceof Error ? e.message : e}`);
} finally {
  await browser.close();
}

if (SOLO_CAPTURAS) {
  console.log(`\nCapturas en ${SALIDA} (sin afirmaciones: SOLO_CAPTURAS=1).`);
  process.exit(failures ? 1 : 0);
}
console.log(`\n${checks - failures}/${checks} comprobaciones en verde.`);
process.exit(failures ? 1 : 0);
