"use client"

import { useEffect, useState } from "react"
import { getUser, getToken } from "@/lib/auth"


const SERVICES = [
  { id: "grocery", name: "Grocery", icon: "https://img.icons8.com/3d-fluency/94/shopping-cart.png", href: "/grocery", color: "bg-green-50", available: true },
  { id: "laundry", name: "Laundry", icon: "https://img.icons8.com/3d-fluency/94/washing-machine.png", href: "/laundry", color: "bg-blue-50", available: true },
  { id: "services", name: "Services", icon: "https://img.icons8.com/3d-fluency/94/maintenance.png", href: "/home-services", color: "bg-teal-50", available: true },
  { id: "travel", name: "Hotel & Flights", icon: "https://img.icons8.com/3d-fluency/94/airplane-mode-on.png", href: "/travel", color: "bg-sky-50", available: true },
  { id: "healthcare", name: "Clinics", icon: "https://img.icons8.com/3d-fluency/94/hospital.png", href: "#", color: "bg-yellow-50", available: false },
  { id: "food", name: "Food To Go", icon: "https://img.icons8.com/3d-fluency/94/hamburger.png", href: "#", color: "bg-orange-50", available: false },
  { id: "errand", name: "Errands", icon: "https://img.icons8.com/3d-fluency/94/box.png", href: "#", color: "bg-purple-50", available: false },
  { id: "bills", name: "Bills", icon: "https://img.icons8.com/3d-fluency/94/bill.png", href: "#", color: "bg-lime-50", available: false },
  { id: "more", name: "More", icon: "https://img.icons8.com/3d-fluency/94/menu.png", href: "#", color: "bg-gray-50", available: false },
]

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [banners, setBanners] = useState<{ id: string; title: string; subtitle: string; imageUrl: string; bgColor: string; link: string }[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const [partners, setPartners] = useState<any[]>([])
  const [promos, setPromos] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [address, setAddress] = useState("")
  const [detecting, setDetecting] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [addingNew, setAddingNew] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: "Home", address: "", lat: 0, lng: 0 })
  const [savingAddr, setSavingAddr] = useState(false)
  const [locatingNew, setLocatingNew] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeOrders, setActiveOrders] = useState<{ id: string; type: "grocery" | "laundry" | "service"; status: string; name: string; total: number; createdAt: any }[]>([])
  const [showOrderTracker, setShowOrderTracker] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => setMounted(true), [])

  // PWA/TWA Install Prompt
  useEffect(() => {
    const dismissed = sessionStorage.getItem("install-dismissed")
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone
    setIsStandalone(!!standalone)
    if (standalone || dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowInstall(true), 2000) // Show after 2s
    }
    window.addEventListener("beforeinstallprompt", handler)

    // iOS: show custom prompt after 3s
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS && !standalone) {
      setTimeout(() => setShowInstall(true), 3000)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("user_location")
    if (saved) setAddress(JSON.parse(saved).address)
    else detectLocation()
  }, [])

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const data = await res.json()
          const addr = data.address?.road ? `${data.address.road}, ${data.address.city || data.address.town || ""}` : data.display_name?.split(",").slice(0, 2).join(",") || ""
          setAddress(addr)
          localStorage.setItem("user_location", JSON.stringify({ address: addr, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        } catch { setAddress("Location detected") }
        setDetecting(false)
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    const u = getUser()
    if (!u) return
    setUser(u)
    fetch("/api/users/me", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (p) { setProfile(p); if (p.savedAddresses) setSavedAddresses(p.savedAddresses) } })
    fetch(`/api/notifications?recipientType=customer&recipientId=${u.id}`)
      .then(r => r.ok ? r.json() : []).then(setNotifications)
  }, [])

  // Poll active orders every 10s
  useEffect(() => {
    if (!user) { setActiveOrders([]); return }
    const activeStatuses = ["pending", "confirmed", "preparing", "ready_for_pickup", "rider_accepted", "rider_at_store", "rider_picked_up", "out_for_delivery"]
    const laundryActiveStatuses = ["pending", "accepted", "rider_to_customer", "rider_picked_up", "rider_to_laundromat", "at_laundromat", "washing", "ready", "rider_return_pickup", "rider_returning"]
    const poll = async () => {
      const [gr, la] = await Promise.all([
        fetch(`/api/orders?customerId=${user.id}`).then(r => r.ok ? r.json() : []),
        fetch(`/api/laundry-orders?customerId=${user.id}`).then(r => r.ok ? r.json() : []),
      ])
      const grocery = gr.filter((o: any) => activeStatuses.includes(o.status))
        .map((o: any) => ({ id: o.id, type: "grocery" as const, status: o.status, name: `${o.items?.length || 0} items`, total: o.total || 0, createdAt: o.createdAt }))
      const laundry = la.filter((o: any) => laundryActiveStatuses.includes(o.status))
        .map((o: any) => ({ id: o.id, type: "laundry" as const, status: o.status, name: o.serviceName || "Laundry", total: o.totalPrice || 0, createdAt: o.createdAt }))
      setActiveOrders([...grocery, ...laundry])
    }
    poll()
    const iv = setInterval(poll, 10000)
    return () => clearInterval(iv)
  }, [user])

  useEffect(() => {
    fetch("/api/hero").then(r => r.ok ? r.json() : []).then((data: any[]) => {
      setBanners(data.length > 0 ? data.map((s: any) => ({ id: s.id, title: s.title || "", subtitle: s.description || s.subtitle || "", imageUrl: s.imageUrl || "", bgColor: s.bgColor || "#16A34A", link: s.link || "/grocery" })) : [
        { id: "1", title: "Free Delivery", subtitle: "On orders ₱1,000+", imageUrl: "", bgColor: "#16A34A", link: "/grocery" },
        { id: "2", title: "Laundry Pickup", subtitle: "We'll handle the rest", imageUrl: "", bgColor: "#1a56db", link: "/laundry" },
        { id: "3", title: "Home Services", subtitle: "Aircon, plumbing & more", imageUrl: "", bgColor: "#0d9488", link: "/services" },
      ])
    }).catch(() => {})
    fetch("/api/promos").then(r => r.ok ? r.json() : []).then(setPromos).catch(() => {})
    fetch("/api/users?role=partner").then(r => r.ok ? r.json() : []).then((p: any[]) => setPartners(p.filter(x => x.status === "active"))).catch(() => {})
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setCurrentBanner((c) => (c + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners.length])

  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    if (!user) return
    fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAllRead", recipientType: "customer", recipientId: user.id }) })
      .then(() => setNotifications(n => n.map(x => ({ ...x, read: true }))))
  }

  const selectAddress = (addr: any) => {
    setAddress(addr.address)
    localStorage.setItem("user_location", JSON.stringify({ address: addr.address, lat: addr.lat, lng: addr.lng }))
    setShowAddressModal(false)
  }

  const detectForNew = () => {
    if (!navigator.geolocation) return
    setLocatingNew(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          const data = await res.json()
          const addr = data.display_name?.split(",").slice(0, 3).join(",") || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
          setNewAddr((p) => ({ ...p, address: addr, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        } catch {}
        setLocatingNew(false)
      },
      () => setLocatingNew(false),
      { enableHighAccuracy: true }
    )
  }

  const saveNewAddress = async () => {
    if (!newAddr.address.trim()) return
    setSavingAddr(true)
    const entry = { id: Date.now().toString(), label: newAddr.label, address: newAddr.address, lat: newAddr.lat, lng: newAddr.lng }
    const updated = [...savedAddresses, entry]
    setSavedAddresses(updated)
    if (user) await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ savedAddresses: updated }) })
    selectAddress(entry)
    setAddingNew(false)
    setNewAddr({ label: "Home", address: "", lat: 0, lng: 0 })
    setSavingAddr(false)
  }

  const deleteAddress = async (id: string) => {
    const updated = savedAddresses.filter((a: any) => a.id !== id)
    setSavedAddresses(updated)
    if (user) await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ savedAddresses: updated }) })
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7]" suppressHydrationWarning>
      {/* ═══ DESKTOP HEADER ═══ */}
      <header className="bg-[#16A34A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Desktop top bar */}
          <div className="hidden md:flex items-center justify-between py-4">
            <a href="/" className="text-white font-black text-2xl tracking-tight">Payroo</a>
            <div className="flex-1 max-w-xl mx-8">
              <a href="/grocery" className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-sm text-gray-400">Search for groceries, services...</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="max-w-[150px] truncate">{detecting ? "Detecting..." : address || "Set location"}</span>
              </button>
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {mounted && unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-[#1F2937] text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
                </button>
              </div>
              <a href="/account" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-white text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>{mounted && profile?.name ? profile.name : "Account"}</span>
              </a>
            </div>
          </div>

          {/* Mobile header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between pt-3 pb-2">
              <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-2 flex-1 min-w-0">
                <svg className="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div className="text-left min-w-0">
                  <p className="text-white/60 text-[10px] leading-none">DELIVER TO</p>
                  <p className="text-white text-sm font-bold truncate">{detecting ? "Detecting..." : address || "Set your location"}</p>
                </div>
                <svg className="w-4 h-4 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="flex items-center gap-3 ml-3">
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {mounted && unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-[#1F2937] text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
                </button>
                <a href="/account" className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </a>
              </div>
            </div>
            <div className="pb-3">
              <a href="/grocery" className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-sm text-gray-400">Search for groceries, services...</span>
              </a>
            </div>
          </div>
        </div>

        {/* Notifications dropdown */}
        {showNotifs && (
          <div className="absolute right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 top-full mt-1 w-72 md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
              <span className="text-xs font-bold">Notifications</span>
              {mounted && unread > 0 && user && <button onClick={markAllRead} className="text-[10px] text-[#16A34A] font-bold">Mark read</button>}
            </div>
            <div className="max-h-60 overflow-y-auto">
              {notifications.length === 0 ? <p className="p-4 text-xs text-gray-400 text-center">No notifications</p> : (
                notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className={`px-4 py-2.5 border-b border-gray-50 ${!n.read ? "bg-green-50" : ""}`}>
                    <p className="text-[11px] font-bold text-gray-800">{n.title}</p>
                    <p className="text-[10px] text-gray-500">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24 md:pb-12">

        {/* ═══ BANNER CAROUSEL ═══ */}
        {mounted && banners.length > 0 && (
          <div className="mt-4 md:mt-6">
            <div
              className="relative rounded-2xl overflow-hidden shadow-md h-[150px] md:h-[320px]"
              style={{
                backgroundColor: banners[currentBanner]?.bgColor || "#16A34A",
                backgroundImage: banners[currentBanner]?.imageUrl
                  ? `linear-gradient(to right,rgba(0,0,0,0.6),rgba(0,0,0,0.15)),url(${banners[currentBanner].imageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <a href={banners[currentBanner]?.link || "#"} className="absolute inset-0 flex flex-col justify-end md:justify-center p-5 md:p-12">
                <span className="inline-flex self-start items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-1.5 md:mb-3 text-white text-[11px] md:text-sm font-black uppercase tracking-wider drop-shadow">{banners[currentBanner]?.title}</span>
                <p className="text-white/80 text-xs md:text-lg drop-shadow max-w-md">{banners[currentBanner]?.subtitle}</p>
                <span className="mt-2 md:mt-4 self-start bg-white text-gray-800 text-[11px] md:text-sm font-bold px-4 md:px-6 py-1.5 md:py-2.5 rounded-full shadow hover:bg-gray-100 transition-colors">Order now →</span>
              </a>
              {banners.length > 1 && (
                <div className="absolute bottom-2.5 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)} className={`h-1.5 md:h-2 rounded-full transition-all ${i === currentBanner ? "bg-white w-4 md:w-6" : "bg-white/40 w-1.5 md:w-2"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ SERVICES GRID ═══ */}
        <div className="mt-5 md:mt-8">
          <h2 className="hidden md:block font-bold text-lg text-gray-800 mb-4">Our Services</h2>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3 md:gap-4">
            {SERVICES.map((s) => (
              <a
                key={s.id}
                href={s.available ? s.href : undefined}
                className={`relative flex flex-col items-center ${!s.available ? "opacity-60" : "hover:scale-105 transition-transform"}`}
              >
                {!s.available && <span className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 bg-yellow-400 text-[#1F2937] text-[6px] font-bold px-1 py-[1px] rounded-sm whitespace-nowrap leading-tight">SOON</span>}
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center ${s.color} shadow-sm`}>
                  <img src={s.icon} alt={s.name} className="w-9 h-9 md:w-10 md:h-10 object-contain" />
                </div>
                <span className="text-[11px] md:text-xs text-gray-700 font-medium mt-1.5 text-center leading-tight">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ═══ QUICK ORDER CARDS ═══ */}
        <div className="mt-6 md:mt-8">
          <h2 className="hidden md:block font-bold text-lg text-gray-800 mb-4">Quick Order</h2>
          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto md:overflow-visible scrollbar-hide pb-1">
            <a href="/grocery" className="flex-shrink-0 w-[70%] md:w-auto bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-70">Same-day delivery</p>
              <p className="text-lg md:text-xl font-black mt-1">Grocery</p>
              <p className="text-[11px] md:text-sm opacity-80 mt-0.5">Fresh produce & daily essentials</p>
              <span className="inline-block mt-3 bg-white/20 backdrop-blur text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full">Shop now</span>
            </a>
            <a href="/laundry" className="flex-shrink-0 w-[70%] md:w-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-70">Pickup & delivery</p>
              <p className="text-lg md:text-xl font-black mt-1">Laundry</p>
              <p className="text-[11px] md:text-sm opacity-80 mt-0.5">Wash, dry & fold service</p>
              <span className="inline-block mt-3 bg-white/20 backdrop-blur text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full">Book now</span>
            </a>
            <a href="/home-services" className="flex-shrink-0 w-[70%] md:w-auto bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <p className="text-[10px] md:text-xs font-bold uppercase opacity-70">Book a pro</p>
              <p className="text-lg md:text-xl font-black mt-1">Home Services</p>
              <p className="text-[11px] md:text-sm opacity-80 mt-0.5">Aircon, plumbing, electrical</p>
              <span className="inline-block mt-3 bg-white/20 backdrop-blur text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full">Book now</span>
            </a>
          </div>
        </div>

        {/* ═══ PROMOS ═══ */}
        {mounted && promos.length > 0 && (
          <div className="mt-6 md:mt-10">
            <h2 className="font-bold text-sm md:text-lg text-gray-800 mb-3 md:mb-4">🔥 Deals for you</h2>
            <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-1">
              {promos.map((p) => (
                <div key={p.id} className="flex-shrink-0 min-w-[200px] md:min-w-0 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-800">{p.title}</p>
                      {p.description && <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">{p.description}</p>}
                    </div>
                    <div className="bg-[#16A34A] text-white text-lg font-black w-12 h-12 rounded-full flex items-center justify-center">
                      {p.discountPercent}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ LAUNDRY PARTNERS ═══ */}
        {mounted && partners.length > 0 && (
          <div className="mt-6 md:mt-10">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="font-bold text-sm md:text-lg text-gray-800">🧺 Laundry Partners</h2>
              <a href="/laundry" className="text-[11px] md:text-sm text-[#16A34A] font-bold">See All</a>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-1">
              {partners.map((p) => (
                <a key={p.id} href="/laundry" className="flex flex-col items-center min-w-[72px] md:min-w-[90px] hover:scale-105 transition-transform">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-blue-50 border-2 border-white shadow-md flex items-center justify-center">
                    {p.logoUrl ? <img src={p.logoUrl} alt={p.shopName} className="w-full h-full object-cover" /> : <span className="text-blue-600 font-bold text-lg">{p.shopName.charAt(0)}</span>}
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-700 font-medium mt-1.5 text-center leading-tight line-clamp-2 max-w-[72px] md:max-w-[90px]">{p.shopName}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ═══ HOW IT WORKS ═══ */}
        <div className="mt-8 md:mt-12">
          <h2 className="font-bold text-sm md:text-lg text-gray-800 mb-3 md:mb-5">How it works</h2>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {[
              { step: "1", title: "Choose", desc: "Pick a service", icon: "https://img.icons8.com/3d-fluency/94/finger.png" },
              { step: "2", title: "Order", desc: "Add items & pay", icon: "https://img.icons8.com/3d-fluency/94/shopping-cart.png" },
              { step: "3", title: "Enjoy", desc: "Delivered fast", icon: "https://img.icons8.com/3d-fluency/94/rocket.png" },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-3 md:p-6 border border-gray-100 text-center hover:shadow-md transition-shadow">
                <img src={s.icon} alt={s.title} className="w-10 h-10 md:w-14 md:h-14 mx-auto object-contain" />
                <p className="font-bold text-xs md:text-base text-gray-800 mt-1 md:mt-2">{s.title}</p>
                <p className="text-[10px] md:text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="mt-8 md:mt-12 mb-4">
          <div className="bg-white rounded-xl p-4 md:p-8 border border-gray-100">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex items-center justify-center md:justify-start mb-1 md:mb-0">
                <a href="/" className="font-black text-sm md:text-lg text-gray-800 tracking-tight">Payroo</a>
              </div>
              <p className="text-[10px] md:text-sm text-gray-400 text-center md:text-right">Your everyday super app</p>
            </div>
            <div className="hidden md:flex items-center justify-center gap-8 mt-6 pt-6 border-t border-gray-100">
              <a href="/grocery" className="text-sm text-gray-500 hover:text-[#16A34A] transition-colors">Grocery</a>
              <a href="/laundry" className="text-sm text-gray-500 hover:text-[#16A34A] transition-colors">Laundry</a>
              <a href="/services" className="text-sm text-gray-500 hover:text-[#16A34A] transition-colors">Services</a>
              <a href="/account" className="text-sm text-gray-500 hover:text-[#16A34A] transition-colors">My Account</a>
              <a href="/auth" className="text-sm text-gray-500 hover:text-[#16A34A] transition-colors">Sign In</a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ADDRESS MODAL ═══ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowAddressModal(false); setAddingNew(false) }} />
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg mx-auto overflow-hidden" style={{ animation: "slideUp 0.25s ease-out" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-base text-gray-800">Deliver to</h2>
              <button onClick={() => { setShowAddressModal(false); setAddingNew(false) }} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-4 max-h-[75vh] overflow-y-auto space-y-3">
              <button onClick={() => { detectLocation(); setShowAddressModal(false) }} className="w-full flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-[#16A34A] rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[#16A34A]">Use current location</p>
                  <p className="text-[11px] text-gray-400">Detect via GPS</p>
                </div>
              </button>

              {savedAddresses.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Saved Addresses</p>
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => {
                      const icons: Record<string, string> = {
                        Home: "https://img.icons8.com/3d-fluency/94/home.png",
                        Office: "https://img.icons8.com/3d-fluency/94/office-building.png",
                        Work: "https://img.icons8.com/3d-fluency/94/briefcase.png",
                        Other: "https://img.icons8.com/3d-fluency/94/map-pin.png",
                      }
                      const active = address === addr.address
                      return (
                        <div key={addr.id} onClick={() => selectAddress(addr)} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${active ? "border-[#16A34A] bg-green-50" : "border-gray-200"}`}>
                          <img src={icons[addr.label] || icons.Other} alt={addr.label} className="w-7 h-7 shrink-0 object-contain" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">{addr.label}</p>
                            <p className="text-[11px] text-gray-500 truncate">{addr.address}</p>
                          </div>
                          {active && <span className="w-2 h-2 bg-[#16A34A] rounded-full shrink-0" />}
                          <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id) }} className="text-gray-300 hover:text-green-400 text-xl leading-none shrink-0">&times;</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!addingNew ? (
                <button onClick={() => setAddingNew(true)} className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-[#16A34A] transition-colors">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Add new address</span>
                </button>
              ) : (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-700">New Address</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Home", "Office", "Work", "Other"] as const).map((lbl) => {
                      const lblIcons: Record<string, string> = {
                        Home: "https://img.icons8.com/3d-fluency/94/home.png",
                        Office: "https://img.icons8.com/3d-fluency/94/office-building.png",
                        Work: "https://img.icons8.com/3d-fluency/94/briefcase.png",
                        Other: "https://img.icons8.com/3d-fluency/94/map-pin.png",
                      }
                      return (
                      <button key={lbl} onClick={() => setNewAddr((p) => ({ ...p, label: lbl }))} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${newAddr.label === lbl ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-white text-gray-600 border-gray-200"}`}>
                        <img src={lblIcons[lbl]} alt={lbl} className="w-5 h-5 mx-auto mb-0.5 object-contain" />{lbl}
                      </button>
                      )
                    })}
                  </div>
                  <textarea placeholder="Enter full address..." value={newAddr.address} onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none" rows={2} />
                  <button onClick={detectForNew} disabled={locatingNew} className="w-full flex items-center justify-center gap-2 border border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg py-2 text-xs font-medium">
                    {locatingNew ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> Detecting...</> : "📍 Use current location"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setAddingNew(false); setNewAddr({ label: "Home", address: "", lat: 0, lng: 0 }) }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-medium">Cancel</button>
                    <button onClick={saveNewAddress} disabled={savingAddr || !newAddr.address.trim()} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-xs font-bold disabled:opacity-40">{savingAddr ? "Saving..." : "Save Address"}</button>
                  </div>
                </div>
              )}

              {mounted && !user ? (
                <p className="text-[11px] text-center text-gray-400 pb-2">📝 <a href="/auth" className="text-[#16A34A] font-bold">Sign in</a> to save addresses across devices</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING ACTIVE ORDER TRACKER ═══ */}
      {mounted && activeOrders.length > 0 && (
        <>
          {/* Floating pill button */}
          {!showOrderTracker && (
            <button
              onClick={() => setShowOrderTracker(true)}
              className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white text-gray-800 pl-14 pr-5 py-3 rounded-full shadow-2xl border border-gray-100 flex items-center gap-3 animate-[bounceIn_0.3s_ease-out] hover:shadow-xl transition-shadow"
            >
              {/* Overlapping 3D icons */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 border-2 border-white z-30 animate-[ride_2s_ease-in-out_infinite]">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" /></svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 border-2 border-white -ml-3 z-20 animate-[ride_2s_0.3s_ease-in-out_infinite]">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 border-2 border-white -ml-3 z-10 animate-[ride_2s_0.6s_ease-in-out_infinite]">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zM19 19H5V5h14v14zM6 15h12v2H6zm0-4h12v2H6zm0-4h12v2H6z" /></svg>
                </div>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block leading-tight text-gray-800">{activeOrders.length} Active Order{activeOrders.length > 1 ? "s" : ""}</span>
                <span className="text-[10px] text-gray-400">Tap to track</span>
              </div>
              <div className="w-6 h-6 bg-[#16A34A] rounded-full flex items-center justify-center ml-1">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
              </div>
            </button>
          )}

          {/* Expanded order tracker drawer */}
          {showOrderTracker && (
            <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slideUp_0.25s_ease-out]">
              <div className="bg-[#16A34A] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white font-bold text-sm">{activeOrders.length} Active Order{activeOrders.length > 1 ? "s" : ""}</span>
                </div>
                <button onClick={() => setShowOrderTracker(false)} className="text-white/70 hover:text-white text-xl leading-none">&times;</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {activeOrders.map((order) => {
                  const statusLabel = order.status.replace(/_/g, " ")
                  const href = order.type === "grocery" ? `/order?id=${order.id}` : order.type === "laundry" ? "/laundry" : "/services"
                  const icon = order.type === "grocery" ? "https://img.icons8.com/3d-fluency/94/shopping-cart.png" : order.type === "laundry" ? "https://img.icons8.com/3d-fluency/94/washing-machine.png" : "https://img.icons8.com/3d-fluency/94/maintenance.png"
                  const color = order.type === "grocery" ? "bg-green-50 text-green-800" : order.type === "laundry" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"
                  const progressStatuses: Record<string, number> = {
                    pending: 15, confirmed: 30, accepted: 30, preparing: 45, ready_for_pickup: 60, ready: 60,
                    rider_accepted: 65, rider_at_store: 70, rider_picked_up: 75, rider_to_laundromat: 50,
                    at_laundromat: 55, washing: 65, rider_return_pickup: 80, rider_returning: 85,
                    out_for_delivery: 85, in_progress: 50,
                  }
                  const progress = progressStatuses[order.status] || 20
                  return (
                    <a key={`${order.type}-${order.id}`} href={href} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={icon} alt={order.type} className="w-8 h-8 object-contain shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{order.name}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${color}`}>{statusLabel}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#16A34A] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-gray-400 capitalize">{order.type}</p>
                            <p className="text-[10px] font-bold text-gray-600">₱{order.total}</p>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </a>
                  )
                })}
              </div>
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <a href="/account" className="text-[11px] text-[#16A34A] font-bold text-center block">View All Orders →</a>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ MOBILE BOTTOM NAV (hidden on desktop) ═══ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom" suppressHydrationWarning>
        <div className="max-w-lg mx-auto grid grid-cols-4 py-1.5">
          <a href="/" className="flex flex-col items-center gap-0.5 py-1 text-[#16A34A]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-bold">Home</span>
          </a>
          <a href="/grocery" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px] font-medium">Grocery</span>
          </a>
          <a href="/laundry" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            <span className="text-[10px] font-medium">Laundry</span>
          </a>
          <a href="/account" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-medium">Account</span>
          </a>
        </div>
      </nav>

      {/* ═══ PWA/TWA INSTALL POPUP ═══ */}
      {mounted && showInstall && !isStandalone && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowInstall(false); sessionStorage.setItem("install-dismissed", "1") }} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease-out]">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#16A34A] to-[#15803d] px-6 pt-8 pb-12 text-center relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="absolute -left-6 -bottom-10 w-28 h-28 bg-white/5 rounded-full" />
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-[#16A34A] font-black text-lg tracking-tight">P</span>
              </div>
              <h2 className="text-white font-black text-xl tracking-tight">Install Payroo</h2>
              <p className="text-white/70 text-xs mt-1">Get the full app experience</p>
            </div>

            {/* Benefits */}
            <div className="px-6 -mt-6 relative">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                {[
                  { icon: "https://img.icons8.com/3d-fluency/94/lightning-bolt.png", text: "Faster loading & instant access" },
                  { icon: "https://img.icons8.com/3d-fluency/94/appointment-reminders.png", text: "Order notifications & updates" },
                  { icon: "https://img.icons8.com/3d-fluency/94/iphone.png", text: "Works offline — like a native app" },
                  { icon: "https://img.icons8.com/3d-fluency/94/home.png", text: "Launch from your home screen" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-3">
                    <img src={b.icon} alt="" className="w-8 h-8 object-contain shrink-0" />
                    <p className="text-sm text-gray-700">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-5 space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={async () => {
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    if (outcome === "accepted") setShowInstall(false)
                    setDeferredPrompt(null)
                  }}
                  className="w-full bg-[#FF8A00] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#e07800] transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Install App
                </button>
              ) : (
                /* iOS instructions */
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-gray-800 mb-2">Install on iPhone / iPad</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <span>Tap</span>
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    <span>then</span>
                    <span className="font-bold text-gray-800">"Add to Home Screen"</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setShowInstall(false); sessionStorage.setItem("install-dismissed", "1") }}
                className="w-full text-center text-sm text-gray-400 py-2 hover:text-gray-600"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
