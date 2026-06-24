/*
  KAMERA PANELİ
  -------------------------------------------------------------------------
  Robot üzerindeki iki kamerayı operatöre canlı gösterir:
   1) Ön (navigasyon) kamerası
   2) Aşağı bakan kamera — görüntü işleme ile renkli şerit/çizgi takibi ve
      QR kod okuma için (şartname madde 4 ve 5).

  Görüntülerin üzerine "canlı feed" hissi veren overlay'ler eklenir:
   - REC/LIVE rozeti + zaman damgası
   - Çizgi takip hedef çizgisi
   - Tespit edilen QR kodun çerçevesi ve koordinatları

  FAYDASI: Operatör robotun "ne gördüğünü" doğrular; çizgi takibi ve QR
  hizalamasının doğru çalışıp çalışmadığını gözle kontrol edebilir.
*/
"use client"

import Image from "next/image"
import { Camera, ScanLine } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import type { RobotTelemetry } from "@/lib/robot-simulation"

function LiveBadge() {
  return (
    <span className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded bg-destructive/90 px-2 py-0.5 text-[10px] font-bold text-white">
      <span className="size-1.5 animate-pulse-dot rounded-full bg-white" />
      CANLI
    </span>
  )
}

export function CameraPanel({ telemetry }: { telemetry: RobotTelemetry }) {
  return (
    <PanelCard
      title="Kamera Görüntüleri"
      icon={Camera}
      action={
        <span className="rounded bg-chart-3/15 px-2 py-0.5 text-[10px] font-medium text-chart-3">
          2 KAMERA BAĞLI
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Ön navigasyon kamerası */}
        <figure className="relative aspect-video overflow-hidden rounded-md border border-border bg-black">
          <LiveBadge />
          <Image
            src="/camera-front.png"
            alt="Robot ön navigasyon kamerası görüntüsü — fabrika koridoru"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            crossOrigin="anonymous"
          />
          {/* Nişangah / merkez hedef */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/70" />
            <div className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-accent/70" />
            <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-accent/70" />
          </div>
          <figcaption className="absolute bottom-1.5 left-2 z-10 font-mono text-[10px] text-white/90 drop-shadow">
            CAM-01 • ÖN
          </figcaption>
        </figure>

        {/* Aşağı bakan çizgi/QR kamerası */}
        <figure className="relative aspect-video overflow-hidden rounded-md border border-border bg-black">
          <LiveBadge />
          <Image
            src="/camera-floor.png"
            alt="Aşağı bakan kamera — zemindeki renkli şerit ve QR kod"
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            crossOrigin="anonymous"
          />
          {/* Çizgi takip hedef ekseni */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent/80" />
          {/* Tespit edilen QR çerçevesi */}
          <div className="pointer-events-none absolute left-1/2 top-3 size-12 -translate-x-1/2 rounded border-2 border-primary">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {telemetry.lastQr}
            </span>
          </div>
          <figcaption className="absolute bottom-1.5 left-2 z-10 flex items-center gap-1 font-mono text-[10px] text-white/90 drop-shadow">
            <ScanLine className="size-3" /> CAM-02 • ÇİZGİ/QR
          </figcaption>
        </figure>
      </div>

      {/* Görüntü işleme özet metrikleri */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted p-2">
          <p className="text-[10px] uppercase text-muted-foreground">Çizgi Sapması</p>
          <p className="font-mono text-sm font-semibold text-card-foreground">
            {telemetry.qrOffsetX} px
          </p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <p className="text-[10px] uppercase text-muted-foreground">FPS</p>
          <p className="font-mono text-sm font-semibold text-card-foreground">30</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <p className="text-[10px] uppercase text-muted-foreground">Çözünürlük</p>
          <p className="font-mono text-sm font-semibold text-card-foreground">720p</p>
        </div>
      </div>
    </PanelCard>
  )
}
