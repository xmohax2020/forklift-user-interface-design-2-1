/*
  ÜST BAR (Header)
  -------------------------------------------------------------------------
  Operatörün en sık ihtiyaç duyduğu özet bilgileri ve kritik kontrolleri
  ekranın en üstünde toplar: GERÇEK bağlantı durumu, saat, mod
  (Otomatik/Manuel — robottaki fiziksel anahtardan okunur) ve her zaman
  erişilebilir ACİL STOP butonu (şartname madde 10-h).

  FAYDASI: Acil Stop daima görünür ve tek tıkla erişilebilir; bağlantı kesik
  veya anahtar otomatikteyken arayüz bunu net gösterir.
*/
"use client"

import { useEffect, useState } from "react"
import { Cpu, ShieldAlert, Clock, Link2, Link2Off } from "lucide-react"
import type { ConnStatus, RobotTelemetry } from "@/lib/robot-connection"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry | null
  status: ConnStatus
  onEmergencyStop: () => void
}

const STATUS_META: Record<ConnStatus, { label: string; cls: string }> = {
  disconnected: { label: "Bağlı Değil", cls: "border-destructive/40 bg-destructive/15 text-destructive" },
  connecting: { label: "Bağlanıyor…", cls: "border-chart-1/40 bg-chart-1/15 text-chart-1" },
  connected: { label: "Robota Bağlı", cls: "border-chart-3/40 bg-chart-3/15 text-chart-3" },
  error: { label: "Bağlantı Hatası", cls: "border-destructive/40 bg-destructive/15 text-destructive" },
}

export function DashboardHeader({ telemetry, status, onEmergencyStop }: Props) {
  // Canlı saat — sahadaki olayları zamanla eşleştirmek için.
  const [clock, setClock] = useState("--:--:--")
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("tr-TR", { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const connected = status === "connected"
  const manual = telemetry?.manualSwitch === "manual"
  const statusMeta = STATUS_META[status]

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
        {/* Mod rozeti — yalnızca bağlıyken anlamlı (robottaki anahtardan gelir) */}
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium",
            !connected
              ? "border-border bg-muted text-muted-foreground"
              : manual
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-primary/40 bg-primary/15 text-primary",
          )}
        >
          {!connected ? "MOD —" : manual ? "MANUEL MOD" : "OTOMATİK MOD"}
        </span>

        {/* Gerçek bağlantı durumu */}
        <span className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium", statusMeta.cls)}>
          {connected ? <Link2 className="size-3.5" /> : <Link2Off className="size-3.5" />}
          {statusMeta.label}
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
          disabled={!connected}
          className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldAlert className="size-4" />
          ACİL STOP
        </button>
      </div>
    </header>
  )
}
