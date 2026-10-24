"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { Branding } from "@/lib/branding";
import type { ThemePreference } from "@/lib/theme";
import type { ResolvedCommit } from "@/lib/version";
import { AppNav } from "@/components/app-nav";
import { BrandLogo } from "@/components/brand-mark";
import { BandaSinConexion } from "@/components/banda-sin-conexion";
import { AtajosGlobales } from "@/components/atajos-globales";
import { BarraSuperior } from "@/components/barra-superior";

/**
 * Cascarón de la app en dos modos:
 *
 * - Escritorio (lg+): el panel lateral es una tarjeta fija junto a la ventana
 *   flotante (060a), que lleva arriba la barra con buscador y campana.
 * - Móvil/tableta: el lateral sale de la izquierda como cajón sobre un velo,
 *   y arriba de la ventana queda una barra con el hamburguesa y la marca. El
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
    // 060a — El papel de fondo con el lateral y la ventana flotando encima.
    <div className="shell-paper flex h-dvh gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
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

      <div data-shell="ventana" className="shell-window flex min-w-0 flex-1 flex-col">
        {/* En el teléfono: el hamburguesa y la marca, dentro de la ventana. */}
        <header className="flex h-12 shrink-0 items-center gap-1.5 border-b bg-background px-2 lg:hidden">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Abrir el menú"
            aria-expanded={navOpen}
            className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <BrandLogo branding={branding} className="min-w-0" />
        </header>
        <BarraSuperior branding={branding} userName={userName} />

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
