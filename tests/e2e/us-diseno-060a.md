# Guion E2E — 060a: tema y Bandeja en la ventana flotante

Automatizado en `scripts/e2e-diseno-060a.mjs` (spec
[060a](../../specs/060a-diseno-con-rea/spec.md)).

**Preparación**: app viva con `WA_MOCK_ENABLED=true`; el guion entra (o crea a
la dueña), conecta un número de prueba por el wa-mock y recibe tres mensajes,
uno con un nombre y un texto largos a propósito.

Para cada tema (claro, oscuro: cookie `vocero-theme`) y cada ancho (1280 y
390 px):

1. Abrir `/inbox`: el tema pedido está en `<html>`, la lista se pinta con su
   título «Bandeja» y la conversación de prueba aparece.
2. El contenido vive en la ventana flotante (`data-shell="ventana"`). En
   escritorio: esquinas de ≥ 20 px, la barra superior con «Buscar clientes» y
   el lateral (`data-shell="lateral"`) como tarjeta del tema.
3. Nada desborda a lo ancho (ni la página ni ningún elemento del `main`).
4. En el teléfono: «Abrir el menú» saca el cajón y «Cerrar el menú» lo
   guarda.
5. Abrir la conversación larga: el hilo muestra el mensaje, el compositor
   está a la vista y sigue sin desbordar; en escritorio, el panel del
   contacto («Etapa del pipeline») se ve junto al hilo.
6. Sin errores de página en todo el recorrido.

Con `CAPTURAS_DIR` deja `bandeja-<tema>-<ancho>.png` (y en el teléfono
`menu-…` e `hilo-…`). `SOLO_CAPTURAS=1` no cuenta lo nuevo de la 060a: así se
sacó el «antes» de `docs/060a/antes/`.
