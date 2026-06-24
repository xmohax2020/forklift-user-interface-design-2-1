/*
  UZAKTAN MANUEL KONTROL PANELİ
  -------------------------------------------------------------------------
  Şartname madde 10: arayüz uzaktan kontrole uygun olmalı; gerektiğinde robot
  uzaktan manuel kontrol edilebilmelidir. Manuel moda geçiş robot üzerindeki
  fiziksel anahtarla yapılır — anahtar OTOMATİK'teyken uzaktan kontrol
  YAPILAMAZ. Bunu burada bir "Anahtar (OTOMATİK/MANUEL)" simülasyonu ile
  modelliyoruz.

  - Yön tuşları (ileri/geri/sol/sağ) ve çatal (fork) yukarı/aşağı.
  - Otomatik moddayken tüm sürüş tuşları devre dışıdır (güvenlik).

  FAYDASI: Arıza/sıkışma durumunda operatör robotu güvenli şekilde elle
  kurtarabilir; otomatik modda yanlışlıkla müdahale engellenir.
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

type Dir = "up" | "down" | "left" | "right" | "fork_up" | "fork_down"

interface Props {
  manualMode: boolean
  onToggleManual: (on: boolean) => void
  onDrive: (dir: Dir) => void
}

export function ManualControlPanel({ manualMode, onToggleManual, onDrive }: Props) {
  // Tek bir sürüş tuşu için ortak stil + devre dışı mantığı.
  const Btn = ({ dir, children, className }: { dir: Dir; children: React.ReactNode; className?: string }) => (
    <button
      type="button"
      disabled={!manualMode}
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
        // Robot üzerindeki fiziksel anahtarın yazılım karşılığı.
        <button
          type="button"
          role="switch"
          aria-checked={manualMode}
          onClick={() => onToggleManual(!manualMode)}
          className={cn(
            "flex items-center gap-2 rounded-full border px-1 py-1 text-[10px] font-bold transition",
            manualMode ? "border-accent/50 bg-accent/15" : "border-border bg-muted",
          )}
        >
          <span className={cn("rounded-full px-2 py-0.5", !manualMode && "bg-primary text-primary-foreground")}>
            OTO
          </span>
          <span className={cn("rounded-full px-2 py-0.5", manualMode && "bg-accent text-accent-foreground")}>
            MAN
          </span>
        </button>
      }
    >
      {!manualMode && (
        <p className="mb-3 rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          Anahtar <strong className="text-card-foreground">OTOMATİK</strong> konumda — uzaktan sürüş kilitli.
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
          <span className="flex items-center justify-center text-[9px] font-medium text-muted-foreground">
            SÜRÜŞ
          </span>
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
