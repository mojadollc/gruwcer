"use client"

import { useEffect, useState } from "react"
import { getUser, getToken } from "@/lib/auth"

const CATEGORIES = ["All", "Tools", "Equipment", "Electronics", "Sports", "Other"]

export default function RentalsPage() {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [bookingForm, setBookingForm] = useState({ startDate: "", endDate: "", agreedToTerms: false })
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [myBookings, setMyBookings] = useState<any[]>([])
  const [tab, setTab] = useState<"browse" | "my">("browse")

  useEffect(() => {
    const u = getUser()
    setUser(u)
    if (u) fetch(`/api/rental-bookings?renterId=${u.id}`).then(r => r.ok ? r.json() : []).then(setMyBookings)
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = category !== "All" ? `?category=${category.toLowerCase()}` : ""
    fetch(`/api/rentals${q}`).then(r => r.ok ? r.json() : []).then(setListings).finally(() => setLoading(false))
  }, [category])

  const filtered = listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()))

  const calcDays = () => {
    if (!bookingForm.startDate || !bookingForm.endDate) return 0
    const diff = new Date(bookingForm.endDate).getTime() - new Date(bookingForm.startDate).getTime()
    return Math.max(1, Math.ceil(diff / 86400000))
  }

  const days = calcDays()
  const subtotal = selected ? selected.ratePerDay * days : 0
  const platformFee = Math.round(subtotal * 0.1 * 100) / 100
  const totalAmount = subtotal + (selected?.damageDeposit || 0) + platformFee
  const downpayment = Math.round(totalAmount * 0.5 * 100) / 100
  const balanceDue = totalAmount - downpayment

  const handleBook = async () => {
    if (!user) { window.location.href = "/auth?redirect=/rentals"; return }
    if (!bookingForm.startDate || !bookingForm.endDate || !bookingForm.agreedToTerms) return
    setBooking(true)
    try {
      const res = await fetch("/api/rental-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selected.id,
          renterId: user.id,
          renterName: user.name,
          renterPhone: user.phone || "",
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate,
          days,
          agreedToTerms: true,
        }),
      })
      const result = await res.json()
      if (!res.ok) { alert(result.error || "Booking failed"); return }
      setBookingResult(result)
      if (result.paymentUrl) window.location.href = result.paymentUrl
    } finally { setBooking(false) }
  }

  const statusColor: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    downpayment_paid: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    disputed: "bg-orange-100 text-orange-700",
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      {/* Header */}
      <header className="bg-[#16A34A] text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <div>
              <h1 className="font-black text-base">🔧 Tool & Equipment Rental</h1>
              <p className="text-white/60 text-[10px]">Rent from your neighbors</p>
            </div>
          </div>
          <a href="/rentals/post" className="bg-[#FF8A00] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#e07800] transition-colors">
            + Post Item
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100 max-w-fit">
          {(["browse", "my"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? "bg-[#16A34A] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t === "browse" ? "Browse" : "My Rentals"}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="Search tools, equipment..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${category === c ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>{c}</button>
              ))}
            </div>

            {/* Security banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
              <span className="text-xl shrink-0">🛡️</span>
              <div>
                <p className="text-xs font-bold text-blue-800">Secure Rental Platform</p>
                <p className="text-[11px] text-blue-600 mt-0.5">50% downpayment held in escrow by Gruwcer. Remaining 50% paid after use. All renters are ID-verified.</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-4xl mb-3">🔧</p>
                <p className="font-bold text-gray-600">No listings found</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to post a tool or equipment!</p>
                <a href="/rentals/post" className="inline-block mt-4 bg-[#16A34A] text-white px-6 py-2.5 rounded-full text-sm font-bold">Post Your Item</a>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filtered.map(l => (
                  <button key={l.id} onClick={() => setSelected(l)} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left border border-gray-100 hover:-translate-y-0.5">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {l.imageUrls?.[0] ? (
                        <img src={l.imageUrls[0]} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🔧</div>
                      )}
                      <span className="absolute top-2 left-2 bg-[#16A34A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full capitalize">{l.category}</span>
                      {l.bookings?.length > 0 && <span className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">RENTED</span>}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm text-gray-800 line-clamp-1">{l.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">📍 {l.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <span className="text-[#16A34A] font-black text-base">₱{l.ratePerDay.toLocaleString()}</span>
                          <span className="text-gray-400 text-[10px]">/day</span>
                        </div>
                        {l.damageDeposit > 0 && <span className="text-[10px] text-orange-600 font-medium">+₱{l.damageDeposit} deposit</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "my" && (
          <div className="space-y-3">
            {!user ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-gray-500 text-sm">Please <a href="/auth?redirect=/rentals" className="text-[#16A34A] font-bold">sign in</a> to view your rentals.</p>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-bold text-gray-600">No rentals yet</p>
                <button onClick={() => setTab("browse")} className="mt-3 bg-[#16A34A] text-white px-6 py-2 rounded-full text-sm font-bold">Browse Items</button>
              </div>
            ) : myBookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{b.listing?.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{b.startDate} → {b.endDate} ({b.days} day{b.days > 1 ? "s" : ""})</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusColor[b.status] || "bg-gray-100 text-gray-500"}`}>
                    {b.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Total</p>
                    <p className="text-sm font-bold text-gray-800">₱{b.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Paid (50%)</p>
                    <p className="text-sm font-bold text-green-600">₱{b.downpayment.toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400">Balance</p>
                    <p className="text-sm font-bold text-orange-600">₱{b.balanceDue.toFixed(2)}</p>
                  </div>
                </div>
                {b.status === "pending_payment" && b.paymongoUrl && (
                  <a href={b.paymongoUrl} className="mt-3 block w-full bg-[#FF8A00] text-white text-center py-2.5 rounded-xl text-sm font-bold">Pay Downpayment (50%) →</a>
                )}
                {b.status === "completed" && (
                  <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs text-orange-700 font-medium">
                    ⚠️ Please settle remaining balance of ₱{b.balanceDue.toFixed(2)} to the owner.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setSelected(null); setBookingForm({ startDate: "", endDate: "", agreedToTerms: false }) }} />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] flex flex-col" style={{ animation: "slideUp 0.25s ease-out" }}>
            {/* Image */}
            <div className="aspect-video bg-gray-100 relative shrink-0">
              {selected.imageUrls?.[0] ? (
                <img src={selected.imageUrls[0]} alt={selected.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🔧</div>
              )}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center text-lg">&times;</button>
              <span className="absolute bottom-3 left-3 bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-full capitalize">{selected.category}</span>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <h2 className="font-black text-lg text-gray-800">{selected.title}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">📍 {selected.location} • Posted by {selected.ownerName}</p>
                <p className="text-sm text-gray-600 mt-2">{selected.description}</p>
              </div>

              {/* Rate */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Daily Rate</p>
                  <p className="text-2xl font-black text-[#16A34A]">₱{selected.ratePerDay.toLocaleString()}<span className="text-sm font-normal text-gray-400">/day</span></p>
                </div>
                {selected.damageDeposit > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Damage Deposit</p>
                    <p className="text-base font-bold text-orange-600">₱{selected.damageDeposit.toLocaleString()}</p>
                    <p className="text-[9px] text-gray-400">refundable</p>
                  </div>
                )}
              </div>

              {/* Security notice */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <div>
                  <p className="text-[11px] font-bold text-blue-800">Escrow Protection</p>
                  <p className="text-[10px] text-blue-600">50% downpayment is held by Gruwcer until rental starts. Remaining 50% paid after use.</p>
                </div>
              </div>

              {/* Date picker */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Select Rental Dates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">Start Date</label>
                    <input type="date" min={new Date().toISOString().split("T")[0]} value={bookingForm.startDate} onChange={e => setBookingForm(f => ({ ...f, startDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A] mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold">End Date</label>
                    <input type="date" min={bookingForm.startDate || new Date().toISOString().split("T")[0]} value={bookingForm.endDate} onChange={e => setBookingForm(f => ({ ...f, endDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A] mt-1" />
                  </div>
                </div>
              </div>

              {/* Cost breakdown */}
              {days > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Cost Breakdown</p>
                  <div className="flex justify-between text-gray-600"><span>₱{selected.ratePerDay} × {days} day{days > 1 ? "s" : ""}</span><span>₱{subtotal.toFixed(2)}</span></div>
                  {selected.damageDeposit > 0 && <div className="flex justify-between text-orange-600"><span>Damage deposit (refundable)</span><span>₱{selected.damageDeposit.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-gray-500"><span>Platform fee (10%)</span><span>₱{platformFee.toFixed(2)}</span></div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800"><span>Total</span><span>₱{totalAmount.toFixed(2)}</span></div>
                  <div className="bg-[#16A34A] text-white rounded-lg p-3 mt-2">
                    <div className="flex justify-between text-sm font-bold"><span>Pay now (50% downpayment)</span><span>₱{downpayment.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs text-white/70 mt-1"><span>Pay after use (50% balance)</span><span>₱{balanceDue.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={bookingForm.agreedToTerms} onChange={e => setBookingForm(f => ({ ...f, agreedToTerms: e.target.checked }))} className="mt-0.5 accent-[#16A34A] w-4 h-4 shrink-0" />
                <p className="text-[11px] text-gray-500">I agree to the rental terms. I understand that 50% downpayment is non-refundable if I cancel after payment. I will return the item in the same condition and pay the remaining 50% after use.</p>
              </label>
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={handleBook}
                disabled={booking || !bookingForm.startDate || !bookingForm.endDate || !bookingForm.agreedToTerms || days < 1 || selected.bookings?.length > 0}
                className="w-full bg-[#FF8A00] text-white py-3.5 rounded-xl font-black text-sm hover:bg-[#e07800] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {booking ? "Processing..." : selected.bookings?.length > 0 ? "Currently Rented" : `Pay Downpayment ₱${downpayment.toFixed(2)} →`}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-2">You need to <a href="/auth?redirect=/rentals" className="text-[#16A34A] font-bold">sign in</a> to book</p>}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </main>
  )
}
