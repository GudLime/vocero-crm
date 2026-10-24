# 060b — Rediseño del tema y la Bandeja (rama B: sin REA)

**Feature Branch**: `claude/060b-diseno-sin-rea-ec1a0d`

**Created**: 2026-10-23

**Status**: Especificada antes de escribir código. Implementada; gate, contraste, arnés 060b (43/43), arneses de la Bandeja y self-test (280/280) en verde. Experimento: NO se fusiona;
Kevin la compara con la rama A (060a, la misma tarea observando con REA) y elige.

**Input**: Kevin quiere el aspecto de la instancia de referencia (un fork MIT de
Vocero de un amigo suyo, con su permiso). Esta rama la observa **solo con el
navegador integrado** de la app (árbol de accesibilidad, capturas y estilos
calculados leídos por JavaScript). Las notas del relevamiento y las capturas de
la referencia quedan fuera del repo: muestran datos de clientes reales.

**Carril**: ligero (Principio VI). Sin datos, sin contrato, sin migración: es
CSS y marcado.

## Problema

La 2.4 se ve como un panel plano: barra lateral azul marino pegada al borde y
la página entera blanca. La referencia, con los mismos tokens de color de
partida, se siente más ligera: la app vive en **tarjetas flotantes** sobre un
fondo con un leve degradado, el menú es una tarjeta clara con secciones que se
pliegan, hay una barra superior de «píldoras» y la Bandeja usa píldoras para
sus filtros.

## Lo que se observó (resumen; el detalle va en el informe)

- **Marco**: fondo con dos resplandores (acento y cian) sobre un degradado
  frío; 12 px de margen y 12 px entre piezas (8 px en el teléfono). Menú:
  tarjeta `bg-panel` con borde y radio 20, ancho 16.5rem. Contenido: tarjeta
  `bg` con borde, radio 24 y `shadow-md`.
- **Barra superior** (≥ lg): buscador en píldora que ocupa el ancho, píldora
  de la organización, campana y avatar con relieve («icon-3d»). En el teléfono
  la barra va dentro de la tarjeta, blanca, con hamburguesa, logo y campana.
- **Menú**: secciones con letra («A · …») en mono 10.5 que se pliegan; el
  activo es una tarjeta blanca con borde, sombra y tinta del acento; abajo una
  tarjeta con el usuario y la versión en mono.
- **Tokens**: radios 10/14/20 (antes 9/12/16), sombras más suaves y en dos
  capas, `--accent-glow` (cian) para remates.
- **Bandeja**: «Todas» y «No leídas» como píldoras con contador en insignia;
  la cabecera del hilo con un filo de 3 px en degradado acento→cian; estados
  vacíos con un círculo de 64 px y título en Instrument Serif itálica.
- **Oscuro**: misma estructura; el lienzo es `bg-subtle` y el menú `bg-panel`.

## Decisiones

**D1 — Tokens.** Se adoptan los radios, las sombras y `--accent-glow` de la
referencia en `:root`. **El tema oscuro conserva la escalera v2 de Vocero**:
la paleta oscura de la referencia (fondo `#0b1327`, bordes `#1a2748`) no pasa
los pisos de `tests/unit/contraste-temas.test.ts` (bordes ≥ 1.6:1, escalones
entre superficies). Se copia su estructura, no sus hex.

**D2 — Marco de tarjetas** (`app-shell.tsx` + clases `.shell-*` en
globals.css): lienzo con degradado, menú y contenido como tarjetas separadas.
En el teléfono el menú sigue siendo cajón (mismo comportamiento, Escape y
velo), y la barra del teléfono deja de ser azul marino: va dentro de la
tarjeta, en `bg`.

**D3 — Barra superior en escritorio**: el buscador abre la barra Ctrl+K de la
055 (no es otro buscador); a la derecha la píldora con el nombre de la
organización (white-label: sale de la marca, nunca de la referencia) y el
avatar del usuario. La campana de la referencia es un centro de
notificaciones que Vocero no tiene: no se pinta un botón que no hace nada.

**D4 — Menú claro con secciones plegables**. Deja de ser `nav-dark`: toma los
neutros del tema activo. Los grupos de `appNavGroups` llevan letra («A ·
Trabajo», «B · Agente»); se pliegan con un botón (`aria-expanded`) y **nacen
abiertos** (Vocero tiene pocos renglones; plegarlos por defecto escondería
pantallas sin ganar espacio). Resultados y Ajustes quedan sueltos. El ítem
activo es una tarjeta `bg` con borde y sombra. Pie: tarjeta del usuario con
avatar en relieve, sonido, tema y salir; la versión debajo, igual que hoy.
El bloque `.nav-dark` se queda en globals.css (lo usa la vista previa de
Configuración → Marca y lo vigilan las pruebas de white-label).

**D5 — White-label intacto**: todo color de marca sale de `--accent*`; el
remate cian (`--accent-glow`) es neutro de la marca Vocero, no del cliente.
Sin el logo ni el nombre de la referencia.

**D6 — Bandeja**: píldoras para «Todas | No leídas» (siguen siendo `tab` con
`aria-selected`, 052) y el botón «Filtrar» como píldora a la derecha; filo en
degradado en la cabecera del hilo; estados vacíos (`EmptyState` y el hilo sin
elegir) con círculo de 64 px y título serif. Nada cambia de comportamiento:
filtros (052), eventos (054), atajos (055) y gestos (059) quedan como están.

## Fuera de alcance

Otras pantallas (Pipeline, Contactos, Ajustes) heredan tokens y marco, pero no
se rediseñan. La campana de notificaciones. Los canales extra que la
referencia lista (Telegram).

## Criterios de aceptación

1. La Bandeja se pinta con el marco nuevo en claro y oscuro, a 1280 y 390 px,
   sin desborde horizontal a 390.
2. El buscador de la barra superior abre la barra Ctrl+K.
3. Las secciones del menú se pliegan y despliegan; el activo se marca.
4. `pnpm typecheck && pnpm lint && pnpm build && pnpm test` en verde, también
   con `CHANNELS=whatsapp,instagram,messenger,tiktok AGENDA=on`.
5. Arnés nuevo `scripts/e2e-diseno-060b.mjs` en verde; siguen verdes
   `e2e-filtros-ventana`, `e2e-reenviar-y-deslizar`, `e2e-eventos-hilo`,
   `e2e-atajos`, `e2e-notas-internas` y `e2e-selftest` en base limpia.

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I · Seguridad | Sin secretos ni datos nuevos; las capturas de la referencia no entran al repo |
| II · Soberanía | Sin dependencias: CSS y componentes propios; fuentes ya self-hosted |
| III · Multi-tenancy | No toca consultas; el nombre de la organización sale de la marca ya cargada |
| IV · Idempotencia | No escribe nada |
| V · Hecho | Gate técnico, test de contraste, arnés E2E nuevo y los de la Bandeja |
| VI · Specs | Este documento, antes del código; carril ligero |
| VIII · Foco | Mismo flujo de trabajo; solo cambia cómo se ve |
| IX · En vivo | El arnés recorre la Bandeja real en claro y oscuro, 1280 y 390 |
