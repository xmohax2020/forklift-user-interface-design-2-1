/*
  PANEL KARTI (ortak kapsayıcı)
  -------------------------------------------------------------------------
  Tüm dashboard bölümleri (kamera, durum, QR, PLC vb.) aynı görünümde olsun
  diye kullanılan ortak kart bileşeni. Başlık, ikon ve sağ üstte opsiyonel bir
  aksiyon alanı içerir.

  FAYDASI: Tek yerden stil yönetimi → tutarlı arayüz, daha az kod tekrarı.
*/
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function PanelCard({ title, icon: Icon, children, action, className }: PanelCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card/80 backdrop-blur-sm shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden />
          <h2 className="text-sm font-medium tracking-wide text-card-foreground">{title}</h2>
        </div>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  )
}
