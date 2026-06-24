/*
  CANLI HARİTA & ROTA TANIMLAMA PANELİ
  -------------------------------------------------------------------------
  Şartname madde 1-2:
   • Harita robotun 2D lazer alan tarayıcısından GERÇEK gelir ("map" mesajı:
     doluluk ızgarasının PNG'si + çözünürlük + origin). Arka planda bu görüntü
     çizilir; üzerine robot konumu, rota ve kontrollü kapı bindirilir.
   • Rota tanımlama: "Rota Düzenle" modunda operatör harita üzerine tıklayarak
     waypoint ekler. Tıklanan ekran noktası, harita meta verisi (origin +
     çözünürlük) kullanılarak DÜNYA KOORDİNATINA (metre) çevrilir. "Kaydet" ile
     rota robota yüklenir ("route" mesajı) ve robot bu rotayı izler.

  KOORDİNAT DÖNÜŞÜMÜ (ROS doluluk ızgarası kuralı):
     pikselX = (dunyaX - originX) / cozunurluk
     pikselY = yukseklik - (dunyaY - originY) / cozunurluk
  Görüntü, SVG ile birebir aynı kutuya (0..100) gerildiği için piksel→yüzde
  dönüşümü doğrudan yapılır.

  Robot/harita bağlı değilken sahte konum/rota çizilmez; "harita bekleniyor"
  bilgisi gösterilir.

  FAYDASI: Operatör sahayı gerçek harita üzerinden izler ve robotun izleyeceği
  rotayı arayüzden serbestçe, gerçek metre koordinatlarında tanımlar.
*/
"use client"

import { useRef } from "react"
import { Map as MapIcon, Pencil, Trash2, Check } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { cn } from "@/lib/utils"
import type { MapData, RobotTelemetry } from "@/lib/robot-connection"

interface Props {
  telemetry: RobotTelemetry | null
  map: MapData | null
  route: [number, number][] // dünya metre koordinatları
  editing: boolean
  connected: boolean
  onToggleEdit: () => void
  onAddWaypoint: (p: [number, number]) => void
  onClear: () => void
  onSave: () => void
}

// Dünya (metre) → görünüm yüzdesi (0..100).
function worldToView(map: MapData, wx: number, wy: number): [number, number] {
  const px = (wx - map.origin[0]) / map.resolution
  const py = map.height - (wy - map.origin[1]) / map.resolution
  return [(px / map.width) * 100, (py / map.height) * 100]
}

// Görünüm yüzdesi (0..100) → dünya (metre). (tıklamada kullanılır)
function viewToWorld(map: MapData, vx: number, vy: number): [number, number] {
  const px = (vx / 100) * map.width
  const py = (vy / 100) * map.height
  const wx = map.origin[0] + px * map.resolution
  const wy = map.origin[1] + (map.height - py) * map.resolution
  return [+wx.toFixed(3), +wy.toFixed(3)]
}

export function MapPanel({
  telemetry,
  map,
  route,
  editing,
  connected,
  onToggleEdit,
  onAddWaypoint,
  onClear,
  onSave,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  const hasPose = map != null && telemetry?.x != null && telemetry?.y != null
  const [rx, ry] = hasPose ? worldToView(map!, telemetry!.x!, telemetry!.y!) : [0, 0]

  // Rotayı (dünya metre) görünüm koordinatına çevirip yol çiz.
  const routeView = map ? route.map(([wx, wy]) => worldToView(map, wx, wy)) : []
  const routePath = routeView.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ")

  // Düzenleme modunda haritaya tıklayınca dünya koordinatlı waypoint ekler.
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editing || !svgRef.current || !map) return
    const rect = svgRef.current.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * 100
    const vy = ((e.clientY - rect.top) / rect.height) * 100
    onAddWaypoint(viewToWorld(map, vx, vy))
  }

  const canEdit = connected && map != null

  return (
    <PanelCard
      title="Canlı Harita & Rota"
      icon={MapIcon}
      className="h-full"
      action={
        <button
          type="button"
          onClick={onToggleEdit}
          disabled={!canEdit}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
            editing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-card-foreground",
          )}
        >
          {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          {editing ? "Bitir" : "Rota Düzenle"}
        </button>
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-background/60">
        {/* Robotun 2D lazer haritası (gerçek doluluk ızgarası PNG'si) */}
        {map?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={map.image || "/placeholder.svg"}
            alt="Robotun 2D lazer tarayıcı haritası"
            className="absolute inset-0 h-full w-full object-fill"
            crossOrigin="anonymous"
          />
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className={cn("relative h-full w-full", editing && "cursor-crosshair")}
          preserveAspectRatio="none"
          onClick={handleClick}
        >
          {/* Izgara (harita yokken de referans verir) */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i} stroke="var(--border)" strokeWidth={0.15}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} />
            </g>
          ))}

          {/* Tanımlı rota çizgisi */}
          {routeView.length > 1 && (
            <path d={routePath} fill="none" stroke="var(--primary)" strokeWidth={1.2} strokeDasharray="2 1.5" opacity={0.9} />
          )}

          {/* Düzenleme modunda waypoint'leri numaralandır */}
          {editing &&
            routeView.map((p, i) => (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={1.6} fill="var(--primary)" />
                <text x={p[0] + 2} y={p[1] - 1.5} fontSize={2.6} fill="var(--primary)">
                  {i + 1}
                </text>
              </g>
            ))}

          {/* Robot konumu (yalnızca gerçek poz geldiğinde) */}
          {hasPose && !editing && (
            <g transform={`translate(${rx} ${ry}) rotate(${-(telemetry?.heading ?? 0)})`}>
              <circle r={4} fill="var(--accent)" opacity={0.25} />
              <rect x={-2} y={-1.6} width={4} height={3.2} rx={0.6} fill="var(--accent)" />
            </g>
          )}
        </svg>

        {/* Durum rozetleri */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {editing ? (
            <span className="rounded bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              DÜZENLEME — haritaya tıklayarak nokta ekle
            </span>
          ) : telemetry?.deviation != null ? (
            <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Sapma: <span className="font-mono text-card-foreground">{telemetry.deviation.toFixed(1)} cm</span>
            </span>
          ) : null}
          {telemetry?.obstacle && !editing && (
            <span className="animate-pulse-dot rounded bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">
              ENGEL — DURDU
            </span>
          )}
        </div>

        {/* Harita yoksa bilgilendirme */}
        {!map && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-md bg-background/80 px-3 py-2 text-center text-xs text-muted-foreground">
              {connected ? "2D lazer tarayıcıdan harita bekleniyor…" : "Robot bağlı değil — harita yok."}
            </p>
          </div>
        )}
      </div>

      {/* Rota düzenleme araç çubuğu */}
      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <span className="mr-auto text-xs text-muted-foreground">
            Nokta: <span className="font-mono font-semibold text-card-foreground">{route.length}</span>
          </span>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-3.5" /> Temizle
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={route.length < 2}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            <Check className="size-3.5" /> Kaydet & Yükle
          </button>
        </div>
      )}

      {/* Konum / yön özetleri (normal mod) */}
      {!editing && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">X</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">
              {telemetry?.x != null ? `${telemetry.x.toFixed(2)} m` : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Y</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">
              {telemetry?.y != null ? `${telemetry.y.toFixed(2)} m` : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Yön</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">
              {telemetry?.heading != null ? `${Math.round(telemetry.heading)}°` : "—"}
            </p>
          </div>
        </div>
      )}
    </PanelCard>
  )
}
