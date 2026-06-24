/*
  AĞ (WiFi) PANELİ
  -------------------------------------------------------------------------
  Şartname "WİFİ AĞA BAĞLANTI TANIMI" bölümü: sahada internet erişimi OLMAYAN
  iki lokal WiFi ağı vardır:
    1) "YARISMA DENEME AGI" — deneme/test için
    2) "YARISMA AGI"        — gerçek yarışma için
  Her ağa yalnızca 2 cihaz (forklift robot + takip/monitör bilgisayarı)
  bağlanabilir ve erişim MAC adres filtreleme ile kontrol edilir.

  FAYDASI: Operatör hangi ağda olduğunu, sinyal gücünü ve hangi cihazların
  (MAC filtreli) bağlı olduğunu görür. Yarışmada yanlış ağa bağlanmak görev
  kaybına yol açabileceği için bu görünürlük kritiktir.
*/
"use client"

import { Wifi, Router, Laptop, Bot } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-simulation"
import { cn } from "@/lib/utils"

export function NetworkPanel({ telemetry }: { telemetry: RobotTelemetry }) {
  const activeSsid = "YARISMA AGI"

  const networks = [
    { ssid: "YARISMA AGI", note: "Yarışma ağı", active: true },
    { ssid: "YARISMA DENEME AGI", note: "Deneme ağı", active: false },
  ]

  // MAC filtreleme ile izinli 2 cihaz.
  const devices = [
    { icon: Bot, name: "Forklift Robot", mac: "A4:CF:12:9B:3D:7E", online: telemetry.wifiConnected },
    { icon: Laptop, name: "Operatör Bilgisayarı", mac: "DC:A6:32:1F:88:0A", online: true },
  ]

  // RSSI'yi 0-4 bar'a çevir (kabaca).
  const bars = Math.max(0, Math.min(4, Math.round((telemetry.wifiRssi + 90) / 10)))

  return (
    <PanelCard title="Ağ Bağlantısı (WiFi)" icon={Wifi}>
      {/* Mevcut ağlar */}
      <div className="space-y-1.5">
        {networks.map((n) => (
          <div
            key={n.ssid}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2",
              n.active ? "border-chart-3/40 bg-chart-3/10" : "border-border bg-muted opacity-70",
            )}
          >
            <div className="flex items-center gap-2">
              <Router className={cn("size-4", n.active ? "text-chart-3" : "text-muted-foreground")} />
              <div>
                <p className="text-sm font-medium text-card-foreground">{n.ssid}</p>
                <p className="text-[10px] text-muted-foreground">{n.note} • İnternet yok</p>
              </div>
            </div>
            {n.active ? (
              <div className="flex items-end gap-0.5" aria-label={`Sinyal ${bars}/4`}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn("w-1 rounded-sm", i < bars ? "bg-chart-3" : "bg-muted-foreground/30")}
                    style={{ height: `${(i + 1) * 4 + 2}px` }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">Bağlı değil</span>
            )}
          </div>
        ))}
      </div>

      {/* Bağlı cihazlar (MAC filtreli) */}
      <p className="mb-1.5 mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {activeSsid} — İzinli Cihazlar (MAC Filtreli)
      </p>
      <ul className="space-y-1.5">
        {devices.map((d) => (
          <li key={d.mac} className="flex items-center gap-2.5 rounded-md bg-muted px-3 py-2">
            <d.icon className="size-4 text-accent" />
            <div className="flex-1">
              <p className="text-sm text-card-foreground">{d.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{d.mac}</p>
            </div>
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                d.online ? "text-chart-3" : "text-destructive",
              )}
            >
              <span className={cn("size-2 rounded-full", d.online ? "bg-chart-3" : "bg-destructive")} />
              {d.online ? "Çevrimiçi" : "Çevrimdışı"}
            </span>
          </li>
        ))}
      </ul>
    </PanelCard>
  )
}
