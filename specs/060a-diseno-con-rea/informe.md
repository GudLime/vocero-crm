# Informe — 060a (rama A: observada con REA)

- **Inicio**: 2026-10-23 22:19 (UTC−6)
- **Fin**: 2026-10-23 22:50 (UTC−6) — unos 31 minutos de reloj, con el gate,
  los arneses y el self-test incluidos.
- **Navegador de observación**: Brave con depuración en `127.0.0.1:9223`, la
  sesión de Kevin en `crm.s4luia.com/inbox`. No se usaron el navegador
  integrado ni Claude in Chrome para mirar la referencia.

## Herramientas de REA y para qué

| Herramienta | Para qué |
|---|---|
| `list_browser_targets` | Encontrar la pestaña de la Bandeja (`0C8ACA64…`) |
| `capture_web_screenshot` | La Bandeja en claro, 1295×947, tal como estaba |
| `inspect_web_page` | DOM (nombres de atributos, sin valores), recursos, hojas y fuentes; con `include_script_sources` se quedaron los bundles JS |
| `export_web_scripts` | Volcar esos bundles a disco (scratchpad) para leer las clases de Tailwind del layout y de la Bandeja |
| `analyze_web_bundle` | Se intentó: la conexión MCP se cayó con una página de ~740 kB de fuentes. Se sustituyó por la vía anterior |
| `capture_browser_scenario` (launch) | Brave headless, perfil propio y sin sesión, contra el `.css` público de `_next/static`: el cuerpo de la respuesta trajo la hoja completa (65 kB), de donde salen TODOS los tokens |
| `capture_browser_scenario` (connect) | 1) viewport de 390 px: no repintó el layout (ver abajo). 2) Tocar el botón de tema, capturar el oscuro y volver a claro. El JS confirmó antes que el botón solo escribe la cookie `vocero-theme`: no cambia datos del CRM |

Nada abrió conversaciones ni escribió en el servidor de la referencia. Las
capturas y el CSS de la referencia viven solo en el scratchpad.

## Tokens y estructuras extraídos

- **Neutros y acento claros**: idénticos a los de Vocero (`#ffffff`,
  `#f6f8fc`, `#eef2f9`, `#0a1730`, `#0d5bff`…), lo que confirma el ancestro
  común.
- **Radios**: 10 / 14 / 20 px (Vocero: 9 / 12 / 16).
- **Sombras**: `shadow-sm` doble y corta, `shadow-md` más cercana, `shadow-pop`
  de una capa.
- **Oscuro**: la paleta 1.x (`#0b1327`, `#070e20`, `#111b36`, bordes
  `#1a2748`).
- **Cascarón** (clases `envigo-*`): papel con dos resplandores radiales
  (acento 8 %, cian 10 %) sobre un degradado `#dfe7f5 → #eef2f9 → #f7f9fd`;
  ventana con radio 24 y `shadow-md`; lateral `#eef2f9` con borde `#e4eaf5` y
  radio 20; píldoras de 40 px con `shadow-sm`; título de sección en mono
  10.5 px con tracking .14em.
- **Lateral**: 16.5rem, grupos plegables con chevron, ítem radio 12 / 13.5 px,
  activo como tarjeta blanca con borde y sombra, icono 18 px con trazo 1.9;
  pie como tarjeta con avatar «3D» del acento.
- **Barra superior**: buscador, píldora del negocio con la inicial en
  `brand-tint`, campana redonda, avatar en degradado.
- **Bandeja**: casi la de Vocero 1.x; difiere en las pestañas en píldora con
  contador en círculo, la lista a 360 px y un filo de 3 px del acento al cian
  arriba del hilo.

## Qué costó ver

1. **El hilo y el panel del contacto en vivo**: la referencia tiene la
   Bandeja vacía (0 conversaciones), así que no hubo nada que abrir sin pedir
   datos. Se reconstruyeron desde su JS (clases de la fila, del hilo, del
   compositor y del panel), no desde una captura.
