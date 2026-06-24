/*
  ROBOT SİMÜLASYON KATMANI
  -------------------------------------------------------------------------
  Gerçek yarışmada bu veriler forklift otonom mobil robottan WiFi (YARISMA AGI)
  üzerinden gelir. Burada arayüzü canlı göstermek için verileri yerel olarak
  üretiyoruz. Gerçek robota bağlanırken tek yapmanız gereken bu hook içindeki
  değerleri WebSocket / MQTT / ROS bridge'den gelen telemetri ile değiştirmek.

  FAYDASI: Tüm canlı durum tek bir yerde toplanır. Arayüz bileşenleri sadece
  "tüketici" olur; veri kaynağı değişse bile (sim -> gerçek robot) bileşenleri
  değiştirmeye gerek kalmaz.
*/

"use client"

import { useEffect, useRef, useState } from "react"

// Şartnamede tanımlı 8 robot durumu (görev maddesi 10).
export type RobotState =
  | "idle" // a) Göreve hazır bekleme
  | "task_processing" // b) Görev alındı, işleniyor
  | "moving_empty" // c) Görev alındı, yüksüz hareket
  | "moving_loaded" // d) Görev alındı, yüklü hareket
  | "waiting_plc" // e) Fabrika otomasyon sistemi (PLC) komut bekleniyor
  | "returning" // f) Görev tamamlandı, başlangıca hareket
  | "error" // g) Hata durumu
  | "estop" // h) Acil stop

// Durumların Türkçe etiket + renk eşlemesi (arayüzde tutarlılık için).
export const ROBOT_STATE_META: Record<
  RobotState,
  { label: string; tone: "idle" | "active" | "load" | "wait" | "danger" }
> = {
  idle: { label: "Göreve Hazır (Bekleme)", tone: "idle" },
  task_processing: { label: "Görev Alındı — İşleniyor", tone: "active" },
  moving_empty: { label: "Yüksüz Hareket", tone: "active" },
  moving_loaded: { label: "Yüklü Hareket", tone: "load" },
  waiting_plc: { label: "PLC Komutu Bekleniyor", tone: "wait" },
  returning: { label: "Başlangıca Dönüyor", tone: "active" },
  error: { label: "HATA", tone: "danger" },
  estop: { label: "ACİL STOP", tone: "danger" },
}

export type LogDirection = "tx" | "rx" // tx: robottan PLC'ye, rx: PLC'den robota
export interface CommMessage {
  id: number
  time: string
  dir: LogDirection
  text: string
}

export interface RobotTelemetry {
  state: RobotState
  // Konum bilgisi (harita koordinatları, metre)
  x: number
  y: number
  heading: number // derece
  speed: number // m/s
  battery: number // %
  routeProgress: number // 0-1 arası rota tamamlanma oranı
  deviation: number // rotadan sapma (cm) — şartname limiti 10cm
  obstacle: boolean // önde engel var mı
  obstacleDistance: number // m
  // Görev bilgileri
  pickupNode: string // rastgele atanan alma noktası (PLC üretir)
  dropoffNode: string // rastgele atanan bırakma noktası
  loaded: boolean // yük forkliftte mi
  // QR
  lastQr: string
  qrOffsetX: number // QR'nin kameraya göre yatay ofseti (mm)
  qrOffsetZ: number // QR'nin kameraya göre mesafesi (mm)
  qrAngle: number // QR'ye göre açı (derece)
  // PLC / kapı
  plcConnected: boolean
  doorOpen: boolean
  // Ağ
  wifiConnected: boolean
  wifiRssi: number // dBm
  // Görev süresi
  missionSeconds: number
}

const PICKUPS = ["A1", "A2", "A3"] // 3 alma noktası
const DROPOFFS = ["B1", "B2", "B3"] // 3 bırakma noktası
const QR_CODES = ["Q1", "Q2", "Q3", "Q4", "Q5"]

function nowTime() {
  return new Date().toLocaleTimeString("tr-TR", { hour12: false })
}

/*
  Senaryoyu (şartname Bölüm 4) sıraya koyan basit bir durum makinesi.
  Her adım belirli saniye sürer ve uygun PLC mesajlarını/günlüğü üretir.
*/
type Step = {
  state: RobotState
  duration: number
  loaded: boolean
  onEnter?: (api: SimApi) => void
}

interface SimApi {
  log: (dir: LogDirection, text: string) => void
  setDoor: (open: boolean) => void
}

