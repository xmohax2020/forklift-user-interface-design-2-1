/*
  FABRİKA OTOMASYON (PLC) HABERLEŞME PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10: arayüzde PLC haberleşme durumu ve alınıp verilen mesajlar
  görülmelidir. Kapı kontrol noktası durumu da burada izlenir (madde 9).

  Mesajlar robottan GERÇEK gelir ("comm" mesajları, tx/rx). Bağlantı/komut
  olayları yerel olarak da günlüğe işlenir. Sahte trafik üretilmez.

  FAYDASI: Robot ile fabrika otomasyon sistemi arasındaki tüm trafik şeffaftır;
  haberleşme hatası anında görülür.
*/
"use client"

import { Network, DoorOpen, DoorClosed, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { CommMessage, RobotTelemetry } from "@/lib/robot-connection"
import { cn } from "@/lib/utils"

interface Props {
  telemetry: RobotTelemetry | null
  messages: CommMessage[]
  connected: boolean
}

export function PlcPanel({ telemetry, messages, connected }: Props) {
  const plcConnected = Boolean(telemetry?.plcConnected)
  const doorOpen = Boolean(telemetry?.doorOpen)

  return (
    <PanelCard
      title="PLC Haberleşme"
      icon={Network}
      className="h-full"
      action={
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium",
            plcConnected ? "bg-chart-3/15 text-chart-3" : "bg-destructive/15 text-destructive",
          )}
        >
          {plcConnected ? "BAĞLI" : "BAĞLI DEĞİL"}
        </span>
      }
    >
      {/* Bağlantı + kapı durumu kutucukları */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-muted p-2.5">
          <p className="text-[10px] uppercase text-muted-foreground">PLC Durumu</p>
          <p className="font-mono text-sm font-semibold text-card-foreground">
            {telemetry ? (plcConnected ? "Çevrimiçi" : "Çevrimdışı") : "—"}
          </p>
        </div>
        <div className={cn("flex items-center gap-2 rounded-md p-2.5", doorOpen ? "bg-chart-3/15" : "bg-muted")}>
          {doorOpen ? (
            <DoorOpen className="size-5 text-chart-3" />
          ) : (
            <DoorClosed className="size-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-[10px] uppercase text-muted-foreground">Kontrollü Kapı</p>
            <p className={cn("text-sm font-semibold", doorOpen ? "text-chart-3" : "text-card-foreground")}>
              {telemetry ? (doorOpen ? "AÇIK — Geçiş İzni" : "KAPALI") : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Mesaj günlüğü */}
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Mesaj Günlüğü (TX / RX)
      </p>
      <ul className="h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-background/60 p-2 font-mono text-xs">
        {messages.length === 0 && (
          <li className="py-4 text-center text-muted-foreground">
            {connected ? "Mesaj bekleniyor…" : "Robot bağlı değil."}
          </li>
        )}
        {messages.map((m) => (
          <li key={m.id} className="flex items-start gap-2">
            <span className="shrink-0 text-muted-foreground">{m.time}</span>
            {m.dir === "tx" ? (
              <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-primary" />
            ) : (
              <ArrowDownLeft className="mt-0.5 size-3 shrink-0 text-accent" />
            )}
            <span className={cn("leading-snug", m.dir === "tx" ? "text-card-foreground" : "text-accent")}>{m.text}</span>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}
