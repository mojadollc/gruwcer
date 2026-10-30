"use client"

import { useEffect, useState } from "react"
import { getUser, getToken } from "@/lib/auth"

const PAYMONGO_FEE = 10
const GRUWCER_FEE = 3
const SERVICE_FEE = PAYMONGO_FEE + GRUWCER_FEE

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
  const [error, setError] = useState("")
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
        if (data.error) { setError(data.error); return }
        const prods: Product[] = data.products || []
        setProducts(prods)
        const nets = [...new Set(prods.map(p => p.network))] as string[]
        setNetworks(nets)
        const mobile = nets.filter(n => MOBILE_NETWORKS.some(m => n.toUpperCase().includes(m)))
        setSelectedNetwork(mobile[0] || nets[0] || "")
      })
      .catch(e => setError(e.message))
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

  // Right panel content (confirm / phone) — shown in sidebar on desktop
  const RightPanel = () => {
    if (step === "paying") return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4 py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: productColor }}>
          <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
        </div>
        <p className="font-black text-xl text-gray-800">Redirecting to PayMongo...</p>
        <p className="text-gray-400 text-sm">Please wait, do not close this screen.</p>
      </div>
    )

    if (step === "phone" && selectedProduct) {
      const maxLen = selectedProduct.addressMax || 11
      const minLen = selectedProduct.addressMin || 10
      return (
        <div className="p-6 space-y-4">
          <div>
            <h2 className="font-bold text-gray-800 text-base mb-1">Enter Mobile Number</h2>
            <p className="text-xs text-gray-400">Number to receive the load</p>
          </div>
          {/* Product summary */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400">{selectedProduct.network}</p>
              <p className="font-bold text-gray-800 text-sm">{selectedProduct.name}</p>
              {selectedProduct.validity && <p className="text-[10px] text-gray-400">{selectedProduct.validity}</p>}
            </div>
            <p className="text-xl font-black" style={{ color: productColor }}>₱{selectedProduct.amount}</p>
          </div>
          {/* Phone input */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <input type="tel" inputMode="numeric" maxLength={maxLen} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, maxLen))}
              placeholder="09XX XXX XXXX"
              className="w-full text-2xl font-extrabold text-gray-800 tracking-widest text-center px-4 py-4 bg-transparent focus:outline-none placeholder:text-gray-300" />
            {phone.length > 0 && <p className="text-xs text-gray-400 text-center pb-2">{phone.length} / {maxLen} digits</p>}
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
                className={`h-12 rounded-xl text-lg font-bold transition-all active:scale-95 ${key === "C" ? "bg-red-50 text-red-500 border border-red-100" : key === "⌫" ? "bg-gray-100 text-gray-600" : "bg-white border border-gray-100 shadow-sm text-gray-800"}`}>
                {key === "⌫" ? "←" : key}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setStep("browse"); setSelectedProduct(null) }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">← Back</button>
            <button onClick={() => setStep("confirm")} disabled={phone.length < minLen}
              className="flex-1 py-3 rounded-xl text-white font-black text-sm disabled:opacity-40 shadow-md transition-all"
              style={{ backgroundColor: phone.length >= minLen ? productColor : "#9ca3af" }}>
              Next →
            </button>
          </div>
        </div>
      )
    }

    if (step === "confirm" && selectedProduct) return (
      <div className="p-6 space-y-4">
        <div>
          <h2 className="font-bold text-gray-800 text-base mb-1">Review & Pay</h2>
          <p className="text-xs text-gray-400">Double-check before paying</p>
        </div>
        {/* Amount hero */}
        <div className="rounded-xl overflow-hidden shadow-sm">
          <div className="py-5 text-center text-white" style={{ backgroundColor: productColor }}>
            <p className="text-sm opacity-80 mb-1">{selectedProduct.network} · {selectedProduct.name}</p>
            <p className="text-4xl font-black">₱{selectedProduct.amount}</p>
            {selectedProduct.validity && <p className="text-xs opacity-70 mt-1">{selectedProduct.validity}</p>}
          </div>
          <div className="bg-white p-4 space-y-2.5">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Mobile Number</span><span className="font-black text-gray-800 tracking-widest">{phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Network</span><span className="font-bold text-gray-800">{selectedProduct.network}</span></div>
            <div className="border-t border-gray-100 pt-2.5 space-y-1.5">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Load Amount</span><span className="font-bold">₱{selectedProduct.amount.toFixed(2)}</span></div>
              <div className="flex justify-between">
                <div>
                  <span className="text-sm text-gray-500">Service Fee</span>
                  <p className="text-[10px] text-gray-400">PayMongo ₱{PAYMONGO_FEE} + Gruwcer ₱{GRUWCER_FEE}</p>
                </div>
                <span className="font-bold text-orange-500">+₱{SERVICE_FEE}.00</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-sm font-bold text-gray-800">Total to Pay</span>
                <span className="font-black text-lg" style={{ color: productColor }}>₱{(selectedProduct.amount + SERVICE_FEE).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 text-center">
          ⚠️ Double-check the mobile number. Load cannot be reversed once sent.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setStep("phone")} className="py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">✏️ Edit Number</button>
          <button onClick={() => { setStep("browse"); setSelectedProduct(null) }} className="py-3 rounded-xl bg-red-50 text-red-500 font-bold text-sm border border-red-100">Cancel</button>
        </div>
        <button onClick={handleCheckout} disabled={paying}
          className="w-full py-4 rounded-xl text-white font-black text-sm shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: productColor }}>
          {paying
            ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Creating payment...</>
            : <>💳 Pay ₱{(selectedProduct.amount + SERVICE_FEE).toFixed(2)} via PayMongo</>}
        </button>
        {!user && <p className="text-center text-xs text-gray-400"><a href="/auth?redirect=/eload" className="text-[#16A34A] font-bold">Sign in</a> to track your e-load history</p>}
      </div>
    )

    // Default: empty state prompt
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 space-y-3">
        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 6v4m0 0l-2-2m2 2l2-2"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
        </div>
        <p className="font-bold text-gray-600">Select a product</p>
        <p className="text-xs text-gray-400">Choose a network and promo from the left to get started</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      {/* ── HEADER ── */}
      <div className="bg-[#16A34A] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-white font-bold text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </a>
          <p className="font-black text-white text-base">⚡ E-Load</p>
          <div className="text-right hidden md:block">
            <p className="text-white/60 text-[10px]">Service fee: ₱{SERVICE_FEE}</p>
          </div>
          <div className="md:hidden w-16" />
        </div>
      </div>

      {/* ── DESKTOP: two-column | MOBILE: single column ── */}
      <div className="max-w-7xl mx-auto md:flex md:gap-0 md:h-[calc(100vh-56px)]">

        {/* LEFT: Browse panel */}
        <div className={`md:flex-1 md:overflow-y-auto md:border-r md:border-gray-200 ${step !== "browse" ? "hidden md:block" : ""}`}>
          {/* Type tabs */}
          <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide sticky top-0 z-10">
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-8 w-20 rounded-full bg-gray-100 animate-pulse shrink-0" />) :
              availableTypes.map(t => (
                <button key={t.id} onClick={() => { setSelectedType(t.id); setSelectedNetwork(t.nets[0] || ""); setFilter("all") }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${selectedType === t.id ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))
            }
          </div>

          {/* Network chips */}
          <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide sticky top-[49px] z-10">
            {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-10 w-20 rounded-xl bg-gray-100 animate-pulse shrink-0" />) :
              typeNetworks.map(net => {
                const color = NETWORK_COLORS[net] || "#16A34A"
                const logo = NETWORK_LOGOS[net]
                const active = selectedNetwork === net
                return (
                  <button key={net} onClick={() => { setSelectedNetwork(net); setFilter("all"); setSearch("") }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${active ? "border-transparent text-white shadow-md" : "border-gray-100 bg-white text-gray-700"}`}
                    style={active ? { backgroundColor: color } : {}}>
                    {logo && <img src={logo} alt={net} className={`w-5 h-5 object-contain ${active ? "brightness-0 invert" : ""}`} />}
                    {net}
                  </button>
                )
              })
            }
          </div>

          <div className="p-4">
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

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center my-4">
                <p className="text-red-600 text-sm font-bold">Failed to load products</p>
                <p className="text-red-400 text-xs mt-1">{error}</p>
                <button onClick={() => { setError(""); setLoading(true); fetch("/api/eload").then(r => r.json()).then(d => { setProducts(d.products || []); setNetworks([...new Set((d.products || []).map((p: any) => p.network))] as string[]) }).finally(() => setLoading(false)) }} className="mt-3 text-xs bg-red-500 text-white px-4 py-1.5 rounded-lg font-bold">Retry</button>
              </div>
            )}

            {/* Products */}
            {loading ? (
              <div className="space-y-3 mt-2">
                {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 && !error ? (
              <div className="bg-white rounded-2xl p-10 text-center mt-2">
                <p className="text-gray-400 text-sm">No products available for {selectedNetwork}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2">
                {filtered.map(p => (
                  <button key={p.promoId}
                    onClick={() => { setSelectedProduct(p); setPhone(""); setStep("phone") }}
                    className={`w-full bg-white rounded-2xl px-4 py-3.5 border-2 shadow-sm active:scale-[0.98] transition-all text-left flex items-center gap-3 ${selectedProduct?.promoId === p.promoId ? "border-opacity-100" : "border-gray-100 hover:border-gray-200"}`}
                    style={selectedProduct?.promoId === p.promoId ? { borderColor: NETWORK_COLORS[p.network] || "#16A34A" } : {}}>
                    <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: (NETWORK_COLORS[p.network] || "#16A34A") + "18" }}>
                      {NETWORK_LOGOS[p.network]
                        ? <img src={NETWORK_LOGOS[p.network]} alt={p.network} className="w-8 h-8 object-contain" />
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
        </div>

        {/* RIGHT: Step panel — always visible on desktop, replaces left on mobile */}
        <div className={`md:w-[400px] md:overflow-y-auto bg-white md:shadow-none ${step === "browse" ? "hidden md:block" : "block"}`}>
          <RightPanel />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 py-1.5">
          <a href="/" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px]">Home</span>
          </a>
          <a href="/grocery" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px]">Grocery</span>
          </a>
          <a href="/eload" className="flex flex-col items-center gap-0.5 py-1 text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 6v4m0 0l-2-2m2 2l2-2"/></svg>
            <span className="text-[10px] font-bold">E-Load</span>
          </a>
          <a href="/account" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">Account</span>
          </a>
        </div>
      </nav>
    </main>
  )
}
