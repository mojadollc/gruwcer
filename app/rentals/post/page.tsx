"use client"

import { useState, useEffect } from "react"
import { getUser, getToken } from "@/lib/auth"

const CATEGORIES = ["tools", "equipment", "electronics", "sports", "other"]

export default function PostRentalPage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    title: "", description: "", category: "tools",
    ratePerDay: "", damageDeposit: "", minDays: "1", maxDays: "30", location: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [idUrl, setIdUrl] = useState("")
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [myListings, setMyListings] = useState<any[]>([])

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = "/auth?redirect=/rentals/post"; return }
    setUser(u)
    fetch(`/api/rentals?ownerId=${u.id}&status=all`).then(r => r.ok ? r.json() : []).then(setMyListings)
  }, [])

  const uploadFile = async (file: File, type: "image" | "id") => {
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    return data.url as string
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length)
    if (!files.length) return
    setUploadingImg(true)
    try {
      const urls = await Promise.all(files.map(f => uploadFile(f, "image")))
      setImages(prev => [...prev, ...urls].slice(0, 4))
    } finally { setUploadingImg(false) }
  }

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingId(true)
    try { setIdUrl(await uploadFile(file, "id")) }
    finally { setUploadingId(false) }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.ratePerDay || !form.location || !idUrl) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.id,
          ownerName: user.name,
          ownerPhone: user.phone || "",
          title: form.title,
          description: form.description,
          category: form.category,
          ratePerDay: Number(form.ratePerDay),
          damageDeposit: Number(form.damageDeposit) || 0,
          minDays: Number(form.minDays) || 1,
          maxDays: Number(form.maxDays) || 30,
          location: form.location,
          imageUrls: images,
          ownerIdUrl: idUrl,
          idVerified: false,
          status: "pending_approval",
        }),
      })
      if (res.ok) setDone(true)
    } finally { setSubmitting(false) }
  }

  const statusColor: Record<string, string> = {
    pending_approval: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    rented: "bg-blue-100 text-blue-700",
    suspended: "bg-red-100 text-red-600",
  }

  if (done) return (
    <main className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="font-black text-xl text-gray-800">Listing Submitted!</h2>
        <p className="text-sm text-gray-500 mt-2">Your listing is under review. Admin will approve it shortly and it will go live.</p>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
          <p className="text-xs font-bold text-blue-800">What happens next?</p>
          <ul className="text-[11px] text-blue-600 mt-1 space-y-1">
            <li>✓ Admin verifies your government ID</li>
            <li>✓ Listing goes live once approved</li>
            <li>✓ Renters pay 50% downpayment (held in escrow)</li>
            <li>✓ You receive payment after rental is complete</li>
          </ul>
        </div>
        <div className="flex gap-2 mt-5">
          <a href="/rentals" className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold text-center">Browse</a>
          <button onClick={() => setDone(false)} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-xl text-sm font-bold">Post Another</button>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      <header className="bg-[#16A34A] text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/rentals" className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h1 className="font-black text-base">Post a Rental Item</h1>
            <p className="text-white/60 text-[10px]">Free to list — earn from your spare tools</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Free listing banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🆓</span>
          <div>
            <p className="text-sm font-bold text-green-800">100% Free to List</p>
            <p className="text-[11px] text-green-600">No listing fee. Gruwcer only takes a 10% platform fee from the rental amount when your item is rented.</p>
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Item Details</p>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Item Title *</label>
            <input placeholder="e.g. Makita Drill, Pressure Washer, Tent..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#16A34A]" />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Category *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 capitalize transition-all ${form.category === c ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
            <textarea placeholder="Describe the item, condition, what it's used for..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#16A34A] resize-none" rows={3} />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Location / Area *</label>
            <input placeholder="e.g. Lapu-Lapu City, Cebu" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#16A34A]" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rate per Day (₱) *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                <input type="number" min={1} placeholder="500" value={form.ratePerDay} onChange={e => setForm(f => ({ ...f, ratePerDay: e.target.value }))} className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Damage Deposit (₱)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                <input type="number" min={0} placeholder="0" value={form.damageDeposit} onChange={e => setForm(f => ({ ...f, damageDeposit: e.target.value }))} className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Optional. Refunded after safe return.</p>
            </div>
          </div>

          {form.ratePerDay && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-700">Earnings Preview (per rental)</p>
              <div className="flex justify-between"><span>3-day rental</span><span className="font-bold text-[#16A34A]">₱{(Number(form.ratePerDay) * 3 * 0.9).toFixed(2)} <span className="text-gray-400 font-normal">after 10% fee</span></span></div>
              <div className="flex justify-between"><span>7-day rental</span><span className="font-bold text-[#16A34A]">₱{(Number(form.ratePerDay) * 7 * 0.9).toFixed(2)} <span className="text-gray-400 font-normal">after 10% fee</span></span></div>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Item Photos (up to 4)</p>
          <div className="grid grid-cols-4 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} className="w-full h-full object-cover" />
                <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#16A34A] transition-colors">
                {uploadingImg ? <div className="w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" /> : <><span className="text-2xl text-gray-300">+</span><span className="text-[10px] text-gray-400 mt-1">Add photo</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </label>
            )}
          </div>
        </div>

        {/* Government ID */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🪪</span>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Government ID Required *</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Upload a valid government-issued ID (UMID, PhilSys, Driver's License, Passport). This is for security verification only and stored securely.</p>
            </div>
          </div>
          {idUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-green-200">
              <img src={idUrl} className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ ID Uploaded</span>
              </div>
              <button onClick={() => setIdUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-3 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl py-5 cursor-pointer hover:bg-orange-100 transition-colors">
              {uploadingId ? <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : (
                <><span className="text-2xl">📷</span><span className="text-sm font-bold text-orange-700">Upload Government ID</span></>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} disabled={uploadingId} />
            </label>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.title || !form.ratePerDay || !form.location || !idUrl}
          className="w-full bg-[#16A34A] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#15803d] transition-colors disabled:opacity-40 shadow-lg"
        >
          {submitting ? "Submitting..." : "Submit Listing for Approval →"}
        </button>
        <p className="text-center text-[11px] text-gray-400 pb-4">Your listing will be reviewed by admin before going live.</p>

        {/* My listings */}
        {myListings.length > 0 && (
          <div className="space-y-3 pb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">My Listings</p>
            {myListings.map(l => (
              <div key={l.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {l.imageUrls?.[0] ? <img src={l.imageUrls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🔧</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{l.title}</p>
                  <p className="text-[11px] text-gray-400">₱{l.ratePerDay}/day • {l.bookings?.length || 0} booking{l.bookings?.length !== 1 ? "s" : ""}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${({ pending_approval: "bg-yellow-100 text-yellow-700", active: "bg-green-100 text-green-700", rented: "bg-blue-100 text-blue-700", suspended: "bg-red-100 text-red-600" } as any)[l.status] || "bg-gray-100 text-gray-500"}`}>
                  {l.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
