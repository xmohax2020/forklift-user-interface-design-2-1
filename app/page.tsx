/*
  OPERATÖR KONTROL PANELİ — ANA SAYFA
  -------------------------------------------------------------------------
  Şartname (SRUY 2026) madde 10'da istenen kullanıcı arayüzünün tamamını
  tek ekranda toplar. Tüm canlı veri tek bir kaynaktan (useRobotSimulation)
  gelir ve panellere dağıtılır.

  Yerleşim (responsive, mobil öncesi → masaüstü):
   - Üst bar: kimlik, WiFi, mod, saat, ACİL STOP
   - Sol kolon : Robot durumu + Görev + Telemetri/Güvenlik
   - Orta kolon: Kamera + Harita
   - Sağ kolon : PLC haberleşme + QR + Manuel kontrol + Ağ

  FAYDASI: Operatör tüm kritik bilgiyi tek ekrandan, kaydırmadan izleyebilir;
  acil müdahale kontrolleri daima erişilebilir.
*/
"use client"

import { useState } from "react"
import { AnimatedBackground } from "@/components/animated-background"
import { DashboardHeader } from "@/components/dashboard-header"
import { RobotStatusPanel } from "@/components/robot-status-panel"
import { MissionPanel } from "@/components/mission-panel"
import { TelemetryPanel } from "@/components/telemetry-panel"
import { CameraPanel } from "@/components/camera-panel"
import { MapPanel } from "@/components/map-panel"
import { FactorySystemPanel } from "@/components/factory-system-panel"
import { PlcPanel } from "@/components/plc-panel"
import { QrPanel } from "@/components/qr-panel"
import { ManualControlPanel } from "@/components/manual-control-panel"
import { NetworkPanel } from "@/components/network-panel"
import { useRobotSimulation } from "@/lib/robot-simulation"

export default function Page() {
  // Tüm canlı durum ve operatör eylemleri tek hook'tan gelir.
  const sim = useRobotSimulation()
  // MADDE 2: harita rota düzenleme modu (yalnızca arayüz durumu).
  const [editingRoute, setEditingRoute] = useState(false)

  return (
    <>
      {/* Hareketli fabrika zemini arka planı */}
      <AnimatedBackground />

      <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4">
        <DashboardHeader
          telemetry={sim.telemetry}
          manualMode={sim.manualMode}
          onEmergencyStop={sim.emergencyStop}
        />

        {/* 3 kolonlu ana ızgara (büyük ekranlarda) */}
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sol kolon */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <RobotStatusPanel telemetry={sim.telemetry} />
            <MissionPanel
              telemetry={sim.telemetry}
              running={sim.running}
              manualMode={sim.manualMode}
              onStart={sim.startMission}
            />
            <TelemetryPanel
              telemetry={sim.telemetry}
              onToggleObstacle={sim.toggleObstacle}
              onResetError={sim.resetError}
            />
          </div>

          {/* Orta kolon */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <CameraPanel telemetry={sim.telemetry} />
            <MapPanel
              telemetry={sim.telemetry}
              route={sim.route}
              editing={editingRoute}
              onToggleEdit={() => setEditingRoute((v) => !v)}
              onAddWaypoint={sim.addWaypoint}
              onClear={sim.clearRoute}
              onReset={sim.resetRoute}
              onSave={(count) => {
                sim.saveRoute(count)
                setEditingRoute(false)
              }}
            />
            <FactorySystemPanel
              queue={sim.taskQueue}
              activeTask={sim.activeTask}
              connected={sim.telemetry.plcConnected}
              canDispatch={!sim.running && !sim.manualMode}
              onDispatch={sim.dispatchTask}
            />
          </div>

          {/* Sağ kolon */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <PlcPanel telemetry={sim.telemetry} messages={sim.messages} />
            <QrPanel telemetry={sim.telemetry} />
            <ManualControlPanel
              manualMode={sim.manualMode}
              onToggleManual={sim.setManual}
              onDrive={sim.manualDrive}
            />
            <NetworkPanel telemetry={sim.telemetry} />
          </div>
        </div>
      </main>
    </>
  )
}
