"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import type { Branding } from "@/lib/branding";
import type { ThemePreference } from "@/lib/theme";
import type { ResolvedCommit } from "@/lib/version";
import { AppNav } from "@/components/app-nav";
import { BrandLogo } from "@/components/brand-mark";
import { BandaSinConexion } from "@/components/banda-sin-conexion";
import { AtajosGlobales, abrirBarraDeComandos } from "@/components/atajos-globales";
import { initials } from "@/lib/utils";

/**
 * Cascarón de la app en dos modos (060b: el marco de tarjetas):
 *
 * - Escritorio (lg+): sobre el lienzo (`.app-canvas`) flotan dos tarjetas, el
 *   menú y el contenido (`.app-window`). El contenido lleva arriba la barra
 *   de píldoras: el buscador (abre la barra Ctrl+K de la 055), la
 *   organización y el usuario.
 * - Móvil/tableta: el menú sale de la izquierda como cajón sobre un velo, y
 *   la barra del teléfono (hamburguesa y marca) va dentro de la tarjeta. El
 *   cajón se cierra solo al navegar (el `pathname` cambia) y con Escape.
 *
 * La altura usa `100dvh` (no `100vh`) porque en el navegador móvil la barra de
 * direcciones se encoge al hacer scroll: con `vh` el compositor de la Bandeja
 * queda debajo del borde visible.
 */
export function AppShell({
  branding,
  userName,
  role,
  theme,
  commit,
  agenda = false,
  kicker,
  aviso = null,
  children,
}: {
  branding: Branding;
  userName: string;
  role: string;
  theme: ThemePreference;
  /** Commit resuelto en el servidor, con su procedencia (ver `resolveCommit`). */
  commit?: ResolvedCommit;
  /** 015 — ¿esta instancia tiene agenda? Lo decide el servidor. */
  agenda?: boolean;
  /** 028 — La etiqueta bajo el logo (`navKicker`). */
  kicker?: string;
  /**
   * Franja de aviso por encima de TODA la aplicación (#85).
   *
   * Va aquí y no dentro de una pantalla porque lo que anuncia no es de una
   * pantalla: es que el agente no puede contestar. Quien tiene ese problema
   * no está mirando Ajustes, está mirando su bandeja y preguntándose por qué
   * no responde nadie.
   */
  aviso?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  // Navegar = cerrar el cajón. Sin esto, tocar "Pipeline" deja el velo encima
  // de la pantalla recién cargada.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="app-canvas flex h-dvh gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
      {navOpen && (
        <button
          aria-label="Cerrar el menú"
          tabIndex={-1}
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-overlay lg:hidden"
        />
      )}

      <AppNav
        branding={branding}
        commit={commit}
        userName={userName}
        role={role}
        theme={theme}
        agenda={agenda}
        kicker={kicker}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="app-window flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-background px-2 lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Abrir el menú"
            aria-expanded={navOpen}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <BrandLogo branding={branding} className="min-w-0 flex-1" />
        </header>

        <header className="relative z-30 hidden shrink-0 items-center gap-3 border-b bg-background/80 px-5 py-3 backdrop-blur lg:flex">
          {/* No es otro buscador: abre la barra Ctrl+K, que ya encuentra
              pantallas y conversaciones. */}
          <button
            type="button"
            onClick={abrirBarraDeComandos}
            aria-label="Buscar (Ctrl+K)"
            className="top-pill flex h-10 min-w-0 flex-1 items-center gap-2 px-4 text-left text-[13.5px] text-text-3 transition-colors hover:text-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="flex-1 truncate">Buscar conversaciones o pantallas…</span>
            <kbd className="rounded-md border border-border-strong px-1.5 font-mono text-[10.5px] text-text-3">
              Ctrl K
            </kbd>
          </button>
          <span className="top-pill flex h-10 min-w-0 items-center gap-2 px-4 text-[13px] font-medium text-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-tint text-[11px] font-bold text-brand-text">
              {branding.name.trim().charAt(0).toUpperCase() || "·"}
            </span>
            <span className="max-w-44 truncate">{branding.name}</span>
          </span>
          <span
            className="icon-3d h-10 w-10 rounded-full text-xs font-bold"
            title={userName}
            aria-label={userName}
            role="img"
          >
            {initials(userName)}
          </span>
        </header>

        {aviso}
        {/* 056 — El tiempo real caído se ve desde cualquier pantalla. */}
        <BandaSinConexion />
        {/* 055 — Ctrl+K y «?» desde cualquier pantalla. */}
        <AtajosGlobales agenda={agenda} role={role} />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
