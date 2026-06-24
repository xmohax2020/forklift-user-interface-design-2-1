/*
  TELEMETRİ & GÜVENLİK PANELİ
  -------------------------------------------------------------------------
  Robotun sağlık ve güvenlik metriklerini gösterir:
   - Batarya (%) ve hız (m/s)
   - Rotadan sapma (cm) — şartname madde 7: en fazla 10 cm sapabilir.
   - Konum toleransı (±7.5 cm) ve yön toleransı (±5°) — şartname madde 8.
   - Engel mesafesi — madde 6: güvenli mesafede durmalı.

  Ayrıca demo/saha kontrolü için iki düğme:
   - "Engel Koy/Kaldır": engel senaryosunu test etmek için.
   - "Hatayı Sıfırla": hata/acil stop sonrası sisteme hazır durumuna döndürür.

  FAYDASI: Operatör puan kaybına yol açabilecek (sapma, tolerans) durumları
  anlık izler; limit aşımında göstergeler kırmızıya döner.
*/
"use client"

import { Gauge, BatteryMedium, AlertTriangle, RotateCcw, OctagonAlert } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-simulation"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry
  onToggleObstacle: () => void
  onResetError: () => void
}

export function TelemetryPanel({ telemetry, onToggleObstacle, onResetError }: Props) {
  const deviationOver = telemetry.deviation > 10 // şartname limiti

  return (
    <PanelCard title="Telemetri & Güvenlik" icon={Gauge}>
      {/* Batarya + hız */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BatteryMedium className="size-4" />
            <span className="text-[10px] uppercase">Batarya</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-card-foreground">{Math.round(telemetry.battery)}%</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className={cn("h-full rounded-full", telemetry.battery < 25 ? "bg-destructive" : "bg-chart-3")}
              style={{ width: `${telemetry.battery}%` }}
            />
          </div>
        </div>
        <div className="rounded-md bg-muted p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="size-4" />
            <span className="text-[10px] uppercase">Hız</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-card-foreground">
            {telemetry.speed.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">m/s</span>
          </p>
        </div>
      </div>

      {/* Sapma & toleranslar */}
      <div className="mb-3 space-y-2">
        <div
          className={cn(
            "rounded-md border px-3 py-2",
            deviationOver ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted",
          )}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Rotadan Sapma (limit 10 cm)</span>
            <span className={cn("font-mono font-semibold", deviationOver ? "text-destructive" : "text-card-foreground")}>
              {telemetry.deviation.toFixed(1)} cm
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className={cn("h-full rounded-full", deviationOver ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min(100, (telemetry.deviation / 10) * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-[10px] uppercase text-muted-foreground">Konum Tol.</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">±7.5 cm</p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-[10px] uppercase text-muted-foreground">Yön Tol.</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">±5°</p>
          </div>
        </div>
      </div>

      {/* Engel durumu */}
      <div
        className={cn(
          "mb-3 flex items-center gap-2 rounded-md border px-3 py-2",
          telemetry.obstacle ? "border-destructive/40 bg-destructive/10" : "border-chart-3/40 bg-chart-3/10",
        )}
      >
        <AlertTriangle className={cn("size-4", telemetry.obstacle ? "text-destructive" : "text-chart-3")} />
        <span className={cn("flex-1 text-xs font-medium", telemetry.obstacle ? "text-destructive" : "text-chart-3")}>
          {telemetry.obstacle ? "Engel algılandı — güvenli duruş" : "Önde engel yok"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{telemetry.obstacleDistance.toFixed(1)} m</span>
      </div>

      {/* Saha/demo kontrol düğmeleri */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onToggleObstacle}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-card-foreground transition hover:bg-accent/20"
        >
          <OctagonAlert className="size-4" />
          Engel Koy / Kaldır
        </button>
        <button
          type="button"
          onClick={onResetError}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-card-foreground transition hover:bg-accent/20"
        >
          <RotateCcw className="size-4" />
          Hatayı Sıfırla
        </button>
      </div>
    </PanelCard>
  )
}
