"use client"

import { useEffect, useState } from "react"

type AdminTab = "listings" | "bookings"

export default function AdminRentalsPage() {
  const [tab, setTab] = useState<AdminTab>("listings")
  const [listings, setListings] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [filter, setFilter] = useState("all")

  const load = async () => {
    setLoading(true)
    const [l, b] = await Promise.all([
      fetch("/api/rentals?status=all").then(r => r.ok ? r.json() : []),
      fetch("/api/rental-bookings").then(r => r.ok ? r.json() : []),
    ])
    setListings(Array.isArray(l) ? l : [])
    setBookings(Array.isArray(b) ? b : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateListingStatus = async (id: string, status: string) => {
    await fetch(`/api/rentals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    setListings(ls => ls.map(l => l.id === id ? { ...l, status } : l))
    if (selectedListing?.id === id) setSelectedListing((l: any) => ({ ...l, status }))
  }

  const updateBookingStatus = async (id: string, status: string) => {
    await fetch(`/api/rental-bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b))
    if (selectedBooking?.id === id) setSelectedBooking((b: any) => ({ ...b, status }))
  }

  const listingStatusColor: Record<string, string> = {
    pending_approval: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    rented: "bg-blue-100 text-blue-700",
    returned: "bg-gray-100 text-gray-600",
    suspended: "bg-red-100 text-red-600",
  }
  const bookingStatusColor: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    downpayment_paid: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    disputed: "bg-orange-100 text-orange-700",
  }

  const filteredListings = filter === "all" ? listings : listings.filter(l => l.status === filter)

  const stats = {
    pending: listings.filter(l => l.status === "pending_approval").length,
    active: listings.filter(l => l.status === "active").length,
    rented: listings.filter(l => l.status === "rented").length,
    disputes: bookings.filter(b => b.status === "disputed").length,
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-[#1F2937]">Tool & Equipment Rentals</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">Manage listings, bookings, and disputes</p>
      </header>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pending Approval", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Active Listings", value: stats.active, color: "text-green-600", bg: "bg-green-50" },
            { label: "Currently Rented", value: stats.rented, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Disputes", value: stats.disputes, color: "text-red-600", bg: "bg-red-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-fit">
          {(["listings", "bookings"] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? "bg-white text-[#1F2937] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
          ))}
        </div>

        {tab === "listings" && (
          <>
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {["all", "pending_approval", "active", "rented", "suspended"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${filter === f ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}</div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map(l => (
                  <div key={l.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {l.imageUrls?.[0] ? <img src={l.imageUrls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-gray-800">{l.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${listingStatusColor[l.status] || "bg-gray-100 text-gray-500"}`}>{l.status.replace(/_/g, " ").toUpperCase()}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{l.category}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">By {l.ownerName} • ₱{l.ratePerDay}/day • {l.location}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{l.bookings?.length || 0} booking{l.bookings?.length !== 1 ? "s" : ""}</p>
                      </div>
                      <button onClick={() => setSelectedListing(l)} className="shrink-0 text-xs text-[#16A34A] font-bold border border-[#16A34A] px-3 py-1.5 rounded-lg hover:bg-green-50">View</button>
                    </div>
                  </div>
                ))}
                {filteredListings.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No listings found.</p>}
              </div>
            )}
          </>
        )}

        {tab === "bookings" && (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-gray-800">{b.listing?.title || "—"}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bookingStatusColor[b.status] || "bg-gray-100 text-gray-500"}`}>{b.status.replace(/_/g, " ").toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Renter: {b.renterName} • {b.startDate} → {b.endDate} ({b.days}d)</p>
                    <div className="flex gap-4 mt-1 text-[11px]">
                      <span className="text-gray-500">Total: <span className="font-bold text-gray-700">₱{b.totalAmount?.toFixed(2)}</span></span>
                      <span className="text-green-600">Paid: <span className="font-bold">₱{b.downpayment?.toFixed(2)}</span></span>
                      <span className="text-orange-600">Balance: <span className="font-bold">₱{b.balanceDue?.toFixed(2)}</span></span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(b)} className="shrink-0 text-xs text-[#16A34A] font-bold border border-[#16A34A] px-3 py-1.5 rounded-lg hover:bg-green-50">View</button>
                </div>
                {b.status === "disputed" && b.disputeReason && (
                  <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs text-orange-700">⚠️ Dispute: {b.disputeReason}</div>
                )}
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No bookings yet.</p>}
          </div>
        )}
      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedListing(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-[#1F2937] px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-white">{selectedListing.title}</h2>
              <button onClick={() => setSelectedListing(null)} className="text-white/70 text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {selectedListing.imageUrls?.[0] && <img src={selectedListing.imageUrls[0]} className="w-full h-40 object-cover rounded-xl" />}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Owner</p><p className="font-semibold">{selectedListing.ownerName}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Phone</p><p className="font-semibold">{selectedListing.ownerPhone || "—"}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Rate</p><p className="font-semibold">₱{selectedListing.ratePerDay}/day</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Deposit</p><p className="font-semibold">₱{selectedListing.damageDeposit}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Location</p><p className="font-semibold">{selectedListing.location}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Category</p><p className="font-semibold capitalize">{selectedListing.category}</p></div>
              </div>
              {selectedListing.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedListing.description}</p>}

              {/* Government ID */}
              {selectedListing.ownerIdUrl && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Government ID</p>
                  <a href={selectedListing.ownerIdUrl} target="_blank" rel="noopener noreferrer">
                    <img src={selectedListing.ownerIdUrl} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.status === "pending_approval" && (
                    <button onClick={() => updateListingStatus(selectedListing.id, "active")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600">✓ Approve Listing</button>
                  )}
                  {selectedListing.status === "active" && (
                    <button onClick={() => updateListingStatus(selectedListing.id, "suspended")} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600">Suspend</button>
                  )}
                  {selectedListing.status === "suspended" && (
                    <button onClick={() => updateListingStatus(selectedListing.id, "active")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600">Reinstate</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-[#1F2937] px-5 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-white">Booking #{selectedBooking.id.slice(-8).toUpperCase()}</h2>
              <button onClick={() => setSelectedBooking(null)} className="text-white/70 text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Item</p><p className="font-semibold">{selectedBooking.listing?.title}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Renter</p><p className="font-semibold">{selectedBooking.renterName}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Dates</p><p className="font-semibold">{selectedBooking.startDate} → {selectedBooking.endDate}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Days</p><p className="font-semibold">{selectedBooking.days}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Total</p><p className="font-bold text-[#16A34A]">₱{selectedBooking.totalAmount?.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Platform Fee</p><p className="font-semibold">₱{selectedBooking.platformFee?.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Downpayment (paid)</p><p className="font-semibold text-green-600">₱{selectedBooking.downpayment?.toFixed(2)}</p></div>
                <div><p className="text-[10px] text-gray-400 uppercase font-bold">Balance Due</p><p className="font-semibold text-orange-600">₱{selectedBooking.balanceDue?.toFixed(2)}</p></div>
              </div>

              {selectedBooking.disputeReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-orange-700">Dispute Reason</p>
                  <p className="text-sm text-orange-600 mt-1">{selectedBooking.disputeReason}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.status === "pending_payment" && (
                    <button onClick={() => updateBookingStatus(selectedBooking.id, "downpayment_paid")} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Mark Downpayment Paid</button>
                  )}
                  {selectedBooking.status === "downpayment_paid" && (
                    <button onClick={() => updateBookingStatus(selectedBooking.id, "active")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Mark Active (Item Picked Up)</button>
                  )}
                  {selectedBooking.status === "active" && (
                    <button onClick={() => updateBookingStatus(selectedBooking.id, "completed")} className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold">Mark Completed (Returned)</button>
                  )}
                  {selectedBooking.status === "disputed" && (
                    <button onClick={() => updateBookingStatus(selectedBooking.id, "completed")} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Resolve Dispute</button>
                  )}
                  {!["cancelled", "completed"].includes(selectedBooking.status) && (
                    <button onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold">Cancel</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
