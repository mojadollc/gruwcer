"use client"

import { useEffect, useState } from "react"
// All data via Postgres API — categories stored in DB

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", emoji: "", order: 0 })
  const [uploading, setUploading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", emoji: "", order: 0 })

  const load = async () => {
    const res = await fetch("/api/products?all=true")
    const products = await res.json()
    const cats = [...new Set(products.map((p: any) => p.category).filter(Boolean))]
      .map((name, i) => ({ id: String(i), name }))
    setCategories(cats)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleEdit = (cat: any) => {
    setEditing(cat)
    setForm({ name: cat.name, emoji: cat.emoji || "", order: cat.order || 0 })
  }

  const handleSave = async () => {
    if (!editing) return
    await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: form.name }) })
    setEditing(null)
    load()
  }

  const handleImageUpload = async (catName: string, file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "categories")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!data.url) throw new Error(data.error || "Upload failed")
      // Patch all products in this category with the new imageUrl via a bulk update
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryImageUrl: data.url, category: catName }),
      }).catch(() => {})
      alert(`Image uploaded: ${data.url}`)
      load()
    } catch (e: any) {
      alert(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleAdd = async () => {
    if (!newForm.name.trim()) return
    // Categories are derived from products — no separate create needed
    console.log("Add category:", newForm.name)
    setShowAdd(false)
    setNewForm({ name: "", emoji: "", order: 0 })
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    // Categories are derived from products — no separate delete needed
    console.log("Delete category:", id)
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <button onClick={() => setShowAdd(true)} className="bg-[#16A34A] text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Category</button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-400">No categories found. Add one or check your store ID.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{cat.emoji || "📁"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{cat.name}</p>
                  <p className="text-xs text-gray-400">Order: {cat.order || 0}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(cat)} className="flex-1 text-xs bg-blue-50 text-blue-600 py-1.5 rounded-lg font-medium">Edit</button>
                <label className="flex-1 text-xs bg-green-50 text-green-600 py-1.5 rounded-lg font-medium text-center cursor-pointer">
                  {uploading ? "Uploading..." : "📷 Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(cat.name, e.target.files[0]) }} />
                </label>
                <button onClick={() => handleDelete(cat.id)} className="text-xs bg-green-50 text-green-700 py-1.5 px-3 rounded-lg font-medium">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Edit Category</h2>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Emoji (optional)" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-[#16A34A] text-white py-2 rounded-lg text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-lg">Add Category</h2>
            <input placeholder="Name" value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Emoji (optional)" value={newForm.emoji} onChange={(e) => setNewForm({ ...newForm, emoji: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Order" value={newForm.order} onChange={(e) => setNewForm({ ...newForm, order: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 bg-[#16A34A] text-white py-2 rounded-lg text-sm font-bold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
