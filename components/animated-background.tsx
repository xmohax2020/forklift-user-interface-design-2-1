/*
  ANİMASYONLU ARKA PLAN
  -------------------------------------------------------------------------
  Dashboard'un arkasında, fabrika zeminini ve otonom robotun rota üzerindeki
  hareketini temsil eden dekoratif bir katman çizer.

  FAYDASI: Arayüze "canlı / çalışıyor" hissi verir ve sahnenin (fabrika içi
  lojistik) bağlamını görsel olarak destekler. Tamamen pointer-events-none
  olduğu için arayüz etkileşimini engellemez ve sadece CSS transform kullandığı
  için performansı düşürmez.

  FARE IŞIĞI: Fare hareket ettikçe imlecin altında küçük beyaz bir ışık
  (radial glow) belirir. Konum CSS değişkenleri (--mx/--my) ile güncellenir,
  böylece React yeniden render olmadan akıcı çalışır.
*/
"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const handleMove = (e: MouseEvent) => {
      // requestAnimationFrame ile throttle ederek performansı korur.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = glowRef.current
        if (!el) return
        el.style.setProperty("--mx", `${e.clientX}px`)
        el.style.setProperty("--my", `${e.clientY}px`)
        el.style.opacity = "1"
      })
    }
    const handleLeave = () => {
      if (glowRef.current) glowRef.current.style.opacity = "0"
    }
    window.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseleave", handleLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Fareyi takip eden küçük beyaz ışık */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(120px 120px at var(--mx, 50%) var(--my, 50%), color-mix(in oklch, white 22%, transparent), transparent 70%)",
        }}
      />
      {/* Kayan fabrika zemini ızgarası — konveyör / hareket hissi verir */}
      <div
        className="bg-grid-pan absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--foreground) 25%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 25%, transparent) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* LIDAR / lazer tarayıcı süpürme çizgisi (haritalama çağrışımı) */}
      <div className="absolute inset-x-0 top-0 h-full">
        <div
          className="animate-scan-sweep absolute inset-x-0 h-32"
          style={{
            background:
              "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--accent) 40%, transparent), transparent)",
          }}
        />
      </div>

      {/* Robotun rota üzerinde dolaştığı yol — SVG path + offset-path animasyonu */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <path
            id="robot-route"
            d="M 150 650 L 150 250 L 500 250 L 500 500 L 900 500 L 900 150 L 1080 150"
            fill="none"
          />
        </defs>

        {/* Rota çizgisi (kesikli) */}
        <use
          href="#robot-route"
          stroke="color-mix(in oklch, var(--primary) 45%, transparent)"
          strokeWidth={3}
          strokeDasharray="14 12"
          fill="none"
        />

        {/* Rota üzerindeki düğüm/istasyon noktaları */}
        {[
          [150, 650],
          [150, 250],
          [500, 250],
          [500, 500],
          [900, 500],
          [900, 150],
          [1080, 150],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={7}
            fill="color-mix(in oklch, var(--accent) 60%, transparent)"
          />
        ))}

        {/* Rota boyunca ilerleyen robot (offset-path ile yol takibi) */}
        <g
          style={{
            offsetPath: "path('M 150 650 L 150 250 L 500 250 L 500 500 L 900 500 L 900 150 L 1080 150')",
            animation: "route-travel 14s linear infinite",
          }}
        >
          <rect
            x={-16}
            y={-12}
            width={32}
            height={24}
            rx={4}
            fill="var(--primary)"
            opacity={0.85}
          />
          <rect x={10} y={-4} width={14} height={8} rx={1} fill="var(--primary)" opacity={0.85} />
        </g>
      </svg>

      {/* Üstte hafif bir koyulaştırma — içeriğin okunaklı kalması için */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}
