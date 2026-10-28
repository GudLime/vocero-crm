# Customizaciones Gudlime

Fork de [kevinrivm/vocero-crm](https://github.com/kevinrivm/vocero-crm) usado
por la agencia Gudlime para todas las instancias de CRM-as-a-service.

## Cambios respecto a upstream

1. **`src/app/gudlime-theme.css`** — override del look (radios chicos, sombras
   mínimas, neutros slate). No toca `--accent*` ni el logo.
2. **`src/app/layout.tsx`** — una línea: `import "./gudlime-theme.css"` después
   de `globals.css`.
3. **`src/lib/temas.ts`** — `APARIENCIA_POR_DEFECTO.letra = "inter"`.
4. **`src/components/app-nav.tsx`** — sidebar de escritorio con **icono + label**
   (ancho `w-56`, activo = acento sólido), en lugar del riel solo-iconos.

Color y logo: cada cliente los configura en **Configuración → Marca** (DB).

Detalle y estrategia de merge: ver el toolkit
[`GudLime/gudlime-crm-service`](https://github.com/GudLime/gudlime-crm-service)
→ `docs/tema.md`. Fuente canónica del CSS: `theme/gudlime-theme.css` ahí.

## Actualizar desde upstream

```bash
git remote add upstream https://github.com/kevinrivm/vocero-crm.git  # una vez
git fetch upstream
git checkout main
git merge upstream/main   # o rebase
# Conflictos esperables: import en layout.tsx, default de letra en temas.ts,
# y cambios en app-nav.tsx (sidebar con labels) si upstream tocó el riel.
```

Después: redeploy en Coolify (build from this repo, Dockerfile).
