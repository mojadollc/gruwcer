"use client"

import { useEffect, useState } from "react"
import type { ReactElement } from "react"
import { getUser, getToken } from "@/lib/auth"

const ServiceIcon = ({ id }: { id: string }) => {
  const icons: Record<string, ReactElement> = {
    grocery: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    laundry: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><circle cx="12" cy="13" r="2"/><line x1="6" y1="7" x2="6" y2="7" strokeWidth={2.5}/><line x1="9" y1="7" x2="9" y2="7" strokeWidth={2.5}/></svg>,
    services: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    travel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
    healthcare: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    food: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    eload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 6v4m0 0l-2-2m2 2l2-2"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
    rental: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    bills: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    more: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  }
  return icons[id] || icons.more
}

const SERVICES = [
  { id: "grocery", name: "Grocery", href: "/grocery", available: true, color: "text-green-600 bg-green-50" },
  { id: "laundry", name: "Laundry", href: "/laundry", available: true, color: "text-blue-600 bg-blue-50" },
  { id: "services", name: "Services", href: "/home-services", available: true, color: "text-orange-600 bg-orange-50" },
  { id: "travel", name: "Hotel & Flights", href: "/travel", available: true, color: "text-purple-600 bg-purple-50" },
  { id: "rentals", name: "Rentals", href: "/rentals", available: true, color: "text-amber-600 bg-amber-50" },
  { id: "healthcare", name: "Clinics", href: "#", available: false, color: "text-red-500 bg-red-50" },
  { id: "food", name: "Food To Go", href: "/food", available: true, color: "text-yellow-600 bg-yellow-50" },
  { id: "errand", name: "Errands", href: "#", available: false, color: "text-teal-600 bg-teal-50" },
  { id: "bills", name: "Bills", href: "#", available: false, color: "text-indigo-600 bg-indigo-50" },
  { id: "more", name: "More", href: "#", available: false, color: "text-gray-600 bg-gray-100" },
]

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const FALLBACK_BANNERS = [
    { id: "1", title: "Free Delivery", subtitle: "On orders ₱1,000+", imageUrl: "", bgColor: "#16A34A", link: "/grocery" },
    { id: "2", title: "Laundry Pickup", subtitle: "We'll handle the rest", imageUrl: "", bgColor: "#1a56db", link: "/laundry" },
    { id: "3", title: "Home Services", subtitle: "Aircon, plumbing & more", imageUrl: "", bgColor: "#0d9488", link: "/home-services" },
  ]
  const [banners, setBanners] = useState<{ id: string; title: string; subtitle: string; imageUrl: string; bgColor: string; link: string }[]>(FALLBACK_BANNERS)
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

  useEffect(() => {
    const dismissed = sessionStorage.getItem("install-dismissed")
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone
    setIsStandalone(!!standalone)
    if (standalone || dismissed) return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowInstall(true), 2000)
    }
    window.addEventListener("beforeinstallprompt", handler)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS && !standalone) setTimeout(() => setShowInstall(true), 3000)
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`)
          const data = await res.json()
          const a = data.address || {}
          const parts = [a.house_number, a.road, a.suburb || a.village || a.neighbourhood, a.city || a.town || a.municipality, a.state].filter(Boolean)
          const addr = parts.length > 0 ? parts.join(", ") : data.display_name?.split(",").slice(0, 2).join(",") || ""
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
    fetch("/api/hero", { next: { revalidate: 300 } } as any).then(r => r.ok ? r.json() : []).then((data: any[]) => {
      if (data.length > 0) setBanners(data.map((s: any) => ({ id: s.id, title: s.title || "", subtitle: s.description || s.subtitle || "", imageUrl: s.imageUrl || "", bgColor: s.bgColor || "#16A34A", link: s.link || "/grocery" })))
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
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`)
          const data = await res.json()
          const a = data.address || {}
          const parts = [a.house_number, a.road, a.suburb || a.village || a.neighbourhood, a.city || a.town || a.municipality, a.state].filter(Boolean)
          const addr = parts.length > 0 ? parts.join(", ") : data.display_name?.split(",").slice(0, 3).join(",") || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
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

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50">

        {/* ── Top bar: logo + actions ── */}
        <div className="bg-[#16A34A]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0">
              {/* Icon mark */}
              <div className="relative w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <path d="M12 2C8 2 4 5.5 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.5-4-8-8-8z" fill="#16A34A"/>
                  <circle cx="12" cy="10" r="2.5" fill="white"/>
                </svg>
              </div>
              {/* Wordmark */}
              <div className="leading-none">
                <span className="text-white font-black text-xl tracking-tight">Gruwcer</span>
                <span className="block text-white/50 text-[9px] font-medium tracking-widest uppercase">Super App</span>
              </div>
            </a>

            {/* Location pill — desktop */}
            <button onClick={() => setShowAddressModal(true)} className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 transition-colors min-w-0 max-w-xs">
              <svg className={`w-3.5 h-3.5 text-[#FFD23F] shrink-0 ${detecting ? "animate-pulse" : ""}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              <div className="text-left min-w-0">
                <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest leading-none">Deliver to</p>
                <p className="text-white text-xs font-semibold truncate mt-0.5">{detecting ? "Detecting..." : address || "Set your location"}</p>
              </div>
              <svg className="w-3 h-3 text-white/40 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">

              {/* Location icon — mobile only */}
              <button onClick={() => setShowAddressModal(true)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <svg className={`w-5 h-5 text-white ${detecting ? "animate-pulse" : ""}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors relative">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  {mounted && unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#FF8A00] text-white text-[8px] font-black rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">Notifications</span>
                      {mounted && unread > 0 && user && <button onClick={markAllRead} className="text-xs text-[#16A34A] font-bold">Mark all read</button>}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0
                        ? <p className="p-5 text-xs text-gray-400 text-center">No notifications yet</p>
                        : notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className={`px-4 py-3 ${!n.read ? "bg-green-50" : ""}`}>
                            <p className="text-xs font-bold text-gray-800">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{n.message}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Account */}
              <a href={mounted && user ? "/account" : "/auth"} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                {mounted && profile?.name ? (
                  <div className="w-7 h-7 rounded-full bg-[#FF8A00] flex items-center justify-center shadow">
                    <span className="text-white text-xs font-black">{profile.name.charAt(0).toUpperCase()}</span>
                  </div>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                )}
              </a>
            </div>
          </div>
        </div>

        {/* ── Location bar — mobile only ── */}
        <button onClick={() => setShowAddressModal(true)} className="md:hidden w-full bg-[#0d7a3a] flex items-center gap-2 px-4 py-2 border-t border-white/10">
          <svg className={`w-3.5 h-3.5 text-[#FFD23F] shrink-0 ${detecting ? "animate-pulse" : ""}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest shrink-0">Deliver to</span>
          <span className="text-white text-xs font-semibold truncate flex-1 text-left">{detecting ? "Detecting location..." : address || "Set your location"}</span>
          <svg className="w-3 h-3 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
        </button>

        {/* ── Category nav strip ── */}
        <div className="bg-[#16A34A] border-t border-white/10">
          <div className="max-w-7xl mx-auto px-3 md:px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
              {SERVICES.map((s) => (
                <a
                  key={s.id}
                  href={s.available ? s.href : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                    s.available
                      ? "text-white hover:bg-white/20 active:bg-white/30"
                      : "text-white/30 cursor-default"
                  }`}
                >
                  <span className="w-3.5 h-3.5 shrink-0"><ServiceIcon id={s.id} /></span>
                  {s.name}
                  {!s.available && <span className="bg-[#FF8A00] text-white text-[7px] font-black px-1 py-px rounded-sm leading-none">SOON</span>}
                </a>
              ))}
            </div>
          </div>
        </div>

      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-12">

        {/* ═══ HERO BANNER ═══ */}
        <div className="mt-4 md:mt-6">
          <div className="md:flex md:gap-4">
            {/* Main banner */}
            {banners.length === 0 ? (
              <div className="relative rounded-2xl overflow-hidden h-[160px] md:h-[340px] md:flex-1 bg-gray-200 animate-pulse">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            ) : (
              <div
                className="relative rounded-2xl overflow-hidden h-[160px] md:h-[340px] md:flex-1 cursor-pointer"
                style={{
                  backgroundColor: banners[currentBanner]?.bgColor || "#16A34A",
                  backgroundImage: banners[currentBanner]?.imageUrl
                    ? `linear-gradient(to right,rgba(0,0,0,0.55),rgba(0,0,0,0.1)),url(${banners[currentBanner].imageUrl})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <a href={banners[currentBanner]?.link || "#"} className="absolute inset-0 flex flex-col justify-end p-5 md:p-10">
                  <span className="inline-flex self-start items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2 text-white text-[11px] md:text-sm font-black uppercase tracking-wider">{banners[currentBanner]?.title}</span>
                  <p className="text-white/85 text-xs md:text-lg max-w-sm">{banners[currentBanner]?.subtitle}</p>
                  <span className="mt-3 self-start bg-[#FF8A00] text-white text-xs md:text-sm font-bold px-5 py-2 rounded-full shadow hover:bg-[#e07800] transition-colors">Shop Now →</span>
                </a>
                {banners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {banners.map((_, i) => (
                      <button key={i} onClick={() => setCurrentBanner(i)} className={`h-1.5 rounded-full transition-all ${i === currentBanner ? "bg-white w-5" : "bg-white/40 w-1.5"}`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Side banners - desktop only */}
            <div className="hidden md:flex flex-col gap-4 w-64">
              <a href="/grocery" className="flex-1 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70">Same-day delivery</p>
                  <p className="text-lg font-black mt-1">Grocery</p>
                  <p className="text-xs opacity-80 mt-0.5">Fresh produce & essentials</p>
                </div>
                <span className="self-start bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mt-3">Order now</span>
              </a>
              <a href="/laundry" className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white relative overflow-hidden hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70">Pickup & delivery</p>
                  <p className="text-lg font-black mt-1">Laundry</p>
                  <p className="text-xs opacity-80 mt-0.5">Wash, dry & fold</p>
                </div>
                <span className="self-start bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full mt-3">Book now</span>
              </a>
            </div>
          </div>
        </div>

        {/* ═══ SERVICES GRID ═══ */}
        <div className="mt-5 md:mt-8 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-sm md:text-base text-gray-800 mb-4">Shop by Department</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
            {[...SERVICES.slice(0, 4), { id: "eload", name: "E-Load", href: "/eload", available: true, color: "text-purple-600 bg-purple-50" }, ...SERVICES.slice(5)].map((s) => (
              <a
                key={s.id}
                href={s.available ? s.href : undefined}
                className={`relative flex flex-col items-center gap-1.5 group ${!s.available ? "opacity-50" : ""}`}
              >
                {!s.available && <span className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 bg-[#FF8A00] text-white text-[7px] font-bold px-1 py-px rounded-sm whitespace-nowrap">SOON</span>}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${s.available ? s.color + " group-hover:scale-110 transition-transform" : "bg-gray-100 text-gray-400"}`}>
                  <span className="w-6 h-6 md:w-7 md:h-7"><ServiceIcon id={s.id} /></span>
                </div>
                <span className="text-[10px] md:text-xs text-gray-600 font-medium text-center leading-tight">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ═══ PROMOS / DEALS ═══ */}
        {promos.length > 0 && (
          <div className="mt-5 md:mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm md:text-base text-gray-800">🔥 Deals for You</h2>
              <a href="/grocery" className="text-xs text-[#16A34A] font-bold">See all</a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {promos.slice(0, 4).map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#16A34A] text-white text-lg font-black rounded-full flex items-center justify-center shrink-0">{p.discountPercent}%</div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{p.title}</p>
                    {p.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ QUICK ORDER CARDS (mobile horizontal scroll) ═══ */}
        <div className="mt-5 md:mt-6">
          <h2 className="font-bold text-sm md:text-base text-gray-800 mb-3">Quick Order</h2>
          <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto scrollbar-hide pb-1">
            <a href="/grocery" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Same-day delivery</p>
              <p className="text-lg font-black mt-1">Grocery</p>
              <p className="text-xs opacity-80 mt-0.5">Fresh produce & daily essentials</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Shop now</span>
            </a>
            <a href="/laundry" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Pickup & delivery</p>
              <p className="text-lg font-black mt-1">Laundry</p>
              <p className="text-xs opacity-80 mt-0.5">Wash, dry & fold service</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Book now</span>
            </a>
            <a href="/eload" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Mobile & games</p>
              <p className="text-lg font-black mt-1">E-Load</p>
              <p className="text-xs opacity-80 mt-0.5">Smart, Globe, TNT & more</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Load now</span>
            </a>
            <a href="/home-services" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Book a pro</p>
              <p className="text-lg font-black mt-1">Home Services</p>
              <p className="text-xs opacity-80 mt-0.5">Aircon, plumbing, electrical</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Book now</span>
            </a>
            <a href="/food" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Local restaurants</p>
              <p className="text-lg font-black mt-1">Food to Go</p>
              <p className="text-xs opacity-80 mt-0.5">Order from nearby restaurants</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Order now</span>
            </a>
            <a href="/rentals" className="flex-shrink-0 w-[72%] md:w-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 md:p-6 text-white relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-[10px] font-bold uppercase opacity-70">Rent from neighbors</p>
              <p className="text-lg font-black mt-1">Tool Rentals</p>
              <p className="text-xs opacity-80 mt-0.5">Drills, pressure washers & more</p>
              <span className="inline-block mt-3 bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">Browse now</span>
            </a>
          </div>
        </div>

        {/* PARTNERS */}
        {partners.length > 0 && (
          <div className="mt-5 md:mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm md:text-base text-gray-800">🧺 Laundry Partners</h2>
              <a href="/laundry" className="text-xs text-[#16A34A] font-bold">See All</a>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {partners.map((p) => (
                <a key={p.id} href="/laundry" className="flex flex-col items-center min-w-[72px] hover:scale-105 transition-transform">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-50 border-2 border-white shadow-md flex items-center justify-center">
                    {p.logoUrl ? <img src={p.logoUrl} alt={p.shopName} className="w-full h-full object-cover" /> : <span className="text-blue-600 font-bold text-lg">{p.shopName.charAt(0)}</span>}
                  </div>
                  <p className="text-[10px] text-gray-700 font-medium mt-1.5 text-center leading-tight line-clamp-2 max-w-[72px]">{p.shopName}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* HOW IT WORKS */}
        <div className="mt-6 md:mt-8 bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-sm md:text-base text-gray-800 mb-4">How It Works</h2>
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            {[
              { step: "1", title: "Choose", desc: "Pick a service", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-green-600"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
              { step: "2", title: "Order", desc: "Add items & pay", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-orange-500"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
              { step: "3", title: "Enjoy", desc: "Delivered fast", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-500"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-2">
                  <span className="w-8 h-8 md:w-10 md:h-10">{s.icon}</span>
                </div>
                <div className="w-6 h-6 bg-[#16A34A] text-white text-xs font-black rounded-full flex items-center justify-center mb-1">{s.step}</div>
                <p className="font-bold text-xs md:text-sm text-gray-800">{s.title}</p>
                <p className="text-[10px] md:text-xs text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 md:mt-10 bg-[#0B5E34] rounded-2xl overflow-hidden">
          <div className="px-6 py-8 md:py-10">
            <div className="md:grid md:grid-cols-4 md:gap-8">
              <div className="mb-6 md:mb-0">
                <a href="/" className="text-white font-black text-xl tracking-tight">Gruwcer</a>
                <p className="text-white/50 text-xs mt-2 leading-relaxed">Your everyday super app. Grocery, laundry & home services — all in one place.</p>
              </div>
              <div className="hidden md:block">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Services</p>
                <div className="space-y-2">
                  {["Grocery", "Laundry", "Home Services", "Hotel & Flights"].map(l => (
                    <a key={l} href="#" className="block text-white/60 text-sm hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Account</p>
                <div className="space-y-2">
                  {[["Sign In", "/auth"], ["My Orders", "/account"], ["Wallet", "/wallet"], ["Partner Portal", "/partner"]].map(([l, h]) => (
                    <a key={l} href={h} className="block text-white/60 text-sm hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3">Support</p>
                <div className="space-y-2">
                  {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"].map(l => (
                    <a key={l} href="#" className="block text-white/60 text-sm hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-white/30 text-xs">© 2025 Gruwcer. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="/grocery" className="text-white/40 text-xs hover:text-white transition-colors">Grocery</a>
                <a href="/laundry" className="text-white/40 text-xs hover:text-white transition-colors">Laundry</a>
                <a href="/auth" className="text-white/40 text-xs hover:text-white transition-colors">Sign In</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ADDRESS MODAL */}
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
                      const addrIcons: Record<string, ReactElement> = {
                        Home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                        Office: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                        Work: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                        Other: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                      }
                      const active = address === addr.address
                      return (
                        <div key={addr.id} onClick={() => selectAddress(addr)} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${active ? "border-[#16A34A] bg-green-50" : "border-gray-200"}`}>
                          <span className="w-7 h-7 shrink-0 text-[#16A34A]">{addrIcons[addr.label] || addrIcons.Other}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">{addr.label}</p>
                            <p className="text-[11px] text-gray-500 truncate">{addr.address}</p>
                          </div>
                          {active && <span className="w-2 h-2 bg-[#16A34A] rounded-full shrink-0" />}
                          <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id) }} className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0">&times;</button>
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
                      const lblIcons: Record<string, ReactElement> = {
                            Home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                            Office: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                            Work: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
                            Other: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                          }
                      return (
                        <button key={lbl} onClick={() => setNewAddr((p) => ({ ...p, label: lbl }))} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${newAddr.label === lbl ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-white text-gray-600 border-gray-200"}`}>
                          <span className="w-5 h-5 mx-auto mb-0.5 block">{lblIcons[lbl]}</span>{lbl}
                        </button>
                      )
                    })}
                  </div>
                  <textarea placeholder="Enter full address..." value={newAddr.address} onChange={(e) => setNewAddr((p) => ({ ...p, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none" rows={2} />
                  <button onClick={detectForNew} disabled={locatingNew} className="w-full flex items-center justify-center gap-2 border border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg py-2 text-xs font-medium">
                    {locatingNew ? "Detecting..." : "📍 Use current location"}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setAddingNew(false); setNewAddr({ label: "Home", address: "", lat: 0, lng: 0 }) }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-xs font-medium">Cancel</button>
                    <button onClick={saveNewAddress} disabled={savingAddr || !newAddr.address.trim()} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-xs font-bold disabled:opacity-40">{savingAddr ? "Saving..." : "Save Address"}</button>
                  </div>
                </div>
              )}
              {mounted && !user && (
                <p className="text-[11px] text-center text-gray-400 pb-2">📝 <a href="/auth" className="text-[#16A34A] font-bold">Sign in</a> to save addresses across devices</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ORDER TRACKER */}
      {mounted && activeOrders.length > 0 && (
        <>
          {!showOrderTracker && (
            <button
              onClick={() => setShowOrderTracker(true)}
              className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-white text-gray-800 pl-14 pr-5 py-3 rounded-full shadow-2xl border border-gray-100 flex items-center gap-3 hover:shadow-xl transition-shadow"
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white z-30">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" /></svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg border-2 border-white -ml-3 z-20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>
                </div>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block leading-tight">{activeOrders.length} Active Order{activeOrders.length > 1 ? "s" : ""}</span>
                <span className="text-[10px] text-gray-400">Tap to track</span>
              </div>
              <div className="w-6 h-6 bg-[#16A34A] rounded-full flex items-center justify-center ml-1">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
              </div>
            </button>
          )}
          {showOrderTracker && (
            <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[60] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ animation: "slideUp 0.25s ease-out" }}>
              <div className="bg-[#16A34A] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-300 rounded-full animate-pulse" />
                  <span className="text-white font-bold text-sm">{activeOrders.length} Active Order{activeOrders.length > 1 ? "s" : ""}</span>
                </div>
                <button onClick={() => setShowOrderTracker(false)} className="text-white/70 hover:text-white text-xl leading-none">&times;</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {activeOrders.map((order) => {
                  const statusLabel = order.status.replace(/_/g, " ")
                  const href = order.type === "grocery" ? `/order?id=${order.id}` : order.type === "laundry" ? "/laundry" : "/services"
                  const icon = order.type === "grocery"
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-green-600"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                    : order.type === "laundry"
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-600"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><circle cx="12" cy="13" r="2"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-teal-600"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                  const color = order.type === "grocery" ? "bg-green-50 text-green-800" : order.type === "laundry" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"
                  const progressStatuses: Record<string, number> = { pending: 15, confirmed: 30, accepted: 30, preparing: 45, ready_for_pickup: 60, ready: 60, rider_accepted: 65, rider_at_store: 70, rider_picked_up: 75, rider_to_laundromat: 50, at_laundromat: 55, washing: 65, rider_return_pickup: 80, rider_returning: 85, out_for_delivery: 85 }
                  const progress = progressStatuses[order.status] || 20
                  return (
                    <a key={`${order.type}-${order.id}`} href={href} className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{order.name}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${color}`}>{statusLabel}</span>
                          </div>
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

      {/* MOBILE BOTTOM NAV */}
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

      {/* PWA INSTALL POPUP */}
      {mounted && showInstall && !isStandalone && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowInstall(false); sessionStorage.setItem("install-dismissed", "1") }} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" style={{ animation: "slideUp 0.3s ease-out" }}>
            <div className="bg-gradient-to-br from-[#16A34A] to-[#0B5E34] px-6 pt-8 pb-12 text-center relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-[#16A34A] font-black text-lg">G</span>
              </div>
              <h2 className="text-white font-black text-xl">Install Gruwcer</h2>
              <p className="text-white/70 text-xs mt-1">Get the full app experience</p>
            </div>
            <div className="px-6 -mt-6 relative">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                {[
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-yellow-500"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>, text: "Faster loading & instant access" },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-blue-500"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, text: "Order notifications & updates" },
                  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-green-600"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, text: "Launch from your home screen" },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-3">
                    <span className="w-8 h-8 shrink-0">{b.icon}</span>
                    <p className="text-sm text-gray-700">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-5 space-y-3">
              {deferredPrompt ? (
                <button
                  onClick={async () => {
                    deferredPrompt.prompt()
                    const { outcome } = await deferredPrompt.userChoice
                    if (outcome === "accepted") setShowInstall(false)
                    setDeferredPrompt(null)
                  }}
                  className="w-full bg-[#FF8A00] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#e07800] transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Install App
                </button>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-gray-800 mb-2">Install on iPhone / iPad</p>
                  <p className="text-xs text-gray-500">Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></p>
                </div>
              )}
              <button onClick={() => { setShowInstall(false); sessionStorage.setItem("install-dismissed", "1") }} className="w-full text-center text-sm text-gray-400 py-2 hover:text-gray-600">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