2. **390 px**: `capture_browser_scenario` en modo `connect` no aplicó la
   emulación de viewport a la pestaña ya abierta (la captura salió recortada
   del layout de escritorio). El comportamiento móvil se sacó de las clases
   (`lg:hidden`, cajón de 17rem, `max-xl:` del panel).
3. **Valores de atributos**: `inspect_web_page` por diseño no retiene valores
   de atributos (solo nombres), así que las clases no salen del DOM; hubo que
   ir a los bundles.
4. **La hoja CSS**: `inspect_web_page` lista la hoja pero no su texto. La
   salida fue un escenario `launch` sin sesión contra la URL pública.
5. **Tamaño de las respuestas**: casi todo excede el límite del MCP y se
   guardó en archivo; hubo que decodificar PNG y cuerpos base64 con Python.

## Qué tan fiel quedó cada zona

| Zona | Nota | Por qué |
|---|---|---|
| Tokens claros | 5/5 | Radios y sombras copiados del CSS; los neutros ya coincidían |
| Tokens oscuros | 3/5 | Forma replicada, color NO: se mantuvo la escalera v2 de Vocero porque la 1.x de la referencia rompe los pisos de `contraste-temas.test.ts` (bordes ~1.2:1). El oscuro de Vocero se ve más claro que el de la referencia |
| Cascarón (papel + ventana) | 5/5 | Mismos degradados, radio 24, márgenes 8/12 px; el resplandor sale de `--accent` (white-label) |
| Menú lateral | 4/5 | Tarjeta, ítems, activo, pie y plegado iguales. Sin las letras «A · B · C» ni las secciones propias de la referencia; el grupo de la pantalla actual no se pliega |
| Barra superior | 4/5 | Mismas píldoras. El buscador abre la barra Ctrl+K (055) en vez de un input propio, y la campana es el sonido de mensajes, no un centro de avisos |
| Lista de la Bandeja | 5/5 | Pestañas en píldora con contador en círculo; el resto ya era igual. La lista mide 330 px hasta `2xl` (360 en la referencia) para no ahogar el hilo dentro de la ventana |
| Hilo | 4/5 | Filo del acento al cian añadido; el resto ya coincidía con su JS. Sin captura en vivo de la referencia para comparar |
| Panel del contacto | 4/5 | Sin cambios: su estructura ya coincide con la del JS de la referencia. Mismo límite: sin captura en vivo |
| 390 px | 4/5 | Cajón y barra de 48 px como en su código; sin captura móvil real de la referencia |

## Verificación

- `pnpm typecheck && pnpm lint && pnpm build && pnpm test`: verde (1370
  pruebas), también con `CHANNELS=whatsapp,instagram,messenger,tiktok AGENDA=on`.
- Contraste nuevo (`contraste-temas.test.ts`): texto, secundario y terciario
  del lateral ≥ 4.5:1 en los dos temas; el lateral claro lleva su propio
  terciario (`#5c6a85`) porque el de la página quedaba a 2.8:1.
- `scripts/e2e-diseno-060a.mjs`: 51/51 (claro y oscuro, 1280 y 390 px).
- `e2e-filtros-ventana` 22/22, `e2e-reenviar-y-deslizar` 43/43,
  `e2e-eventos-hilo` 15/15, `e2e-atajos` 25/25 (claro y oscuro),
  `e2e-notas-internas` 28/28.
- `scripts/e2e-selftest.mjs` en base limpia: 280/280.
- Capturas: `docs/060a/antes/` y `docs/060a/despues/` (bandeja, hilo y menú;
  claro y oscuro; 1280 y 390). Solo datos de prueba del wa-mock.

## Pendientes y notas

- La vista previa de Ajustes → Marca ahora pinta el lateral nuevo
  (`shell-sidebar`); `.nav-dark` sigue en el CSS (la vigilan las pruebas de
  branding) pero ya no lo usa la app.
- El color de la barra de estado de la PWA (`lib/pwa.ts`) sigue en el azul
  marino de antes.
