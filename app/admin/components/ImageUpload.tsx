"use client"

import { useState } from "react"

export default function ImageUpload({ folder, value, onChange }: { folder: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", folder)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) onChange(data.url)
      else alert(data.error || "Upload failed")
    } catch { alert("Upload failed") }
    finally { setUploading(false) }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload below"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#16A34A]"
        />
        <label className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors ${uploading ? "bg-gray-100 text-gray-400" : "bg-[#16A34A] text-white hover:bg-[#15803d]"}`}>
          {uploading ? (
            <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Uploading...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload</>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {value && <img src={value} alt="Preview" className="h-20 rounded-lg object-cover border border-gray-100" />}
    </div>
  )
}
