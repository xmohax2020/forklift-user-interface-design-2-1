/*
  ANİMASYONLU ARKA PLAN
  -------------------------------------------------------------------------
  Dashboard'un arkasında, fabrika zeminini ve otonom robotun rota üzerindeki
  hareketini temsil eden dekoratif bir katman çizer.

  FAYDASI: Arayüze "canlı / çalışıyor" hissi verir ve sahnenin (fabrika içi
  lojistik) bağlamını görsel olarak destekler. Tamamen pointer-events-none
  olduğu için arayüz etkileşimini engellemez ve sadece CSS transform kullandığı
  için performansı düşürmez.
*/
export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
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
