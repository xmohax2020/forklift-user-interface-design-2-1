/*
  GÖREV PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10: arayüzde görev durum bilgisi görülmelidir.
  Burada PLC tarafından rastgele atanan alma (A) ve bırakma (B) noktaları,
  yük durumu, rota tamamlanma yüzdesi ve görev kronometresi gösterilir.

  Görev için süre limitleri şartname madde 12'de tanımlıdır:
   - 30 dk: hedef süre (erken bitirme = artı puan)
   - 45 dk: üst limit
  Kronometre 30 dk'yı geçince renk değiştirerek operatörü uyarır.

  FAYDASI: Operatör görevin neresinde olduğunu ve süre baskısını net görür.
*/
"use client"

import { ClipboardList, Play, PackageCheck, MapPin, Timer } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-simulation"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry
  running: boolean
  manualMode: boolean
  onStart: () => void
}

function formatTime(totalSec: number) {
  const s = Math.floor(totalSec)
  const mm = String(Math.floor(s / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

export function MissionPanel({ telemetry, running, manualMode, onStart }: Props) {
  const overTarget = telemetry.missionSeconds > 30 * 60 // 30 dk hedef
  const progressPct = Math.round(telemetry.routeProgress * 100)

  return (
    <PanelCard title="Görev Durumu" icon={ClipboardList}>
      {/* Alma / Bırakma noktaları (PLC atar) */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-accent/30 bg-accent/10 p-3">
          <div className="flex items-center gap-1.5 text-accent">
            <MapPin className="size-4" />
            <span className="text-xs font-medium">Alma Noktası</span>
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-card-foreground">{telemetry.pickupNode}</p>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-1.5 text-primary">
            <PackageCheck className="size-4" />
            <span className="text-xs font-medium">Bırakma Noktası</span>
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-card-foreground">{telemetry.dropoffNode}</p>
        </div>
      </div>

      {/* Yük durumu */}
      <div className="mb-3 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Yük Durumu</span>
        <span className={cn("font-semibold", telemetry.loaded ? "text-primary" : "text-muted-foreground")}>
          {telemetry.loaded ? "YÜKLÜ (5 kg)" : "BOŞ"}
        </span>
      </div>

      {/* Rota ilerleme çubuğu */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rota İlerlemesi</span>
          <span className="font-mono font-semibold text-card-foreground">%{progressPct}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Kronometre + başlat */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md border px-3 py-2",
            overTarget ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted",
          )}
        >
          <Timer className={cn("size-4", overTarget ? "text-destructive" : "text-muted-foreground")} />
          <span className={cn("font-mono text-lg font-bold", overTarget ? "text-destructive" : "text-card-foreground")}>
            {formatTime(telemetry.missionSeconds)}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 30:00 hedef</span>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={running || manualMode}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Play className="size-4" />
          {running ? "Görev Aktif" : "Görevi Başlat"}
        </button>
      </div>
      {manualMode && (
        <p className="mt-2 text-center text-xs text-accent">
          Manuel mod aktif — otomatik görev başlatılamaz.
        </p>
      )}
    </PanelCard>
  )
}
