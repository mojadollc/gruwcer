"use client"

import { useEffect, useState } from "react"

type OrderStatus = string

const ADMIN_FLOW_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "ready_for_pickup", "rider_accepted", "rider_at_store", "rider_picked_up", "out_for_delivery", "delivered", "cancelled", "rejected"]

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-orange-100 text-orange-800",
  rider_accepted: "bg-cyan-100 text-cyan-800",
  rider_at_store: "bg-teal-100 text-teal-800",
  rider_picked_up: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-green-100 text-green-900",
  rejected: "bg-green-100 text-green-900",
}

type FilterTab = "incoming" | "active" | "completed" | "all"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<FilterTab>("incoming")
  const [drivers, setDrivers] = useState<any[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [riderFee, setRiderFee] = useState(30)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [editItems, setEditItems] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/users?role=driver").then(r => r.json()).then((data: any[]) => setDrivers(data.filter(d => d.status === "active")))
    fetch("/api/delivery-settings").then(r => r.json()).then((s: any) => setRiderFee(s.riderFeePerDelivery || 30))
    const poll = () => fetch("/api/orders").then(r => r.json()).then((data: any[]) => {
      setOrders(data)
      setLoading(false)
    })
    poll()
    const iv = setInterval(poll, 8000)
    return () => clearInterval(iv)
  }, [])

  const handleStartEdit = (order: any) => {
    setEditingOrder(order)
    setEditItems(order.items.map((item: any) => ({ ...item })))
  }

  const handleSaveEdit = async () => {
    if (!editingOrder) return
    // Calculate new total only from items NOT marked out of stock
    const activeItems = editItems.filter((i) => !i.outOfStock)
    const newTotal = activeItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const oosItems = editItems.filter((i) => i.outOfStock)
    const note = oosItems.length > 0
      ? `Items out of stock: ${oosItems.map((i) => i.name).join(", ")}`
      : "Items updated by admin"
    await fetch(`/api/orders/${editingOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: editItems, total: newTotal, notes: editingOrder.notes ? `${editingOrder.notes} | ${note}` : note }),
    })
    setEditingOrder(null)
    setEditItems([])
  }

  const handleAccept = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmed" }) })
  }

  const handleReject = async (orderId: string) => {
    if (!confirm("Reject this order?")) return
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }) })
  }

  const handlePreparing = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "preparing" }) })
  }

  const handleReady = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ready_for_pickup" }) })
  }

  const handleAssignDriver = async (orderId: string, driverDocId: string) => {
    if (!driverDocId) {
      await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driverId: "", driverName: "" }) })
      return
    }
    const driver = drivers.find((d) => d.id === driverDocId)
    if (!driver) return
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driverId: driver.id, driverName: driver.name }) })
  }

  const handleAutoAssignDriver = async (order: any) => {
    const lat = order.deliveryLat || 0
    const lng = order.deliveryLng || 0
    const drivers2: any[] = await fetch("/api/users?role=driver").then(r => r.json())
    const nearest = drivers2.find((d: any) => d.isOnline && d.status === "active") || null
    if (nearest) {
      await fetch(`/api/orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driverId: nearest.id, driverName: nearest.name }) })
    } else {
      alert("No online riders available nearby.")
    }
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      const customerId = (order as any).customerId
      if (status === "confirmed" && customerId) await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "customer", recipientId: customerId, title: "Order Confirmed ✅", message: "Your order has been confirmed and will be prepared shortly.", orderId }) })
      if (status === "preparing" && customerId) await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "customer", recipientId: customerId, title: "Preparing Your Order 👨‍🍳", message: "Your order is being prepared.", orderId }) })
      if (status === "ready_for_pickup" && customerId) await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "customer", recipientId: customerId, title: "Order Ready 📦", message: "Your order is packed and waiting for a rider.", orderId }) })
      if (status === "out_for_delivery" && customerId) await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "customer", recipientId: customerId, title: "On the Way! 🏍️", message: "Your order is out for delivery.", orderId }) })
      if (status === "delivered" && customerId) await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientType: "customer", recipientId: customerId, title: "Delivered! 🎉", message: "Your order has been delivered. Enjoy!", orderId }) })
    }
  }

  // Filter by tab
  const incoming = orders.filter((o) => o.status === "pending")
  const active = orders.filter((o) => ["confirmed", "preparing", "ready_for_pickup", "rider_accepted", "rider_at_store", "rider_picked_up", "out_for_delivery"].includes(o.status))
  const completed = orders.filter((o) => ["delivered", "cancelled", "rejected"].includes(o.status))
  const filtered = tab === "incoming" ? incoming : tab === "active" ? active : tab === "completed" ? completed : orders

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#1F2937]">Order Management</h1>
          <div className="flex items-center gap-2">
            {incoming.length > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {incoming.length} new
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{incoming.length}</p>
            <p className="text-xs text-gray-400">New Orders</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{active.length}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{completed.filter((o) => o.status === "delivered").length}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-[#1F2937]">{orders.length}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>

        {/* Earnings Summary */}
        {(() => {
          const delivered = orders.filter((o) => o.status === "delivered")
          const today = new Date(); today.setHours(0, 0, 0, 0)
          const todayDelivered = delivered.filter((o) => {
            const d = o.deliveredAt || o.updatedAt
            return d && d >= today
          })
          const totalRevenue = delivered.reduce((s, o) => s + o.total, 0)
          const todayRevenue = todayDelivered.reduce((s, o) => s + o.total, 0)
          const deliveryFeePerOrder = riderFee
          const totalDeliveryFees = delivered.length * deliveryFeePerOrder
          const todayDeliveryFees = todayDelivered.length * deliveryFeePerOrder
          return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-green-600 font-semibold uppercase">Today Revenue</p>
                  <p className="text-xl font-black text-green-700">₱{todayRevenue.toFixed(0)}</p>
                  <p className="text-[10px] text-green-500">{todayDelivered.length} orders</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-600 font-semibold uppercase">Total Revenue</p>
                  <p className="text-xl font-black text-green-700">₱{totalRevenue.toFixed(0)}</p>
                  <p className="text-[10px] text-green-500">{delivered.length} orders</p>
                </div>
                <div>
                  <p className="text-[10px] text-orange-600 font-semibold uppercase">Today Delivery Fees</p>
                  <p className="text-xl font-black text-orange-700">₱{todayDeliveryFees}</p>
                  <p className="text-[10px] text-orange-500">₱{deliveryFeePerOrder}/delivery</p>
                </div>
                <div>
                  <p className="text-[10px] text-orange-600 font-semibold uppercase">Total Delivery Fees</p>
                  <p className="text-xl font-black text-orange-700">₱{totalDeliveryFees}</p>
                  <p className="text-[10px] text-orange-500">{delivered.length} deliveries</p>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {([
            ["incoming", `Incoming (${incoming.length})`],
            ["active", `Active (${active.length})`],
            ["completed", `Completed (${completed.length})`],
            ["all", "All"],
          ] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                tab === key ? "bg-[#16A34A] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-4xl mb-3">{tab === "incoming" ? "📭" : "📋"}</p>
            <p className="text-gray-400 text-sm">No orders</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Order Header */}
                <div
                  className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                    <span className="text-xs text-gray-400">{order.createdAt?.toLocaleString?.() || ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#16A34A] font-bold">₱{order.total.toFixed(2)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Quick Actions for Pending Orders */}
                {order.status === "pending" && (
                  <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-gray-800">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items • {order.deliveryAddress.slice(0, 40)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(order.id)} className="px-4 py-2 text-xs font-bold rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors">
                        ✕ Reject
                      </button>
                      <button onClick={() => handleAccept(order.id)} className="px-4 py-2 text-xs font-bold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors">
                        ✓ Accept
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {(expandedOrder === order.id || order.status === "pending") && (
                  <div className="p-5">
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Customer</p>
                        <p className="text-sm font-medium">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm font-medium">{order.customerPhone}</p>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="text-sm font-medium">{order.deliveryAddress}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-400">Items</p>
                        {!["delivered", "cancelled", "rejected"].includes(order.status) && (
                          <button onClick={() => handleStartEdit(order)} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold hover:bg-blue-700">
                            ✏️ Edit Items
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item: any, i: number) => (
                          <span key={i} className={`text-xs px-2 py-0.5 rounded ${item.outOfStock ? "bg-green-50 text-green-400 line-through" : "bg-gray-100"}`}>
                            {item.name} ×{item.quantity}{item.outOfStock ? " — OUT OF STOCK" : ""}
                          </span>
                        ))}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mb-3 bg-yellow-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-yellow-700">📝 {order.notes}</p>
                      </div>
                    )}

                    {order.paymentMethod && (
                      <div className="mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.paymentMethod === "cod" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                          💳 {order.paymentMethod === "qrph" ? "QR Ph" : order.paymentMethod === "ewallet" ? "E-Wallet" : order.paymentMethod === "bank" ? "Bank Transfer" : order.paymentMethod === "xendit" ? "Online" : "COD"}
                        </span>
                      </div>
                    )}
                    {/* Action Buttons - FoodPanda Flow */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                      {order.status === "confirmed" && (
                        <button onClick={() => handlePreparing(order.id)} className="text-xs bg-purple-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-600 transition-colors">
                          👨🍳 Start Preparing
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button onClick={() => handleReady(order.id)} className="text-xs bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors">
                          📦 Ready for Pickup
                        </button>
                      )}
                      {order.status === "ready_for_pickup" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAutoAssignDriver(order)}
                            className="text-xs bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700"
                          >
                            ⚡ Auto-Assign
                          </button>
                          <select
                            value={order.driverId || ""}
                            onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                            className={`text-xs px-3 py-2 rounded-lg border outline-none ${
                              order.driverId ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600"
                            }`}
                          >
                            <option value="">— Manual —</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Manual status override */}
                      {!["pending", "delivered", "cancelled", "rejected"].includes(order.status) && (
                        <div className="ml-auto">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            className="text-[10px] border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white text-gray-500"
                          >
                            {ADMIN_FLOW_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Driver info */}
                    {order.driverName && (
                      <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                        <span className="text-sm">🏍️</span>
                        <span className="text-xs font-medium text-blue-700">Rider: {order.driverName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Items Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingOrder(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#1F2937] px-6 py-4">
              <h2 className="font-bold text-lg text-white">Edit Order Items</h2>
              <p className="text-white/70 text-xs">#{editingOrder.id.slice(0, 8)} — {editingOrder.customerName}</p>
            </div>
            <div className="p-5 space-y-2 max-h-[50vh] overflow-y-auto">
              {editItems.map((item, i) => (
                <div key={item.productId} className={`flex items-center gap-3 rounded-lg px-4 py-3 ${item.outOfStock ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.outOfStock ? "text-green-400 line-through" : "text-gray-800"}`}>{item.name}</p>
                    <p className="text-[10px] text-gray-400">₱{item.price} each</p>
                    {item.outOfStock && (
                      <span className="text-[9px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded mt-1 inline-block">OUT OF STOCK</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.outOfStock && (
                      <>
                        <button
                          onClick={() => {
                            const updated = [...editItems]
                            if (updated[i].quantity > 1) updated[i] = { ...updated[i], quantity: updated[i].quantity - 1 }
                            setEditItems(updated)
                          }}
                          className="w-7 h-7 rounded bg-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center hover:bg-gray-300"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => {
                            const updated = [...editItems]
                            updated[i] = { ...updated[i], quantity: updated[i].quantity + 1 }
                            setEditItems(updated)
                          }}
                          className="w-7 h-7 rounded bg-blue-600 text-white font-bold text-sm flex items-center justify-center hover:bg-blue-700"
                        >
                          +
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        const updated = [...editItems]
                        updated[i] = { ...updated[i], outOfStock: !updated[i].outOfStock }
                        setEditItems(updated)
                      }}
                      className={`text-[9px] font-bold px-2 py-1.5 rounded-lg ml-1 transition-colors ${
                        item.outOfStock
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {item.outOfStock ? "✓ Restock" : "✕ Out of Stock"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] text-gray-400">Original Total</p>
                  <p className="text-sm text-gray-400 line-through">₱{editingOrder.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">New Total</p>
                  <p className="text-lg font-bold text-[#16A34A]">₱{editItems.filter((i) => !i.outOfStock).reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</p>
                </div>
              </div>
              {editItems.filter((i) => i.outOfStock).length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
                  <p className="text-[10px] text-green-800 font-bold">⚠️ {editItems.filter((i) => i.outOfStock).length} item(s) marked as out of stock:</p>
                  <p className="text-[10px] text-green-700 mt-0.5">{editItems.filter((i) => i.outOfStock).map((i) => i.name).join(", ")}</p>
                  <p className="text-[9px] text-green-400 mt-1">Customer will see these items with strikethrough &amp; “Out of Stock” label</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditingOrder(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={editItems.filter((i) => !i.outOfStock).length === 0} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-sm font-bold hover:bg-[#15803d] disabled:opacity-40">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
