# Damas_Robo — Kontrol Paneli Kurulum ve Robot Bağlantı Rehberi

Bu arayüz **simülasyon içermez**. Robot bağlanana kadar tüm alanlar `—` (boş)
görünür; robot bağlanıp veri gönderdiği anda paneller gerçek değerlerle dolar.

Tüm bağlantı mantığı `lib/robot-connection.ts` dosyasındadır. Robot firmware'iniz
aşağıdaki JSON sözleşmesine uyduğu sürece **arayüzde hiçbir kod değişikliği
gerekmez.**

---

## 1. Genel Mimari

```
┌─────────────────────────┐        WebSocket (JSON)        ┌──────────────────────────┐
│  OPERATÖR BİLGİSAYARI    │  ◀───────────────────────────▶ │  FORKLİFT OTONOM ROBOT     │
│  (bu arayüz - tarayıcı)  │                                │  (Raspberry Pi / Jetson)   │
│                          │   ── telemetry / comm / map ─▶ │  WebSocket SUNUCUSU        │
│                          │   ◀─ command / route ──        │  → ROS / PLC / motor       │
└─────────────────────────┘                                └──────────────────────────┘
```

- Tarayıcıdan robota bağlanmanın standart yolu **WebSocket**'tir.
- Robot üzerinde küçük bir **WebSocket sunucusu** çalışır:
  - Robotun anlık durumunu JSON olarak **sürekli** arayüze gönderir (telemetri).
  - Arayüzden gelen komutları (acil stop, manuel sürüş, rota, görev) alır ve
    ROS / mikrodenetleyici / PLC tarafına iletir.
- ROS kullanıyorsanız **`rosbridge_suite`** tam olarak bu işi yapar
  (`ws://<robot-ip>:9090`). İstemezseniz aşağıdaki sade JSON protokolünü kendi
  sunucunuzda da uygulayabilirsiniz.

---

## 2. Bağlanmak İçin Adım Adım

1. **Aynı ağa bağlanın.** Robot ile bu arayüzü çalıştıran bilgisayarı aynı yerel
   ağa bağlayın (şartname: "YARISMA AGI" — internet yok, MAC filtreli, 2 cihaz).
2. **Robotta WebSocket sunucusunu başlatın.** Adresini not edin:
   - Kendi sunucunuz → `ws://192.168.1.50:8765`
   - rosbridge ise → `ws://192.168.1.50:9090`
   - (`192.168.1.50` yerine robotunuzun gerçek IP'sini yazın.)
3. **Arayüzde "Ağ & Bağlantı" panelini açın**, bu adresi girip **"Bağlan"**a basın.
4. Robot, aşağıda tanımlı JSON mesajlarını göndermeye başladığında tüm paneller
   **gerçek** verilerle dolar.

> **HTTPS / karışık içerik notu:** Bu arayüz `https://` üzerinden açılırsa
> tarayıcı güvenlik gereği yalnızca `wss://` (şifreli) WebSocket'e izin verir.
> Sahada en pratik yol, arayüzü operatör bilgisayarında **yerel olarak**
> (`http://localhost`) çalıştırmaktır; o zaman `ws://` sorunsuz çalışır.

---

## 3. JSON Protokolü — ROBOT → ARAYÜZ (gelen mesajlar)

Her mesaj bir JSON nesnesidir ve `type` alanı taşır.

### 3.1 Telemetri (durum) — periyodik gönderilmeli (ör. 5–10 Hz)

```json
{
  "type": "telemetry",
  "data": {
    "state": "idle",
    "manualSwitch": "auto",
    "x": 3.42, "y": 1.18,
    "heading": 92.0,
    "speed": 0.43,
    "routeProgress": 0.37,
    "deviation": 2.4,
    "obstacle": false,
    "obstacleDistance": 3.1,
    "pickupNode": "A2",
    "dropoffNode": "B3",
    "loaded": false,
    "lastQr": "Q3",
    "qrOffsetX": 12, "qrOffsetZ": 980, "qrAngle": -1.5,
    "plcConnected": true,
    "doorOpen": false,
    "wifiRssi": -54,
    "missionSeconds": 128
  }
}
```

| Alan | Açıklama |
|------|----------|
| `state` | 8 durumdan biri (aşağıdaki tablo) |
| `manualSwitch` | Robottaki fiziksel anahtar: `"auto"` \| `"manual"` |
| `x`, `y` | Dünya koordinatı (metre) — harita ile aynı çerçeve |
| `heading` | Yön (derece) |
| `speed` | Hız (m/s) |
| `routeProgress` | Rota tamamlanma (0..1) |
| `deviation` | Rotadan sapma (cm) — şartname limiti 10 cm |
| `obstacle` / `obstacleDistance` | Önde engel var mı / mesafe (m) |
| `pickupNode` / `dropoffNode` | Aktif görevin alma / bırakma noktası |
| `loaded` | Yük forkliftte mi |
| `lastQr` | Son okunan QR kod |
| `qrOffsetX` / `qrOffsetZ` / `qrAngle` | QR'nin kameraya göre konumu |
| `plcConnected` | Fabrika otomasyon (PLC) bağlantısı |
| `doorOpen` | Kontrollü kapı durumu |
| `wifiRssi` | (Opsiyonel) WiFi sinyal gücü (dBm) |
| `missionSeconds` | Görev kronometresi (sn) |

> Eksik alan gönderebilirsiniz; arayüz o alanı `—` gösterir. Sahte değer üretmez.

#### Geçerli `state` değerleri (şartname madde 10)

| `state` | Anlamı |
|---------|--------|
| `idle` | a) Göreve hazır bekleme |
| `task_processing` | b) Görev alındı, işleniyor |
| `moving_empty` | c) Görev alındı, yüksüz hareket |
| `moving_loaded` | d) Görev alındı, yüklü hareket |
| `waiting_plc` | e) PLC komutu bekleniyor |
| `returning` | f) Görev tamamlandı, başlangıca dönüyor |
| `error` | g) Hata durumu |
| `estop` | h) Acil stop |

