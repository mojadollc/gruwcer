"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { clearAuth } from "@/lib/auth"
import Link from "next/link"
import { useNotificationSound } from "@/app/components/useNotificationSound"

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/admin", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/admin/categories", label: "Categories", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/admin/hero", label: "Hero Slides", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/admin/banners", label: "App Banners", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { href: "/admin/popup", label: "Popup Banner", icon: "M7 4V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2zm0 10V9m0 5a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2v-1a2 2 0 012-2zm10-10V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2zm0 10V9" },
  { href: "/admin/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { href: "/admin/laundry", label: "Laundry", icon: "M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm4 1h2m2 0h2m-5 4a4 4 0 108 0 4 4 0 00-8 0z" },
  { href: "/admin/partners", label: "Partners", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/admin/promos", label: "Promos", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
  { href: "/admin/customers", label: "Customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { href: "/admin/drivers", label: "Riders", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" },
  { href: "/admin/reports", label: "Reports", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { href: "/admin/wallet", label: "Wallet", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { href: "/admin/home-services", label: "Home Services", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
  { href: "/admin/settings", label: "Settings", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [pendingGrocery, setPendingGrocery] = useState(0)
  const [pendingLaundry, setPendingLaundry] = useState(0)
  const [pendingPartners, setPendingPartners] = useState(0)
  const [pendingRiders, setPendingRiders] = useState(0)
  const [notifications, setNotifications] = useState<{id:string;title:string;message:string;read:boolean}[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null)
  const prevGrocery = useRef(0)
  const prevLaundry = useRef(0)
  const playSound = useNotificationSound()
  const router = useRouter()
  const pathname = usePathname()

  // Poll pending counts every 10s
  useEffect(() => {
    async function fetchCounts() {
      const [grocery, laundry, partners, riders] = await Promise.all([
        fetch("/api/counts?type=grocery").then((r) => r.json()),
        fetch("/api/counts?type=laundry").then((r) => r.json()),
        fetch("/api/counts?type=partners").then((r) => r.json()),
        fetch("/api/counts?type=riders").then((r) => r.json()),
      ])
      const g = grocery.count || 0
      const l = laundry.count || 0
      if (g > prevGrocery.current) { playSound(); setNewOrderToast(`🛒 New grocery order received!`); setTimeout(() => setNewOrderToast(null), 5000) }
      else if (l > prevLaundry.current) { playSound(); setNewOrderToast(`🧺 New laundry booking received!`); setTimeout(() => setNewOrderToast(null), 5000) }
      prevGrocery.current = g
      prevLaundry.current = l
      setPendingGrocery(g)
      setPendingLaundry(l)
      setPendingPartners(partners.count || 0)
      setPendingRiders(riders.count || 0)
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 10000)
    return () => clearInterval(interval)
  }, [playSound])

  // Poll notifications every 15s
  useEffect(() => {
    if (!authenticated) return
    async function fetchNotifs() {
      const res = await fetch("/api/notifications?recipientType=admin")
      if (res.ok) setNotifications(await res.json())
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
    if (!token && pathname !== "/admin/login") {
      router.push("/admin/login")
    } else {
      setAuthenticated(true)
    }
    setChecking(false)
  }, [router, pathname])

  function handleLogout() {
    clearAuth()
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  // Don't show layout for login page
  if (pathname === "/admin/login") return <>{children}</>
  if (checking) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!authenticated) return null

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-gray-200 fixed h-full z-30">
        <div className="p-5 border-b border-gray-100">
          <a href="/" className="flex items-center gap-2">
            <span className="font-black text-sm text-[#1F2937] tracking-tight">Payroo</span>
            <span className="text-[10px] text-gray-400">Admin</span>
          </a>
        </div>
        <nav className="flex-1 p-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Management</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            const isExactAdmin = item.href === "/admin" && pathname === "/admin"
            const active = isActive || isExactAdmin
            const badge = item.href === "/admin/orders" ? pendingGrocery : item.href === "/admin/laundry" ? pendingLaundry : item.href === "/admin/partners" ? pendingPartners : item.href === "/admin/drivers" ? pendingRiders : 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mt-1 transition-colors ${
                  active ? "bg-[#16A34A]/10 text-[#16A34A] font-medium" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="bg-green-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">{badge}</span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-green-50 hover:text-[#16A34A] text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-black text-sm text-[#1F2937] tracking-tight">Payroo</a>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-[#16A34A]">Logout</button>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)) || (item.href === "/admin" && pathname === "/admin")
          const badge = item.href === "/admin/orders" ? pendingGrocery : item.href === "/admin/laundry" ? pendingLaundry : item.href === "/admin/partners" ? pendingPartners : item.href === "/admin/drivers" ? pendingRiders : 0
          return (
            <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center py-2 relative ${active ? "text-[#16A34A]" : "text-gray-400"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-[9px] mt-0.5">{item.label}</span>
              {badge > 0 && (
                <span className="absolute top-1 right-1/4 bg-green-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] rounded-full flex items-center justify-center px-0.5">{badge}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 md:ml-[240px] mt-14 md:mt-0 mb-16 md:mb-0">
        {/* New Order Toast */}
        {newOrderToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-[#16A34A] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <span className="text-sm font-bold">{newOrderToast}</span>
            <button onClick={() => setNewOrderToast(null)} className="text-white/70 hover:text-white ml-2 text-lg leading-none">&times;</button>
          </div>
        )}
        {/* Admin Notification Bar */}
        <div className="hidden md:flex items-center justify-end px-6 py-2 bg-white border-b border-gray-100">
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-gray-500 hover:text-[#16A34A] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 bg-green-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{notifications.filter((n) => !n.read).length}</span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b flex items-center justify-between bg-gray-50">
                  <span className="text-sm font-bold text-gray-800">Notifications</span>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <button onClick={() => fetch("/api/notifications", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ action: "markAllRead", recipientType: "admin" }) }).then(() => setNotifications(n => n.map(x => ({...x, read: true}))))} className="text-[10px] text-[#16A34A] font-medium">Mark all read</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-400 text-xs">No notifications</p>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div key={n.id} className={`px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${!n.read ? "bg-blue-50" : ""}`}>
                        <p className="text-xs font-bold text-gray-800">{n.title}</p>
                        <p className="text-[11px] text-gray-500">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
