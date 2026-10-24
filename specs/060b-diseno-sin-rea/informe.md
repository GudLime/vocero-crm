# 060b — Informe (rama B: navegador integrado, sin REA)

**Inicio**: 2026-10-23 22:19 (-06:00) · **Fin**: 2026-10-23 22:57 (-06:00)

Rama B del experimento: la misma tarea que la 060a, observando la referencia
**solo con el navegador integrado** de la app de Claude (herramientas
`mcp__Claude_Browser__*`). No se usó REA ni Claude in Chrome. La referencia se
abrió en modo lectura: no se abrió ninguna conversación, no se cambió el tema
guardado ni se hizo clic en nada que escriba datos.

## Herramientas y para qué

| Herramienta | Para qué |
|---|---|
| `preview_start` (url) | Abrir la referencia en la pestaña `seed` (sesión de Kevin ya iniciada) |
| `computer` → `screenshot` | Ver cada estado: 1280 claro, 1280 oscuro, 390 claro (con y sin el cajón a medio cerrar) |
| `resize_window` | 1280×800 y 390×844; al final, `desktop` |
| `javascript_tool` | (1) Recorrer `document.styleSheets` y sacar las reglas de `:root`, `:root[data-theme="dark"]` y las clases propias del marco (`.envigo-*`, `.icon-3d`, `.thread-bg`, `.kicker`). (2) Un recorrido del DOM con `getComputedStyle` + `getBoundingClientRect` (color, fondo, tipografía, radio, padding, sombra, posición) hasta 9 niveles. (3) Poner `data-theme="dark"` en `<html>` para ver el oscuro **sin** tocar la preferencia guardada. (4) `fetch` del chunk JS de `/inbox` y extraer sus `className` |
| `read_page` / `get_page_text` | No hicieron falta: el árbol con estilos calculados daba más |

Las capturas y las notas de la referencia quedaron en el scratchpad de la
sesión, fuera del repo.

## Qué se sacó

**Tokens** (claro casi idéntico al de Vocero 2.4, porque es un fork):

- Radios 10 / 14 / 20 (Vocero: 9 / 12 / 16); tarjetas de 20 y 24 px.
- Sombras en dos capas y más suaves: `shadow-sm` `0 1px 2px … .05, 0 1px 3px … .06`;
  `shadow-md` `0 4px 12px -4px … .12, 0 12px 32px -12px … .14`; `shadow-pop`
  `0 24px 64px -20px … .28`.
- `--accent-glow` cian (`#00c2ff`; oscuro `#38d6ff`).
- Oscuro: `bg #0b1327`, `subtle #070e20`, `panel #111b36`, `border #1a2748`.

**Estructura**:

- Lienzo con dos resplandores radiales (acento 8 %, cian 10 %) sobre un
  degradado `#dfe7f5 → #eef2f9 → #f7f9fd`; margen y separación de 12 px (8 en
  el teléfono).
- Menú como tarjeta (`#eef2f9`, borde `#e4eaf5`, radio 20, 16.5rem):
  logo, `CRM · WHATSAPP` en mono, secciones con letra («A · Comercial») que se
  pliegan con una rejilla `0fr/1fr`, ítem activo como tarjeta blanca con
  borde, sombra y tinta del acento, tarjeta del usuario con avatar en relieve.
- Contenido como tarjeta (radio 24, `shadow-md`) con una barra superior de
  píldoras: buscador, organización, campana, avatar.
- Bandeja: píldoras «Todas | No leídas» con contador en insignia, chips de
  canal, buscador en píldora; vacíos con círculo de 64 px y título en
  Instrument Serif itálica. Del bundle: filo de 3 px `from-brand to-brand-glow`
  en la cabecera del hilo, burbujas `rounded-2xl` con esquina de 5 px,
  compositor en cápsula de 23 px, panel de detalles de 320 px.

## Qué costó ver

- **La Bandeja de la referencia está vacía** (0 conversaciones en todos los
  canales). No hubo filas, hilo ni panel del contacto en vivo, y no había
  conversación que pedirle a Kevin que abriera. Esas zonas salieron de las
  clases del chunk de `/inbox` leído con `fetch`, no de verlas pintadas: se
  sabe *qué* clases usan, pero no cómo se ven con datos.
- **El oscuro forzado por atributo** pintó la primera captura a medio camino
  (las transiciones `transition-all` de los ítems): hubo que repetirla.
