/*
  AĞ & BAĞLANTI PANELİ
  -------------------------------------------------------------------------
  Robota GERÇEK bağlantı buradan kurulur. Operatör, robot üzerindeki WebSocket
  sunucusunun adresini girer ve "Bağlan"a basar (bkz. lib/robot-connection.ts).

  Şartname "WİFİ AĞA BAĞLANTI" notu: sahada internet erişimi OLMAYAN iki lokal
  WiFi ağı vardır ("YARISMA AGI" ve "YARISMA DENEME AGI"); her ağa MAC filtreli
  yalnızca 2 cihaz (robot + operatör bilgisayarı) bağlanır. Bu yüzden burada
  internet değil, aynı yerel ağ üzerindeki robotun ADRESİ kullanılır.

  NASIL DOLDURULUR:
   • rosbridge kullanıyorsanız:  ws://<robot-ip>:9090
   • kendi WS sunucunuz varsa:    ws://<robot-ip>:8765
   (Arayüz https üzerinden açıldıysa tarayıcı yalnızca wss:// kabul eder;
    sahada arayüzü http://localhost'ta çalıştırmak en pratik yoldur.)

  FAYDASI: Bağlantı tek yerden, gerçek adresle yönetilir; sinyal gücü (robot
  bildirirse) ve durum net görülür.
*/
"use client"

import { useEffect, useState } from "react"
import { Wifi, Plug, PlugZap, Router } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { ConnStatus } from "@/lib/robot-connection"
import { cn } from "@/lib/utils"

interface Props {
  url: string
  status: ConnStatus
  wifiRssi: number | null
  onSetUrl: (u: string) => void
  onConnect: () => void
  onDisconnect: () => void
}

const STATUS_META: Record<ConnStatus, { label: string; cls: string }> = {
  disconnected: { label: "Bağlı değil", cls: "text-destructive" },
  connecting: { label: "Bağlanıyor…", cls: "text-chart-1" },
  connected: { label: "Bağlı", cls: "text-chart-3" },
  error: { label: "Hata", cls: "text-destructive" },
}

export function NetworkPanel({ url, status, wifiRssi, onSetUrl, onConnect, onDisconnect }: Props) {
  // Girişteki adres yerel durumda tutulur; kaydedilmiş adres yüklenince eşitlenir.
  const [draft, setDraft] = useState(url)
  useEffect(() => setDraft(url), [url])

  const connected = status === "connected"
  const connecting = status === "connecting"
  // RSSI bilgisini robot bildirirse 0-4 bar'a çevir.
  const bars = wifiRssi != null ? Math.max(0, Math.min(4, Math.round((wifiRssi + 90) / 10))) : 0

  const handleConnect = () => {
    onSetUrl(draft.trim())
    onConnect()
  }

  return (
    <PanelCard
      title="Ağ & Bağlantı"
      icon={Wifi}
      action={
        <span className={cn("flex items-center gap-1.5 text-[11px] font-medium", STATUS_META[status].cls)}>
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "animate-pulse-dot bg-chart-3" : status === "connecting" ? "bg-chart-1" : "bg-destructive",
            )}
          />
          {STATUS_META[status].label}
        </span>
      }
    >
      {/* Robot WebSocket adresi */}
      <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Robot Bağlantı Adresi (WebSocket)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="url"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ws://192.168.1.50:9090"
          disabled={connected || connecting}
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-card-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
        {connected || connecting ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Plug className="size-4" /> Kes
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={!draft.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlugZap className="size-4" /> Bağlan
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Örn: rosbridge için <span className="font-mono">ws://&lt;robot-ip&gt;:9090</span> • kendi sunucunuz için{" "}
        <span className="font-mono">ws://&lt;robot-ip&gt;:8765</span>
      </p>

      {/* Sinyal gücü (yalnızca robot bildirirse) */}
      <div className="mt-3 flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <div className="flex items-center gap-2">
          <Router className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">WiFi Sinyal Gücü</span>
        </div>
        {wifiRssi != null ? (
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5" aria-label={`Sinyal ${bars}/4`}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn("w-1 rounded-sm", i < bars ? "bg-chart-3" : "bg-muted-foreground/30")}
                  style={{ height: `${(i + 1) * 4 + 2}px` }}
                />
              ))}
            </div>
            <span className="font-mono text-xs text-card-foreground">{wifiRssi} dBm</span>
          </div>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Saha ağları bilgisi (şartname notu) */}
      <p className="mb-1.5 mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Saha Ağları (internet yok • MAC filtreli • 2 cihaz)
      </p>
      <ul className="space-y-1.5 text-xs">
        <li className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-card-foreground">YARISMA AGI</span>
          <span className="text-muted-foreground">Yarışma ağı</span>
        </li>
        <li className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
          <span className="text-card-foreground">YARISMA DENEME AGI</span>
          <span className="text-muted-foreground">Deneme ağı</span>
        </li>
      </ul>
    </PanelCard>
  )
}
