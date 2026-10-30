"use client"

import { useEffect, useState } from "react"
import ImageUpload from "../components/ImageUpload"
// All data via Postgres API

const defaultSlide = {
  badge: "",
  title: "",
  highlight: "",
  description: "",
  imageUrl: "",
  bgColor: "#16A34A",
  link: "",
  order: 0,
  enabled: true,
}

export default function AdminHero() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(defaultSlide)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadSlides() }, [])

  async function loadSlides() {
    setLoading(true)
    try {
      const data = await fetch("/api/hero?all=true").then(r => r.json())
      setSlides(data)
    } catch (e) {
      console.error("Failed to load slides:", e)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(slide: any) {
    setEditing(slide)
    setForm({ badge: slide.badge, title: slide.title, highlight: slide.highlight, description: slide.description, imageUrl: slide.imageUrl, bgColor: slide.bgColor, link: slide.link || "", order: slide.order, enabled: slide.enabled })
    setShowForm(true)
  }

  function handleNew() {
    setEditing(null)
    setForm({ ...defaultSlide, order: slides.length + 1 })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) await fetch(`/api/hero/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      else await fetch("/api/hero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      await loadSlides()
      setShowForm(false)
      setEditing(null)
    } catch (e) {
      console.error("Failed to save:", e)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this slide?")) return
    await fetch(`/api/hero/${id}`, { method: "DELETE" })
    await loadSlides()
  }

  async function handleToggle(slide: any) {
    await fetch(`/api/hero/${slide.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !slide.enabled }) })
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, enabled: !s.enabled } : s)))
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#1F2937]">Hero Slides Management</h1>
          <button onClick={handleNew} className="bg-[#16A34A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#15803d] transition-colors">+ Add Slide</button>
        </div>
      </header>

      <div className="p-6">
        {/* Slide Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-lg text-[#1F2937]">{editing ? "Edit Slide" : "New Slide"}</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Preview */}
                <div className="rounded-lg overflow-hidden relative min-h-[120px] flex items-end text-white" style={{ backgroundColor: form.bgColor }}>
                  {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="relative z-10 p-5 w-full" style={{ background: form.imageUrl ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" : "none" }}>
                    {form.badge && <span className="inline-block bg-white/20 text-xs font-bold uppercase px-2 py-1 rounded-full mb-2">{form.badge}</span>}
                    <h3 className="text-xl font-black leading-tight drop-shadow">{form.title || "Title"}<br /><span className="text-yellow-300">{form.highlight || "Highlight"}</span></h3>
                    <p className="text-white/80 text-sm mt-1 drop-shadow">{form.description || "Description text"}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Badge Text</label>
                    <input type="text" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Express Delivery" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="w-10 h-10 rounded border border-gray-200 cursor-pointer" />
                      <input type="text" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fast Delivery" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Highlight Text</label>
                  <input type="text" value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })} placeholder="e.g. To Your Doorstep" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A] resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Image</label>
                  <ImageUpload folder="hero" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Link URL (optional)</label>
                  <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://... or /grocery (leave empty for no link)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Order</label>
                    <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select value={form.enabled ? "enabled" : "disabled"} onChange={(e) => setForm({ ...form, enabled: e.target.value === "enabled" })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]">
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-[#16A34A] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#15803d] disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Slides List */}
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading slides...</div>
        ) : slides.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-500 font-medium">No hero slides yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;+ Add Slide&quot; to create your first hero banner</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {slides.map((slide) => (
              <div key={slide.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-[300px] relative min-h-[100px] text-white flex-shrink-0 flex items-end overflow-hidden" style={{ backgroundColor: slide.bgColor }}>
                    {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                    <div className="relative z-10 p-4 w-full" style={{ background: slide.imageUrl ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" : "none" }}>
                      {slide.badge && <span className="inline-block bg-white/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-1">{slide.badge}</span>}
                      <h3 className="text-sm font-black leading-tight drop-shadow">{slide.title}<br /><span className="text-yellow-300">{slide.highlight}</span></h3>
                      <p className="text-white/70 text-[10px] mt-1 line-clamp-2 drop-shadow">{slide.description}</p>
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${slide.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{slide.enabled ? "Active" : "Disabled"}</span>
                        <span className="text-[10px] text-gray-400">Order: {slide.order}</span>
                      </div>
                      <p className="font-medium text-sm text-[#1F2937]">{slide.title} — {slide.highlight}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(slide)} className={`relative w-11 h-6 rounded-full transition-colors ${slide.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${slide.enabled ? "translate-x-5" : ""}`} />
                      </button>
                      <button onClick={() => handleEdit(slide)} className="p-2 text-gray-400 hover:text-[#16A34A] hover:bg-green-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(slide.id)} className="p-2 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
