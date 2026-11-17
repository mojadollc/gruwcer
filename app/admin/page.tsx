"use client"

import { useEffect, useState } from "react"
// All data via Postgres API

const ITEMS_PER_PAGE = 20

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden">("all")
  const [storeCategories, setStoreCategories] = useState<any[]>([])

  // Edit modal state
  const [editing, setEditing] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: "", price: "", stock: "", unit: "", category: "" })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const res = await fetch("/api/products?all=true")
      setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(product: any) {
    setToggling(product.id)
    const newValue = product.showOnSite === false ? true : false
    try {
      await fetch(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ showOnSite: newValue }) })
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, showOnSite: newValue } : p)))
    } finally {
      setToggling(null)
    }
  }

  function openEdit(product: any) {
    setEditing(product)
    setEditForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      unit: product.unit || "",
      category: product.category,
    })
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const updates = {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price) || 0,
        stock: parseInt(editForm.stock) || 0,
        unit: editForm.unit.trim(),
        category: editForm.category,
      }
      await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
      setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...updates } : p))
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(file: File) {
    if (!editing) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "products")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!data.url) throw new Error(data.error || "Upload failed")
      await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: data.url }) })
      setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, imageUrl: data.url } : p))
      setEditing({ ...editing, imageUrl: data.url })
    } catch (e: any) {
      alert(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => {
      if (filterStatus === "visible") return p.showOnSite !== false
      if (filterStatus === "hidden") return p.showOnSite === false
      return true
    })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [search, filterStatus])

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <h1 className="text-lg font-bold text-[#1F2937]">Product Management</h1>
      </header>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-[#1F2937]">{products.length}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-green-600">{products.filter((p) => p.showOnSite !== false).length}</p>
            <p className="text-xs text-gray-400">Visible</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-green-700">{products.filter((p) => p.showOnSite === false).length}</p>
            <p className="text-xs text-gray-400">Hidden</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-orange-600">{products.filter((p) => p.stock <= 5).length}</p>
            <p className="text-xs text-gray-400">Low Stock</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#16A34A]" />
            </div>
            <div className="flex gap-2">
              {(["all", "visible", "hidden"] as const).map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-lg text-xs font-medium capitalize ${filterStatus === s ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[60px_1fr_90px_70px_120px_70px_80px_60px] gap-3 px-5 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
            <span>Image</span>
            <span>Name</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Category</span>
            <span>Unit</span>
            <span className="text-center">Visible</span>
            <span className="text-center">Edit</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
          ) : paginated.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No products found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {paginated.map((product) => (
                <div key={product.id} className="grid grid-cols-1 md:grid-cols-[60px_1fr_90px_70px_120px_70px_80px_60px] gap-3 px-5 py-3 items-center hover:bg-gray-50/50">
                  {/* Image */}
                  <div>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} className="w-10 h-10 object-contain rounded border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <div>
                    <p className="text-sm font-medium text-[#1F2937] line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400 md:hidden">{product.category} · ₱{product.price} · Stock: {product.stock}</p>
                  </div>
                  {/* Price */}
                  <span className="hidden md:block text-xs font-medium text-green-700">₱{product.price.toFixed(2)}</span>
                  {/* Stock */}
                  <span className={`hidden md:block text-xs font-medium ${product.stock <= 5 ? "text-green-700" : "text-gray-700"}`}>{product.stock}</span>
                  {/* Category */}
                  <span className="hidden md:block text-xs text-gray-500 truncate">{product.category}</span>
                  {/* Unit */}
                  <span className="hidden md:block text-xs text-gray-400">{product.unit || "—"}</span>
                  {/* Visibility */}
                  <div className="hidden md:flex justify-center">
                    <button
                      onClick={() => handleToggle(product)}
                      disabled={toggling === product.id}
                      className={`relative w-11 h-6 rounded-full transition-colors ${product.showOnSite !== false ? "bg-green-500" : "bg-gray-300"} ${toggling === product.id ? "opacity-50" : ""}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${product.showOnSite !== false ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  {/* Edit */}
                  <div className="flex justify-end md:justify-center">
                    <button onClick={() => openEdit(product)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs bg-white border text-gray-600 disabled:opacity-40">Prev</button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs bg-white border text-gray-600 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ EDIT PRODUCT MODAL ═══ */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#16A34A] px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-white">Edit Product</h2>
              <button onClick={() => setEditing(null)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Image Upload */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center overflow-hidden transition-colors">
                    {uploading ? (
                      <svg className="w-6 h-6 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    ) : editing.imageUrl ? (
                      <img src={editing.imageUrl} className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }} />
                </label>
                <div className="text-xs text-gray-400">
                  <p className="font-medium text-gray-600">Product Image</p>
                  <p>Click to upload or change</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500">Product Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Selling Price (₱)</label>
                  <input type="number" min="0" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Stock</label>
                  <input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
                </div>
              </div>

              {/* Category Dropdown (from pos-app-for-stores) */}
              <div>
                <label className="text-xs font-semibold text-gray-500">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => {
                    const selected = storeCategories.find((c) => c.name === e.target.value)
                    setEditForm({
                      ...editForm,
                      category: e.target.value,
                      unit: selected?.unit || editForm.unit,
                      price: selected?.salePrice ? String(selected.salePrice) : editForm.price,
                    })
                  }}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A] bg-white"
                >
                  <option value="">{editForm.category || "Select category"}</option>
                  {storeCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}{c.unit ? ` (${c.unit})` : ""}{c.salePrice ? ` — ₱${c.salePrice}` : ""}</option>
                  ))}
                </select>
                {(() => {
                  const sel = storeCategories.find((c) => c.name === editForm.category)
                  if (!sel) return null
                  return (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {sel.unit && <>Unit: <span className="font-medium text-gray-600">{sel.unit}</span> · </>}
                      {sel.salePrice && <>Sale Price: <span className="font-medium text-green-600">₱{sel.salePrice}</span></>}
                    </p>
                  )
                })()}
              </div>

              {/* Unit */}
              <div>
                <label className="text-xs font-semibold text-gray-500">Unit</label>
                <input placeholder="e.g. pc, kg, pack, bottle" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#16A34A]" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={handleSave} disabled={saving || !editForm.name.trim()} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-lg text-sm font-bold disabled:opacity-40">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
