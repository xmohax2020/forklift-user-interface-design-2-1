/*
  ════════════════════════════════════════════════════════════════════════
  GERÇEK ROBOT BAĞLANTI KATMANI  (SİMÜLASYON YOK)
  ════════════════════════════════════════════════════════════════════════
  Bu dosya, operatör bilgisayarındaki arayüz ile FORKLİFT OTONOM MOBİL ROBOT
  arasındaki GERÇEK haberleşmeyi yönetir. Hiçbir sahte/üretilmiş (simüle) veri
  YOKTUR. Robot bağlı değilken tüm alanlar "—" / boş görünür; robot bağlanıp
  veri gönderdiği anda arayüz gerçek değerlerle dolar.

  ── NASIL ÇALIŞIR ─────────────────────────────────────────────────────────
  Tarayıcıdan robota bağlanmanın standart yolu WebSocket'tir. Robot üzerinde
  (ör. Raspberry Pi / Jetson / endüstriyel PC) küçük bir WebSocket SUNUCUSU
  çalışır. Bu sunucu:
    • Robotun anlık durumunu JSON olarak DURMADAN arayüze gönderir (telemetri).
    • Arayüzden gelen komutları (acil stop, manuel sürüş, rota, görev) alır ve
      ROS / mikrodenetleyici / PLC tarafına iletir.

  ROS kullanıyorsanız "rosbridge_suite" tam olarak bu işi yapar
  (ws://<robot-ip>:9090). İsterseniz aşağıdaki sade JSON protokolünü kendi
  sunucunuzda da uygulayabilirsiniz.

  ── ROBOTA BAĞLANMAK İÇİN NE YAPMANIZ GEREKİR (ADIM ADIM) ───────────────────
  1) Robot ve bu arayüzü çalıştıran bilgisayarı AYNI yerel ağa bağlayın
     (şartname: "YARISMA AGI" — internet yok, MAC filtreli, 2 cihaz).
  2) Robot üzerinde WebSocket sunucusunu başlatın. Adresini not edin,
     ör:  ws://192.168.1.50:8765   (rosbridge ise ws://192.168.1.50:9090)
  3) Arayüzdeki "Ağ & Bağlantı" panelinden bu adresi girip "Bağlan"a basın.
  4) Robot, aşağıda tanımlı JSON mesajlarını göndermeye başladığında tüm
     paneller GERÇEK verilerle dolar.

  NOT (HTTPS/karışık içerik): Bu arayüz https:// üzerinden açılırsa tarayıcı
  güvenlik gereği yalnızca wss:// (şifreli) WebSocket'e izin verir. Sahada en
  pratik yol, arayüzü operatör bilgisayarında yerel olarak (http://localhost)
  çalıştırmaktır; o zaman ws:// sorunsuz çalışır.

  ════════════════════════════════════════════════════════════════════════
  JSON PROTOKOLÜ  —  ROBOT → ARAYÜZ  (gelen mesajlar)
  ════════════════════════════════════════════════════════════════════════
  Her mesaj bir JSON nesnesidir ve "type" alanı taşır:

  1) Telemetri (durum) — robot bunu periyodik (ör. 5–10 Hz) göndermeli:
     {
       "type": "telemetry",
       "data": {
         "state": "idle",            // 8 durumdan biri (aşağıdaki RobotState)
         "manualSwitch": "auto",     // robot üzerindeki fiziksel anahtar: "auto" | "manual"
         "x": 3.42, "y": 1.18,        // dünya koordinatı (metre) — harita ile aynı çerçeve
         "heading": 92.0,             // yön (derece)
         "speed": 0.43,               // m/s
         "routeProgress": 0.37,       // 0..1 rota tamamlanma
         "deviation": 2.4,            // rotadan sapma (cm) — şartname limiti 10cm
         "obstacle": false,           // önde engel var mı (madde 6)
         "obstacleDistance": 3.1,     // m
         "pickupNode": "A2",          // aktif görevin alma noktası
         "dropoffNode": "B3",         // aktif görevin bırakma noktası
         "loaded": false,             // yük forkliftte mi
         "lastQr": "Q3",              // son okunan QR (madde 5)
         "qrOffsetX": 12, "qrOffsetZ": 980, "qrAngle": -1.5,  // QR'nin kameraya göre pozisyonu
         "plcConnected": true,        // fabrika otomasyon (PLC) bağlantısı
         "doorOpen": false,           // kontrollü kapı durumu (madde 9)
         "wifiRssi": -54,             // opsiyonel: WiFi sinyal gücü (dBm)
         "missionSeconds": 128        // görev kronometresi (sn)
       }
     }
     Not: Eksik alan gönderebilirsiniz; arayüz o alanı "—" gösterir.

  2) Haberleşme günlüğü (PLC/MES ile alınıp verilen mesajlar — madde 10):
     { "type": "comm", "dir": "tx", "text": "Q5 kapı geçiş izni isteniyor", "time": "14:02:11" }
       dir = "tx" (robottan gönderilen) | "rx" (robota gelen). "time" opsiyonel.

  3) Fabrika üretim sistemi iş emri kuyruğu (madde 3):
     { "type": "task_queue", "tasks": [
         { "id":"WO-1042", "pickup":"A2", "dropoff":"B3",
           "priority":"normal", "payload":"Palet 5kg", "receivedAt":"14:00:03" }
     ]}
     { "type": "active_task", "task": { ...aynı yapı... } }   // veya null

  4) Canlı harita (2D lazer tarayıcı çıktısı — madde 1):
     { "type": "map", "data": {
         "width": 400, "height": 300,     // piksel
         "resolution": 0.05,              // metre/piksel
         "origin": [-2.0, -1.5],          // haritanın sol-alt köşesinin dünya koordinatı (metre)
         "image": "data:image/png;base64,...."   // doluluk ızgarasının PNG'si (data URL)
     }}
     Harita bir kez veya güncellendikçe gönderilebilir.

  5) Robotta kayıtlı rota (opsiyonel — robot mevcut rotasını bildirebilir):
     { "type": "route", "points": [[x0,y0],[x1,y1], ...] }   // dünya metre koordinatları

  ════════════════════════════════════════════════════════════════════════
  JSON PROTOKOLÜ  —  ARAYÜZ → ROBOT  (giden komutlar)
  ════════════════════════════════════════════════════════════════════════
   { "type":"command", "action":"emergency_stop" }                 // ACİL STOP (madde 10-h)
   { "type":"command", "action":"reset_error" }                    // hata/estop sonrası sıfırla
   { "type":"command", "action":"start_mission" }                  // kuyruğun başındaki işi başlat
   { "type":"command", "action":"dispatch_task", "id":"WO-1042" }  // belirli iş emrini gönder
   { "type":"command", "action":"manual_drive", "dir":"up" }       // YALNIZCA anahtar "manual" iken
        dir ∈ "up" | "down" | "left" | "right" | "fork_up" | "fork_down" | "stop"
   { "type":"route", "points":[[x,y],...] }                        // operatörün tanımladığı yeni rota

  FAYDASI: Tüm gerçek veri ve komut tek noktada toplanır. Robot firmware'i bu
  sade JSON sözleşmesine uyduğu sürece arayüzde hiçbir değişiklik gerekmez.
*/

