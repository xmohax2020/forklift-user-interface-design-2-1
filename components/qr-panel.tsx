/*
  QR KOD PANELİ
  -------------------------------------------------------------------------
  Şartname madde 5: robot QR kod okuyabilmeli VE QR kodun kameraya göre
  pozisyonunu hesaplayabilmelidir. Bu panel robottan GERÇEK gelen son QR kodu
  ve hesaplanan konumu (yatay ofset, mesafe, açı) gösterir. Veri yoksa "—".

  FAYDASI: Yük alma/bırakma öncesi hassas konumlanmanın doğruluğu izlenir.
*/
"use client"

import { QrCode } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-connection"

export function QrPanel({ telemetry }: { telemetry: RobotTelemetry | null }) {
  const fmt = (v: number | null, unit: string) => (v != null ? `${v} ${unit}` : "—")
  const fields = [
    { label: "Yatay Ofset (X)", value: fmt(telemetry?.qrOffsetX ?? null, "mm") },
    { label: "Mesafe (Z)", value: fmt(telemetry?.qrOffsetZ ?? null, "mm") },
    { label: "Açı", value: telemetry?.qrAngle != null ? `${telemetry.qrAngle}°` : "—" },
  ]

  return (
    <PanelCard title="QR Kod & Konum" icon={QrCode}>
      <div className="flex items-center gap-4">
        {/* Okunan QR kimliği */}
        <div className="flex flex-col items-center justify-center rounded-md border border-border bg-muted p-3">
          <QrCode className="size-10 text-primary" aria-hidden />
          <span className="mt-1 font-mono text-lg font-bold text-card-foreground">{telemetry?.lastQr ?? "—"}</span>
          <span className="text-[10px] uppercase text-muted-foreground">Son Okunan</span>
        </div>

        {/* Kameraya göre hesaplanan pozisyon */}
        <dl className="flex-1 space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between border-b border-border/60 pb-1.5">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="font-mono text-sm font-semibold text-card-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </PanelCard>
  )
}
