"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Search } from "lucide-react";
import type { Branding } from "@/lib/branding";
import { faviconInitial } from "@/lib/favicon";
import { initials } from "@/lib/utils";
import { abrirBarraDeComandos } from "@/components/atajos-globales";
import { guardarSonido, sonidoActivado } from "@/components/avisos-de-mensajes";

/**
 * 060a — La barra de arriba de la ventana, solo en escritorio (lg+): el
 * buscador, el negocio, la campana y quien está dentro, como píldoras.
 *
 * El buscador no es un buscador propio: abre la barra Ctrl+K (055), que ya
 * encuentra clientes por nombre o teléfono y pantallas del menú. La campana
 * es la preferencia de sonido de siempre (en el teléfono sigue en el pie del
 * menú, que es lo que se ve ahí).
 */
export function BarraSuperior({ branding, userName }: { branding: Branding; userName: string }) {
  const [sonido, setSonido] = useState(true);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    setSonido(sonidoActivado());
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <div className="relative z-30 hidden shrink-0 items-center gap-3 border-b bg-background px-5 py-3 lg:flex">
      <button
        type="button"
        onClick={abrirBarraDeComandos}
        aria-label="Buscar clientes"
        className="shell-pill flex h-10 min-w-0 flex-1 items-center gap-2 px-4 text-left text-[13.5px] text-text-3 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden />
        <span className="flex-1 truncate">Buscar clientes…</span>
        <kbd className="rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[10.5px] text-text-3">
          {mac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <span className="shell-pill flex h-10 max-w-56 items-center gap-2 px-4 text-[13px] font-medium text-foreground">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-tint text-[11px] font-bold text-brand-text"
          aria-hidden
        >
          {faviconInitial(branding.name)}
        </span>
        <span className="truncate">{branding.name}</span>
      </span>

      <button
        type="button"
        onClick={() => {
          const v = !sonido;
          setSonido(v);
          guardarSonido(v);
        }}
        aria-label={sonido ? "Sonido de mensajes: activado" : "Sonido de mensajes: silenciado"}
        aria-pressed={sonido}
        title={sonido ? "Silenciar el sonido de mensajes nuevos" : "Activar el sonido de mensajes nuevos"}
        className="shell-pill flex h-10 w-10 shrink-0 items-center justify-center text-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {sonido ? (
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
        ) : (
          <BellOff className="h-[18px] w-[18px]" strokeWidth={1.7} />
        )}
      </button>

      <span
        className="avatar-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        title={userName}
        aria-hidden
      >
        {initials(userName)}
      </span>
    </div>
  );
}
