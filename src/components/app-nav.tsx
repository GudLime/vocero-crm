"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Bell, BellOff, ChevronDown, LogOut, X } from "lucide-react";
import { BotonInstalar } from "@/components/pwa";
import { BotonActivarAvisos } from "@/components/activar-avisos";
import { limpiarBorradores } from "@/lib/borradores";
import type { Branding } from "@/lib/branding";
import type { ThemePreference } from "@/lib/theme";
import { cn, initials } from "@/lib/utils";
import { appNavGroups, isNavActive, SETTINGS_ITEM, type NavItem } from "@/lib/nav";
import { signOut } from "@/lib/auth/client";
import { useEvents } from "@/components/use-events";
import {
  debeSonar,
  guardarSonido,
  abrirConversacionDeAviso,
  mostrarAvisoSistema,
  permisoAvisos,
  reproducirAviso,
  sonidoActivado,
  useDesbloquearAudio,
  useTituloNoLeidos,
} from "@/components/avisos-de-mensajes";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  cuerpoAviso,
  debeAvisarSistema,
  urlDeAvisoSegura,
  urlDeConversacion,
} from "@/lib/avisos-sistema";
import { appIconHref } from "@/lib/pwa";
import { BrandLogo } from "@/components/brand-mark";
import {
  BUILD_COMMIT,
  UNVERIFIED_COMMIT_NOTE,
  versionLabel,
  versionTitle,
  type ResolvedCommit,
} from "@/lib/version";

/**
 * Un renglón del menú (060a): esquinas de 12px y, activo, una tarjeta del
 * color de la ventana con borde, sombra corta y tinta del acento; bajo el
 * cursor, la misma tarjeta sin borde. El borde transparente de los demás
 * guarda el alto para que nada salte al cambiar de pantalla.
 * Exportado para la vista previa de Configuración → Marca, que pinta la barra.
 */
export function navItemClass(active: boolean) {
  return cn(
    "flex items-center gap-[10px] rounded-[12px] border px-2.5 py-2.5 text-[13.5px] transition-all lg:py-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-border bg-background font-semibold text-brand-text shadow-sm"
      : "border-transparent font-medium text-text-2 hover:bg-background hover:text-foreground hover:shadow-sm"
  );
}

/** 060a — Qué grupos del menú plegó la persona (por título), en este navegador. */
const PLEGADOS_KEY = "vocero.navPlegados";