### 3.2 Haberleşme günlüğü (PLC/MES ile alınıp verilen mesajlar)

```json
{ "type": "comm", "dir": "tx", "text": "Q5 kapı geçiş izni isteniyor", "time": "14:02:11" }
```
- `dir`: `"tx"` (robottan gönderilen) \| `"rx"` (robota gelen).
- `time`: opsiyonel; gönderilmezse arayüz kendi saatini yazar.

### 3.3 Fabrika üretim sistemi iş emri kuyruğu

```json
{ "type": "task_queue", "tasks": [
    { "id": "WO-1042", "pickup": "A2", "dropoff": "B3",
      "priority": "normal", "payload": "Palet 5kg", "receivedAt": "14:00:03" }
]}
```
```json
{ "type": "active_task", "task": { "id": "WO-1042", "pickup": "A2", "dropoff": "B3", "priority": "normal", "payload": "Palet 5kg", "receivedAt": "14:00:03" } }
```
(`active_task` için `task` `null` da olabilir.)

### 3.4 Canlı harita (2D lazer tarayıcı çıktısı)

```json
{ "type": "map", "data": {
    "width": 400, "height": 300,
    "resolution": 0.05,
    "origin": [-2.0, -1.5],
    "image": "data:image/png;base64,...."
}}
```
- `width`/`height`: piksel, `resolution`: metre/piksel.
- `origin`: haritanın sol-alt köşesinin dünya koordinatı (metre).
- `image`: doluluk ızgarasının PNG'si (data URL). Bir kez veya güncellendikçe gönderilebilir.

### 3.5 Robotta kayıtlı rota (opsiyonel)

```json
{ "type": "route", "points": [[0.0, 0.0], [1.2, 0.3], [2.4, 1.1]] }
```
Dünya metre koordinatları.

---

## 4. JSON Protokolü — ARAYÜZ → ROBOT (giden komutlar)

```json
{ "type": "command", "action": "emergency_stop" }
{ "type": "command", "action": "reset_error" }
{ "type": "command", "action": "start_mission" }
{ "type": "command", "action": "dispatch_task", "id": "WO-1042" }
{ "type": "command", "action": "manual_drive", "dir": "up" }
{ "type": "route", "points": [[0.0, 0.0], [1.2, 0.3]] }
```

