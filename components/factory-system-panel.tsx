/*
  FABRİKA ÜRETİM SİSTEMİ (MES) PANELİ
  -------------------------------------------------------------------------
  ŞARTNAME MADDE 3: Görevler (alma ve bırakma noktaları) fabrika üretim
  sisteminden iletilir. Bu panel, üretim sisteminden (MES/ERP) gelen iş emri
  kuyruğunu gösterir; operatör sıradaki işi robota gönderebilir.

  - Üstte haberleşme protokolü ve bağlantı durumu özetlenir.
  - Her satır bir iş emri: numara, alma→bırakma, öncelik, geliş zamanı.
  - "Gönder" ile iş emri robota iletilir ve görev başlar.

  FAYDASI: Operatör görevleri elle uydurmaz; gerçek üretim akışındaki gibi
  sistemden gelen iş emirlerini görür ve yönetir.
*/
"use client"

import { Factory, Send, Inbox, Zap } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { cn } from "@/lib/utils"
import type { FactoryTask } from "@/lib/robot-simulation"

interface Props {
  queue: FactoryTask[]
  activeTask: FactoryTask | null
  connected: boolean
  canDispatch: boolean
  onDispatch: (id: string) => void
}

export function FactorySystemPanel({ queue, activeTask, connected, canDispatch, onDispatch }: Props) {
  return (
    <PanelCard
      title="Fabrika Üretim Sistemi (MES)"
      icon={Factory}
      action={
        <span
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium",
            connected ? "bg-chart-3/15 text-chart-3" : "bg-destructive/15 text-destructive",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "animate-pulse-dot bg-chart-3" : "bg-destructive",
            )}
          />
          {connected ? "OPC-UA Bağlı" : "Bağlantı Yok"}
        </span>
      }
    >
      {/* Protokol / haberleşme özeti */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted px-2.5 py-1.5">
          <span className="text-muted-foreground">Protokol</span>
          <p className="font-mono font-semibold text-card-foreground">OPC-UA / Modbus TCP</p>
        </div>
        <div className="rounded-md bg-muted px-2.5 py-1.5">
          <span className="text-muted-foreground">Aktif İş Emri</span>
          <p className="font-mono font-semibold text-card-foreground">{activeTask ? activeTask.id : "—"}</p>
        </div>
      </div>

      {/* İş emri kuyruğu başlığı */}
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Inbox className="size-3.5" />
        Gelen İş Emirleri
        <span className="ml-auto font-mono text-card-foreground">{queue.length} bekliyor</span>
      </div>

      {/* Kuyruk listesi */}
      <div className="flex flex-col gap-2">
        {queue.length === 0 && (
          <p className="rounded-md border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
            Kuyruk boş — üretim sisteminden yeni iş emri bekleniyor…
          </p>
        )}

        {queue.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-card-foreground">{task.id}</span>
                {task.priority === "yuksek" && (
                  <span className="flex items-center gap-0.5 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                    <Zap className="size-2.5" /> ÖNCELİKLİ
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono text-accent">{task.pickup}</span>
                {" → "}
                <span className="font-mono text-primary">{task.dropoff}</span>
                {" • "}
                {task.payload} • {task.receivedAt}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDispatch(task.id)}
              disabled={!canDispatch}
              className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-3.5" /> Gönder
            </button>
          </div>
        ))}
      </div>

      {!canDispatch && queue.length > 0 && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Robot meşgul veya manuel modda — görev tamamlanınca yeni iş gönderilebilir.
        </p>
      )}
    </PanelCard>
  )
}
