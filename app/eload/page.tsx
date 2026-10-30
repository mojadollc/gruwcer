"use client"

import { useEffect, useState } from "react"
import { getUser, getToken } from "@/lib/auth"

const PAYMONGO_FEE = 10
const GRUWCER_FEE = 3
const SERVICE_FEE = PAYMONGO_FEE + GRUWCER_FEE // ₱13

const NETWORK_COLORS: Record<string, string> = {
  SMART: "#00B900", GLOBE: "#007DFE", TNT: "#F59E0B", DITO: "#06B6D4",
  TM: "#6366F1", GOMO: "#14B8A6", SUN: "#F97316", "GOMO PH": "#14B8A6",
  "GAME CLUB": "#8B5CF6", CIGNAL: "#0EA5E9", "CIGNAL TV": "#0EA5E9",
  SKY: "#0284C7", VIVAMAX: "#E11D48",
}

const NETWORK_LOGOS: Record<string, string> = {
  SMART: "/networks/smart.png", GLOBE: "/networks/globe.png",
  TNT: "/networks/tnt.png", DITO: "/networks/Dito.png",
  TM: "/networks/tm.png", GOMO: "/networks/gomo.png",
  SUN: "/networks/sun.png", "GAME CLUB": "/networks/gameclub.png",
  CIGNAL: "/networks/Cignal.png",
}

const MOBILE_NETWORKS = ["GLOBE", "TM", "SMART", "TNT", "DITO", "GOMO", "GOMO PH", "SUN"]
const GAME_NETWORKS = ["GAME CLUB", "RAZER GOLD", "ROBLOX", "RIOT", "STEAM", "GARENA", "MOBILE LEGENDS", "MLBB"]
const CABLE_NETWORKS = ["CIGNAL", "CIGNAL TV", "SKY", "SKY CABLE", "VIVAMAX", "VIVA ONE", "VIU"]

type Step = "browse" | "phone" | "confirm" | "paying"
type Product = { promoId: number; name: string; network: string; category: string; amount: number; description: string; validity: string; addressMin: number; addressMax: number; addressType: string }

