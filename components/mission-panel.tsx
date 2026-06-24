/*
  GÖREV PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10: arayüzde görev durum bilgisi görülmelidir. Burada robottan
  GERÇEK gelen alma (A) / bırakma (B) noktaları, yük durumu, rota tamamlanma
  yüzdesi ve görev kronometresi gösterilir. Veri yoksa "—" gösterilir.

  Ayrıca: hata/acil stop sonrası robotu hazır duruma döndüren "Hatayı Sıfırla"
  komutu (robota gönderilir).

  FAYDASI: Operatör görevin neresinde olduğunu net görür; hata sonrası tek
  tıkla sıfırlama komutu gönderebilir.
*/
"use client"

import { ClipboardList, Play, PackageCheck, MapPin, Timer, RotateCcw } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-connection"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry | null
  connected: boolean
  manualAllowed: boolean
  onStart: () => void
  onResetError: () => void
}

function formatTime(totalSec: number | null) {
  if (totalSec == null) return "--:--"
  const s = Math.floor(totalSec)
  const mm = String(Math.floor(s / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

export function MissionPanel({ telemetry, connected, manualAllowed, onStart, onResetError }: Props) {
  const missionSeconds = telemetry?.missionSeconds ?? null
  const overTarget = missionSeconds != null && missionSeconds > 30 * 60 // 30 dk hedef
  const progress = telemetry?.routeProgress ?? null
  const progressPct = progress != null ? Math.round(progress * 100) : 0
  const isError = telemetry?.state === "error" || telemetry?.state === "estop"

  return (
    <PanelCard title="Görev Durumu" icon={ClipboardList}>
      {/* Alma / Bırakma noktaları (fabrika üretim sisteminden gelir) */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-accent/30 bg-accent/10 p-3">
          <div className="flex items-center gap-1.5 text-accent">
            <MapPin className="size-4" />
            <span className="text-xs font-medium">Alma Noktası</span>
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-card-foreground">{telemetry?.pickupNode ?? "—"}</p>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-1.5 text-primary">
            <PackageCheck className="size-4" />
            <span className="text-xs font-medium">Bırakma Noktası</span>
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-card-foreground">{telemetry?.dropoffNode ?? "—"}</p>
        </div>
      </div>

      {/* Yük durumu */}
      <div className="mb-3 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Yük Durumu</span>
        <span className={cn("font-semibold", telemetry?.loaded ? "text-primary" : "text-muted-foreground")}>
          {telemetry ? (telemetry.loaded ? "YÜKLÜ" : "BOŞ") : "—"}
        </span>
      </div>

      {/* Rota ilerleme çubuğu */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rota İlerlemesi</span>
          <span className="font-mono font-semibold text-card-foreground">{progress != null ? `%${progressPct}` : "—"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
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
            {formatTime(missionSeconds)}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 30:00 hedef</span>
        </div>

        {isError ? (
          <button
            type="button"
            onClick={onResetError}
            disabled={!connected}
            className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
            Hatayı Sıfırla
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={!connected || manualAllowed}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="size-4" />
            Görevi Başlat
          </button>
        )}
      </div>
      {manualAllowed && (
        <p className="mt-2 text-center text-xs text-accent">Manuel mod aktif — otomatik görev başlatılamaz.</p>
      )}
      {!connected && (
        <p className="mt-2 text-center text-xs text-muted-foreground">Robot bağlı değil — komut gönderilemez.</p>
      )}
    </PanelCard>
  )
}