"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Şartname madde 10'da tanımlı 8 robot durumu.
export type RobotState =
  | "idle" // a) Göreve hazır bekleme
  | "task_processing" // b) Görev alındı, işleniyor
  | "moving_empty" // c) Görev alındı, yüksüz hareket
  | "moving_loaded" // d) Görev alındı, yüklü hareket
  | "waiting_plc" // e) Fabrika otomasyon sistemi (PLC) komut bekleniyor
  | "returning" // f) Görev tamamlandı, başlangıca hareket
  | "error" // g) Hata durumu
  | "estop" // h) Acil stop

// Robot üzerindeki fiziksel anahtar (madde 10): otomatik / manuel.
export type SwitchMode = "auto" | "manual"

// Durumların Türkçe etiket + renk tonu eşlemesi.
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

export type LogDirection = "tx" | "rx" // tx: robottan, rx: robota
export interface CommMessage {
  id: number
  time: string
  dir: LogDirection
  text: string
}

// Robottan gelen anlık telemetri. Tüm alanlar opsiyoneldir; gelmeyen alan
// arayüzde "—" gösterilir (sahte değer ÜRETİLMEZ).
export interface RobotTelemetry {
  state: RobotState
  manualSwitch: SwitchMode
  x: number | null
  y: number | null
  heading: number | null
  speed: number | null
  routeProgress: number | null
  deviation: number | null
  obstacle: boolean
  obstacleDistance: number | null
  pickupNode: string | null
  dropoffNode: string | null
  loaded: boolean
  lastQr: string | null
  qrOffsetX: number | null
  qrOffsetZ: number | null
  qrAngle: number | null
  plcConnected: boolean
  doorOpen: boolean
  wifiRssi: number | null
  missionSeconds: number | null
}

