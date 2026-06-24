/*
  UZAKTAN MANUEL KONTROL PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10: arayüz uzaktan kontrole uygun olmalı; gerektiğinde robot
  uzaktan manuel kontrol edilebilmelidir. ÖNEMLİ: Manuel moda geçiş robot
  ÜZERİNDEKİ FİZİKSEL ANAHTAR ile yapılır. Anahtar OTOMATİK'teyken uzaktan
  kontrol YAPILAMAZ.

  Bu nedenle buradaki anahtar göstergesi SALT-OKUNUR'dur: durumu robottan gelen
  telemetri (manualSwitch) belirler. Arayüzden yazılımsal olarak manuel moda
  geçilemez — yalnızca anahtar manuel iken sürüş tuşları aktif olur ve robota
  "manual_drive" komutu gönderilir.

  FAYDASI: Güvenlik şartı birebir karşılanır; otomatik modda yanlışlıkla
  müdahale fiziksel olarak engellenmiş olur.
*/
"use client"

import {
  Gamepad2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowBigUpDash,
  ArrowBigDownDash,
} from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { cn } from "@/lib/utils"
import type { DriveDir } from "@/lib/robot-connection"

interface Props {
  manualAllowed: boolean // robottaki anahtar "manual" konumda mı (salt-okunur)
  connected: boolean
  onDrive: (dir: DriveDir) => void
}

export function ManualControlPanel({ manualAllowed, connected, onDrive }: Props) {
  const enabled = manualAllowed && connected

  // Tek bir sürüş tuşu için ortak stil + devre dışı mantığı.
  const Btn = ({ dir, children, className }: { dir: DriveDir; children: React.ReactNode; className?: string }) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => onDrive(dir)}
      className={cn(
        "flex items-center justify-center rounded-md border border-border bg-muted text-card-foreground transition active:scale-95 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  )

  return (
    <PanelCard
      title="Uzaktan Manuel Kontrol"
      icon={Gamepad2}
      action={
        // Robot üzerindeki fiziksel anahtarın SALT-OKUNUR göstergesi.
        <span
          className={cn(
            "flex items-center gap-2 rounded-full border px-1 py-1 text-[10px] font-bold",
            manualAllowed ? "border-accent/50 bg-accent/15" : "border-border bg-muted",
          )}
          aria-label={`Robot anahtarı: ${manualAllowed ? "MANUEL" : "OTOMATİK"}`}
        >
          <span className={cn("rounded-full px-2 py-0.5", !manualAllowed && "bg-primary text-primary-foreground")}>OTO</span>
          <span className={cn("rounded-full px-2 py-0.5", manualAllowed && "bg-accent text-accent-foreground")}>MAN</span>
        </span>
      }
    >
      {!connected ? (
        <p className="mb-3 rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          Robot bağlı değil — uzaktan sürüş kilitli.
        </p>
      ) : !manualAllowed ? (
        <p className="mb-3 rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          Robot anahtarı <strong className="text-card-foreground">OTOMATİK</strong> konumda — uzaktan sürüş kilitli.
          Etkinleştirmek için robot üzerindeki anahtarı <strong className="text-accent">MANUEL</strong> konuma alın.
        </p>
      ) : (
        <p className="mb-3 rounded-md bg-accent/10 px-3 py-2 text-center text-xs text-accent">
          Anahtar MANUEL — uzaktan sürüş aktif.
        </p>
      )}

      <div className="flex items-center justify-around gap-4">
        {/* Yön kontrol pad'i */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
          <span />
          <Btn dir="up" className="size-12">
            <ChevronUp className="size-6" />
          </Btn>
          <span />
          <Btn dir="left" className="size-12">
            <ChevronLeft className="size-6" />
          </Btn>
          <span className="flex items-center justify-center text-[9px] font-medium text-muted-foreground">SÜRÜŞ</span>
          <Btn dir="right" className="size-12">
            <ChevronRight className="size-6" />
          </Btn>
          <span />
          <Btn dir="down" className="size-12">
            <ChevronDown className="size-6" />
          </Btn>
          <span />
        </div>

        {/* Çatal (fork) yükseltme/indirme */}
        <div className="flex flex-col gap-1.5">
          <span className="text-center text-[9px] font-medium text-muted-foreground">ÇATAL</span>
          <Btn dir="fork_up" className="h-12 w-16">
            <ArrowBigUpDash className="size-6" />
          </Btn>
          <Btn dir="fork_down" className="h-12 w-16">
            <ArrowBigDownDash className="size-6" />
          </Btn>
        </div>
      </div>
    </PanelCard>
  )
}
