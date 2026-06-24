/*
  ÜST BAR (Header)
  -------------------------------------------------------------------------
  Operatörün en sık ihtiyaç duyduğu özet bilgileri ve kritik kontrolleri
  ekranın en üstünde toplar: bağlantı durumu, saat, mod (Otomatik/Manuel)
  ve her zaman erişilebilir ACİL STOP butonu.

  FAYDASI: Güvenlik açısından kritik olan Acil Stop daima görünür ve tek
  tıkla erişilebilir konumdadır (şartname madde 10-h).
*/
"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, Cpu, ShieldAlert, Clock } from "lucide-react"
import type { RobotTelemetry } from "@/lib/robot-simulation"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry
  manualMode: boolean
  onEmergencyStop: () => void
}

export function DashboardHeader({ telemetry, manualMode, onEmergencyStop }: Props) {
  // Canlı saat — sahadaki olayları zamanla eşleştirmek için.
  const [clock, setClock] = useState("--:--:--")
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("tr-TR", { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
      {/* Sol: kimlik */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Cpu className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-balance text-base font-semibold leading-tight">
            Otonom Forklift — Operatör Kontrol Paneli
          </h1>
          <p className="text-xs text-muted-foreground">SRUY 2026 • Fabrika İçi Lojistik Robotu</p>
        </div>
      </div>

      {/* Sağ: canlı göstergeler */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mod rozeti */}
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium",
            manualMode
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-primary/40 bg-primary/15 text-primary",
          )}
        >
          {manualMode ? "MANUEL MOD" : "OTOMATİK MOD"}
        </span>

        {/* WiFi / ağ durumu (YARISMA AGI) */}
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium",
            telemetry.wifiConnected
              ? "border-chart-3/40 bg-chart-3/15 text-chart-3"
              : "border-destructive/40 bg-destructive/15 text-destructive",
          )}
        >
          {telemetry.wifiConnected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {telemetry.wifiConnected ? `${telemetry.wifiRssi} dBm` : "Bağlantı Yok"}
        </span>

        {/* Saat */}
        <span className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {clock}
        </span>

        {/* ACİL STOP — daima erişilebilir */}
        <button
          type="button"
          onClick={onEmergencyStop}
          className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
        >
          <ShieldAlert className="size-4" />
          ACİL STOP
        </button>
      </div>
    </header>
  )
}
