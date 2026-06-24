/*
  CANLI HARİTA & ROTA TANIMLAMA PANELİ
  -------------------------------------------------------------------------
  Şartname madde 1-2: 2D lazer tarayıcı ile oluşturulan haritanın üzerine
  tanımlı rota, düğüm/istasyon noktaları ve kontrollü kapı çizilir. Robotun
  anlık konumu, operatörün tanımladığı rota (route) üzerinde ilerler.

  MADDE 2 — ROTA TANIMLAMA:
  "Rota Düzenle" moduna geçildiğinde operatör harita üzerine tıklayarak
  waypoint (rota köşe noktası) ekler. Temizle / Varsayılan / Kaydet butonları
  ile rotayı yönetir. Kaydedilen rota robota yüklenir ve robot bu rotayı izler.

  FAYDASI: Operatör sahayı kuş bakışı izler VE robotun izleyeceği yolu
  arayüzden serbestçe tanımlayabilir; sabit/önceden kodlanmış rotaya bağlı değildir.
*/
"use client"

import { useRef } from "react"
import { Map as MapIcon, Pencil, Trash2, RotateCcw, Check } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { cn } from "@/lib/utils"
import type { RobotTelemetry } from "@/lib/robot-simulation"

// Polyline üzerinde 0-1 oranına karşılık gelen (x,y) noktasını bulur.
function pointOnRoute(route: [number, number][], t: number): [number, number] {
  if (route.length === 0) return [50, 50]
  if (route.length === 1) return route[0]
  const segLens: number[] = []
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    const dx = route[i + 1][0] - route[i][0]
    const dy = route[i + 1][1] - route[i][1]
    const len = Math.hypot(dx, dy)
    segLens.push(len)
    total += len
  }
  let dist = t * total
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      const r = segLens[i] === 0 ? 0 : dist / segLens[i]
      return [
        route[i][0] + (route[i + 1][0] - route[i][0]) * r,
        route[i][1] + (route[i + 1][1] - route[i][1]) * r,
      ]
    }
    dist -= segLens[i]
  }
  return route[route.length - 1]
}

interface Props {
  telemetry: RobotTelemetry
  route: [number, number][]
  editing: boolean
  onToggleEdit: () => void
  onAddWaypoint: (p: [number, number]) => void
  onClear: () => void
  onReset: () => void
  onSave: (count: number) => void
}

export function MapPanel({
  telemetry,
  route,
  editing,
  onToggleEdit,
  onAddWaypoint,
  onClear,
  onReset,
  onSave,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [rx, ry] = pointOnRoute(route, telemetry.routeProgress)
  const routePath = route.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ")

  // Sabit istasyon noktaları (haritadaki referanslar).
  const nodes = [
    { x: 12, y: 88, label: "Bekleme", color: "var(--muted-foreground)" },
    { x: 40, y: 30, label: "Alma", color: "var(--accent)" },
    { x: 70, y: 62, label: "Q5 Kapı", color: "var(--chart-1)" },
    { x: 90, y: 20, label: "Bırakma", color: "var(--primary)" },
  ]

  // Düzenleme modunda haritaya tıklayınca waypoint ekler.
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editing || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onAddWaypoint([x, y])
  }

  return (
    <PanelCard
      title="Canlı Harita & Rota"
      icon={MapIcon}
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleEdit}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition",
              editing
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-card-foreground",
            )}
          >
            {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? "Bitir" : "Rota Düzenle"}
          </button>
        </div>
      }
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-background/60">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className={cn("h-full w-full", editing && "cursor-crosshair")}
          preserveAspectRatio="none"
          onClick={handleClick}
        >
          {/* Izgara */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i} stroke="var(--border)" strokeWidth={0.15}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} />
            </g>
          ))}

          {/* Tanımlı rota çizgisi */}
          {route.length > 1 && (
            <path
              d={routePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={1.2}
              strokeDasharray="2 1.5"
              opacity={0.85}
            />
          )}

          {/* Düzenleme modunda waypoint'leri göster + numaralandır */}
          {editing &&
            route.map((p, i) => (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={1.6} fill="var(--primary)" />
                <text x={p[0] + 2} y={p[1] - 1.5} fontSize={2.6} fill="var(--primary)">
                  {i + 1}
                </text>
              </g>
            ))}

          {/* Kontrollü kapı (Q5) — açıksa yeşil */}
          <rect
            x={68}
            y={59}
            width={4}
            height={6}
            fill={telemetry.doorOpen ? "var(--chart-3)" : "var(--destructive)"}
            opacity={0.85}
          />

          {/* İstasyon noktaları (düzenleme modunda gizli, sadelik için) */}
          {!editing &&
            nodes.map((n) => (
              <g key={n.label}>
                <circle cx={n.x} cy={n.y} r={2} fill={n.color} />
                <text x={n.x + 3} y={n.y + 1} fontSize={3} fill="var(--muted-foreground)">
                  {n.label}
                </text>
              </g>
            ))}

          {/* Engel (varsa) robotun önünde */}
          {telemetry.obstacle && !editing && (
            <rect x={rx + 1} y={ry - 2.5} width={4} height={4} fill="var(--destructive)" rx={0.5} />
          )}

          {/* Robot konumu (düzenleme modunda gizli) */}
          {!editing && (
            <g transform={`translate(${rx} ${ry})`}>
              <circle r={4} fill="var(--accent)" opacity={0.25} />
              <rect x={-2} y={-1.6} width={4} height={3.2} rx={0.6} fill="var(--accent)" />
            </g>
          )}
        </svg>

        {/* Üst köşe rozetleri */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {editing ? (
            <span className="rounded bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              DÜZENLEME — haritaya tıklayarak nokta ekle
            </span>
          ) : (
            <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Sapma: <span className="font-mono text-card-foreground">{telemetry.deviation.toFixed(1)} cm</span>
            </span>
          )}
          {telemetry.obstacle && !editing && (
            <span className="animate-pulse-dot rounded bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">
              ENGEL — DURDU
            </span>
          )}
        </div>
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
            onClick={onReset}
            className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-card-foreground"
          >
            <RotateCcw className="size-3.5" /> Varsayılan
          </button>
          <button
            type="button"
            onClick={() => onSave(route.length)}
            disabled={route.length < 2}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            <Check className="size-3.5" /> Kaydet
          </button>
        </div>
      )}

      {/* Konum / yön özetleri (normal mod) */}
      {!editing && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">X</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">{rx.toFixed(1)} m</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Y</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">{ry.toFixed(1)} m</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Yön</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">{Math.round(telemetry.heading)}°</p>
          </div>
        </div>
      )}
    </PanelCard>
  )
}
