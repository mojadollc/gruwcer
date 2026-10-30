"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useNotificationSound } from "@/app/components/useNotificationSound"

const STATUS_STEPS: { key: string; label: string; icon: string; description: string }[] = [
  { key: "pending", label: "Order Placed", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", description: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", description: "Store accepted your order" },
  { key: "preparing", label: "Preparing", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", description: "Your items are being prepared" },
  { key: "ready_for_pickup", label: "Ready", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", description: "Order is ready for pickup" },
  { key: "out_for_delivery", label: "On the Way", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0", description: "Rider is heading to you" },
  { key: "delivered", label: "Delivered", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", description: "Order delivered!" },
]

function getStepIndex(status: string): number {
  if (status === "rider_accepted" || status === "rider_at_store") return 3
  if (status === "rider_picked_up" || status === "out_for_delivery") return 4
  const idx = STATUS_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

function OrderTracker() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const validId = id && id !== "undefined" && id !== "null" ? id : null
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [riderRating, setRiderRating] = useState(0)
  const [storeRating, setStoreRating] = useState(0)
  const [review, setReview] = useState("")
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [statusToast, setStatusToast] = useState("")
  // Chat
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  // Report
  const [showReport, setShowReport] = useState(false)
  const [reportForm, setReportForm] = useState({ type: "order" as "rider" | "order" | "product" | "other", subject: "", description: "" })
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const playSound = useNotificationSound()
  const prevStatus = useRef<string | null>(null)

  useEffect(() => {
    if (!validId) { setLoading(false); return }
    const poll = () => fetch(`/api/orders/${validId}`).then(r => r.ok ? r.json() : null).then((o: any) => {
      if (!o) return
      if (prevStatus.current && prevStatus.current !== o.status) {
        playSound()
        const label = o.status.replace(/_/g, " ")
        setStatusToast(`Order ${label}`)
        setTimeout(() => setStatusToast(""), 3000)
      }
      prevStatus.current = o.status
      setOrder(o)
      setLoading(false)
    })
    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [validId, playSound])

  // Chat listener
  useEffect(() => {
    if (!validId) return
    const pollChat = () => fetch(`/api/orders/${validId}`).then(r => r.ok ? r.json() : null).then((o: any) => {
      if (o?.chats) { setChatMessages(o.chats); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100) }
    })
    pollChat()
    const iv = setInterval(pollChat, 3000)
    return () => clearInterval(iv)
  }, [validId])

  const handleSendChat = async () => {
    if (!chatInput.trim() || !validId || !order) return
    await fetch("/api/orders/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: validId, senderId: order.customerId || "customer", senderName: order.customerName, senderRole: "customer", message: chatInput.trim() }) }).catch(() => {})
    setChatInput("")
  }

  const handleSubmitReport = async () => {
    if (!reportForm.subject || !reportForm.description || !order) return
    setReportSubmitting(true)
    await fetch("/api/admin/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      orderId: validId || undefined,
      customerId: order.customerId || "unknown",
      customerName: order.customerName,
      customerEmail: "",
      type: reportForm.type,
      subject: reportForm.subject,
      description: reportForm.description,
      status: "pending",
    }) })
    setReportSubmitting(false)
    setReportSubmitted(true)
  }

  if (!validId) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500 font-bold">Invalid order link. Please check your order history.</p></div>
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your order...</p>
      </div>
    </div>
  )
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p className="text-green-500">Order not found</p></div>

  const currentStep = getStepIndex(order.status)
  const isActive = !["delivered", "cancelled", "rejected"].includes(order.status)
  const isRiderAssigned = ["rider_accepted", "rider_at_store", "rider_picked_up", "out_for_delivery"].includes(order.status)
  const hasRiderLocation = !!(order.driverLat && order.driverLng)
  const hasDeliveryLocation = !!(order.deliveryLat && order.deliveryLng)
  const showMap = isRiderAssigned && (hasRiderLocation || hasDeliveryLocation)

  // ETA calculation
  const getETA = () => {
    if (order.estimatedDeliveryMinutes) return `${order.estimatedDeliveryMinutes} min`
    if (order.status === "pending") return "15-25 min"
    if (order.status === "confirmed") return "12-20 min"
    if (order.status === "preparing") return "10-15 min"
    if (order.status === "ready_for_pickup") return "8-12 min"
    if (["rider_accepted", "rider_at_store", "rider_picked_up", "out_for_delivery"].includes(order.status)) return "5-10 min"
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#16A34A] text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="font-bold text-sm">Back to Shop</span>
          </a>
          <span className="text-xs text-white/70">#{validId!.slice(-8).toUpperCase()}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto pb-8">
        {/* ETA Banner */}
        {isActive && getETA() && (
          <div className="bg-white border-b border-gray-100 px-4 py-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Estimated Delivery</p>
            <p className="text-3xl font-black text-[#1F2937] mt-1">{getETA()}</p>
            {order.status === "out_for_delivery" && <p className="text-xs text-green-600 mt-1 font-medium">🛵 Rider is on the way!</p>}
          </div>
        )}

        {/* Cancelled/Rejected Banner */}
        {(order.status === "cancelled" || order.status === "rejected") && (
          <div className="bg-green-50 border-b border-green-100 px-4 py-4 text-center">
            <p className="text-green-700 font-bold">{order.status === "rejected" ? "Order Rejected" : "Order Cancelled"}</p>
            <p className="text-xs text-green-400 mt-1">Please contact support if you need help</p>
          </div>
        )}

        {/* Live Map - Rider Location */}
        {showMap && (
          <div className="bg-white border-b border-gray-100">
            {hasRiderLocation && hasDeliveryLocation ? (
              <iframe
                key={`${order.driverLat}-${order.driverLng}`}
                className="h-56 w-full border-0"
                loading="lazy"
                src={`https://maps.google.com/maps/dir/${order.driverLat},${order.driverLng}/${order.deliveryLat},${order.deliveryLng}/@${order.driverLat},${order.driverLng},14z/data=!3m1!4b1!4m2!4m1!3e0?output=embed`}
              />
            ) : (
              <iframe
                key={`${order.driverLat || order.deliveryLat}`}
                className="h-56 w-full border-0"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${hasRiderLocation ? `${order.driverLat},${order.driverLng}` : `${order.deliveryLat},${order.deliveryLng}`}&z=15&output=embed`}
              />
            )}
            {order.driverName && (
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{order.driverName}</p>
                    <p className="text-[10px] text-gray-400">Your delivery rider</p>
                  </div>
                </div>
                {order.customerPhone && (
                  <a href={`tel:${order.customerPhone}`} className="w-10 h-10 bg-green-50 border border-green-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Steps - Vertical Timeline */}
        <div className="bg-white px-4 py-6 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-800 mb-4">Order Status</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i < currentStep
              const isCurrent = i === currentStep
              const isPending = i > currentStep
              return (
                <div key={step.key} className="flex gap-3">
                  {/* Line + Dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-[#16A34A] text-white ring-4 ring-green-100" : "bg-gray-200 text-gray-400"
                    }`}>
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} /></svg>
                      )}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pt-1 pb-4">
                    <p className={`text-sm font-medium ${isCurrent ? "text-[#16A34A]" : isCompleted ? "text-green-700" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                    {(isCurrent || isCompleted) && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{step.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white px-4 py-5 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {order.items.map((item: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 ${item.outOfStock ? "opacity-60" : ""}`}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                  {item.imageUrl ? <img src={item.imageUrl} className="w-8 h-8 object-contain" /> : <span className="text-sm">📦</span>}
                  {item.outOfStock && <div className="absolute inset-0 bg-green-500/10 rounded-lg" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${item.outOfStock ? "text-green-400 line-through" : "text-gray-800"}`}>{item.name}</p>
                  {item.outOfStock ? (
                    <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">OUT OF STOCK</span>
                  ) : (
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  )}
                </div>
                <span className={`text-sm font-bold ${item.outOfStock ? "text-green-300 line-through" : "text-gray-800"}`}>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.items.some((i: any) => i.outOfStock) && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-[10px] text-green-800 font-bold">⚠️ Some items are out of stock and have been removed from your total.</p>
            </div>
          )}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-bold text-sm">Total</span>
            <span className="font-bold text-[#16A34A] text-lg">₱{order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white px-4 py-5 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-800 mb-3">Delivery Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400">📍</span>
              <span className="text-gray-600">{order.deliveryAddress}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">👤</span>
              <span className="text-gray-600">{order.customerName}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">📱</span>
              <span className="text-gray-600">{order.customerPhone}</span>
            </div>
            {order.notes && (
              <div className="flex gap-2">
                <span className="text-gray-400">📝</span>
                <span className="text-gray-600">{order.notes}</span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex gap-2">
                <span className="text-gray-400">💳</span>
                <span className="text-gray-600">{order.paymentMethod === "qrph" ? "QR Ph" : order.paymentMethod === "ewallet" ? "E-Wallet (GrabPay/Maya/ShopeePay)" : order.paymentMethod === "bank" ? "Bank Transfer (BPI/UBP/RCBC)" : order.paymentMethod === "xendit" ? "Online Payment" : "Cash on Delivery"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Section - Shows after delivery */}
        {order.status === "delivered" && !order.riderRating && !ratingSubmitted && (
          <div className="bg-white px-4 py-5">
            <h2 className="font-bold text-sm text-gray-800 mb-4">Rate Your Experience</h2>

            {/* Rate Rider */}
            {order.driverName && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">🏍️ Rate Rider: {order.driverName}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRiderRating(star)} className={`text-2xl transition-transform ${star <= riderRating ? "text-yellow-400 scale-110" : "text-gray-300"}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rate Store */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">🏪 Rate Store / Products</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setStoreRating(star)} className={`text-2xl transition-transform ${star <= storeRating ? "text-yellow-400 scale-110" : "text-gray-300"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}
            <textarea
              placeholder="Write a review (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] resize-none mb-3"
              rows={2}
            />

            <button
              onClick={async () => {
                if (!id || (!riderRating && !storeRating)) return
                await fetch(`/api/orders/${validId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ riderRating: riderRating || undefined, storeRating: storeRating || undefined, review: review || undefined }) })
                setRatingSubmitted(true)
              }}
              disabled={!riderRating && !storeRating}
              className="w-full bg-[#16A34A] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#15803d] transition-colors disabled:opacity-40"
            >
              Submit Rating
            </button>
          </div>
        )}

        {/* Rating Already Submitted */}
        {(order.riderRating || ratingSubmitted) && order.status === "delivered" && (
          <div className="bg-white px-4 py-5 text-center">
            <p className="text-green-600 font-bold text-sm">✓ Thank you for your feedback!</p>
            {order.riderRating && <p className="text-xs text-gray-400 mt-1">Rider: {"★".repeat(order.riderRating)} | Store: {"★".repeat(order.storeRating || 0)}</p>}
          </div>
        )}

        {/* Help / Report Button */}
        <div className="bg-white px-4 py-4 border-t border-gray-100">
          <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Report an Issue
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#16A34A] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <span className="text-sm">🔔</span>
            <span className="text-sm font-bold capitalize">{statusToast}</span>
          </div>
        </div>
      )}

      {/* ═══ FLOATING CHAT BUTTON - only when active & driver assigned ═══ */}
      {isActive && order.driverName && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#16A34A] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#15803d] transition-colors z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{chatMessages.length}</span>
          )}
        </button>
      )}

      {/* ═══ CHAT DRAWER ═══ */}
      {showChat && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChat(false)} />
          <div className="relative mt-auto bg-white rounded-t-2xl w-full max-w-2xl mx-auto h-[70vh] flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">
            {/* Chat Header */}
            <div className="bg-[#16A34A] px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{order.driverName || "Rider"}</p>
                  <p className="text-white/60 text-[10px]">Delivery Chat</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/80 hover:text-white text-xl">&times;</button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-gray-400 text-sm">No messages yet</p>
                  <p className="text-gray-300 text-xs mt-1">Send a message to your rider</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.senderRole === "customer" ? "bg-[#16A34A] text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"}`}>
                      {msg.senderRole !== "customer" && <p className="text-[10px] font-bold mb-0.5 text-gray-400">{msg.senderName}</p>}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-[9px] mt-1 ${msg.senderRole === "customer" ? "text-white/50" : "text-gray-300"}`}>
                        {msg.createdAt?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) || "now"}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-200 bg-white flex gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#16A34A]"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className="w-10 h-10 bg-[#16A34A] text-white rounded-full flex items-center justify-center hover:bg-[#15803d] transition-colors disabled:opacity-40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REPORT MODAL ═══ */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReport(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1F2937] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-white">Report an Issue</h2>
                <p className="text-white/60 text-xs">We'll look into this right away</p>
              </div>
              <button onClick={() => setShowReport(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>

            {reportSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-bold text-lg text-gray-800">Report Submitted</h3>
                <p className="text-sm text-gray-500 mt-2">Our team will review your report and get back to you soon.</p>
                <button onClick={() => { setShowReport(false); setReportSubmitted(false); setReportForm({ type: "order", subject: "", description: "" }) }} className="mt-4 bg-[#1F2937] text-white px-6 py-2.5 rounded-lg text-sm font-bold">
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Report Type */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issue Type</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["order", "rider", "product", "other"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setReportForm({ ...reportForm, type })}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                          reportForm.type === type ? "border-[#16A34A] bg-green-50 text-[#16A34A]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {type === "order" && "📦 "}
                        {type === "rider" && "🏍️ "}
                        {type === "product" && "🛒 "}
                        {type === "other" && "❓ "}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
                  <input
                    placeholder="Brief description of the issue"
                    value={reportForm.subject}
                    onChange={(e) => setReportForm({ ...reportForm, subject: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mt-2 outline-none focus:border-[#16A34A]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</label>
                  <textarea
                    placeholder="Tell us more about what happened..."
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mt-2 outline-none focus:border-[#16A34A] resize-none"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleSubmitReport}
                  disabled={reportSubmitting || !reportForm.subject || !reportForm.description}
                  className="w-full bg-[#16A34A] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#15803d] transition-colors disabled:opacity-40"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderTracker />
    </Suspense>
  )
}
