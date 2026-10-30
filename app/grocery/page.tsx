"use client"

import { useEffect, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [storeCategories, setStoreCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<any[]>([])
  const [cartLoaded, setCartLoaded] = useState(false)
  const [userAddress, setUserAddress] = useState("")
  const [userLat, setUserLat] = useState(0)
  const [userLng, setUserLng] = useState(0)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState({ name: "", phone: "", address: "", landmark: "", notes: "", lat: 0, lng: 0, paymentMethod: "cod" })
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [deliverySettings, setDeliverySettings] = useState<any>(null)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentMethods, setPaymentMethods] = useState<any>({ cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true })
  const [addedProduct, setAddedProduct] = useState<any>(null)
  const [popupBanners, setPopupBanners] = useState<any[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("user_location")
    if (saved) { const loc = JSON.parse(saved); setUserAddress(loc.address); setUserLat(loc.lat); setUserLng(loc.lng) }
    else fetchUserLocation()
  }, [])

  const fetchUserLocation = () => {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setUserLat(latitude); setUserLng(longitude)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`)
        const data = await res.json()
        const a = data.address || {}
        const parts = [a.house_number, a.road, a.suburb || a.village || a.neighbourhood, a.city || a.town || a.municipality, a.state].filter(Boolean)
        const addr = parts.length > 0 ? parts.join(", ") : data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        setUserAddress(addr)
        localStorage.setItem("user_location", JSON.stringify({ address: addr, lat: latitude, lng: longitude }))
      } catch {
        setUserAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      } finally { setDetectingLocation(false) }
    }, () => setDetectingLocation(false), { enableHighAccuracy: true })
  }

  useEffect(() => {
    const u = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null
    if (u) {
      setUser(u)
      const token = localStorage.getItem("token")
      fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p) { setProfile(p); setWalletBalance(p.walletBalance || 0) } })
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem("cart")
    if (saved) setCart(JSON.parse(saved))
    setCartLoaded(true)
  }, [])

  useEffect(() => { if (cartLoaded) localStorage.setItem("cart", JSON.stringify(cart)) }, [cart, cartLoaded])

  useEffect(() => {
    fetch("/api/popup").then(r => r.ok ? r.json() : []).then((banners: any[]) => {
      if (!Array.isArray(banners)) return
      const enabled = banners.filter(b => b.enabled && b.imageUrl)
      if (enabled.length > 0) { setPopupBanners([enabled[Math.floor(Math.random() * enabled.length)]]); setShowPopup(true) }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) { setNotifications([]); return }
    const poll = () => fetch(`/api/notifications?recipientType=customer&recipientId=${user.id}`).then(r => r.json()).then(setNotifications).catch(() => {})
    poll()
    const iv = setInterval(poll, 15000)
    return () => clearInterval(iv)
  }, [user])

  useEffect(() => {
    fetch("/api/delivery-settings").then(async r => { try { const d = await r.json(); if (d && !d.error && typeof d === "object") setDeliverySettings(d) } catch {} }).catch(() => {})
    fetch("/api/settings/payment-methods").then(r => r.ok ? r.json() : {}).then(pm => setPaymentMethods((prev: any) => ({ ...prev, ...pm }))).catch(() => {})
  }, [])

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) { const newQty = existing.quantity + 1; setAddedProduct({ product, quantity: newQty }); return prev.map((i) => i.product.id === product.id ? { ...i, quantity: newQty } : i) }
      setAddedProduct({ product, quantity: 1 })
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0))
  }

  const cartTotal = cart.reduce((sum, i) => sum + (i.product.onSale && i.product.salePrice ? i.product.salePrice : i.product.price) * i.quantity, 0)
  const cartDeposit = cart.reduce((sum, i) => sum + (i.product.bottleDeposit || 0) * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    if (!deliverySettings) return
    const config = deliverySettings.grocery || { baseFare: 39, baseKm: 2, perKmRate: 10, surgeMultiplier: 1.5, surgeEnabled: false }
    const total = cart.reduce((sum, i) => sum + (i.product.onSale && i.product.salePrice ? i.product.salePrice : i.product.price) * i.quantity, 0)
    if (total >= (deliverySettings.freeDeliveryMinOrder || 1000)) { setDeliveryFee(0); return }
    if (checkoutForm.lat && checkoutForm.lng && deliverySettings.storeLat && deliverySettings.storeLng) {
      const R = 6371
      const dLat = (checkoutForm.lat - deliverySettings.storeLat) * Math.PI / 180
      const dLng = (checkoutForm.lng - deliverySettings.storeLng) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(deliverySettings.storeLat * Math.PI / 180) * Math.cos(checkoutForm.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      let fee = config.baseFare + (Math.max(0, km - config.baseKm) * config.perKmRate)
      if (config.surgeEnabled) fee *= config.surgeMultiplier
      setDeliveryFee(Math.round(fee))
    } else { setDeliveryFee(config.baseFare) }
  }, [checkoutForm.lat, checkoutForm.lng, deliverySettings, cart])

  const detectLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setCheckoutForm((prev) => ({ ...prev, lat: latitude, lng: longitude }))
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        let address = ""
        if (apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`)
          const data = await res.json()
          if (data.results?.[0]) address = data.results[0].formatted_address
        }
        if (!address) {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`)
          const data = await res.json()
          const a = data.address || {}
          const parts = [a.house_number, a.road, a.suburb || a.village || a.neighbourhood, a.city || a.town || a.municipality, a.state].filter(Boolean)
          address = parts.length > 0 ? parts.join(", ") : data.display_name || ""
        }
        setCheckoutForm((prev) => ({ ...prev, address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, lat: latitude, lng: longitude }))
      } catch { setCheckoutForm((prev) => ({ ...prev, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })) }
      finally { setLocating(false) }
    }, () => { alert("Unable to get location"); setLocating(false) }, { enableHighAccuracy: true })
  }

  const handleCheckout = async () => {
    if (!user) { window.location.href = "/auth?redirect=/grocery"; return }
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart.map((i: any) => ({ name: i.product.name, price: i.product.price, quantity: i.quantity, productId: i.product.id, imageUrl: i.product.imageUrl })), total: cartTotal + cartDeposit + deliveryFee, customerId: user?.id || null, customerName: checkoutForm.name, customerPhone: checkoutForm.phone, deliveryAddress: checkoutForm.address + (checkoutForm.landmark ? ` (Landmark: ${checkoutForm.landmark})` : ""), status: "pending", paymentMethod: checkoutForm.paymentMethod, deliveryType: new Date().getHours() < 15 ? "same_day" : "next_day", notes: checkoutForm.notes || "", deliveryLat: checkoutForm.lat || undefined, deliveryLng: checkoutForm.lng || undefined }) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Order failed") }
      const order = await res.json()
      const orderId = order.id
      if (!orderId) throw new Error("No order ID returned")
      setCart([]); setShowCheckout(false); setShowCart(false)
      if (checkoutForm.paymentMethod === "wallet") {
        await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: user.id, ownerType: "customer", type: "deduction", amount: -(cartTotal + cartDeposit + deliveryFee), orderId, note: `Grocery order #${orderId.slice(-6).toUpperCase()}` }) })
        setWalletBalance((prev: number) => prev - (cartTotal + cartDeposit + deliveryFee))
        window.location.href = `/order?id=${orderId}`; return
      }
      if (["qrph", "ewallet", "bank"].includes(checkoutForm.paymentMethod)) {
        const { createXenditPayment } = await import("@/lib/xendit")
        const total = cartTotal + cartDeposit + deliveryFee
        const pms = checkoutForm.paymentMethod === "qrph" ? ["QRPH"] : checkoutForm.paymentMethod === "ewallet" ? ["GRABPAY", "MAYA", "SHOPEEPAY"] : ["DD_BPI", "DD_UBP", "DD_RCBC"]
        const payment = await createXenditPayment({ amount: total, description: `Grocery #${orderId.slice(-6).toUpperCase()}`, externalId: `order_${orderId}`, paymentMethods: pms, successRedirectUrl: `${window.location.origin}/order?id=${orderId}`, failureRedirectUrl: `${window.location.origin}/payment/failed?id=${orderId}&service=grocery` })
        if (payment?.invoiceUrl) { window.location.href = payment.invoiceUrl; return }
      }
      window.location.href = `/order?id=${orderId}`
    } catch (e) { console.error("Order error:", e); alert("Failed to place order. Please try again.") }
    finally { setSubmitting(false) }
  }

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setProfile(null) }

  useEffect(() => {
    if (profile && !checkoutForm.name) setCheckoutForm((prev) => ({ ...prev, name: profile.name || prev.name, phone: profile.phone || prev.phone, address: profile.address || userAddress || prev.address }))
  }, [profile])

  useEffect(() => {
    if (userAddress && !checkoutForm.address) setCheckoutForm((prev) => ({ ...prev, address: userAddress, lat: userLat, lng: userLng }))
  }, [userAddress])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pos-products")
        let data: any = []
        try { data = await res.json() } catch {}
        const prods: any[] = Array.isArray(data) ? data : []
        for (let i = prods.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[prods[i], prods[j]] = [prods[j], prods[i]] }
        setProducts(prods)
        const cats = [...new Set(prods.map((p: any) => p.category).filter(Boolean))]
        setCategories(cats as any)
        setStoreCategories((cats as string[]).map((name: string) => ({ id: name, name })))
      } catch (e) { console.error("Failed to load products:", e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = Array.isArray(products) ? products.filter((p) => {
    const matchCat = selectedCategory === "All" || p.category === selectedCategory
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch && p.stock > 0
  }) : []

  const fallbackCategoryList = [
    { label: "Beverages", emoji: "🧃" },
    { label: "Snacks", emoji: "🍪" },
    { label: "Household", emoji: "🧹" },
    { label: "Condiments", emoji: "🧂" },
    { label: "Frozen", emoji: "🧊" },
    { label: "Personal Care", emoji: "🧴" },
    { label: "Canned Goods", emoji: "🥫" },
    { label: "Dairy & Eggs", emoji: "🥚" },
    { label: "Rice", emoji: "🍚" },
    { label: "Fruits & Vegetables", emoji: "🥦" },
    { label: "Meat & Seafood", emoji: "🥩" },
    { label: "Bread & Pastry", emoji: "🍞" },
    { label: "Medicine & Health", emoji: "💊" },
    { label: "Others", emoji: "🛒" },
  ]

  const categoryList = storeCategories.length > 0
    ? storeCategories.map((c) => ({ label: c.name, emoji: c.imageUrl ? undefined : "📂", icon: c.imageUrl }))
    : fallbackCategoryList

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isSameDay = mounted && new Date().getHours() < 15
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <main className="min-h-screen bg-[#F4F5F7] pb-24" suppressHydrationWarning>

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-50 shadow-lg" suppressHydrationWarning>
        {/* Top bar */}
        <div className="bg-[#0B5E34] text-white text-xs" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8" suppressHydrationWarning>
            <button onClick={fetchUserLocation} disabled={detectingLocation} className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors">
              <svg className={`w-3 h-3 shrink-0 ${detectingLocation ? "animate-pulse" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="max-w-[220px] truncate text-white/80">{detectingLocation ? "Detecting..." : userAddress || "Set your location"}</span>
            </button>
            <div className="flex items-center gap-3 text-white/70">
              {mounted && user ? (
                <>
                  <a href="/account" className="hover:text-yellow-300 transition-colors">{profile?.name || "My Account"}</a>
                  <span className="text-white/30">|</span>
                  <a href="/account" className="hover:text-yellow-300 transition-colors">Orders</a>
                  <span className="text-white/30">|</span>
                  <button onClick={handleLogout} className="hover:text-yellow-300 transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <a href="/auth?redirect=/grocery" className="hover:text-yellow-300 transition-colors">Sign In</a>
                  <span className="text-white/30">|</span>
                  <a href="/auth?redirect=/grocery" className="hover:text-yellow-300 transition-colors">Register</a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main header */}
        <header className="bg-[#16A34A]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            {/* Logo */}
            <a href="/" className="shrink-0 flex items-center gap-2">
              <div className="w-9 h-9 bg-[#FF8A00] rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-black text-sm">G</span>
              </div>
              <span className="text-white font-black text-lg tracking-tight hidden sm:block">Gruwcer</span>
            </a>

            {/* Search */}
            <div className="flex-1 flex">
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-white text-gray-800 placeholder-gray-400 rounded-l-lg"
              />
              <button className="bg-[#FF8A00] hover:bg-[#e07800] px-4 rounded-r-lg transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>

            {/* Notifications */}
            {user && (
              <div className="relative shrink-0">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-white p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF8A00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b flex items-center justify-between bg-gray-50">
                      <span className="text-xs font-bold text-gray-700">Notifications</span>
                      {unreadCount > 0 && <button onClick={() => fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markAllRead", recipientType: "customer", recipientId: user.id }) }).then(() => setNotifications((n: any[]) => n.map(x => ({ ...x, read: true }))))} className="text-[10px] text-[#16A34A] font-bold">Mark all read</button>}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? <p className="p-4 text-center text-gray-400 text-xs">No notifications</p> : notifications.slice(0, 8).map((n) => (
                        <div key={n.id} className={`px-4 py-2.5 border-b border-gray-50 ${!n.read ? "bg-green-50" : ""}`}>
                          <p className="text-xs font-bold text-gray-800">{n.title}</p>
                          <p className="text-[11px] text-gray-500">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart button */}
            <button onClick={() => setShowCart(true)} className="shrink-0 relative bg-[#FF8A00] hover:bg-[#e07800] text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              <span className="text-sm font-bold hidden sm:block">Cart</span>
              {cartCount > 0 && <span className="bg-white text-[#16A34A] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
          </div>

          {/* Delivery badge strip */}
          <div className={`${isSameDay ? "bg-[#FF8A00]" : "bg-blue-600"} py-1.5`} suppressHydrationWarning>
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
              <p className="text-white text-[11px] font-bold">
                {isSameDay ? "⚡ Same-Day Delivery" : "🌙 Next-Day Delivery"}
                <span className="font-normal text-white/80 ml-1">{isSameDay ? "• Order before 3:00 PM" : "• Orders after 3PM delivered tomorrow"}</span>
              </p>
            </div>
          </div>
        </header>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 mt-4">

        {/* HERO SLIDER */}
        <HeroSlider />

        {/* CATEGORY PILLS */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-sm text-gray-800 uppercase tracking-wide">Shop by Category</h2>
            <span className="text-[10px] text-gray-400">{categories.length} categories</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${selectedCategory === "All" ? "bg-[#16A34A] border-[#16A34A] text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-[#16A34A] hover:text-[#16A34A]"}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              All
            </button>
            {categoryList.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all whitespace-nowrap ${selectedCategory === cat.label ? "bg-[#16A34A] border-[#16A34A] text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-[#16A34A] hover:text-[#16A34A]"}`}
              >
                {(cat as any).icon ? <img src={(cat as any).icon} alt={cat.label} className="w-4 h-4 object-contain" /> : <span className="text-sm leading-none">{(cat as any).emoji}</span>}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-base text-gray-800">
                {selectedCategory === "All" ? "All Products" : selectedCategory}
              </h2>
              {!loading && <p className="text-xs text-gray-400 mt-0.5">{filtered.length} items available</p>}
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-xs text-[#16A34A] font-bold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm relative">
                  <div className="absolute inset-0 overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  </div>
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-8 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <p className="text-gray-500 font-bold">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different category or search term</p>
              <button onClick={() => { setSelectedCategory("All"); setSearchQuery("") }} className="mt-4 bg-[#16A34A] text-white px-6 py-2 rounded-full text-sm font-bold">Browse All</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADDED TO CART MODAL */}
      {addedProduct && (
        <AddedToCartModal product={addedProduct.product} quantity={addedProduct.quantity} onClose={() => setAddedProduct(null)} onUpdateQuantity={updateQuantity} cartCount={cartCount} onViewCart={() => { setAddedProduct(null); setShowCart(true) }} />
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="bg-[#16A34A] px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-black text-lg text-white">Your Cart</h2>
                <p className="text-white/70 text-xs">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                {cart.length > 0 && <button onClick={() => { if (confirm("Clear cart?")) setCart([]) }} className="text-white/60 hover:text-white text-xs font-bold">Clear</button>}
                <button onClick={() => setShowCart(false)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
              </div>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                </div>
                <p className="font-bold text-gray-600">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-1">Add some products to get started</p>
                <button onClick={() => setShowCart(false)} className="mt-4 bg-[#16A34A] text-white px-6 py-2 rounded-full text-sm font-bold">Shop Now</button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                        {item.product.imageUrl ? <img src={item.product.imageUrl} className="w-12 h-12 object-contain" /> : <span className="text-2xl">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-[#16A34A] font-black text-sm">₱{((item.product.onSale && item.product.salePrice ? item.product.salePrice : item.product.price) * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition-colors">−</button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-sm flex items-center justify-center transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 p-4 bg-white shrink-0">
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₱{cartTotal.toFixed(2)}</span></div>
                    {cartDeposit > 0 && <div className="flex justify-between text-sm text-orange-600"><span>Bottle Deposit</span><span>₱{cartDeposit.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-black text-base pt-1 border-t border-gray-100"><span>Total</span><span className="text-[#16A34A]">₱{(cartTotal + cartDeposit).toFixed(2)}</span></div>
                  </div>
                  <button onClick={() => { setShowCart(false); if (!user) { window.location.href = "/auth?redirect=/grocery" } else { setShowCheckout(true); if (!checkoutForm.lat) detectLocation() } }} className="w-full bg-[#FF8A00] hover:bg-[#e07800] text-white py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg">
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl" style={{ animation: "slideUp 0.25s ease-out" }}>
            <div className="bg-[#16A34A] px-6 py-4 flex items-center justify-between">
              <div><h2 className="font-black text-lg text-white">Checkout</h2><p className="text-white/70 text-xs">Complete your delivery details</p></div>
              <button onClick={() => setShowCheckout(false)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Contact</p>
                <input placeholder="Full Name" value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="w-full border-2 border-gray-100 focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
                <input type="tel" placeholder="Phone Number" value={checkoutForm.phone} onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value.replace(/[^0-9]/g, "") })} className="w-full border-2 border-gray-100 focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Delivery Address</p>
                <textarea placeholder="Street address, barangay, city..." value={checkoutForm.address} onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} className="w-full border-2 border-gray-100 focus:border-[#16A34A] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none" rows={2} />
                <button onClick={detectLocation} disabled={locating} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-xl py-2.5 text-sm font-bold hover:bg-blue-100 transition-colors disabled:opacity-50">
                  {locating ? "Detecting..." : "📍 Use My Current Location"}
                </button>
                {checkoutForm.lat !== 0 && <p className="text-[10px] text-green-600 font-bold">✓ Location pinned</p>}
                <input placeholder="Landmark (required)" value={checkoutForm.landmark} onChange={(e) => setCheckoutForm({ ...checkoutForm, landmark: e.target.value })} className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none transition-colors ${!checkoutForm.landmark.trim() ? "border-orange-200 bg-orange-50/30" : "border-gray-100 focus:border-[#16A34A]"}`} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Payment</p>
                {paymentMethods.cod && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${checkoutForm.paymentMethod === "cod" ? "border-[#16A34A] bg-green-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="payment" value="cod" checked={checkoutForm.paymentMethod === "cod"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "cod" })} className="accent-[#16A34A]" />
                    <span className="text-xl">💵</span>
                    <div><p className="text-sm font-bold">Cash on Delivery</p><p className="text-[11px] text-gray-400">Pay when order arrives</p></div>
                  </label>
                )}
                {user && paymentMethods.wallet && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${checkoutForm.paymentMethod === "wallet" ? "border-purple-500 bg-purple-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="payment" value="wallet" checked={checkoutForm.paymentMethod === "wallet"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "wallet" })} className="accent-purple-500" disabled={walletBalance < (cartTotal + cartDeposit + deliveryFee)} />
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
                    <div className="flex-1"><p className="text-sm font-bold">Wallet</p><p className="text-[11px] text-gray-400">Balance: <span className="font-bold text-green-600">₱{walletBalance.toFixed(2)}</span></p></div>
                  </label>
                )}
                {paymentMethods.qrph && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${checkoutForm.paymentMethod === "qrph" ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <input type="radio" name="payment" value="qrph" checked={checkoutForm.paymentMethod === "qrph"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "qrph" })} className="accent-blue-500" />
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-black">QR</div>
                    <div><p className="text-sm font-bold">QR Ph</p><p className="text-[11px] text-gray-400">Any PH banking app</p></div>
                    <span className="ml-auto text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">INSTAPAY</span>
                  </label>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Items ({cartCount})</span><span>₱{cartTotal.toFixed(2)}</span></div>
                {cartDeposit > 0 && <div className="flex justify-between text-sm text-orange-600"><span>Bottle Deposit</span><span>₱{cartDeposit.toFixed(2)}</span></div>}
                <div className="flex justify-between text-sm"><span className={deliveryFee === 0 ? "text-green-600" : "text-gray-600"}>Delivery</span><span className={deliveryFee === 0 ? "text-green-600 font-bold" : ""}>{deliveryFee === 0 ? "FREE" : `₱${deliveryFee.toFixed(2)}`}</span></div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-gray-200"><span>Total</span><span className="text-[#16A34A]">₱{(cartTotal + cartDeposit + deliveryFee).toFixed(2)}</span></div>
              </div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 shrink-0">
              <button onClick={handleCheckout} disabled={submitting || !checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.landmark.trim()} className="w-full bg-[#FF8A00] hover:bg-[#e07800] text-white py-4 rounded-xl font-black text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg">
                {submitting ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Placing Order...</> : <>🛒 Place Order • ₱{(cartTotal + cartDeposit + deliveryFee).toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div className="grid grid-cols-4 py-1.5">
          <a href="/" className="flex flex-col items-center gap-0.5 py-1 text-gray-400"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg><span className="text-[10px]">Home</span></a>
          <a href="/grocery" className="flex flex-col items-center gap-0.5 py-1 text-[#16A34A]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg><span className="text-[10px] font-bold">Grocery</span></a>
          <button onClick={() => setShowCart(true)} className="flex flex-col items-center gap-0.5 py-1 text-gray-400 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            {cartCount > 0 && <span className="absolute top-0.5 right-4 w-4 h-4 bg-[#FF8A00] text-white text-[9px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
            <span className="text-[10px]">Cart</span>
          </button>
          <a href="/account" className="flex flex-col items-center gap-0.5 py-1 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-[10px]">Account</span></a>
        </div>
      </nav>

      {/* POPUP BANNER */}
      {showPopup && popupBanners.length > 0 && popupBanners[0].imageUrl && (
        <PopupModal banner={popupBanners[0]} onClose={() => setShowPopup(false)} />
      )}
    </main>
  )
}

function ProductCard({ product, onAdd }: any) {
  const hasDiscount = product.onSale && product.salePrice
  const displayPrice = hasDiscount ? product.salePrice : product.price
  const discount = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group border border-gray-100">
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden p-3">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <svg className="w-14 h-14 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#FF8A00] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">-{discount}%</span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Few left</span>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[32px]">{product.name}</h4>
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-[#16A34A] font-black text-base">₱{displayPrice.toFixed(2)}</span>
            {hasDiscount && <span className="block text-gray-400 text-[10px] line-through">₱{product.price.toFixed(2)}</span>}
          </div>
        </div>
        {product.bottleDeposit ? <p className="text-[10px] text-orange-500 font-medium mt-0.5">+₱{product.bottleDeposit} deposit</p> : null}
        <button
          onClick={() => onAdd(product)}
          className="w-full mt-2.5 bg-[#16A34A] hover:bg-[#15803d] active:scale-95 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add to Cart
        </button>
      </div>
    </div>
  )
}

function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [slides, setSlides] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  const fallbackSlides = [
    { id: "1", badge: "Express Delivery", title: "Fast Delivery", highlight: "To Your Doorstep", description: "Fresh groceries delivered same day. Free shipping on orders ₱1,000+!", imageUrl: "", bgColor: "#16A34A" },
    { id: "2", badge: "New Arrivals", title: "Fresh Products", highlight: "Every Single Day", description: "Quality fruits, vegetables, and essentials sourced daily.", imageUrl: "", bgColor: "#0B5E34" },
    { id: "3", badge: "Hot Deals", title: "Save Up To", highlight: "50% Off Today", description: "Sign up and unlock exclusive member deals and discounts!", imageUrl: "", bgColor: "#FF8A00" },
  ]

  useEffect(() => {
    fetch("/api/hero").then(r => r.json()).then(data => setSlides(Array.isArray(data) && data.length > 0 ? data : fallbackSlides)).catch(() => setSlides(fallbackSlides)).finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4500)
    return () => clearInterval(t)
  }, [slides.length])

  if (!loaded) return (
    <div className="relative rounded-2xl overflow-hidden h-[180px] md:h-[260px] bg-gray-200">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10 gap-3">
        <div className="h-5 w-24 bg-gray-300 rounded-full" />
        <div className="h-8 w-48 bg-gray-300 rounded-xl" />
        <div className="h-4 w-64 bg-gray-300 rounded-full" />
        <div className="h-8 w-28 bg-gray-300 rounded-full mt-1" />
      </div>
    </div>
  )

  const slide = slides[current]
  return (
    <div className="relative rounded-2xl overflow-hidden h-[180px] md:h-[260px] shadow-md"
      style={{ backgroundColor: slide.bgColor, backgroundImage: slide.imageUrl ? `linear-gradient(to right,rgba(0,0,0,0.55),rgba(0,0,0,0.1)),url(${slide.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
        {slide.badge && <span className="inline-flex self-start items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-2 text-white text-[10px] font-black uppercase tracking-wider">⚡ {slide.badge}</span>}
        <h1 className="text-xl md:text-3xl font-black text-white leading-tight">{slide.title}<br /><span className="text-[#FFD23F]">{slide.highlight}</span></h1>
        <p className="text-white/80 text-xs md:text-sm mt-1.5 max-w-xs line-clamp-2">{slide.description}</p>
        <a href="/grocery" className="mt-3 self-start bg-[#FF8A00] hover:bg-[#e07800] text-white font-black px-5 py-2 rounded-full text-xs transition-colors shadow-lg">Shop Now →</a>
      </div>
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {slides.map((_, i) => <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "bg-white w-5" : "bg-white/40 w-1.5"}`} />)}
        </div>
      )}
    </div>
  )
}

function AddedToCartModal({ product, quantity, onClose, onUpdateQuantity, cartCount, onViewCart }: any) {
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "22rem", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <svg style={{ width: 28, height: 28, color: "#16A34A" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        </div>
        <p style={{ fontWeight: 900, fontSize: "1rem", color: "#1F2937" }}>Added to Cart!</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f9fafb", borderRadius: "12px", padding: "0.75rem", marginTop: "0.75rem" }}>
          <div style={{ width: 48, height: 48, background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb", flexShrink: 0 }}>
            {product.imageUrl ? <img src={product.imageUrl} style={{ width: 40, height: 40, objectFit: "contain" }} /> : <span style={{ fontSize: "1.5rem" }}>📦</span>}
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</p>
            <p style={{ color: "#16A34A", fontWeight: 900, fontSize: "0.875rem" }}>₱{((product.onSale && product.salePrice ? product.salePrice : product.price) * quantity).toFixed(2)}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={() => { if (quantity <= 1) { onUpdateQuantity(product.id, -1); onClose() } else { onUpdateQuantity(product.id, -1) } }} style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", border: "none", fontSize: "1.25rem", fontWeight: "bold", cursor: "pointer" }}>−</button>
          <span style={{ fontSize: "1.125rem", fontWeight: 900, width: 32, textAlign: "center" }}>{quantity}</span>
          <button onClick={() => onUpdateQuantity(product.id, 1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "#16A34A", color: "#fff", border: "none", fontSize: "1.25rem", fontWeight: "bold", cursor: "pointer" }}>+</button>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button onClick={onClose} style={{ flex: 1, border: "2px solid #e5e7eb", background: "#fff", padding: "0.625rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Continue</button>
          <button onClick={onViewCart} style={{ flex: 1, background: "#FF8A00", color: "#fff", padding: "0.625rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 900, border: "none", cursor: "pointer" }}>View Cart ({cartCount})</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PopupModal({ banner, onClose }: { banner: any; onClose: () => void }) {
  useLayoutEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = "" } }, [])
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "-44px", left: "50%", transform: "translateX(-50%)", width: 36, height: 36, background: "transparent", border: "2px solid #fff", borderRadius: "50%", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
        {banner.linkUrl ? <a href={banner.linkUrl} onClick={onClose}><img src={banner.imageUrl} alt="Promo" style={{ maxWidth: "min(380px, 90vw)", maxHeight: "75vh", display: "block" }} /></a> : <img src={banner.imageUrl} alt="Promo" style={{ maxWidth: "min(380px, 90vw)", maxHeight: "75vh", display: "block" }} />}
      </div>
    </div>,
    document.body
  )
}