export default function ELoadPage() {
  const [step, setStep] = useState<Step>("browse")
  const [products, setProducts] = useState<Product[]>([])
  const [networks, setNetworks] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState("mobile")
  const [selectedNetwork, setSelectedNetwork] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const u = getUser()
    if (u) {
      setUser(u)
      fetch("/api/users/me", { headers: { Authorization: `Bearer ${getToken()}` } })
        .then(r => r.ok ? r.json() : null).then(p => { if (p) setProfile(p) })
    }
    fetch("/api/eload")
      .then(r => r.json())
      .then(data => {
        const prods: Product[] = data.products || []
        setProducts(prods)
        const nets = [...new Set(prods.map(p => p.network))] as string[]
        setNetworks(nets)
        const mobile = nets.filter(n => MOBILE_NETWORKS.some(m => n.toUpperCase().includes(m)))
        setSelectedNetwork(mobile[0] || nets[0] || "")
      })
      .finally(() => setLoading(false))
  }, [])

  const mobileNets = networks.filter(n => MOBILE_NETWORKS.some(m => n.toUpperCase().includes(m)))
  const gameNets = networks.filter(n => GAME_NETWORKS.some(g => n.toUpperCase().includes(g)))
  const cableNets = networks.filter(n => CABLE_NETWORKS.some(c => n.toUpperCase().includes(c)))
  const otherNets = networks.filter(n => !mobileNets.includes(n) && !gameNets.includes(n) && !cableNets.includes(n))

  const typeNetworks = selectedType === "mobile" ? mobileNets : selectedType === "games" ? gameNets : selectedType === "cable" ? cableNets : otherNets
  const availableTypes = [
    { id: "mobile", label: "Mobile", emoji: "📱", nets: mobileNets },
    { id: "games", label: "Games", emoji: "🎮", nets: gameNets },
    { id: "cable", label: "Cable/TV", emoji: "📺", nets: cableNets },
    ...(otherNets.length > 0 ? [{ id: "others", label: "Others", emoji: "🔌", nets: otherNets }] : []),
  ].filter(t => t.nets.length > 0)

  const filtered = products
    .filter(p => p.network === selectedNetwork)
    .filter(p => filter === "all" || p.category === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.amount).includes(search))

  const categories = [...new Set(products.filter(p => p.network === selectedNetwork).map(p => p.category).filter(Boolean))]
  const netColor = NETWORK_COLORS[selectedNetwork] || "#16A34A"
  const productColor = selectedProduct ? (NETWORK_COLORS[selectedProduct.network] || "#16A34A") : "#16A34A"

  const handleCheckout = async () => {
    if (!selectedProduct) return
    setPaying(true)
    setStep("paying")
    try {
      const res = await fetch("/api/eload-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.id || null,
          customerName: profile?.name || user?.name || "",
          customerPhone: profile?.phone || "",
          phone,
          promoId: selectedProduct.promoId,
          network: selectedProduct.network,
          productName: selectedProduct.name,
          amount: selectedProduct.amount,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error || "Failed to create payment. Please try again.")
        setStep("confirm")
      }
    } catch {
      alert("Network error. Please try again.")
      setStep("confirm")
    } finally {
      setPaying(false)
    }
  }

  // ── BROWSE ──
  if (step === "browse") return (
    <main className="min-h-screen bg-[#F4F5F7] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30">
        <div className="bg-[#16A34A] px-4 pt-3 pb-5">
          <div className="flex items-center justify-between mb-4">
            <a href="/" className="flex items-center gap-1 text-white/80 text-sm font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              Back
            </a>
            <p className="font-black text-white text-base">E-Load</p>
            <div className="w-14" />
          </div>
          {/* Hero card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Buy E-Load</p>
            <p className="text-white font-black text-lg mt-0.5">Mobile, Games & Cable</p>
            <p className="text-white/60 text-xs mt-0.5">Pay via PayMongo · ₱{SERVICE_FEE} service fee</p>
          </div>
        </div>

        {/* Type tabs */}
        <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {availableTypes.map(t => (
            <button key={t.id} onClick={() => { setSelectedType(t.id); setSelectedNetwork(t.nets[0] || ""); setFilter("all") }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${selectedType === t.id ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Network chips */}
        <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-10 w-20 rounded-xl bg-gray-100 animate-pulse shrink-0" />) :
            typeNetworks.map(net => {
              const color = NETWORK_COLORS[net] || "#16A34A"
              const logo = NETWORK_LOGOS[net]
              const active = selectedNetwork === net
              return (
                <button key={net} onClick={() => { setSelectedNetwork(net); setFilter("all") }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${active ? "border-transparent text-white shadow-md" : "border-gray-100 bg-white text-gray-700"}`}
                  style={active ? { backgroundColor: color } : {}}>
                  {logo && <img src={logo} alt={net} className={`w-5 h-5 object-contain ${active ? "brightness-0 invert" : ""}`} />}
                  {net}
                </button>
              )
            })
          }
        </div>
      </div>

      <div className="px-4 mt-3">
        {/* Search */}
        <input type="text" placeholder={`Search ${selectedNetwork} promos...`} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-10 px-4 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:border-[#16A34A] mb-3" />

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {["all", ...categories].map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === c ? "text-white" : "bg-gray-100 text-gray-500"}`}
                style={filter === c ? { backgroundColor: netColor } : {}}>
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="space-y-3 mt-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center mt-2">
            <p className="text-gray-400 text-sm">No products available</p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-2">
            {filtered.map(p => (
              <button key={p.promoId} onClick={() => { setSelectedProduct(p); setPhone(""); setStep("phone") }}
                className="w-full bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all text-left flex items-center gap-3">
                <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: (NETWORK_COLORS[p.network] || "#16A34A") + "18" }}>
                  {NETWORK_LOGOS[p.network]
                    ? <img src={NETWORK_LOGOS[p.network]} alt={p.network} className="w-9 h-9 object-contain" />
                    : <span className="text-sm font-black" style={{ color: NETWORK_COLORS[p.network] || "#16A34A" }}>₱{p.amount}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                  {p.validity && <span className="inline-block mt-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: NETWORK_COLORS[p.network] || "#16A34A" }}>{p.validity}</span>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-black text-base" style={{ color: NETWORK_COLORS[p.network] || "#16A34A" }}>₱{p.amount}</p>
                  <svg className="w-4 h-4 text-gray-300 ml-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )

  // ── PHONE INPUT ──
  if (step === "phone") {
    const maxLen = selectedProduct?.addressMax || 11
    const minLen = selectedProduct?.addressMin || 10
    return (
      <main className="min-h-screen bg-[#F4F5F7] flex flex-col">
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep("browse")} className="p-1.5 rounded-xl hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <p className="font-bold text-gray-800">Enter Mobile Number</p>
        </div>

        <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
          {/* Product summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{selectedProduct?.network}</p>
              <p className="font-bold text-gray-800 text-sm">{selectedProduct?.name}</p>
              {selectedProduct?.validity && <p className="text-[10px] text-gray-400">{selectedProduct.validity}</p>}
            </div>
            <p className="text-xl font-black" style={{ color: productColor }}>₱{selectedProduct?.amount}</p>
          </div>

          {/* Phone display */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <input type="tel" inputMode="numeric" maxLength={maxLen} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, maxLen))}
              placeholder="09XX XXX XXXX"
              className="w-full text-3xl font-extrabold text-gray-800 tracking-widest text-center px-4 py-5 bg-transparent focus:outline-none placeholder:text-gray-300" />
            {phone.length > 0 && <p className="text-xs text-gray-400 text-center pb-3">{phone.length} / {maxLen} digits</p>}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map(key => (
              <button key={key} onClick={() => {
                if (key === "C") { setPhone(""); return }
                if (key === "⌫") { setPhone(p => p.slice(0, -1)); return }
                if (phone.length >= maxLen) return
                setPhone(p => p + key)
              }}
                className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-95 ${key === "C" ? "bg-red-50 text-red-500 border border-red-100" : key === "⌫" ? "bg-gray-100 text-gray-600" : "bg-white border border-gray-100 shadow-sm text-gray-800"}`}>
                {key === "⌫" ? "←" : key}
              </button>
            ))}
          </div>

          <button onClick={() => setStep("confirm")} disabled={phone.length < minLen}
            className="w-full py-4 rounded-2xl text-white font-black text-base disabled:opacity-40 shadow-lg transition-all active:scale-[0.98]"
            style={{ backgroundColor: phone.length >= minLen ? productColor : "#9ca3af" }}>
            Next →
          </button>
        </div>
      </main>
    )
  }

  // ── CONFIRM ──
  if (step === "confirm") return (
    <main className="min-h-screen bg-[#F4F5F7] flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setStep("phone")} className="p-1.5 rounded-xl hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="font-bold text-gray-800">Review & Pay</p>
      </div>

      <div className="flex-1 px-4 pt-4 pb-6 space-y-4">
        {/* Amount hero */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="py-6 text-center text-white" style={{ backgroundColor: productColor }}>
            <p className="text-sm opacity-80 mb-1">{selectedProduct?.network} · {selectedProduct?.name}</p>
            <p className="text-5xl font-black">₱{selectedProduct?.amount}</p>
            {selectedProduct?.validity && <p className="text-xs opacity-70 mt-1">{selectedProduct.validity}</p>}
          </div>
          <div className="bg-white p-4 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Mobile Number</span><span className="font-black text-gray-800 tracking-widest">{phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Network</span><span className="font-bold text-gray-800">{selectedProduct?.network}</span></div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Load Amount</span><span className="font-bold">₱{selectedProduct?.amount.toFixed(2)}</span></div>
              <div className="flex justify-between">
                <div>
                  <span className="text-sm text-gray-500">Service Fee</span>
                  <p className="text-[10px] text-gray-400">PayMongo ₱{PAYMONGO_FEE} + Gruwcer ₱{GRUWCER_FEE}</p>
                </div>
                <span className="font-bold text-orange-500">+₱{SERVICE_FEE}.00</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-sm font-bold text-gray-800">Total to Pay</span>
                <span className="font-black text-lg" style={{ color: productColor }}>₱{((selectedProduct?.amount || 0) + SERVICE_FEE).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
          ⚠️ Double-check the mobile number. Load cannot be reversed once sent.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStep("phone")} className="py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm">✏️ Edit Number</button>
          <button onClick={() => { setStep("browse"); setSelectedProduct(null) }} className="py-3.5 rounded-2xl bg-red-50 text-red-500 font-bold text-sm border border-red-100">Cancel</button>
        </div>

        <button onClick={handleCheckout} disabled={paying}
          className="w-full py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: productColor }}>
          {paying
            ? <><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Creating payment...</>
            : <>💳 Pay ₱{((selectedProduct?.amount || 0) + SERVICE_FEE).toFixed(2)} via PayMongo</>}
        </button>

        {!user && (
          <p className="text-center text-xs text-gray-400">
            <a href="/auth?redirect=/eload" className="text-[#16A34A] font-bold">Sign in</a> to track your e-load history
          </p>
        )}
      </div>
    </main>
  )

  // ── PAYING ──
  return (
    <main className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center text-center px-6 space-y-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: productColor }}>
        <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
      </div>
      <p className="font-black text-xl text-gray-800">Redirecting to PayMongo...</p>
      <p className="text-gray-400 text-sm">Please wait, do not close this screen.</p>
    </main>
  )
}
