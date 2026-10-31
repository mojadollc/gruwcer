"use client"

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* ── Mobile: full screen ── */}
      <div className="md:hidden w-full min-h-screen">
        {children}
      </div>

      {/* ── Desktop: phone frame centered on branded bg ── */}
      <div className="hidden md:flex min-h-screen bg-gradient-to-br from-[#0B5E34] via-[#16A34A] to-[#0d7a3a] items-center justify-center p-8">

        {/* Left branding */}
        <div className="flex-1 max-w-md pr-12 text-white hidden lg:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                <path d="M12 2C8 2 4 5.5 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.5-4-8-8-8z" fill="#16A34A"/>
                <circle cx="12" cy="10" r="2.5" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="font-black text-3xl tracking-tight">Gruwcer</h1>
              <p className="text-white/50 text-xs font-medium tracking-widest uppercase">Super App</p>
            </div>
          </div>
          <h2 className="text-4xl font-black leading-tight mb-4">
            Your everyday<br />super app.
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Grocery delivery, laundry pickup, home services, food, rentals & more — all in one place.
          </p>
          <div className="space-y-3">
            {[
              { icon: "🛒", label: "Grocery & Food Delivery" },
              { icon: "👕", label: "Laundry Pickup & Delivery" },
              { icon: "🔧", label: "Home Services & Rentals" },
              { icon: "🚗", label: "Vehicle Rentals" },
              { icon: "✈️", label: "Hotel & Flight Booking" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/80 text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone frame */}
        <div className="relative shrink-0">
          {/* Glow */}
          <div className="absolute inset-0 bg-[#16A34A]/30 blur-3xl rounded-full scale-110 pointer-events-none" />

          {/* Device shell */}
          <div className="relative w-[390px] h-[844px] bg-black rounded-[52px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-[6px] border-[#1a1a1a] overflow-hidden">

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-b-3xl z-[9999] flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a] border border-[#333]" />
              <div className="w-14 h-1.5 rounded-full bg-[#1a1a1a]" />
            </div>

            {/* Screen — scrollable app content */}
            <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#F4F5F7] scrollbar-hide">
              {children}
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-[9999]" />
          </div>

          {/* Side buttons */}
          <div className="absolute left-[-10px] top-28 w-1.5 h-8 bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute left-[-10px] top-40 w-1.5 h-12 bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute left-[-10px] top-56 w-1.5 h-12 bg-[#2a2a2a] rounded-l-sm" />
          <div className="absolute right-[-10px] top-36 w-1.5 h-16 bg-[#2a2a2a] rounded-r-sm" />
        </div>

        {/* Right QR / download hint */}
        <div className="flex-1 max-w-xs pl-12 hidden lg:flex flex-col items-start gap-6">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Best experience on</p>
            <p className="font-black text-lg">Mobile Phone</p>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">Open <span className="text-white font-bold">gruwcer.com</span> on your phone for the full app experience.</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 text-white w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Available on</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>📱</span> iOS — Add to Home Screen
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>🤖</span> Android — Install PWA
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
