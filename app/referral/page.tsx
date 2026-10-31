"use client"

import { useEffect, useState } from "react"
import { getUser } from "@/lib/auth"

export default function ReferralPage() {
  const [user, setUser] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = "/auth?redirect=/referral"; return }
    setUser(u)
    // Fetch user profile to get referralCode
    fetch(`/api/users/me`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (profile) setUser((prev: any) => ({ ...prev, referralCode: profile.referralCode }))
      })
    fetch(`/api/referrals?referrerId=${u.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReferrals)
      .finally(() => setLoading(false))
  }, [])

  const referralLink = user?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : "https://gruwcer.com"}/auth?ref=${user.referralCode}`
    : ""

  const copy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const credited = referrals.filter(r => r.status === "credited")
  const pending = referrals.filter(r => r.status === "pending")
  const totalEarned = credited.reduce((s, r) => s + r.rewardAmount, 0)

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    credited: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-600",
  }

  const typeLabel: Record<string, string> = {
    laundry: "Laundry Shop", food: "Food Restaurant", home_services: "Home Services",
    rentals: "Tool Rental", vehicles: "Vehicle Rental", partner: "Partner", provider: "Provider",
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7] pb-24">
      {/* Header */}
      <header className="bg-[#16A34A] px-4 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <a href="/" className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </a>
            <h1 className="text-white font-black text-lg">Refer & Earn</h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Referrals", value: referrals.length },
              { label: "Pending", value: pending.length },
              { label: "Total Earned", value: `₱${totalEarned}` },
            ].map(s => (
              <div key={s.label} className="bg-white/15 rounded-2xl p-3 text-center">
                <p className="text-white font-black text-xl">{s.value}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">

        {/* How it works */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-sm text-gray-800 mb-4">How It Works</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Share your unique referral link with anyone", icon: "🔗" },
              { step: "2", text: "They register as a partner (laundry, food, services, rentals, vehicles)", icon: "📝" },
              { step: "3", text: "Once their account is verified & approved by admin", icon: "✅" },
              { step: "4", text: "You get ₱150 credited to your wallet!", icon: "💰" },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#16A34A] text-white text-xs font-black flex items-center justify-center shrink-0">{s.step}</div>
                <p className="text-sm text-gray-600 pt-0.5">{s.icon} {s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral link */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-sm text-gray-800 mb-1">Your Referral Link</h2>
          <p className="text-xs text-gray-400 mb-3">Share this link — anyone who registers as a partner earns you ₱150</p>

          {user?.referralCode ? (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
                <p className="flex-1 text-xs text-gray-600 break-all font-mono">{referralLink}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={copy} className={`py-3 rounded-xl text-sm font-bold transition-colors ${copied ? "bg-green-500 text-white" : "bg-[#16A34A] text-white hover:bg-[#0d7a3a]"}`}>
                  {copied ? "✓ Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) navigator.share({ title: "Join Gruwcer as a Partner!", text: "Register as a partner on Gruwcer and earn money!", url: referralLink })
                    else copy()
                  }}
                  className="py-3 rounded-xl text-sm font-bold bg-[#FF8A00] text-white hover:bg-[#e07800] transition-colors"
                >
                  Share
                </button>
              </div>
              <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-gray-500">Your referral code</p>
                <p className="font-black text-2xl text-[#16A34A] tracking-widest">{user.referralCode}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">Loading your referral code...</p>
            </div>
          )}
        </div>

        {/* Referral history */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-sm text-gray-800 mb-4">Referral History</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-sm font-bold text-gray-600">No referrals yet</p>
              <p className="text-xs text-gray-400 mt-1">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-[#16A34A]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#16A34A] font-black text-sm">{r.referredName?.charAt(0) || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{r.referredName || "Unknown"}</p>
                    <p className="text-[11px] text-gray-400">{typeLabel[r.partnerType] || r.partnerType} • {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColor[r.status]}`}>
                      {r.status.toUpperCase()}
                    </span>
                    {r.status === "credited" && <p className="text-xs font-black text-green-600 mt-1">+₱{r.rewardAmount}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">📋 Terms & Conditions</p>
          <ul className="text-[11px] text-amber-700 space-y-1 list-disc list-inside">
            <li>Reward is ₱150 per successful partner referral</li>
            <li>Referred person must register as a partner (not a customer)</li>
            <li>Reward is credited only after admin verifies & approves the partner</li>
            <li>Self-referrals are not allowed</li>
            <li>Gruwcer reserves the right to cancel fraudulent referrals</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
