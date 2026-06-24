/*
  FABRİKA ÜRETİM SİSTEMİ (MES) PANELİ
  -------------------------------------------------------------------------
  ŞARTNAME MADDE 3: Görevler (alma ve bırakma noktaları) fabrika üretim
  sisteminden iletilir. Bu panel, robotun WebSocket üzerinden ilettiği GERÇEK
  iş emri kuyruğunu ("task_queue" mesajı) gösterir; operatör sıradaki işi
  robota gönderir ("dispatch_task" komutu). Sahte iş emri üretilmez.

  FAYDASI: Operatör görevleri elle uydurmaz; gerçek üretim akışından gelen iş
  emirlerini görür ve yönetir.
*/
"use client"

import { Factory, Send, Inbox, Zap } from "lucide-react"
import { PanelCard } from "@/components/panel-card"
import { cn } from "@/lib/utils"
import type { FactoryTask } from "@/lib/robot-connection"

interface Props {
  queue: FactoryTask[]
  activeTask: FactoryTask | null
  connected: boolean
  plcConnected: boolean
  canDispatch: boolean
  onDispatch: (id: string) => void
}

export function FactorySystemPanel({ queue, activeTask, connected, plcConnected, canDispatch, onDispatch }: Props) {
  return (
    <PanelCard
      title="Fabrika Üretim Sistemi (MES)"
      icon={Factory}
      action={
        <span
          className={cn(
            "flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium",
            plcConnected ? "bg-chart-3/15 text-chart-3" : "bg-destructive/15 text-destructive",
          )}
        >
          <span className={cn("size-1.5 rounded-full", plcConnected ? "animate-pulse-dot bg-chart-3" : "bg-destructive")} />
          {plcConnected ? "Bağlı" : "Bağlantı Yok"}
        </span>
      }
    >
      {/* Aktif iş emri özeti */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted px-2.5 py-1.5">
          <span className="text-muted-foreground">Aktif İş Emri</span>
          <p className="font-mono font-semibold text-card-foreground">{activeTask ? activeTask.id : "—"}</p>
        </div>
        <div className="rounded-md bg-muted px-2.5 py-1.5">
          <span className="text-muted-foreground">Aktif Görev</span>
          <p className="font-mono font-semibold text-card-foreground">
            {activeTask ? `${activeTask.pickup} → ${activeTask.dropoff}` : "—"}
          </p>
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
            {connected ? "Üretim sisteminden iş emri bekleniyor…" : "Robot bağlı değil — iş emri alınamıyor."}
          </p>
        )}

        {queue.map((task) => (
          <div key={task.id} className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2">
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
                {task.payload ? ` • ${task.payload}` : ""}
                {task.receivedAt ? ` • ${task.receivedAt}` : ""}
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
          {connected ? "Manuel mod aktif — otomatik görev gönderilemez." : "Robot bağlı değil."}
        </p>
      )}
    </PanelCard>
  )
}