// Fabrika üretim sisteminden (MES) gelen iş emri (madde 3).
export interface FactoryTask {
  id: string
  pickup: string
  dropoff: string
  priority: "normal" | "yuksek"
  payload: string
  receivedAt: string
}

// 2D lazer tarayıcıdan üretilen canlı harita (madde 1).
export interface MapData {
  width: number // piksel
  height: number // piksel
  resolution: number // metre/piksel
  origin: [number, number] // sol-alt köşenin dünya koordinatı (metre)
  image: string // doluluk ızgarası PNG (data URL)
}

export type ConnStatus = "disconnected" | "connecting" | "connected" | "error"
export type DriveDir = "up" | "down" | "left" | "right" | "fork_up" | "fork_down" | "stop"

// Bağlantı adresini operatör bilgisayarında saklamak için (uygulama verisi
// değil, yalnızca bağlantı ayarıdır).
const LS_URL_KEY = "forklift.ws.url"

function nowTime() {
  return new Date().toLocaleTimeString("tr-TR", { hour12: false })
}

export function useRobotConnection() {
  const [url, setUrlState] = useState("")
  const [status, setStatus] = useState<ConnStatus>("disconnected")

  // Gerçek veri kaynakları — robot bağlanana kadar boş/null.
  const [telemetry, setTelemetry] = useState<RobotTelemetry | null>(null)
  const [messages, setMessages] = useState<CommMessage[]>([])
  const [taskQueue, setTaskQueue] = useState<FactoryTask[]>([])
  const [activeTask, setActiveTask] = useState<FactoryTask | null>(null)
  const [map, setMap] = useState<MapData | null>(null)

  // Operatörün arayüzden tanımladığı rota (dünya metre koordinatları, madde 2).
  const [route, setRoute] = useState<[number, number][]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const manualAllowed = telemetry?.manualSwitch === "manual"

  // Kaydedilmiş bağlantı adresini yükle.
  useEffect(() => {
    const saved = localStorage.getItem(LS_URL_KEY)
    if (saved) setUrlState(saved)
  }, [])

  const setUrl = useCallback((u: string) => {
    setUrlState(u)
    localStorage.setItem(LS_URL_KEY, u)
  }, [])

  // Yerel haberleşme günlüğüne kayıt ekler (bağlan/kes gibi olaylar için).
  const pushLocalLog = useCallback((dir: LogDirection, text: string) => {
    setMessages((prev) => [{ id: (prev[0]?.id ?? 0) + 1, time: nowTime(), dir, text }, ...prev].slice(0, 200))
  }, [])

  // Robottan gelen ham mesajı işler.
  const handleMessage = useCallback((raw: string) => {
    let msg: any
    try {
      msg = JSON.parse(raw)
    } catch {
      return // JSON değilse yok say
    }
    switch (msg.type) {
      case "telemetry":
        setTelemetry(normalizeTelemetry(msg.data ?? msg.payload ?? msg))
        break
      case "comm":
      case "message": {
        const dir: LogDirection = msg.dir === "rx" ? "rx" : "tx"
        setMessages((prev) =>
          [
            {
              id: (prev[0]?.id ?? 0) + 1,
              time: msg.time ?? nowTime(),
              dir,
              text: String(msg.text ?? ""),
            },
            ...prev,
          ].slice(0, 200),
        )
        break
      }
      case "task_queue":
        if (Array.isArray(msg.tasks)) setTaskQueue(msg.tasks)
        break
      case "active_task":
        setActiveTask(msg.task ?? null)
        break
      case "map":
        if (msg.data) setMap(msg.data as MapData)
        break
      case "route":
        if (Array.isArray(msg.points)) setRoute(msg.points)
        break
      default:
        break
    }
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  const connect = useCallback(() => {
    if (!url) return
    // Var olan bağlantıyı kapat.
    wsRef.current?.close()
    setStatus("connecting")
    pushLocalLog("tx", `Bağlanılıyor: ${url}`)
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      setStatus("error")
      pushLocalLog("rx", "Bağlantı kurulamadı (geçersiz adres)")
      return
    }
    wsRef.current = ws

    ws.onopen = () => {
      setStatus("connected")
      pushLocalLog("rx", "Robota bağlanıldı — telemetri bekleniyor")
    }
    ws.onmessage = (ev) => handleMessage(typeof ev.data === "string" ? ev.data : "")
    ws.onerror = () => {
      setStatus("error")
      pushLocalLog("rx", "Bağlantı hatası")
    }
    ws.onclose = () => {
      setStatus("disconnected")
      // Robot kopunca sahte veri tutmuyoruz; telemetriyi sıfırlıyoruz.
      setTelemetry(null)
      pushLocalLog("rx", "Bağlantı kapandı")
    }
  }, [url, handleMessage, pushLocalLog])

  // Bileşen kaldırılırken bağlantıyı temizle.
  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  // Robota JSON komut gönderir. Bağlı değilse sessizce yok sayar.
  const send = useCallback((obj: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(obj))
    return true
  }, [])

  // ── Komutlar (arayüz butonlarının çağıracağı fonksiyonlar) ──
  const emergencyStop = useCallback(() => {
    send({ type: "command", action: "emergency_stop" })
    pushLocalLog("tx", "ACİL STOP komutu gönderildi")
  }, [send, pushLocalLog])

  const resetError = useCallback(() => {
    send({ type: "command", action: "reset_error" })
    pushLocalLog("tx", "Hata sıfırlama komutu gönderildi")
  }, [send, pushLocalLog])

  const startMission = useCallback(() => {
    send({ type: "command", action: "start_mission" })
    pushLocalLog("tx", "Görev başlat komutu gönderildi")
  }, [send, pushLocalLog])

  const dispatchTask = useCallback(
    (id: string) => {
      send({ type: "command", action: "dispatch_task", id })
      pushLocalLog("tx", `İş emri gönderildi: ${id}`)
    },
    [send, pushLocalLog],
  )

  // Manuel sürüş — YALNIZCA robot anahtarı "manual" konumda ise gönderilir
  // (madde 10: anahtar otomatik modda iken uzaktan kontrol yapılamaz).
  const manualDrive = useCallback(
    (dir: DriveDir) => {
      if (!manualAllowed) return
      send({ type: "command", action: "manual_drive", dir })
    },
    [manualAllowed, send],
  )

  // ── Rota tanımlama (madde 2) ──
  const addWaypoint = useCallback((p: [number, number]) => setRoute((r) => [...r, p]), [])
  const clearRoute = useCallback(() => setRoute([]), [])
  // Tanımlanan rotayı robota yükler.
  const saveRoute = useCallback(() => {
    if (route.length < 2) return
    send({ type: "route", points: route })
    pushLocalLog("tx", `Yeni rota robota yüklendi (${route.length} nokta)`)
  }, [route, send, pushLocalLog])

  return {
    // bağlantı
    url,
    setUrl,
    status,
    connect,
    disconnect,
    manualAllowed,
    // gerçek veriler
    telemetry,
    messages,
    taskQueue,
    activeTask,
    map,
    route,
    // rota tanımlama
    addWaypoint,
    clearRoute,
    saveRoute,
    // komutlar
    emergencyStop,
    resetError,
    startMission,
    dispatchTask,
    manualDrive,
  }
}

