/*
  CANLI HARİTA PANELİ
  -------------------------------------------------------------------------
  Şartname madde 1-2 (haritalama & rota tanımlama) ve senaryo (Şekil 4).
  2D lazer tarayıcı ile oluşturulan haritanın üzerine tanımlı rota, düğüm
  noktaları, alma/bırakma noktaları, QR noktaları ve kontrollü kapı çizilir.
  Robotun anlık konumu rota ilerlemesine (routeProgress) göre güncellenir.

  FAYDASI: Operatör robotun sahadaki konumunu, gideceği rotayı ve kritik
  noktaları kuş bakışı izler. Engel ve kapı durumu harita üzerinde belirir.
*/
"use client"

import { Map as MapIcon } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-simulation"

// Rotayı oluşturan köşe noktaları (harita koordinatları, 0-100 ölçek).
const ROUTE: [number, number][] = [
  [12, 88], // başlangıç/bekleme
  [12, 30],
  [40, 30], // alma bölgesi
  [40, 62],
  [70, 62], // kapı bölgesi (Q5)
  [70, 20],
  [90, 20], // bırakma
]

// Polyline üzerinde 0-1 oranına karşılık gelen (x,y) noktasını bulur.
function pointOnRoute(t: number): [number, number] {
  // Segment uzunluklarını hesapla
  const segLens: number[] = []
  let total = 0
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const dx = ROUTE[i + 1][0] - ROUTE[i][0]
    const dy = ROUTE[i + 1][1] - ROUTE[i][1]
    const len = Math.hypot(dx, dy)
    segLens.push(len)
    total += len
  }
  let dist = t * total
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      const r = segLens[i] === 0 ? 0 : dist / segLens[i]
      return [
        ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * r,
        ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * r,
      ]
    }
    dist -= segLens[i]
  }
  return ROUTE[ROUTE.length - 1]
}

export function MapPanel({ telemetry }: { telemetry: RobotTelemetry }) {
  const [rx, ry] = pointOnRoute(telemetry.routeProgress)
  const routePath = ROUTE.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ")

  const nodes = [
    { x: 12, y: 88, label: "Bekleme", color: "var(--muted-foreground)" },
    { x: 40, y: 30, label: "Alma", color: "var(--accent)" },
    { x: 70, y: 62, label: "Q5 Kapı", color: "var(--chart-1)" },
    { x: 90, y: 20, label: "Bırakma", color: "var(--primary)" },
  ]

  return (
    <PanelCard title="Canlı Harita & Rota" icon={MapIcon} className="h-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-background/60">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
          {/* Izgara */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i} stroke="var(--border)" strokeWidth={0.15}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} />
            </g>
          ))}

          {/* Tanımlı rota */}
          <path d={routePath} fill="none" stroke="var(--primary)" strokeWidth={1.2} strokeDasharray="2 1.5" opacity={0.8} />

          {/* Kontrollü kapı (Q5) — açıksa yeşil */}
          <rect
            x={68}
            y={59}
            width={4}
            height={6}
            fill={telemetry.doorOpen ? "var(--chart-3)" : "var(--destructive)"}
            opacity={0.85}
          />

          {/* Düğüm / istasyon noktaları */}
          {nodes.map((n) => (
            <g key={n.label}>
              <circle cx={n.x} cy={n.y} r={2} fill={n.color} />
              <text x={n.x + 3} y={n.y + 1} fontSize={3} fill="var(--muted-foreground)">
                {n.label}
              </text>
            </g>
          ))}

          {/* Engel (varsa) robotun önünde */}
          {telemetry.obstacle && (
            <g>
              <rect x={rx + 1} y={ry - 2.5} width={4} height={4} fill="var(--destructive)" rx={0.5} />
            </g>
          )}

          {/* Robot konumu */}
          <g transform={`translate(${rx} ${ry})`}>
            <circle r={4} fill="var(--accent)" opacity={0.25} />
            <rect x={-2} y={-1.6} width={4} height={3.2} rx={0.6} fill="var(--accent)" />
          </g>
        </svg>

        {/* Üst köşe rozetleri */}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          <span className="rounded bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Sapma: <span className="font-mono text-card-foreground">{telemetry.deviation.toFixed(1)} cm</span>
          </span>
          {telemetry.obstacle && (
            <span className="animate-pulse-dot rounded bg-destructive px-2 py-0.5 text-[10px] font-bold text-white">
              ENGEL — DURDU
            </span>
          )}
        </div>
      </div>

      {/* Konum / yön özetleri */}
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
    </PanelCard>
  )
}
