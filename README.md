# forklift-user-interface-design-2-1

hi legend of the galactic heroes

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

_______________________________________


Robotunuzu nasıl bağlayacağınız **`lib/robot-connection.ts`** dosyasının en başındaki büyük yorum bloğunda (1–103. satırlar) adım adım yazılı. Özetle orada şunlar var:

**1. Bağlantı yöntemi (satır 22–34) — "ADIM ADIM"**

- Robot ile arayüzü çalıştıran bilgisayarı **aynı yerel ağa** bağlayın ("YARISMA AGI", internetsiz).
- Robot üzerinde bir **WebSocket sunucusu** başlatın, adresini not edin:

- Kendi sunucunuz → `ws://192.168.1.50:8765`
- ROS kullanıyorsanız `rosbridge_suite` → `ws://192.168.1.50:9090`



- Arayüzdeki **"Ağ & Bağlantı"** panelinden bu adresi girip **"Bağlan"**a basın.
- Robot JSON mesajı göndermeye başlayınca tüm paneller gerçek veriyle dolar.


**2. JSON protokolü — Robot → Arayüz (satır 36–88):** robotun göndereceği mesajlar tanımlı: `telemetry` (8 durum, konum, hız, QR, PLC, yük), `comm` (PLC/MES mesaj günlüğü), `task_queue` / `active_task` (iş emirleri), `map` (2D lazer haritası), `route`.

**3. JSON protokolü — Arayüz → Robot (satır 90–99):** arayüzün göndereceği komutlar: `emergency_stop`, `reset_error`, `start_mission`, `dispatch_task`, `manual_drive` (yalnızca anahtar "manual" iken), `route`.


_____________________________________________________________

KURULUM.MD içerinde bağlama yontemi ve lib/robot-connection.ts içirisinde