function leerPlegados(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PLEGADOS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function AppNav({
  branding,
  userName,
  role,
  theme,
  commit,
  agenda = false,
  kicker = "CRM · WhatsApp",
  open = false,
  onClose,
}: {
  branding: Branding;
  userName: string;
  role: string;
  theme: ThemePreference;
  /**
   * Commit resuelto en el servidor. Gana al de build porque puede venir de la
   * plataforma cuando quien construyó no lo pasó como build-arg — y en ese
   * caso llega con `verified: false`, y la insignia lo dice.
   */
  commit?: ResolvedCommit;
  /** 028 — La etiqueta bajo el logo; la decide el servidor por los canales. */
  kicker?: string;
  /**
   * 015 — ¿hay agenda en esta instancia? Viene del servidor por prop y no se
   * deduce de los datos: una instancia con la agenda encendida pero sin citas
   * todavía debe ver la entrada igual.
   */
  agenda?: boolean;
  /** Solo aplica por debajo de `lg`: en escritorio el lateral es fijo. */
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  // 045 — Chats con algo sin leer: es lo que WhatsApp cuenta en la pestaña.
  const [chats, setChats] = useState(0);
  const [sonido, setSonido] = useState(true);
  const [plegados, setPlegados] = useState<string[]>([]);

  function plegar(titulo: string) {
    setPlegados((v) => {
      const nuevos = v.includes(titulo) ? v.filter((t) => t !== titulo) : [...v, titulo];
      try {
        localStorage.setItem(PLEGADOS_KEY, JSON.stringify(nuevos));
      } catch {
        // sin almacenamiento, el pliegue dura lo que la pestaña
      }
      return nuevos;
    });
  }

  async function refetchUnread() {
    const res = await fetch("/api/conversations").catch(() => null);
    if (!res?.ok) return null;
    const data = (await res.json()) as {
      conversations: { id: string; unreadCount: number; contact: { name: string } }[];
    };
    setUnread(data.conversations.reduce((a, c) => a + c.unreadCount, 0));
    setChats(data.conversations.filter((c) => c.unreadCount > 0).length);
    return data.conversations;
  }

  useEffect(() => {
    void refetchUnread();
    setSonido(sonidoActivado());
    setPlegados(leerPlegados());
  }, []);

  useDesbloquearAudio();
  useTituloNoLeidos(chats);

  // 056 — Tocar un aviso del sistema (vía el service worker) abre su chat.
  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const alMensaje = (e: MessageEvent) => {
      const datos = e.data as { tipo?: string; url?: unknown } | null;
      const url = datos?.tipo === "abrir" ? urlDeAvisoSegura(datos.url) : null;
      if (url) abrirConversacionDeAviso(url, (u) => router.push(u));
    };
    sw.addEventListener("message", alMensaje);
    return () => sw.removeEventListener("message", alMensaje);
  }, [router]);

  useEvents({
    onMessageNew: async ({ conversationId, message }) => {
      const m = message as Parameters<typeof cuerpoAviso>[0] & { direction?: string };
      if (debeSonar({ direction: m.direction, conversationId })) reproducirAviso();
      // 056 · D2 — Se decide ANTES de releer la lista: lo que cuenta es si el
      // operador miraba cuando llegó.
      const avisar = debeAvisarSistema({
        direction: m.direction,
        campana: sonidoActivado(),
        permiso: permisoAvisos(),
        visible: document.visibilityState === "visible",
        foco: document.hasFocus(),
      });
      const lista = await refetchUnread();
      // El nombre sale de la Bandeja: una conversación del Laboratorio no está
      // en la lista y no avisa.
      const conv = avisar ? lista?.find((c) => c.id === conversationId) : undefined;
      if (conv) {
        void mostrarAvisoSistema({
          titulo: conv.contact.name,
          cuerpo: cuerpoAviso(m),
          tag: conversationId,
          url: urlDeConversacion(conversationId),
          icono: appIconHref(branding, 192),
          alAbrir: (url) => abrirConversacionDeAviso(url, (u) => router.push(u)),
        });
      }
    },
    onConversationUpdated: () => void refetchUnread(),
  });

  const version = commit ?? { commit: BUILD_COMMIT, verified: BUILD_COMMIT !== "" };
  // #87 — Qué hay en el menú y en qué grupo lo decide `appNavGroups`; aquí
  // solo se pinta.
  const groups = appNavGroups({ agenda, role });

  function renderItem(item: NavItem) {
    const active = isNavActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={navItemClass(active)}
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-text" : "text-text-3")}
          strokeWidth={1.9}
          aria-hidden
        />
        <span className="flex-1">{item.label}</span>
        {item.badge && unread > 0 && (
          <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 text-[10.5px] font-bold text-brand-fg">
            {unread}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside
      // Móvil: cajón que se desliza desde la izquierda (siempre montado, así
      // la transición corre en ambos sentidos). Escritorio: columna fija.
      // `visibility` va en la transición a propósito: al cerrar mantiene el
      // cajón visible mientras se desliza y recién entonces lo oculta, que es
      // lo que lo saca del orden de tabulación en móvil.
      // 060a — Una tarjeta del tema junto a la ventana (antes, la columna azul
      // marino `.nav-dark`). En el teléfono es el cajón, pegado al borde.
      data-shell="lateral"
      className={cn(
        "shell-sidebar fixed inset-y-0 left-0 z-50 flex w-[17rem] shrink-0 flex-col overflow-y-auto px-3 pb-3.5 pt-4 text-foreground transition-[transform,visibility] duration-200",
        "max-lg:rounded-l-none max-lg:border-l-0",
        "lg:static lg:visible lg:z-auto lg:w-[16.5rem] lg:translate-x-0 lg:transition-none",
        open ? "visible translate-x-0 shadow-pop" : "invisible -translate-x-full"
      )}
    >
      {/* Marca: el logo de Vocero o, white-label, la inicial y el nombre */}
      <div className="mb-5 flex items-start gap-1.5 px-2 pt-0.5">
        {/* En móvil el cajón necesita su propio cierre: el velo no siempre es
            alcanzable con el pulgar. */}
        <button
          onClick={onClose}
          aria-label="Cerrar el menú"
          className="-ml-1 mt-0.5 rounded-md p-1.5 text-text-3 hover:bg-accent hover:text-foreground lg:hidden"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
        <div className="min-w-0">
          <BrandLogo branding={branding} />
          <span className="kicker mt-2 block">{kicker}</span>
        </div>
      </div>

      {/* Grupos con encabezado pequeño, sin letras ni colapsables: se leen
          de arriba abajo como una lista de lo que hay. Un grupo sin título
          (Resultados) es una entrada suelta separada por el espacio. */}
      {/* 060a — Cada grupo con título se pliega desde su encabezado; el de la
          pantalla abierta no se puede plegar (se perdería dónde estás). */}
      <nav className="flex flex-col gap-1.5" aria-label="Secciones">
        {groups.map((group, i) => {
          const actual = group.items.some((it) => isNavActive(pathname, it.href));
          const plegado = Boolean(group.title) && !actual && plegados.includes(group.title!);
          return (
            <div key={group.title ?? i} className="flex flex-col gap-0.5">
              {group.title && (
                <button
                  type="button"
                  onClick={() => plegar(group.title!)}
                  disabled={actual}
                  aria-expanded={!plegado}
                  className="flex w-full items-center gap-2 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:hover:bg-transparent"
                >
                  <span className="kicker flex-1">{group.title}</span>
                  {!actual && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-text-3 transition-transform",
                        !plegado && "rotate-180"
                      )}
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  )}
                </button>
              )}
              {!plegado && group.items.map(renderItem)}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* 048 — Solo cuando el navegador ofrece instalar la app: una fila
          propia y no un icono más en el pie, que ya va lleno. */}
      <BotonActivarAvisos className={navItemClass(false)} />
      <BotonInstalar className={navItemClass(false)} />

      {/* Ajustes va abajo, solo: no es trabajo del día. */}
      {renderItem(SETTINGS_ITEM)}

      <div className="mt-2 flex items-center gap-2.5 rounded-[14px] border border-border bg-background px-2.5 py-2 shadow-sm">
        <span className="avatar-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {initials(userName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">{userName}</span>
          <span className="block truncate text-[11px] text-text-3">
            {role === "owner" ? "Propietario" : "Equipo"} · En línea
          </span>
        </span>
        <span className="flex shrink-0 items-center">
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
            // 060a — En escritorio la campana vive en la barra superior.
            className="rounded p-1 text-text-3 transition-colors hover:text-foreground lg:hidden"
          >
            {sonido ? (
              <Bell className="h-4 w-4" strokeWidth={1.7} />
            ) : (
              <BellOff className="h-4 w-4" strokeWidth={1.7} />
            )}
          </button>
          <ThemeToggle initial={theme} />
          <button
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded p-1 text-text-3 hover:text-foreground"
            onClick={async () => {
              // 051 — Los borradores no se quedan en una computadora compartida.
              limpiarBorradores();
              await signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </span>
      </div>

      {/* Qué versión está corriendo. Discreta pero siempre visible: la duda
          "¿ya se desplegó?" aparece justo cuando algo no funciona, y mandar a
          alguien a comparar commits en el servidor significa que no lo hará. */}
      {/* `text-2` y no `text-3`: a 10.5px, el gris más claro no pasa AA contra
          el fondo de la barra. Discreta sí, ilegible no. */}
      {/* El nombre sale de la marca, no de una constante: esto es white-label,
          y una instancia rebautizada que dice "Vocero" en el tooltip delata el
          producto de debajo justo donde el operador la mira todos los días. */}
      {/* Un commit que no salió del build lo dice (#50): presentarlo igual
          que uno verificado es la insignia mintiendo justo cuando alguien la
          consulta para saber qué código corre. El aviso es el ícono (color de
          advertencia: basta 3:1 para un gráfico) y el texto va en `text-2`,
          que pasa AA sobre la barra en cualquier tema. */}
      <p
        className="mt-2 px-2.5 font-mono text-[10.5px] tracking-[0.06em] text-text-2"
        title={versionTitle(branding.name, version)}
      >
        {versionLabel(version.commit)}
        {version.commit && !version.verified && (
          <span className="mt-0.5 flex items-center gap-1">
            <AlertTriangle
              className="h-3 w-3 shrink-0 text-warning-text"
              strokeWidth={2}
              aria-hidden
            />
            {UNVERIFIED_COMMIT_NOTE}
          </span>
        )}
      </p>
    </aside>
  );
}
