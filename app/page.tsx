/*
  OPERATÖR KONTROL PANELİ — ANA SAYFA
  -------------------------------------------------------------------------
  Şartname (SRUY 2026) madde 10'da istenen kullanıcı arayüzünü tek ekranda
  toplar. TÜM veri GERÇEK robottan WebSocket üzerinden gelir (bkz.
  lib/robot-connection.ts). Robot bağlı değilken sahte veri ÜRETİLMEZ;
  paneller "veri bekleniyor" durumunu gösterir.

  Ekrandaki paneller (yalnızca madde 10'da istenenler):
   - Robot durumu (8 durum)        - Görev durumu
   - QR kod & konum                - Fabrika üretim sistemi (MES) iş emirleri
   - PLC haberleşme + mesaj günlüğü- Canlı harita & rota tanımlama
   - Uzaktan manuel kontrol        - Ağ & bağlantı ayarları

  Kaldırılanlar: "Kamera Görüntüleri" ve "Telemetri & Güvenlik" panelleri
  (madde 10 zorunlu arayüz kapsamında değil) ve tüm simülasyon kodu.
*/
"use client"

import { useState } from "react"
import { AnimatedBackground } from "@/components/animated-background"
import { DashboardHeader } from "@/components/dashboard-header"
import { RobotStatusPanel } from "@/components/robot-status-panel"
import { MissionPanel } from "@/components/mission-panel"
import { MapPanel } from "@/components/map-panel"
import { FactorySystemPanel } from "@/components/factory-system-panel"
import { PlcPanel } from "@/components/plc-panel"
import { QrPanel } from "@/components/qr-panel"
import { ManualControlPanel } from "@/components/manual-control-panel"
import { NetworkPanel } from "@/components/network-panel"
import { useRobotConnection } from "@/lib/robot-connection"

export default function Page() {
  // Tüm canlı durum ve operatör komutları gerçek bağlantı hook'undan gelir.
  const robot = useRobotConnection()
  // MADDE 2: harita rota düzenleme modu (yalnızca arayüz durumu).
  const [editingRoute, setEditingRoute] = useState(false)

  const connected = robot.status === "connected"

  return (
    <>
      {/* Hareketli fabrika zemini arka planı (dekoratif) */}
      <AnimatedBackground />

      <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4">
        <DashboardHeader
          telemetry={robot.telemetry}
          status={robot.status}
          onEmergencyStop={robot.emergencyStop}
        />

        {/* 3 kolonlu ana ızgara (büyük ekranlarda) */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sol kolon */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <RobotStatusPanel telemetry={robot.telemetry} connected={connected} />
            <MissionPanel
              telemetry={robot.telemetry}
              connected={connected}
              manualAllowed={robot.manualAllowed}
              onStart={robot.startMission}
              onResetError={robot.resetError}
            />
          </div>

          {/* Orta kolon */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <MapPanel
              telemetry={robot.telemetry}
              map={robot.map}
              route={robot.route}
              editing={editingRoute}
              connected={connected}
              onToggleEdit={() => setEditingRoute((v) => !v)}
              onAddWaypoint={robot.addWaypoint}
              onClear={robot.clearRoute}
              onSave={() => {
                robot.saveRoute()
                setEditingRoute(false)
              }}
            />
            <FactorySystemPanel
              queue={robot.taskQueue}
              activeTask={robot.activeTask}
              connected={connected}
              plcConnected={Boolean(robot.telemetry?.plcConnected)}
              canDispatch={connected && !robot.manualAllowed}
              onDispatch={robot.dispatchTask}
            />
          </div>

          {/* Sağ kolon */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <PlcPanel telemetry={robot.telemetry} messages={robot.messages} connected={connected} />
            <QrPanel telemetry={robot.telemetry} />
            <ManualControlPanel manualAllowed={robot.manualAllowed} connected={connected} onDrive={robot.manualDrive} />
            <NetworkPanel
              url={robot.url}
              status={robot.status}
              wifiRssi={robot.telemetry?.wifiRssi ?? null}
              onSetUrl={robot.setUrl}
              onConnect={robot.connect}
              onDisconnect={robot.disconnect}
            />
          </div>
        </div>
      </main>
    </>
  )
}
