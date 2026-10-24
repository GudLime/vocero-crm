/**
 * Self-test E2E — 060a: el tema nuevo y la Bandeja en la ventana flotante.
 * Guion: tests/e2e/us-diseno-060a.md.
 *
 * Recorre la Bandeja en claro y en oscuro, a 1280 y a 390 px, y comprueba que
 * se pinta (cascarón, lista, hilo, panel del contacto y barra superior), que
 * nada desborda a lo ancho en el teléfono y que el menú del teléfono abre y
 * cierra. Con `CAPTURAS_DIR` deja además las capturas de cada combinación
 * (`bandeja-<tema>-<ancho>.png`): son las del antes y el después de la spec.
 *
 * Requiere la app viva con WA_MOCK_ENABLED=true. `E2E_EMAIL` / `E2E_PASSWORD`
 * para entrar con una cuenta que ya exista. `SOLO_CAPTURAS=1` no cuenta como
 * fallo lo que es nuevo de la 060a (sirve para capturar el «antes»).
 *
 * Uso: node --env-file=<env> scripts/e2e-diseno-060a.mjs
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.APP_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL ?? "e2e-diseno@vocero.test";
const PASSWORD = process.env.E2E_PASSWORD ?? "password-e2e-diseno";
const SALIDA = process.env.CAPTURAS_DIR ?? "";
const SOLO_CAPTURAS = process.env.SOLO_CAPTURAS === "1";
const S = Date.now().toString(36);
const PN = `PN-DIS-${S}`;

let failures = 0;
let checks = 0;
function ok(name, cond, extra = "") {
  checks++;
  if (cond) console.log(`  OK  ${name}`);
  else {
    failures++;
    console.log(`  FALLA  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}
/** Lo que solo existe con el diseño de la 060a: en el «antes» no cuenta. */
function nuevo(name, cond, extra = "") {
  if (SOLO_CAPTURAS) console.log(`  ${cond ? "sí" : "no"}  (060a) ${name}`);
  else ok(name, cond, extra);
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
/** `isVisible` no espera: esto sí. */
const visible = (loc, ms = 20000) =>
  loc
    .first()
    .waitFor({ state: "visible", timeout: ms })
    .then(() => true)
    .catch(() => false);
async function hasta(fn, ms = 15000) {
  const fin = Date.now() + ms;
  for (;;) {
    const v = await fn().catch(() => null);
    if (v || Date.now() > fin) return v;
    await espera(250);
  }
}

if (SALIDA) mkdirSync(SALIDA, { recursive: true });
const browser = await chromium.launch();
// Una sola sesión para todo el recorrido: el login tiene tope por IP.
const base = await browser.newContext();
const req = base.request;
const errores = [];

try {
  console.log("== Preparación ==");
  let r = await req.post(`${BASE}/api/auth/sign-up/email`, {
    headers: { origin: BASE },
    data: { email: EMAIL, password: PASSWORD, name: "Dueña Diseño" },
  });
  if (!r.ok())
    r = await req.post(`${BASE}/api/auth/sign-in/email`, {
      headers: { origin: BASE },
      data: { email: EMAIL, password: PASSWORD },
    });
  ok("login", r.ok());
  const estado = await base.storageState();

  await req.put(`${BASE}/api/settings/whatsapp`, {
    data: { wabaId: "WABA-DIS", phoneNumberId: PN, token: "tok-dis" },
  });
  // Un nombre y un mensaje largos a propósito: son los que desbordan.
  const LARGO = `Maximiliana Guadalupe Hernández de la Concepción ${S}`;
  const CHATS = [
    [`Ana Diseño ${S}`, "Hola, ¿tienen envío a Monterrey?"],
    [LARGO, `Quisiera cotizar ${"muchísimas ".repeat(12)}piezas: https://ejemplo.test/${"x".repeat(80)}`],
    [`Beto Diseño ${S}`, "¿A qué hora abren mañana?"],
  ];
  for (const [i, [name, text]] of CHATS.entries()) {
    await req.post(`${BASE}/api/dev/wa-mock/inbound`, {
      data: { phoneNumberId: PN, from: `5215558${i}${Math.floor(100000 + Math.random() * 899999)}`, name, text },
    });
    await espera(300);
  }
  const convs = await hasta(async () => {
    const l = (await (await req.get(`${BASE}/api/conversations`)).json()).conversations ?? [];
    const m = CHATS.map(([n]) => l.find((c) => c.contact.name === n));
    return m.every(Boolean) ? m : null;
  });
  ok("las conversaciones de prueba existen", Boolean(convs));

  for (const tema of ["light", "dark"]) {
    for (const ancho of [1280, 390]) {
      const movil = ancho < 768;
      console.log(`\n== ${tema} · ${ancho} px ==`);
      const ctx = await browser.newContext({
        storageState: estado,
        viewport: { width: ancho, height: movil ? 844 : 860 },
        deviceScaleFactor: 1,
        isMobile: movil,
        hasTouch: movil,
        locale: "es-MX",
        timezoneId: "America/Mexico_City",
        reducedMotion: "reduce",
      });
      await ctx.addCookies([{ name: "vocero-theme", value: tema, url: BASE }]);
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem("vocero.panelOpen", "true");
        } catch {
          // sin almacenamiento, el panel se queda como venga
        }
      });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => errores.push(`${tema}/${ancho}: ${e.message}`));
      await page.goto(`${BASE}/inbox`, { waitUntil: "load" });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

      const tema_ = await page.evaluate(() => document.documentElement.dataset.theme);
      ok("el tema pedido está puesto", tema_ === tema, tema_);
      ok(
        "la lista se pinta con su título",
        await visible(page.getByRole("heading", { name: "Bandeja" }), 30000)
      );
      const fila = page.getByRole("button", { name: new RegExp(`Ana Diseño ${S}`) }).first();
      ok("la conversación aparece en la lista", await visible(fila, 30000));

      // El cascarón de la 060a: ventana flotante y lateral claro.
      const shell = await page.evaluate(() => {
        const ventana = document.querySelector("[data-shell='ventana']");
        const lateral = document.querySelector("[data-shell='lateral']");
        const cs = ventana ? getComputedStyle(ventana) : null;
        return {
          ventana: Boolean(ventana),
          radio: cs ? parseFloat(cs.borderTopLeftRadius) : 0,
          lateral: Boolean(lateral),
          lateralFondo: lateral ? getComputedStyle(lateral).backgroundColor : null,
          pagina: getComputedStyle(document.body).backgroundColor,
        };
      });
      nuevo("el contenido vive en la ventana flotante", shell.ventana);
      if (!movil) {
        nuevo("la ventana tiene esquinas redondas (≥ 20 px)", shell.radio >= 20, String(shell.radio));
        nuevo(
          "la barra superior tiene buscador de clientes",
          await visible(page.getByRole("button", { name: "Buscar clientes" }), 5000)
        );
        if (!SOLO_CAPTURAS) {
          await page.getByRole("button", { name: "Buscar clientes" }).click();
          const barra = page.getByRole("dialog", { name: "Barra de comandos" });
          ok("«Buscar clientes» abre la barra Ctrl+K", await visible(barra, 5000));
          await page.keyboard.press("Escape");
          ok("la barra se cierra con Escape", await barra.waitFor({ state: "hidden", timeout: 5000 }).then(() => true).catch(() => false));
        }
        nuevo(
          "el lateral es un panel del tema (no azul marino fijo)",
          shell.lateral && tema === "light" ? shell.lateralFondo !== "rgb(7, 14, 32)" : shell.lateral
        );
      }

      // Nada se sale a lo ancho, con el nombre y el mensaje largos en la lista.
      const desborde = () =>
        page.evaluate(() => {
          const w = window.innerWidth;
          const raiz = document.documentElement.scrollWidth - w;
          const fuera = [...document.querySelectorAll("main *")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height) return false;
              const st = getComputedStyle(el);
              if (st.position === "fixed" || st.visibility === "hidden") return false;
              // Lo que vive dentro de un carril con scroll horizontal no cuenta.
              for (let p = el.parentElement; p; p = p.parentElement) {
                const o = getComputedStyle(p).overflowX;
                if (o === "auto" || o === "scroll" || o === "hidden") {
                  const pr = p.getBoundingClientRect();
                  if (pr.right <= w + 1) return false;
                }
              }
              return r.right > w + 1;
            })
            .slice(0, 3)
            .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
          return { raiz, fuera };
        });
      let d = await desborde();
      ok("la lista no desborda a lo ancho", d.raiz <= 0 && d.fuera.length === 0, JSON.stringify(d));

      if (movil) {
        // El menú del teléfono: abre como cajón y cierra con su botón.
        await page.getByRole("button", { name: "Abrir el menú" }).click();
        const cerrar = page.locator("aside").getByRole("button", { name: "Cerrar el menú" });
        ok("el menú del teléfono abre", await visible(cerrar, 5000));
        await page.waitForTimeout(250);
        if (SALIDA) await page.screenshot({ path: `${SALIDA}/menu-${tema}-${ancho}.png` });
        await cerrar.click();
        await page.waitForTimeout(300);
        ok(
          "el menú del teléfono cierra",
          !(await page.locator("aside").getByRole("link", { name: /Bandeja/ }).first().isVisible().catch(() => false))
        );
        if (SALIDA) await page.screenshot({ path: `${SALIDA}/bandeja-${tema}-${ancho}.png` });
      }

      // El hilo, con el panel del contacto en escritorio.
      await page.getByRole("button", { name: new RegExp(LARGO) }).first().click();
      const burbuja = page.locator("[data-message-id]").filter({ hasText: "Quisiera cotizar" }).first();
      ok("el hilo muestra el mensaje", await visible(burbuja, 20000));
      ok(
        "el compositor está a la vista",
        await visible(page.getByRole("textbox", { name: /Escribe una respuesta/ }), 10000)
      );
      await page.waitForTimeout(400);
      d = await desborde();
      ok("el hilo no desborda a lo ancho", d.raiz <= 0 && d.fuera.length === 0, JSON.stringify(d));
      if (!movil) {
        ok(
          "el panel del contacto se ve junto al hilo",
          await visible(page.getByText("Etapa del pipeline").first(), 10000)
        );
      }
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      if (SALIDA)
        await page.screenshot({
          path: `${SALIDA}/${movil ? "hilo" : "bandeja"}-${tema}-${ancho}.png`,
          animations: "disabled",
        });
      await ctx.close();
    }
  }

  ok("sin errores de página", errores.length === 0, errores.slice(0, 3).join(" | "));
} catch (e) {
  failures++;
  console.error("ERROR", e);
} finally {
  await browser.close();
}

console.log(`\n${checks - failures}/${checks} comprobaciones en verde`);
process.exit(failures ? 1 : 0);
