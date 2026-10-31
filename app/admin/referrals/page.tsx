"use client"

import { useEffect, useState } from "react"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  credited: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
}

const TYPE_LABEL: Record<string, string> = {
  laundry: "Laundry", food: "Food", home_services: "Home Services",
  rentals: "Tool Rental", vehicles: "Vehicle Rental", partner: "Partner", provider: "Provider",
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    const q = filter !== "all" ? `?status=${filter}` : ""
    fetch(`/api/referrals${q}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReferrals)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const act = async (id: string, action: "credit" | "cancel") => {
    setActing(id + action)
    await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    })
    setActing(null)
    load()
  }

  const pending = referrals.filter(r => r.status === "pending").length
  const credited = referrals.filter(r => r.status === "credited").length
  const totalPaid = referrals.filter(r => r.status === "credited").reduce((s, r) => s + r.rewardAmount, 0)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Referral Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Credit ₱150 rewards when referred partners are verified</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Referrals", value: referrals.length, color: "text-gray-800" },
          { label: "Pending", value: pending, color: "text-yellow-600" },
          { label: "Credited", value: credited, color: "text-green-600" },
          { label: "Total Paid Out", value: `₱${totalPaid.toLocaleString()}`, color: "text-[#16A34A]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending", "credited", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all capitalize ${filter === f ? "bg-[#16A34A] border-[#16A34A] text-white" : "bg-white border-gray-200 text-gray-600"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-2">🤝</p>
            <p className="font-bold text-gray-600">No referrals found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Referrer", "Referred Partner", "Service Type", "Date", "Status", "Reward", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800 text-sm">{r.referrerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 text-sm">{r.referredName || "—"}</p>
                      <p className="text-[11px] text-gray-400">{r.referredEmail || r.referredPhone || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-1 rounded-full">
                        {TYPE_LABEL[r.partnerType] || r.partnerType || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                      {r.creditedAt && <p className="text-green-600">Credited: {new Date(r.creditedAt).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-[#16A34A]">₱{r.rewardAmount}</td>
                    <td className="px-4 py-3">
                      {r.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => act(r.id, "credit")}
                            disabled={!!acting}
                            className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#0d7a3a] disabled:opacity-50 transition-colors"
                          >
                            {acting === r.id + "credit" ? "..." : "Credit ₱150"}
                          </button>
                          <button
                            onClick={() => act(r.id, "cancel")}
                            disabled={!!acting}
                            className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            {acting === r.id + "cancel" ? "..." : "Cancel"}
                          </button>
                        </div>
                      )}
                      {r.status === "credited" && <span className="text-xs text-green-600 font-bold">✓ Paid</span>}
                      {r.status === "cancelled" && <span className="text-xs text-red-500 font-bold">Cancelled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>
          <p className="text-xs font-bold text-blue-800">When to credit a referral</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Credit ₱150 only after you have verified and approved the referred partner's account. The reward is automatically added to the referrer's wallet and they receive a notification.</p>
        </div>
      </div>
    </div>
  )
}
