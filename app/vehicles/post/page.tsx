"use client"

import { useState, useEffect } from "react"
import { getUser } from "@/lib/auth"

const VEHICLE_TYPES = ["motorbike", "car", "e-bike"]

const FEATURES_BY_TYPE: Record<string, string[]> = {
  motorbike: ["Helmet included", "Full tank", "GPS tracker", "Automatic", "Manual", "With sidecar"],
  car: ["A/C", "GPS", "Bluetooth", "Automatic", "Manual", "Child seat", "Full tank", "Dashcam"],
  "e-bike": ["Charger included", "Helmet included", "Basket", "Rear rack", "Lights included"],
}

export default function PostVehiclePage() {
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    title: "", description: "", vehicleType: "motorbike",
    specs: "", ratePerDay: "", damageDeposit: "", minDays: "1", maxDays: "30",
    location: "", withDriver: false,
  })
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [idUrl, setIdUrl] = useState("")
  const [licenseUrl, setLicenseUrl] = useState("")
  const [orCrUrl, setOrCrUrl] = useState("")
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [uploadingLicense, setUploadingLicense] = useState(false)
  const [uploadingOrCr, setUploadingOrCr] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [myListings, setMyListings] = useState<any[]>([])

  useEffect(() => {
    const u = getUser() as any
    if (!u) { window.location.href = "/auth?redirect=/vehicles/post"; return }
    setUser(u)
    fetch(`/api/vehicles?ownerId=${u.id}&status=all`).then(r => r.ok ? r.json() : []).then(setMyListings)
  }, [])

  const uploadFile = async (file: File) => {
    const fd = new FormData(); fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    return (await res.json()).url as string
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6 - images.length)
    if (!files.length) return
    setUploadingImg(true)
    try {
      const urls = await Promise.all(files.map(uploadFile))
      setImages(prev => [...prev, ...urls].slice(0, 6))
    } finally { setUploadingImg(false) }
  }

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (u: string) => void, setLoading: (v: boolean) => void) => {
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true)
    try { setter(await uploadFile(file)) } finally { setLoading(false) }
  }

  const toggleFeature = (f: string) => setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const handleSubmit = async () => {
    if (!form.title || !form.ratePerDay || !form.location || !idUrl || !licenseUrl) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.id,
          ownerName: user.name,
          ownerPhone: user.phone || "",
          title: form.title,
          description: form.description,
          vehicleType: form.vehicleType,
          specs: form.specs,
          features: selectedFeatures,
          ratePerDay: Number(form.ratePerDay),
          damageDeposit: Number(form.damageDeposit) || 0,
          minDays: Number(form.minDays) || 1,
          maxDays: Number(form.maxDays) || 30,
          location: form.location,
          withDriver: form.withDriver,
          imageUrls: images,
          ownerIdUrl: idUrl,
          licenseUrl,
          orCrUrl: orCrUrl || null,
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="font-black text-xl text-gray-800">Vehicle Listed!</h2>
        <p className="text-sm text-gray-500 mt-2">Your vehicle is under review. Admin will verify your documents and approve the listing.</p>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
          <p className="text-xs font-bold text-blue-800">What happens next?</p>
          <ul className="text-[11px] text-blue-600 mt-1 space-y-1">
            <li>✓ Admin verifies your license & OR/CR</li>
            <li>✓ Listing goes live once approved</li>
            <li>✓ Renters pay 50% downpayment (escrow)</li>
            <li>✓ You receive payment after rental completes</li>
          </ul>
        </div>
        <div className="flex gap-2 mt-5">
          <a href="/vehicles" className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold text-center">Browse</a>
          <button onClick={() => setDone(false)} className="flex-1 bg-[#1a56db] text-white py-2.5 rounded-xl text-sm font-bold">List Another</button>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      <header className="bg-[#1a56db] text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/vehicles" className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div>
            <h1 className="font-black text-base">List Your Vehicle</h1>
            <p className="text-white/60 text-[10px]">Earn from your motorbike, car, or e-bike</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Earnings banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-sm font-bold text-blue-800">Earn from your vehicle</p>
            <p className="text-[11px] text-blue-600">Free to list. Gruwcer takes only 10% platform fee when rented. You keep 90%.</p>
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vehicle Type *</p>
          <div className="grid grid-cols-3 gap-3">
            {VEHICLE_TYPES.map(t => (
              <button key={t} onClick={() => { setForm(f => ({ ...f, vehicleType: t })); setSelectedFeatures([]) }}
                className={`py-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-bold text-sm capitalize ${form.vehicleType === t ? "bg-[#1a56db] border-[#1a56db] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
                <span className="text-2xl">{{ motorbike: "🏍️", car: "🚗", "e-bike": "⚡" }[t]}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vehicle Details</p>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Listing Title *</label>
            <input placeholder={`e.g. Honda Click 125i 2023, Toyota Vios 2022...`} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#1a56db]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Specs / Details</label>
            <input placeholder="e.g. 125cc, Automatic, 2023 model, Blue" value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#1a56db]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
            <textarea placeholder="Describe your vehicle, condition, any notes for renters..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#1a56db] resize-none" rows={3} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Pickup Location *</label>
            <input placeholder="e.g. Lapu-Lapu City, Cebu" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm mt-1 outline-none focus:border-[#1a56db]" />
          </div>

          {/* Features */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Features / Inclusions</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(FEATURES_BY_TYPE[form.vehicleType] || []).map(f => (
                <button key={f} onClick={() => toggleFeature(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedFeatures.includes(f) ? "bg-[#1a56db] border-[#1a56db] text-white" : "bg-white border-gray-200 text-gray-600"}`}>{f}</button>
              ))}
            </div>
          </div>

          {/* With driver toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, withDriver: !f.withDriver }))} className={`w-11 h-6 rounded-full transition-colors relative ${form.withDriver ? "bg-[#1a56db]" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.withDriver ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">With Driver / Rider</p>
              <p className="text-[11px] text-gray-400">You will drive/ride the vehicle for the renter</p>
            </div>
          </label>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pricing</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rate per Day (₱) *</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                <input type="number" min={1} placeholder="800" value={form.ratePerDay} onChange={e => setForm(f => ({ ...f, ratePerDay: e.target.value }))} className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-[#1a56db]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Damage Deposit (₱)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                <input type="number" min={0} placeholder="2000" value={form.damageDeposit} onChange={e => setForm(f => ({ ...f, damageDeposit: e.target.value }))} className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none focus:border-[#1a56db]" />
              </div>
            </div>
          </div>
          {form.ratePerDay && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-700">Your Earnings Preview</p>
              <div className="flex justify-between"><span>3-day rental</span><span className="font-bold text-[#1a56db]">₱{(Number(form.ratePerDay) * 3 * 0.9).toFixed(2)} <span className="text-gray-400 font-normal">after 10% fee</span></span></div>
              <div className="flex justify-between"><span>7-day rental</span><span className="font-bold text-[#1a56db]">₱{(Number(form.ratePerDay) * 7 * 0.9).toFixed(2)} <span className="text-gray-400 font-normal">after 10% fee</span></span></div>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vehicle Photos (up to 6)</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                <img src={url} className="w-full h-full object-cover" />
                <button onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
              </div>
            ))}
            {images.length < 6 && (
              <label className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#1a56db] transition-colors">
                {uploadingImg ? <div className="w-5 h-5 border-2 border-[#1a56db] border-t-transparent rounded-full animate-spin" /> : <><span className="text-2xl text-gray-300">+</span><span className="text-[10px] text-gray-400 mt-1">Add photo</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </label>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">📄</span>
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Required Documents</p>
              <p className="text-[11px] text-gray-400 mt-0.5">All documents are stored securely and only used for verification.</p>
            </div>
          </div>

          {/* Gov ID */}
          <div>
            <p className="text-[11px] font-bold text-gray-600 mb-2">🪪 Government ID *</p>
            {idUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-green-200">
                <img src={idUrl} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center"><span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Uploaded</span></div>
                <button onClick={() => setIdUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl py-4 cursor-pointer hover:bg-orange-100 transition-colors">
                {uploadingId ? <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /> : <><span className="text-xl">📷</span><span className="text-sm font-bold text-orange-700">Upload Gov ID</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleDocUpload(e, setIdUrl, setUploadingId)} disabled={uploadingId} />
              </label>
            )}
          </div>

          {/* Driver's License */}
          <div>
            <p className="text-[11px] font-bold text-gray-600 mb-2">🚗 Driver&apos;s License *</p>
            {licenseUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-green-200">
                <img src={licenseUrl} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center"><span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Uploaded</span></div>
                <button onClick={() => setLicenseUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl py-4 cursor-pointer hover:bg-blue-100 transition-colors">
                {uploadingLicense ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <><span className="text-xl">📷</span><span className="text-sm font-bold text-blue-700">Upload Driver&apos;s License</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleDocUpload(e, setLicenseUrl, setUploadingLicense)} disabled={uploadingLicense} />
              </label>
            )}
          </div>

          {/* OR/CR */}
          <div>
            <p className="text-[11px] font-bold text-gray-600 mb-2">📋 OR/CR (Official Receipt / Certificate of Registration) <span className="text-gray-400 font-normal">— for motorbike & car</span></p>
            {orCrUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-green-200">
                <img src={orCrUrl} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center"><span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Uploaded</span></div>
                <button onClick={() => setOrCrUrl("")} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">&times;</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl py-4 cursor-pointer hover:bg-gray-100 transition-colors">
                {uploadingOrCr ? <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <><span className="text-xl">📷</span><span className="text-sm font-bold text-gray-600">Upload OR/CR (optional)</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e => handleDocUpload(e, setOrCrUrl, setUploadingOrCr)} disabled={uploadingOrCr} />
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !form.title || !form.ratePerDay || !form.location || !idUrl || !licenseUrl}
          className="w-full bg-[#1a56db] text-white py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 shadow-lg"
        >
          {submitting ? "Submitting..." : "Submit for Approval →"}
        </button>
        <p className="text-center text-[11px] text-gray-400 pb-4">Your listing will be reviewed by admin before going live.</p>

        {myListings.length > 0 && (
          <div className="space-y-3 pb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">My Vehicle Listings</p>
            {myListings.map(l => (
              <div key={l.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {l.imageUrls?.[0] ? <img src={l.imageUrls[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{{ motorbike: "🏍️", car: "🚗", "e-bike": "⚡" }[l.vehicleType as string] || "🚗"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{l.title}</p>
                  <p className="text-[11px] text-gray-400">₱{l.ratePerDay}/day • {l.bookings?.length || 0} booking{l.bookings?.length !== 1 ? "s" : ""}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${statusColor[l.status] || "bg-gray-100 text-gray-500"}`}>
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