- **El cajón a 390** salió en la primera captura cerrándose (transición de
  200 ms): misma solución.
- **Nada de capas ni de animaciones finas**: sin una herramienta de
  inspección dedicada, los `@keyframes` (p. ej. `entra-pagina`) se vieron por
  nombre, no por contenido.
- La campana es un centro de notificaciones que en vacío no muestra nada; no
  se abrió (sería un clic sobre estado del CRM del amigo).

## Qué tan fiel quedó cada zona (1–5)

| Zona | Nota | Por qué |
|---|---|---|
| Tema claro (tokens) | **5** | Radios, sombras, glow, lienzo y tarjetas con los valores medidos. Única desviación: `--nav-label` (#5e6c87) en vez de `--text-3` para las letras del menú, porque `text-3` sobre la tarjeta del menú da 2.8:1 y el piso es AA |
| Tema oscuro | **3** | Misma estructura (lienzo = hueco, menú un escalón arriba, tarjeta con borde), pero **no** los hex de la referencia: su paleta no pasa los pisos de `contraste-temas` (bordes a ~1.2:1). Se ve más claro y con más contraste que la referencia |
| Marco (lienzo, tarjetas, márgenes) | **5** | Medidas tomadas del DOM: 12/8 px, radios 20/24, ancho 16.5rem |
| Menú lateral | **4** | Secciones con letra plegables, ítem activo en tarjeta, tarjeta del usuario, versión en mono. Diferencias: las secciones nacen abiertas (Vocero tiene 8 renglones) y el pie lleva además el botón de sonido |
| Barra superior | **4** | Buscador, organización y avatar en píldoras. El buscador abre la barra Ctrl+K de la 055. Sin campana: Vocero no tiene centro de notificaciones y no se pinta un botón muerto |
| Bandeja · lista | **4** | Píldoras de filtro con insignia, chips de canal y buscador iguales; filas ya coincidían (mismo origen). «Filtrar» como píldora en vez del desplegable de canal de la referencia (la 052 lo decidió así) |
| Bandeja · hilo | **3** | Filo en degradado, cabecera y vacío con círculo y serif como en el bundle, pero sin haberlo visto pintado con mensajes |
| Panel del contacto | **3** | Ya compartía estructura (320 px, cajón bajo `xl`); no se pudo observar con datos |
| 390 px | **5** | Barra dentro de la tarjeta, cajón desde la izquierda, sin desborde (arnés) |

## Verificación

- `tsc`, `eslint`, `next build`, `vitest` (120 archivos, 1371 pruebas): verde,
  también con `CHANNELS=whatsapp,instagram,messenger,tiktok AGENDA=on`.
  (`pnpm` se saltó por llamar los binarios directo: el worktree usa el
  `node_modules` del repo por junction y `pnpm` quería reinstalar.)
- `contraste-temas.test.ts`: 5 pisos nuevos del menú en claro y oscuro.
- Arnés nuevo `scripts/e2e-diseno-060b.mjs`: **43/43** (claro y oscuro, 1280 y
  390: marco, buscador → Ctrl+K, píldoras, secciones plegables, filo del hilo,
  sin desborde, compositor dentro, cajón).
- Arneses de la Bandeja: `e2e-filtros-ventana` 22/22, `e2e-reenviar-y-deslizar`
  43/43, `e2e-eventos-hilo` 15/15, `e2e-atajos` 25/25, `e2e-notas-internas`
  28/28.
- `e2e-responsive` actualizado al marco nuevo (menú 264 px, menú en tarjeta,
  barra del teléfono dentro de la tarjeta): 53/54. La que falla, «Agente
  encendido: un clic lo cambia», pide el `/health` del cerebro falso, que solo
  levanta el self-test; no depende del diseño.
- `e2e-selftest.mjs` en base limpia: **280/280** (base `vocero_e2e_060b_st`).

Capturas en `docs/060b/antes/` y `docs/060b/despues/` (claro y oscuro, 1280 y
390: Bandeja, hilo y menú del teléfono).

## Pendientes y notas

- La vista previa de Configuración → Marca sigue pintando la barra azul
  marino (`.nav-dark`); con esta rama ya no coincide con el menú real.
- Otras pantallas heredan tokens y marco pero no se rediseñaron.
- El indicador de Next en modo dev («N», abajo a la izquierda) sale en las
  capturas; no existe en producción.