export function useRobotSimulation() {
  const [t, setT] = useState<RobotTelemetry>(() => ({
    state: "idle",
    x: 0.6,
    y: 0.5,
    heading: 90,
    speed: 0,
    battery: 87,
    routeProgress: 0,
    deviation: 1.2,
    obstacle: false,
    obstacleDistance: 4,
    pickupNode: "A2",
    dropoffNode: "B3",
    loaded: false,
    lastQr: "—",
    qrOffsetX: 0,
    qrOffsetZ: 0,
    qrAngle: 0,
    plcConnected: true,
    doorOpen: false,
    wifiConnected: true,
    wifiRssi: -52,
    missionSeconds: 0,
  }))

  const [messages, setMessages] = useState<CommMessage[]>([])
  const [running, setRunning] = useState(false) // operatör "Görevi Başlat" deyince true
  const [manualMode, setManualMode] = useState(false) // robot üzerindeki anahtar "manuel"de mi
  const msgId = useRef(0)
  const stepIndex = useRef(0)
  const stepElapsed = useRef(0)

  const pushLog = (dir: LogDirection, text: string) => {
    msgId.current += 1
    setMessages((prev) => [
      { id: msgId.current, time: nowTime(), dir, text },
      ...prev,
    ].slice(0, 60))
  }

  // İlk bağlantı el sıkışması logu (sadece bir kez).
  useEffect(() => {
    pushLog("tx", "Robot çevrimiçi — YARISMA AGI'ye bağlanıldı")
    pushLog("tx", "PLC bağlantısı kuruldu (TCP/Modbus)")
    pushLog("rx", "PLC: Bağlantı onaylandı")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Senaryo adımları (şartname senaryosu birebir).
  const steps = useRef<Step[]>([
    {
      state: "task_processing",
      duration: 3,
      loaded: false,
      onEnter: (api) => {
        const p = PICKUPS[Math.floor(Math.random() * PICKUPS.length)]
        const d = DROPOFFS[Math.floor(Math.random() * DROPOFFS.length)]
        setT((s) => ({ ...s, pickupNode: p, dropoffNode: d }))
        api.log("rx", `PLC: Görev atandı → Alma: ${p}, Bırakma: ${d}`)
        api.log("tx", "Görev kabul edildi, rota hesaplanıyor")
      },
    },
    {
      state: "moving_empty",
      duration: 8,
      loaded: false,
      onEnter: (api) => api.log("tx", "Alma noktasına ilerleniyor (yüksüz)"),
    },
    {
      state: "moving_loaded",
      duration: 6,
      loaded: true,
      onEnter: (api) => {
        api.log("tx", "QR okundu, çizgi takibi ile yük alındı")
        api.log("tx", "Yük forkliftte — taşımaya başlandı")
      },
    },
    {
      state: "waiting_plc",
      duration: 4,
      loaded: true,
      onEnter: (api) => {
        api.log("tx", "Q5 kapı kontrol noktasına gelindi — geçiş izni isteniyor")
        setTimeout(() => {
          api.log("rx", "PLC: Kapı açılıyor...")
          api.setDoor(true)
          api.log("rx", "PLC: Geçebilirsin (kapı açık)")
        }, 1800)
      },
    },
    {
      state: "moving_loaded",
      duration: 7,
      loaded: true,
      onEnter: (api) => {
        api.setDoor(false)
        api.log("tx", "Kapı geçildi, bırakma noktasına ilerleniyor")
      },
    },
    {
      state: "task_processing",
      duration: 3,
      loaded: false,
      onEnter: (api) => {
        api.log("tx", "Bırakma noktasına ulaşıldı — yük bırakıldı")
        api.log("tx", "Yük teslim edildi bilgisi gönderildi")
        api.log("rx", "PLC: Teslimat onaylandı")
      },
    },
    {
      state: "returning",
      duration: 8,
      loaded: false,
      onEnter: (api) => api.log("tx", "Bekleme noktasına dönülüyor"),
    },
    {
      state: "idle",
      duration: 9999,
      loaded: false,
      onEnter: (api) => api.log("tx", "Bekleme noktasında — göreve hazır"),
    },
  ])

  const api: SimApi = {
    log: pushLog,
    setDoor: (open) => setT((s) => ({ ...s, doorOpen: open })),
  }

  // Ana simülasyon döngüsü (10 Hz). Gerçek robotta bunun yerine telemetri akışı olur.
  useEffect(() => {
    const id = setInterval(() => {
      setT((s) => {
        // Acil stop veya hata varsa hareket yok.
        if (s.state === "estop" || s.state === "error") {
          return { ...s, speed: 0 }
        }

        // Manuel modda durum makinesi çalışmaz; operatör kontrol eder.
        if (manualMode) {
          return { ...s, state: "idle", speed: 0 }
        }

        if (!running) {
          return { ...s, speed: 0, state: "idle" }
        }

        // Adım ilerlemesi
        const cur = steps.current[stepIndex.current]
        stepElapsed.current += 0.1

        // Engel varsa say ama ilerleme (güvenli duruş — şartname madde 6).
        const blocked = s.obstacle
        const dt = blocked ? 0 : 0.1

        let progressDelta = 0
        if (cur.state.startsWith("moving") || cur.state === "returning") {
          progressDelta = dt / (cur.duration || 1)
        }

        const newProgress = Math.min(1, s.routeProgress + progressDelta * 0.5)

        // Adım süresi dolduysa sonraki adıma geç.
        if (!blocked && stepElapsed.current >= cur.duration) {
          stepElapsed.current = 0
          if (stepIndex.current < steps.current.length - 1) {
            stepIndex.current += 1
            const next = steps.current[stepIndex.current]
            next.onEnter?.(api)
            if (next.state === "idle") setRunning(false)
            return {
              ...s,
              state: next.state,
              loaded: next.loaded,
              speed: next.state === "idle" ? 0 : 0.45,
            }
          }
        }

        // Canlı değerler (hafif gürültü ile gerçekçilik).
        const moving =
          cur.state.startsWith("moving") || cur.state === "returning"
        return {
          ...s,
          routeProgress: newProgress,
          speed: blocked ? 0 : moving ? 0.42 + Math.random() * 0.1 : 0,
          heading: (s.heading + (moving && !blocked ? 1.5 : 0)) % 360,
          deviation: Math.max(
            0,
            Math.min(9.5, s.deviation + (Math.random() - 0.5) * 0.8),
          ),
          battery: Math.max(20, s.battery - 0.004),
          wifiRssi: Math.round(-52 + (Math.random() - 0.5) * 6),
          obstacleDistance: blocked
            ? 0.4 + Math.random() * 0.2
            : 3 + Math.random() * 2,
          qrOffsetX: cur.state === "moving_loaded" ? Math.round((Math.random() - 0.5) * 30) : s.qrOffsetX,
          missionSeconds: s.missionSeconds + 0.1,
        }
      })
    }, 100)
    return () => clearInterval(id)
  }, [running, manualMode])

  // QR okuma simülasyonu (her birkaç saniyede bir).
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const qr = QR_CODES[Math.floor(Math.random() * QR_CODES.length)]
      setT((s) => ({
        ...s,
        lastQr: qr,
        qrOffsetX: Math.round((Math.random() - 0.5) * 40),
        qrOffsetZ: Math.round(900 + Math.random() * 300),
        qrAngle: +((Math.random() - 0.5) * 6).toFixed(1),
      }))
      pushLog("tx", `QR okundu: ${qr} (poz hesaplandı)`)
    }, 6000)
    return () => clearInterval(id)
  }, [running])

  // -- Operatör eylemleri (arayüz butonlarının çağıracağı fonksiyonlar) --

  const startMission = () => {
    if (manualMode) return
    stepIndex.current = 0
    stepElapsed.current = 0
    const first = steps.current[0]
    first.onEnter?.(api)
    setT((s) => ({ ...s, routeProgress: 0, missionSeconds: 0 }))
    setRunning(true)
  }

  const emergencyStop = () => {
    setRunning(false)
    setT((s) => ({ ...s, state: "estop", speed: 0 }))
    pushLog("tx", "⚠ ACİL STOP tetiklendi — tüm hareket durduruldu")
  }

  const resetError = () => {
    setT((s) => ({ ...s, state: "idle" }))
    pushLog("tx", "Sistem sıfırlandı — göreve hazır")
  }

  const toggleObstacle = () => {
    setT((s) => {
      const next = !s.obstacle
      pushLog(
        "tx",
        next
          ? "Engel algılandı — güvenli mesafede durduruldu"
          : "Engel kalktı — göreve devam ediliyor",
      )
      return { ...s, obstacle: next }
    })
  }

  const setManual = (on: boolean) => {
    setManualMode(on)
    pushLog(
      "tx",
      on
        ? "Anahtar MANUEL konuma alındı — uzaktan kontrol aktif"
        : "Anahtar OTOMATİK konuma alındı — uzaktan kontrol kapalı",
    )
    if (on) setRunning(false)
  }

  // Manuel sürüş komutu (uzaktan kontrol panelinden gelir).
  const manualDrive = (dir: "up" | "down" | "left" | "right" | "fork_up" | "fork_down") => {
    if (!manualMode) return
    pushLog("tx", `Manuel komut: ${dir}`)
    setT((s) => {
      const step = 0.04
      switch (dir) {
        case "up":
          return { ...s, y: Math.max(0.05, s.y - step), speed: 0.3 }
        case "down":
          return { ...s, y: Math.min(0.95, s.y + step), speed: 0.3 }
        case "left":
          return { ...s, x: Math.max(0.05, s.x - step), heading: 180, speed: 0.3 }
        case "right":
          return { ...s, x: Math.min(0.95, s.x + step), heading: 0, speed: 0.3 }
        default:
          return s
      }
    })
  }

  return {
    telemetry: t,
    messages,
    running,
    manualMode,
    startMission,
    emergencyStop,
    resetError,
    toggleObstacle,
    setManual,
    manualDrive,
  }
}
