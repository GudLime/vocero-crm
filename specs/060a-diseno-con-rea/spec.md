# 060a — Tema y Bandeja de la referencia (rama A: observada con REA)

**Feature Branch**: `claude/060a-diseno-con-rea-ff4363`

**Created**: 2026-10-23

**Status**: Especificada antes de escribir código. Experimento: NO se fusiona;
Kevin la compara con la rama B (sin REA) y elige.

**Input**: Kevin quiere el aspecto del fork de un amigo (otra instancia de
Vocero, MIT, con permiso) para el tema y la Bandeja. Esta rama la observa
**solo con REA** sobre Brave (CDP 9223). Las capturas y los datos de la
referencia se quedan fuera del repo (tienen datos de clientes); aquí solo
viven los tokens y la estructura que se sacaron de su CSS y su JS públicos.

**Carril**: ligero (Principio VI). Sin datos, sin contrato, sin migración:
es CSS y JSX.

## Problema

La interfaz de Vocero es de dos colores: barra lateral azul marino fija y la
página pegada a ella, de borde a borde. La referencia, que parte del mismo
código, se ve más ligera: la página es un fondo con un leve degradado, el
contenido vive en una **ventana flotante** de esquinas grandes, el menú es una
**tarjeta clara** del tema con secciones plegables y hay una **barra superior**
con buscador, organización, campana y avatar.

## Lo que se sacó de la referencia (con REA)

| Zona | Lo observado |
|---|---|
| Tokens claros | `--radius-sm/--radius/--radius-lg` = 10/14/20 px; `--shadow-sm` = `0 1px 2px rgba(8,27,82,.05), 0 1px 3px rgba(8,27,82,.06)`; `--shadow-md` = `0 4px 12px -4px rgba(8,27,82,.12), 0 12px 32px -12px rgba(8,27,82,.14)`; `--shadow-pop` = `0 24px 64px -20px rgba(8,27,82,.28)`. Neutros y acento iguales a los de Vocero |
| Tokens oscuros | Los de la 1.x (`#0b1327`/`#070e20`/`#111b36`, bordes `#1a2748`) |
| Fondo | `radial(1200×500 en 15% −10%, acento 8%)` + `radial(900×480 en 95% 0, cian 10%)` + `linear(#dfe7f5 → #eef2f9 42% → #f7f9fd)`; en oscuro, `--bg-subtle` |
| Ventana | `bg` del tema, borde `--border`, radio 24 px, `--shadow-md`; margen 8 px (12 desde `sm`) |
| Lateral | Tarjeta `#eef2f9` con borde `#e4eaf5`, radio 20 px; 16.5rem en escritorio. Secciones con kicker mono y chevron. Ítem: radio 12 px, 13.5 px; activo = tarjeta blanca con borde y `shadow-sm`, tinta `accent-text`; hover = blanco con `shadow-sm` |
| Pie del lateral | Tarjeta blanca radio 14 px con avatar en degradado del acento, nombre y rol, tema y salir; versión en mono debajo |
| Barra superior (≥ lg) | `bg/80` con desenfoque, `px-5 py-3`; píldoras de 40 px con borde y `shadow-sm`: buscador de clientes, organización (inicial en `brand-tint`), campana redonda, avatar en degradado |
| Bandeja | Como la de Vocero; diferencias: pestañas «Todas / No leídas» como **píldoras** con el contador en un círculo (relleno del acento en la activa) y el fondo del contenido en `bg-subtle/60` |

## Decisiones

**D1 — Tokens.** Se adoptan los radios y las sombras claras de la referencia.
El **tema oscuro conserva la escalera v2** de Vocero: los valores 1.x de la
referencia ponen bordes a 1.2:1 y la barra a 1.04:1 de la página, y
`contraste-temas.test.ts` existe justo para no volver ahí. La forma (ventana,
tarjeta, barra) sí se replica en oscuro.

**D2 — Cascarón.** Fondo con degradado (el resplandor sale del acento con
`color-mix`, así sigue al white-label), ventana flotante con el contenido, y
lateral como tarjeta del tema. Se marcan con `data-shell="ventana"` y
`data-shell="lateral"` para el arnés.

**D3 — Lateral claro.** Deja de usar `.nav-dark` (la clase se queda: la usa la
vista previa de Marca y la vigilan las pruebas de branding). El acento del
menú pasa a ser el de la página. En claro, el gris terciario del lateral se
oscurece (`--text-3` local) para pasar AA a 10.5 px sobre `#eef2f9`.

**D4 — Secciones plegables.** Los grupos de `appNavGroups` se pliegan con su
kicker como botón (chevron). Abierto por defecto el grupo de la pantalla
actual y los demás también (nadie pierde una entrada); lo plegado se recuerda
en `localStorage`. Sin letras «A · B · C»: la referencia las usa para sus
propias secciones, no aportan en Vocero.

**D5 — Barra superior (≥ lg).** Buscador de clientes (lleva a Contactos con
la búsqueda), píldora con la marca white-label, campana de sonido (la misma
preferencia que hoy vive en el pie) y avatar. En el teléfono queda la barra
de 48 px con el hamburguesa, ahora del tema y no azul marino.

**D6 — Bandeja.** Pestañas en píldora con contador en círculo. Lista, hilo y
panel conservan su comportamiento (052, 054, 055, 059).

**D7 — Sin la marca de la referencia.** Ni su logo ni su nombre; el logo y el
nombre siguen saliendo de `branding`.

## Fuera de alcance

Otras pantallas (heredan tokens y cascarón, nada más), la campana de
notificaciones de la referencia (lista de avisos), sus iconos 3D en el menú y
sus secciones propias (Contabilidad, Redes…).

## Verificación

- `pnpm typecheck && pnpm lint && pnpm build && pnpm test`, también con
  `CHANNELS=whatsapp,instagram,messenger,tiktok AGENDA=on`.
- Pruebas de contraste nuevas para el lateral (claro y oscuro).
- Arnés `scripts/e2e-diseno-060a.mjs` (guion `tests/e2e/us-diseno-060a.md`):
  claro y oscuro, 1280 y 390 px; la Bandeja se pinta, ventana y lateral
  presentes, sin desborde a lo ancho, menú del teléfono abre y cierra, hilo y
  panel visibles.
- Arneses de la lista y el hilo: `e2e-filtros-ventana`, `e2e-reenviar-y-deslizar`,
  `e2e-eventos-hilo`, `e2e-atajos`, `e2e-notas-internas`.
- `scripts/e2e-selftest.mjs` en base limpia.
- Capturas antes/después en `docs/060a/`.

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I · Seguridad | Sin secretos ni datos nuevos; el buscador de la barra solo navega a Contactos |
| II · Soberanía | Sin dependencias nuevas: CSS, Tailwind y lucide que ya estaban |
| III · Multi-tenancy | No toca consultas |
| IV · Idempotencia | No escribe nada en el servidor; lo plegado vive en el navegador |
| V · Hecho | Contraste en `pnpm test`, arnés nuevo y los de la Bandeja, self-test en base limpia |
| VI · Specs | Este documento, antes del código; carril ligero |
| VIII · Foco | El cambio es de aspecto: el flujo de la Bandeja no cambia |
| IX · En vivo | El arnés recorre la app real en los dos temas y dos anchos |
| White-label | Acento configurable intacto: el degradado y el avatar salen de `--accent*` |
