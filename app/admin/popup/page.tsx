"use client"

import { useEffect, useState } from "react"
import ImageUpload from "../components/ImageUpload"
// All data via Postgres API

export default function AdminPopupPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ imageUrl: "", linkUrl: "", enabled: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadBanners() }, [])

  async function loadBanners() {
    setLoading(true)
    const data = await fetch("/api/popup").then(r => r.json())
    setBanners(data)
    setLoading(false)
  }

  function handleNew() {
    setEditing(null)
    setForm({ imageUrl: "", linkUrl: "", enabled: true })
    setShowForm(true)
  }

  function handleEdit(banner: any) {
    setEditing(banner)
    setForm({ imageUrl: banner.imageUrl, linkUrl: banner.linkUrl || "", enabled: banner.enabled })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.imageUrl.trim()) return
    setSaving(true)
    if (editing) {
      await fetch("/api/popup", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...form }) })
    } else {
      await fetch("/api/popup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    }
    await loadBanners()
    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this popup banner?")) return
    await fetch(`/api/popup?id=${id}`, { method: "DELETE" })
    await loadBanners()
  }

  async function handleToggle(banner: any) {
    await fetch("/api/popup", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banner.id, enabled: !banner.enabled }) })
    setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, enabled: !b.enabled } : b))
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">Popup Banner</h1>
            <p className="text-xs text-gray-400">Promote products or sales with a popup image on the website</p>
          </div>
          <button onClick={handleNew} className="bg-[#16A34A] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#15803d] transition-colors">+ Add Banner</button>
        </div>
      </header>

      <div className="p-6">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-lg">{editing ? "Edit Banner" : "New Popup Banner"}</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Preview */}
                {form.imageUrl && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img src={form.imageUrl} alt="Preview" className="w-full max-h-64 object-contain" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Image *</label>
                  <ImageUpload folder="popup" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                  <p className="text-[10px] text-gray-400 mt-1">Recommended: 600×800px or 800×600px (JPG/PNG/WebP)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Link URL (optional)</label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://example.com/sale or leave empty"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Where to go when user taps the banner</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForm({ ...form, enabled: !form.enabled })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.enabled ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.enabled ? "translate-x-6" : ""}`} />
                  </button>
                  <span className="text-sm text-gray-600">{form.enabled ? "Enabled (will show on website)" : "Disabled"}</span>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.imageUrl.trim()} className="bg-[#16A34A] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#15803d] disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banners List */}
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-500 font-medium">No popup banners yet</p>
            <p className="text-gray-400 text-sm mt-1">Create one to show a promotional popup on the website</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  <img src={banner.imageUrl} alt="Banner" className="w-full h-full object-contain" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${banner.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {banner.enabled ? "● Active" : "○ Disabled"}
                    </span>
                    {banner.linkUrl && <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[200px]">{banner.linkUrl}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(banner)} className={`relative w-10 h-5 rounded-full transition-colors ${banner.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${banner.enabled ? "translate-x-5" : ""}`} />
                    </button>
                    <button onClick={() => handleEdit(banner)} className="p-1.5 text-gray-400 hover:text-[#16A34A] rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-gray-400 hover:text-green-700 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
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
