/*
  ROBOT DURUM PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10'da zorunlu tutulan 8 robot durumunu listeler ve robottan
  GERÇEK gelen aktif durumu vurgular. Robot bağlı değilken sahte durum
  gösterilmez; "veri bekleniyor" uyarısı çıkar.

  FAYDASI: Operatör robotun hangi aşamada olduğunu (bekleme, yüklü hareket,
  PLC bekliyor, hata, acil stop...) tek bakışta anlar.
*/
"use client"

import { Activity } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { ROBOT_STATE_META, type RobotState, type RobotTelemetry } from "@/lib/robot-connection"
import { cn } from "@/lib/utils"

const ORDER: RobotState[] = [
  "idle",
  "task_processing",
  "moving_empty",
  "moving_loaded",
  "waiting_plc",
  "returning",
  "error",
  "estop",
]

// Durum tonu → renk sınıfı eşlemesi.
const toneClasses: Record<string, { dot: string; text: string; bg: string }> = {
  idle: { dot: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
  active: { dot: "bg-accent", text: "text-accent", bg: "bg-accent/15" },
  load: { dot: "bg-primary", text: "text-primary", bg: "bg-primary/15" },
  wait: { dot: "bg-chart-1", text: "text-chart-1", bg: "bg-chart-1/15" },
  danger: { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/15" },
}

interface Props {
  telemetry: RobotTelemetry | null
  connected: boolean
}

export function RobotStatusPanel({ telemetry, connected }: Props) {
  const active = telemetry?.state ?? null

  return (
    <PanelCard title="Robot Durumu" icon={Activity}>
      {/* Büyük anlık durum göstergesi */}
      {active ? (
        (() => {
          const meta = ROBOT_STATE_META[active]
          const tone = toneClasses[meta.tone]
          return (
            <div className={cn("mb-4 rounded-md border border-border p-4", tone.bg)}>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Anlık Durum</p>
              <div className="flex items-center gap-2.5">
                <span className={cn("size-3 animate-pulse-dot rounded-full", tone.dot)} />
                <span className={cn("text-lg font-bold", tone.text)}>{meta.label}</span>
              </div>
            </div>
          )
        })()
      ) : (
        <div className="mb-4 rounded-md border border-dashed border-border p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Anlık Durum</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {connected ? "Telemetri bekleniyor…" : "Robot bağlı değil"}
          </p>
        </div>
      )}

      {/* Tüm durumların listesi — aktif olan vurgulanır */}
      <ul className="grid grid-cols-1 gap-1.5">
        {ORDER.map((s) => {
          const meta = ROBOT_STATE_META[s]
          const tone = toneClasses[meta.tone]
          const isActive = s === active
          return (
            <li
              key={s}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                isActive ? cn(tone.bg, "font-semibold") : "opacity-60",
              )}
            >
              <span className={cn("size-2 rounded-full", isActive ? tone.dot : "bg-muted-foreground/40")} />
              <span className={isActive ? tone.text : "text-card-foreground"}>{meta.label}</span>
            </li>
          )
        })}
      </ul>
    </PanelCard>
  )
}