| Komut | Açıklama |
|-------|----------|
| `emergency_stop` | ACİL STOP (madde 10-h) |
| `reset_error` | Hata / e-stop sonrası sıfırla |
| `start_mission` | Kuyruğun başındaki işi başlat |
| `dispatch_task` | Belirli iş emrini gönder (`id` ile) |
| `manual_drive` | **Yalnızca** anahtar `manual` iken. `dir`: `up`, `down`, `left`, `right`, `fork_up`, `fork_down`, `stop` |
| `route` | Operatörün arayüzde tanımladığı yeni rotayı robota yükle |

> **Önemli (madde 10):** Robot anahtarı `auto` konumdayken arayüz `manual_drive`
> komutu **göndermez**. Manuel sürüş için robottaki fiziksel anahtar `manual`
> konuma alınmalıdır.

---

## 5. Robot Tarafı Örnek Sunucu (Python)

Bu, robot üzerinde (Raspberry Pi / Jetson) çalışacak minimal bir referanstır.
`websockets` kütüphanesini kullanır: `pip install websockets`

```python
import asyncio, json, websockets

connected = set()

async def send_telemetry():
    """Robot durumunu sürekli arayüze gönderir."""
    while True:
        if connected:
            data = {
                "type": "telemetry",
                "data": {
                    "state": get_robot_state(),       # kendi fonksiyonunuz
                    "manualSwitch": read_mode_switch(),# fiziksel anahtar: "auto"/"manual"
                    "x": get_x(), "y": get_y(),
                    "heading": get_heading(),
                    "speed": get_speed(),
                    "loaded": is_loaded(),
                    "lastQr": last_qr(),
                    "plcConnected": plc_ok(),
                    # ... diğer alanlar (eksik gönderebilirsiniz)
                },
            }
            msg = json.dumps(data)
            await asyncio.gather(*[ws.send(msg) for ws in connected])
        await asyncio.sleep(0.1)   # 10 Hz

async def handler(ws):
    connected.add(ws)
    try:
        async for raw in ws:
            cmd = json.loads(raw)
            if cmd.get("type") == "command":
                action = cmd.get("action")
                if action == "emergency_stop":
                    trigger_estop()                 # kendi fonksiyonunuz
                elif action == "manual_drive":
                    if read_mode_switch() == "manual":   # güvenlik: anahtar kontrolü
                        drive(cmd["dir"])
                elif action == "start_mission":
                    start_mission()
                # ... diğer komutlar
            elif cmd.get("type") == "route":
                load_route(cmd["points"])           # [[x,y], ...]
    finally:
        connected.discard(ws)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await send_telemetry()

asyncio.run(main())
```

`drive()`, `trigger_estop()`, `get_robot_state()` gibi fonksiyonları kendi ROS /
motor / PLC arabiriminize bağlamanız yeterlidir.

---

## 6. ROS Kullanıyorsanız (rosbridge)

```bash
sudo apt install ros-<distro>-rosbridge-suite
roslaunch rosbridge_server rosbridge_websocket.launch
# Arayüzde adres: ws://<robot-ip>:9090
```

rosbridge ile mesajları kendi ROS topic'lerinizden bu JSON formatına çeviren
küçük bir köprü düğümü (bridge node) yazabilir veya doğrudan rosbridge'in
`publish`/`subscribe` protokolünü kullanabilirsiniz.

---

## 7. Sık Karşılaşılan Sorunlar

| Belirti | Olası neden / çözüm |
|---------|---------------------|
| "Bağlanılıyor" takılı kalıyor | IP/port yanlış veya robot sunucusu çalışmıyor. Aynı ağda olduğunuzu doğrulayın. |
| Bağlanıyor ama veri yok | Robot `telemetry` mesajı göndermiyor. JSON `type` alanını kontrol edin. |
| `wss` zorunlu hatası | Arayüz `https` üzerinden açık. `http://localhost` üzerinde çalıştırın. |
| Manuel tuşlar pasif | Robot anahtarı `auto` konumda. `manual` konuma alın. |
| Harita görünmüyor | `map` mesajındaki `image` data URL'i / `origin` / `resolution` eksik. |