// Robottan gelen telemetriyi güvenli (eksik alanları null/varsayılan) hale getirir.
function normalizeTelemetry(d: any): RobotTelemetry {
  const num = (v: any): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
  const str = (v: any): string | null => (typeof v === "string" && v.length > 0 ? v : null)
  const validStates: RobotState[] = [
    "idle",
    "task_processing",
    "moving_empty",
    "moving_loaded",
    "waiting_plc",
    "returning",
    "error",
    "estop",
  ]
  return {
    state: validStates.includes(d?.state) ? d.state : "idle",
    manualSwitch: d?.manualSwitch === "manual" ? "manual" : "auto",
    x: num(d?.x),
    y: num(d?.y),
    heading: num(d?.heading),
    speed: num(d?.speed),
    routeProgress: num(d?.routeProgress),
    deviation: num(d?.deviation),
    obstacle: Boolean(d?.obstacle),
    obstacleDistance: num(d?.obstacleDistance),
    pickupNode: str(d?.pickupNode),
    dropoffNode: str(d?.dropoffNode),
    loaded: Boolean(d?.loaded),
    lastQr: str(d?.lastQr),
    qrOffsetX: num(d?.qrOffsetX),
    qrOffsetZ: num(d?.qrOffsetZ),
    qrAngle: num(d?.qrAngle),
    plcConnected: Boolean(d?.plcConnected),
    doorOpen: Boolean(d?.doorOpen),
    wifiRssi: num(d?.wifiRssi),
    missionSeconds: num(d?.missionSeconds),
  }
}
