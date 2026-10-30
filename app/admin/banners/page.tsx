"use client"

import { useEffect, useState } from "react"
import ImageUpload from "../components/ImageUpload"

type Banner = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  bgColor: string
  link: string
  order: number
  enabled: boolean
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", bgColor: "#16A34A", link: "/grocery", order: 0, enabled: true })

  useEffect(() => { loadBanners() }, [])

  const loadBanners = async () => {
    const res = await fetch("/api/banners")
    if (res.ok) { setBanners(await res.json()); setLoading(false) }
  }

  const handleSave = async () => {
    if (!form.title) return
    if (editing) {
      await fetch(`/api/banners/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    } else {
      await fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    }
    setShowForm(false); setEditing(null)
    setForm({ title: "", subtitle: "", imageUrl: "", bgColor: "#16A34A", link: "/grocery", order: 0, enabled: true })
    await loadBanners()
  }

  const handleEdit = (banner: Banner) => {
    setEditing(banner)
    setForm({ title: banner.title, subtitle: banner.subtitle, imageUrl: banner.imageUrl, bgColor: banner.bgColor, link: banner.link, order: banner.order, enabled: banner.enabled })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return
    await fetch(`/api/banners/${id}`, { method: "DELETE" })
    await loadBanners()
  }

  const handleToggle = async (banner: Banner) => {
    await fetch(`/api/banners/${banner.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !banner.enabled }) })
    setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, enabled: !b.enabled } : b))
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#1F2937]">App Banners</h1>
          <button onClick={() => { setEditing(null); setForm({ title: "", subtitle: "", imageUrl: "", bgColor: "#16A34A", link: "/grocery", order: banners.length + 1, enabled: true }); setShowForm(true) }} className="text-xs bg-[#16A34A] text-white px-4 py-2 rounded-lg font-bold">+ Add Banner</button>
        </div>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 text-sm">No banners yet</p>
            <p className="text-xs text-gray-300 mt-1">Add banners to show on the Super App homepage</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex">
                  {/* Preview */}
                  <div className="w-[200px] p-4 flex-shrink-0 flex items-center" style={{ backgroundColor: banner.bgColor }}>
                    <div>
                      <p className="text-white font-bold text-sm">{banner.title}</p>
                      <p className="text-white/70 text-[10px]">{banner.subtitle}</p>
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${banner.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{banner.enabled ? "Active" : "Disabled"}</span>
                        <span className="text-[10px] text-gray-400">Order: {banner.order}</span>
                      </div>
                      <p className="text-xs text-gray-500">Link: {banner.link}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(banner)} className={`w-10 h-5 rounded-full transition-colors ${banner.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`block w-4 h-4 bg-white rounded-full shadow-sm transition-transform ml-0.5 ${banner.enabled ? "translate-x-5" : ""}`} />
                      </button>
                      <button onClick={() => handleEdit(banner)} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(banner.id)} className="text-xs text-green-500 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg">{editing ? "Edit Banner" : "Add Banner"}</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden relative min-h-[100px] flex items-end" style={{ backgroundColor: form.bgColor }}>
                {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="relative z-10 p-4 w-full" style={{ background: form.imageUrl ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" : "none" }}>
                  <p className="text-white font-bold drop-shadow">{form.title || "Title"}</p>
                  <p className="text-white/70 text-xs drop-shadow">{form.subtitle || "Subtitle"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#16A34A]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Subtitle</label>
                  <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#16A34A]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Background Color</label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="w-10 h-10 rounded border cursor-pointer" />
                    <input value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Link URL (optional)</label>
                  <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/grocery or https://... (leave empty for no link)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-[#16A34A]" />
                  <div className="flex gap-1 mt-1.5">
                    {["/grocery", "/laundry", "/services", "/travel"].map((l) => (
                      <button key={l} type="button" onClick={() => setForm({ ...form, link: l })} className={`text-[10px] px-2 py-0.5 rounded border ${form.link === l ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-gray-50 text-gray-500 border-gray-200"}`}>{l.replace("/", "")}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Image (optional)</label>
                <div className="mt-1"><ImageUpload folder="banners" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Status</label>
                  <select value={form.enabled ? "enabled" : "disabled"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "enabled" })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none">
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSave} className="bg-[#16A34A] text-white px-5 py-2 rounded-lg text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
