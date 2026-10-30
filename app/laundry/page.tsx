"use client"

import { useEffect, useState } from "react"
// Firebase auth removed
import AddressPicker from "@/app/components/AddressPicker"


type LaundryOrder = {
  id: string
  service: string
  serviceName: string
  weight: number
  price: number
  pickupFee: number
  deliveryFee: number
  totalPrice: number
  pickupAddress: string
  pickupLat?: number
  pickupLng?: number
  notes: string
  status: string
  customerId: string
  customerName: string
  customerPhone: string
  partnerId: string
  partnerName: string
  createdAt: any
  paymentMethod?: string
  paymentExpiresAt?: any
}

const DEFAULT_SERVICES = [
  { id: "wash_dry_fold", name: "Wash, Dry & Fold", price: 65, unit: "per kg" },
  { id: "wash_dry", name: "Wash & Dry", price: 50, unit: "per kg" },
  { id: "dry_clean", name: "Dry Clean", price: 150, unit: "per piece" },
  { id: "iron_only", name: "Iron Only", price: 30, unit: "per kg" },
]

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: "bg-orange-100 text-orange-800",
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rider_to_customer: "bg-cyan-100 text-cyan-800",
  rider_picked_up: "bg-cyan-100 text-cyan-800",
  rider_to_laundromat: "bg-teal-100 text-teal-800",
  at_laundromat: "bg-purple-100 text-purple-800",
  washing: "bg-indigo-100 text-indigo-800",
  ready: "bg-orange-100 text-orange-800",
  rider_return_pickup: "bg-teal-100 text-teal-800",
  rider_returning: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-green-100 text-green-900",
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function LaundryPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [pmConfig, setPmConfig] = useState<any>({ cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true })
  const [partners, setPartners] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [orders, setOrders] = useState<LaundryOrder[]>([])
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [form, setForm] = useState({ service: "wash_dry_fold", weight: 3, address: "", notes: "", phone: "", lat: 0, lng: 0, paymentMethod: "cod" })
  const [userAddress, setUserAddress] = useState("")

  // Auto-detect location on load
  useEffect(() => {
    const saved = localStorage.getItem("user_location")
    if (saved) {
      const loc = JSON.parse(saved)
      setUserAddress(loc.address)
      setForm((f) => ({ ...f, address: loc.address, lat: loc.lat, lng: loc.lng }))
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            const data = await res.json()
            const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            setUserAddress(addr)
            setForm((f) => ({ ...f, address: addr, lat: latitude, lng: longitude }))
            localStorage.setItem("user_location", JSON.stringify({ address: addr, lat: latitude, lng: longitude }))
          } catch {
            setForm((f) => ({ ...f, lat: latitude, lng: longitude }))
          }
        },
        () => {},
        { enableHighAccuracy: true }
      )
    }
  }, [])
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<"shops" | "orders">("shops")
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [partnerPromos, setPartnerPromos] = useState<{ id: string; partnerId: string; partnerName: string; title: string; promoCode: string; discountPercent: number; description: string; minOrder: number; validUntil: string; active: boolean }[]>([])
  const [platformPromos, setPlatformPromos] = useState<{ id: string; title: string; discountPercent: number; description: string; applicableTo: string; minOrder: number; validUntil: string; active: boolean }[]>([])

  useEffect(() => {
    fetch("/api/delivery-settings").then(r => r.json()).then(setSettings)
    fetch("/api/settings/payment-methods").then(r => r.ok ? r.json() : {}).then((pm: any) => setPmConfig((prev: any) => ({ ...prev, ...pm })))
    fetch("/api/users?role=partner").then(r => r.json()).then((p: any[]) => {
      setPartners(p.filter((x: any) => x.status === "active"))
    })
    fetch("/api/promos?active=true").then((r) => r.json()).then((data) => {
      setPlatformPromos(data.filter((p: any) => p.applicableTo === "all" || p.applicableTo === "laundry"))
    })
  }, [])

  useEffect(() => {
    const u = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null
    if (u) {
      setUser(u)
      const token = localStorage.getItem("token")
      fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p) {
            setProfile(p)
            setWalletBalance(p.walletBalance || 0)
            setForm((f: any) => ({ ...f, address: p.address || "", phone: p.phone || "" }))
            if (p.savedAddresses) setSavedAddresses(p.savedAddresses)
          }
        })
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const iv = setInterval(async () => {
      const r = await fetch(`/api/laundry-orders?customerId=${user.uid}`)
      if (r.ok) {
        const allOrders = await r.json()
        setOrders(allOrders)
        allOrders.forEach(async (order: any) => {
          if (order.status === "awaiting_payment" && order.paymentExpiresAt) {
            if (new Date() > new Date(order.paymentExpiresAt)) {
              await fetch(`/api/laundry-orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled", cancelReason: "Payment expired" }) })
            }
          }
        })
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [user])


  const getDistanceToShop = (partner: any) => {
    if (!form.lat || !form.lng || !partner.lat || !partner.lng) return null
    return calcDistance(form.lat, form.lng, partner.lat, partner.lng)
  }

  const getPickupFee = (partner: any) => {
    return 0 // No separate pickup fee — included in delivery
  }

  const getDeliveryFee = (partner: any) => {
    if (!settings) return 0
    const km = getDistanceToShop(partner)
    if (!km) return settings.laundryBaseFare || 29
    const extraKm = Math.max(0, km - (settings.laundryBaseKm || 2))
    return Math.round((settings.laundryBaseFare || 29) + extraKm * (settings.laundryPerKmRate || 12))
  }

  const partnerServices = selectedPartner?.services?.length ? selectedPartner.services : DEFAULT_SERVICES
  const selectedService = partnerServices.find((s: any) => s.id === form.service) || partnerServices[0]
  const servicePrice = selectedService.price * form.weight
  const pickupFee = selectedPartner ? getPickupFee(selectedPartner) : 0
  const deliveryFee = selectedPartner ? getDeliveryFee(selectedPartner) : 0
  const totalPrice = servicePrice + pickupFee + deliveryFee

  const handleBook = async () => {
    if (!user || !selectedPartner || !form.address || !form.phone) return
    setSubmitting(true)
    const orderData: Record<string, any> = {
      service: form.service,
      serviceName: selectedService.name,
      weight: form.weight,
      price: servicePrice,
      pickupFee,
      deliveryFee,
      totalPrice,
      pickupAddress: form.address,
      notes: form.notes,
      status: "pending",
      customerId: user.uid,
      customerName: profile?.name || "",
      customerPhone: form.phone,
      partnerId: selectedPartner.id,
      partnerName: selectedPartner.shopName,
    }
    if (form.lat) orderData.pickupLat = form.lat
    if (form.lng) orderData.pickupLng = form.lng
    orderData.paymentMethod = form.paymentMethod

    // If online payment, set status to awaiting_payment (not visible to partner)
    if (["xendit", "qrph", "ewallet", "bank"].includes(form.paymentMethod)) {
      orderData.status = "awaiting_payment"
      orderData.paymentExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
    }

    const res = await fetch("/api/laundry-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderData) })
    const docRef = await res.json()

    // Notify admin of new laundry booking
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "admin", title: "New Laundry Booking 🧺", message: `${profile?.name || "Customer"} booked ${selectedService.name} (${form.weight}kg) from ${selectedPartner.shopName}` }) })

    // Payroo Wallet payment
    if (form.paymentMethod === "wallet") {
      await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: user.id, ownerType: "customer", type: "deduction", amount: -totalPrice, orderId: docRef.id, note: `Laundry - ${selectedService.name} (${form.weight}kg)` }) })
      setWalletBalance((prev: number) => prev - totalPrice)
      setShowBooking(false)
      setSubmitting(false)
      setTab("orders")
      return
    }

    if (["xendit", "qrph", "ewallet", "bank"].includes(form.paymentMethod)) {
      const { createXenditPayment } = await import("@/lib/xendit")
      const paymentMethods =
        form.paymentMethod === "qrph" ? ["QRPH"] :
        form.paymentMethod === "ewallet" ? ["GRABPAY", "MAYA", "SHOPEEPAY"] :
        form.paymentMethod === "bank" ? ["DD_BPI", "DD_UBP", "DD_RCBC"] :
        ["GRABPAY", "MAYA", "SHOPEEPAY", "QRPH", "DD_BPI", "DD_UBP", "DD_RCBC"]
      const payment = await createXenditPayment({
        amount: totalPrice,
        description: `Laundry - ${selectedService.name} (${form.weight}kg)`,
        externalId: `laundry_${docRef.id}`,
        paymentMethods,
        successRedirectUrl: `${window.location.origin}/laundry`,
        failureRedirectUrl: `${window.location.origin}/payment/failed?id=${docRef.id}&service=laundry`,
      })
      if (payment?.invoiceUrl) {
        window.location.href = payment.invoiceUrl
        return
      }
    }

    setSubmitting(false)
    setShowBooking(false)
    setSelectedPartner(null)
    setTab("orders")
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="font-bold text-sm">Back</span>
          </a>
          <h1 className="font-bold text-sm">Laundry Service</h1>
          <div className="w-5" />
        </div>
      </header>

      {/* Location Bar — tappable */}
      <button onClick={() => setShowAddressPicker(true)} className="w-full bg-white border-b border-gray-100 px-4 py-2 text-left">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Deliver to</p>
            <p className="text-xs text-gray-800 font-medium truncate">{userAddress || form.address || "Set your delivery address"}</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>

      <div className="max-w-2xl mx-auto pb-8">
        {/* Tabs */}
        <div className="bg-white flex border-b border-gray-200 sticky top-[48px] z-20">
          <button onClick={() => setTab("shops")} className={`flex-1 py-3 text-xs font-bold relative ${tab === "shops" ? "text-blue-600" : "text-gray-400"}`}>
            Laundry Shops
            {tab === "shops" && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-600 rounded-full" />}
          </button>
          <button onClick={() => setTab("orders")} className={`flex-1 py-3 text-xs font-bold relative ${tab === "orders" ? "text-blue-600" : "text-gray-400"}`}>
            My Orders {orders.length > 0 && `(${orders.length})`}
            {tab === "orders" && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-600 rounded-full" />}
          </button>
        </div>

        {tab === "shops" && (
          <>
            {/* Platform Promos */}
            {platformPromos.length > 0 && (
              <div className="px-4 pt-4 space-y-2">
                {platformPromos.map((promo) => (
                  <div key={promo.id} className="bg-gradient-to-r from-green-500 to-orange-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{promo.title}</p>
                        {promo.description && <p className="text-white/80 text-xs mt-0.5">{promo.description}</p>}
                        {promo.minOrder > 0 && <p className="text-white/60 text-[10px] mt-1">Min. order ₱{promo.minOrder}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black">{promo.discountPercent}%</p>
                        <p className="text-[10px] text-white/70">OFF</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Partner Shops List */}
            <div className="px-4 pt-4 space-y-3">
              {!user && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-3">Sign in to book laundry service</p>
                  <a href="/auth?redirect=/laundry" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold">Sign In</a>
                </div>
              )}

              {user && partners.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /><circle cx="12" cy="14" r="4" strokeWidth={2} /></svg>
                  <p className="text-gray-400 text-sm">No laundry shops available yet</p>
                </div>
              )}

              {user && partners.map((partner) => {
                const km = getDistanceToShop(partner)
                const dFee = getDeliveryFee(partner)
                const shopOnline = partner.isOnline !== false
                return (
                  <div key={partner.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${!shopOnline ? "border-gray-200 opacity-70" : "border-gray-100"}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-blue-50 flex items-center justify-center relative">
                            {partner.logoUrl ? (
                              <img src={partner.logoUrl} alt={partner.shopName} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" /><circle cx="12" cy="14" r="4" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h2m2 0h2" /></svg>
                            )}
                            {!shopOnline && <div className="absolute inset-0 bg-gray-900/40 rounded-full" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-gray-800">{partner.shopName}</p>
                              <span className={`w-2 h-2 rounded-full ${shopOnline ? "bg-green-500" : "bg-gray-400"}`} />
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-1">{partner.address}</p>
                            {partner.landmark && <p className="text-[10px] text-gray-500">📍 {partner.landmark}</p>}
                            <div className="flex items-center gap-2 mt-0.5">
                              {km !== null && <span className="text-[10px] text-blue-600 font-medium">{km.toFixed(1)} km</span>}
                              {partner.openTime && partner.closeTime && (
                                <span className="text-[10px] text-gray-400">🕐 {partner.openTime}–{partner.closeTime}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!shopOnline && (
                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">CLOSED</span>
                        )}
                      </div>

                      {/* Fees */}
                      <div className="flex gap-3 mt-3">
                        <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-blue-500 uppercase">Delivery Fee</p>
                          <p className="text-sm font-bold text-blue-700">₱{dFee}</p>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(partner.services?.length ? partner.services : DEFAULT_SERVICES).slice(0, 3).map((s: any) => (
                          <span key={s.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s.name}: ₱{s.price}/{s.unit.replace("per ", "")}</span>
                        ))}
                      </div>

                      {/* Partner Promos — inside card like Grab/FoodPanda */}
                      {partnerPromos.filter((p) => p.partnerId === partner.id).length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {partnerPromos.filter((p) => p.partnerId === partner.id).map((promo) => (
                            <div key={promo.id} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-orange-600">{promo.discountPercent}%</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-gray-800 truncate">{promo.title}</p>
                                {promo.promoCode ? (
                                  <p className="text-[9px] text-orange-700">Code: <span className="font-bold tracking-wide">{promo.promoCode}</span></p>
                                ) : (
                                  <p className="text-[9px] text-gray-400">Auto-applied</p>
                                )}
                              </div>
                              <span className="text-[9px] text-orange-600 font-bold flex-shrink-0">OFF</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => { if (!shopOnline) return; setSelectedPartner(partner); setForm((f) => ({ ...f, service: (partner.services?.length ? partner.services[0].id : "wash_dry_fold") })); setShowBooking(true) }}
                        disabled={!shopOnline}
                        className={`w-full mt-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${shopOnline ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                      >
                        {shopOnline ? "Book This Shop" : "Currently Closed"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === "orders" && (
          <div className="px-4 pt-4 space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-sm">No laundry orders yet</p>
              </div>
            ) : orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-gray-400">{order.createdAt?.toLocaleDateString?.(undefined, { month: "short", day: "numeric" }) || ""}</span>
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">{order.serviceName} — {order.weight}kg</p>
                <p className="text-[10px] text-gray-500 mb-2">🧺 {order.partnerName}</p>
                {/* Breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Service ({order.serviceName})</span>
                    <span className="text-gray-700">₱{order.price}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="text-gray-700">₱{order.deliveryFee}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                    <span className="text-xs font-bold text-gray-800">Total</span>
                    <span className="text-sm font-bold text-blue-600">₱{order.totalPrice}</span>
                  </div>
                  <p className="text-[9px] text-gray-400">Payment: {order.paymentMethod === "qrph" ? "QR Ph" : order.paymentMethod === "ewallet" ? "E-Wallet" : order.paymentMethod === "bank" ? "Bank Transfer" : order.paymentMethod === "xendit" ? "Online Payment" : "COD"}</p>
                </div>
                {/* Cancel button for pending/accepted orders */}
                {(order.status === "pending" || order.status === "accepted") && (
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to cancel this order?")) return
                      await fetch(`/api/laundry-orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) })
                    }}
                    className="w-full mt-3 border border-green-200 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-50"
                  >
                    Cancel Order
                  </button>
                )}
                {/* Awaiting payment — Pay Now / Cancel */}
                {order.status === "awaiting_payment" && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-orange-700 font-bold">⏳ Awaiting payment — auto-cancels in 10 minutes</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await fetch(`/api/laundry-orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled", cancelReason: "Cancelled by customer" }) })
                        }}
                        className="flex-1 border border-green-200 text-green-700 py-2.5 rounded-lg text-xs font-bold hover:bg-green-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          const { createXenditPayment } = await import("@/lib/xendit")
                          const payment = await createXenditPayment({
                            amount: order.totalPrice,
                            description: `Laundry - ${order.serviceName} (${order.weight}kg)`,
                            externalId: `laundry_${order.id}`,
                            successRedirectUrl: `${window.location.origin}/laundry`,
                            failureRedirectUrl: `${window.location.origin}/payment/failed?id=${order.id}&service=laundry`,
                          })
                          if (payment?.invoiceUrl) window.location.href = payment.invoiceUrl
                        }}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700"
                      >
                        Pay Now — ₱{order.totalPrice}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBooking && selectedPartner && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBooking(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-white">Book Pickup</h2>
                <p className="text-white/70 text-xs">{selectedPartner.shopName}</p>
              </div>
              <button onClick={() => setShowBooking(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto pb-2">
              {/* Service */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Service</label>
                <div className="mt-2 space-y-2">
                  {(selectedPartner.services?.length ? selectedPartner.services : DEFAULT_SERVICES).map((s: any) => (
                    <label key={s.id} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer ${form.service === s.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}>
                      <input type="radio" name="service" value={s.id} checked={form.service === s.id} onChange={() => setForm({ ...form, service: s.id })} className="accent-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      </div>
                      <span className="text-sm font-bold text-blue-600">₱{s.price}/{s.unit.split(" ")[1]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Estimated Weight (kg)</label>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => setForm({ ...form, weight: Math.max(1, form.weight - 1) })} className="w-10 h-10 rounded-lg bg-gray-100 font-bold text-lg">−</button>
                  <span className="text-2xl font-bold w-12 text-center">{form.weight}</span>
                  <button onClick={() => setForm({ ...form, weight: form.weight + 1 })} className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-lg">+</button>
                  <span className="text-xs text-gray-400 ml-2">kg</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "") })} placeholder="09xxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mt-2 outline-none focus:border-blue-600" />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Pickup & Delivery Address</label>
                <button
                  type="button"
                  onClick={() => setShowAddressPicker(true)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mt-2 text-left outline-none focus:border-blue-600 min-h-[44px]"
                >
                  {form.address ? (
                    <span className="text-gray-800">{form.address}</span>
                  ) : (
                    <span className="text-gray-400">Tap to set your address</span>
                  )}
                </button>
                {form.lat > 0 && <p className="text-[9px] text-green-600 mt-1">✓ Location pinned</p>}
              </div>

              {/* Notes */}
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-600" />

              {/* Price Breakdown */}
              <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{selectedService.name} × {form.weight}kg</span>
                  <span>₱{servicePrice}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₱{deliveryFee}</span>
                </div>
                <div className="border-t border-blue-200 pt-1 flex justify-between font-bold text-blue-700">
                  <span>Total</span>
                  <span>₱{totalPrice}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Payment Method</label>
                <div className="mt-2 space-y-2">
                  {/* COD */}
                  {pmConfig.cod && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${form.paymentMethod === "cod" ? "border-[#16A34A] bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="lpay" value="cod" checked={form.paymentMethod === "cod"} onChange={() => setForm({ ...form, paymentMethod: "cod" })} className="accent-[#16A34A]" />
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Cash on Delivery</p>
                      <p className="text-[11px] text-gray-400">Pay cash when rider delivers</p>
                    </div>
                  </label>
                  )}

                  {/* Payroo Wallet */}
                  {user && pmConfig.wallet && (
                    <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${form.paymentMethod === "wallet" ? "border-[#7C3AED] bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="lpay" value="wallet" checked={form.paymentMethod === "wallet"} onChange={() => setForm({ ...form, paymentMethod: "wallet" })} className="accent-[#7C3AED]" disabled={walletBalance < totalPrice} />
                      <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">Payroo Wallet</p>
                        <p className="text-[11px] text-gray-400">Balance: <span className={`font-bold ${walletBalance >= totalPrice ? "text-green-600" : "text-green-500"}`}>₱{walletBalance.toFixed(2)}</span></p>
                      </div>
                      {walletBalance < totalPrice && <span className="text-[9px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">LOW</span>}
                    </label>
                  )}

                  {/* QR PH */}
                  {pmConfig.qrph && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${form.paymentMethod === "qrph" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="lpay" value="qrph" checked={form.paymentMethod === "qrph"} onChange={() => setForm({ ...form, paymentMethod: "qrph" })} className="accent-blue-600" />
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><path strokeWidth="2" d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M20 16v2"/></svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">QR Ph</p>
                      <p className="text-[11px] text-gray-400">Scan QR with any PH banking app</p>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">INSTAPAY</span>
                  </label>
                  )}

                  {/* E-Wallets */}
                  {pmConfig.ewallet && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${form.paymentMethod === "ewallet" ? "border-[#00A0E3] bg-sky-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="lpay" value="ewallet" checked={form.paymentMethod === "ewallet"} onChange={() => setForm({ ...form, paymentMethod: "ewallet" })} className="accent-[#00A0E3]" />
                    <div className="flex gap-1">
                      <div className="w-7 h-7 bg-[#00AA13] rounded-md flex items-center justify-center text-white text-[9px] font-black">GP</div>
                      <div className="w-7 h-7 bg-[#1ABF8A] rounded-md flex items-center justify-center text-white text-[9px] font-black">M</div>
                      <div className="w-7 h-7 bg-[#EE4D2D] rounded-md flex items-center justify-center text-white text-[9px] font-black">SP</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">E-Wallet</p>
                      <p className="text-[11px] text-gray-400">GrabPay · Maya · ShopeePay</p>
                    </div>
                  </label>
                  )}

                  {/* Bank Transfer */}
                  {pmConfig.bank && (
                  <label className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition-colors ${form.paymentMethod === "bank" ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="lpay" value="bank" checked={form.paymentMethod === "bank"} onChange={() => setForm({ ...form, paymentMethod: "bank" })} className="accent-green-600" />
                    <div className="flex gap-1">
                      <div className="w-7 h-7 bg-[#CC0001] rounded-md flex items-center justify-center text-white text-[8px] font-black">BPI</div>
                      <div className="w-7 h-7 bg-[#005DAA] rounded-md flex items-center justify-center text-white text-[8px] font-black">UBP</div>
                      <div className="w-7 h-7 bg-[#005A9C] rounded-md flex items-center justify-center text-white text-[8px] font-black">RCBC</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">Bank Transfer</p>
                      <p className="text-[11px] text-gray-400">BPI · UnionBank · RCBC (Direct Debit)</p>
                    </div>
                  </label>
                  )}
                </div>
                {["qrph", "ewallet", "bank", "xendit"].includes(form.paymentMethod) && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-blue-700">You&apos;ll be redirected to a secure payment page.</p>
                  </div>
                )}
                {form.paymentMethod === "wallet" && walletBalance >= totalPrice && (
                  <div className="mt-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-[11px] text-purple-700">₱{totalPrice.toFixed(2)} will be deducted from your Payroo Wallet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              {(!form.address || !form.phone) && (
                <p className="text-[10px] text-green-500 mb-2 text-center">
                  {!form.address && !form.phone ? "Please set your address and phone number" : !form.address ? "Please set your delivery address" : "Please enter your phone number"}
                </p>
              )}
              <button onClick={handleBook} disabled={submitting || !form.address || !form.phone} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40">
                {submitting ? "Booking..." : `Confirm Booking — ₱${totalPrice}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Picker */}
      <AddressPicker
        open={showAddressPicker}
        onClose={() => setShowAddressPicker(false)}
        onSelect={(address, lat, lng) => {
          setForm((f) => ({ ...f, address, lat, lng }))
          setUserAddress(address)
          localStorage.setItem("user_location", JSON.stringify({ address, lat, lng }))
        }}
        savedAddresses={savedAddresses}
        onSaveAddress={async (addr) => {
          const updated = [...savedAddresses, addr]
          setSavedAddresses(updated)
          if (user) await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ savedAddresses: updated }) })
        }}
        onDeleteAddress={async (id) => {
          const updated = savedAddresses.filter((a) => a.id !== id)
          setSavedAddresses(updated)
          if (user) await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ savedAddresses: updated }) })
        }}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div className="max-w-lg mx-auto grid grid-cols-4 py-1.5">
          <a href="/" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-medium">Home</span>
          </a>
          <a href="/grocery" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px] font-medium">Grocery</span>
          </a>
          <a href="/laundry" className="flex flex-col items-center gap-0.5 py-1 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            <span className="text-[10px] font-bold">Laundry</span>
          </a>
          <a href="/account" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-medium">Account</span>
          </a>
        </div>
      </nav>
    </main>
  )
}
