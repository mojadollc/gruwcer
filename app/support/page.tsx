"use client"

import { useState, useEffect } from "react"

type Tab = "ticket" | "suggestion" | "my_tickets"

const CATEGORIES = [
  { value: "grocery", label: "🛒 Grocery" },
  { value: "laundry", label: "🧺 Laundry" },
  { value: "food", label: "🍔 Food to Go" },
  { value: "rentals", label: "🔧 Rentals" },
  { value: "home_services", label: "🏠 Home Services" },
  { value: "eload", label: "📱 E-Load" },
  { value: "payment", label: "💳 Payment" },
  { value: "account", label: "👤 Account" },
  { value: "other", label: "❓ Other" },
]

const SERVICES = [
  { value: "general", label: "General" },
  { value: "grocery", label: "Grocery" },
  { value: "laundry", label: "Laundry" },
  { value: "food", label: "Food to Go" },
  { value: "rentals", label: "Rentals" },
  { value: "home_services", label: "Home Services" },
  { value: "eload", label: "E-Load" },
]

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
}

export default function SupportPage() {
  const [tab, setTab] = useState<Tab>("ticket")
  const [user, setUser] = useState<{ id: string; name: string; phone: string } | null>(null)

  // Ticket form
  const [tCategory, setTCategory] = useState("other")
  const [tSubject, setTSubject] = useState("")
  const [tMessage, setTMessage] = useState("")
  const [tName, setTName] = useState("")
  const [tPhone, setTPhone] = useState("")
  const [tEmail, setTEmail] = useState("")
  const [tLoading, setTLoading] = useState(false)
  const [tDone, setTDone] = useState(false)

  // Suggestion form
  const [sService, setSService] = useState("general")
  const [sTitle, setSTitle] = useState("")
  const [sDesc, setSDesc] = useState("")
  const [sName, setSName] = useState("")
  const [sLoading, setSLoading] = useState(false)
  const [sDone, setSDone] = useState(false)

  // My tickets
  const [myTickets, setMyTickets] = useState<{
    id: string; subject: string; category: string; status: string; message: string; adminReply?: string; createdAt: string
  }[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)

  useEffect(() => {
    const u = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (u) {
      const parsed = JSON.parse(u)
      setUser(parsed)
      setTName(parsed.name || "")
      setTPhone(parsed.phone || "")
      setSName(parsed.name || "")
    }
  }, [])

  async function fetchMyTickets() {
    if (!user) return
    setTicketsLoading(true)
    const res = await fetch(`/api/support?customerId=${user.id}`)
    if (res.ok) setMyTickets(await res.json())
    setTicketsLoading(false)
  }

  useEffect(() => {
    if (tab === "my_tickets") fetchMyTickets()
  }, [tab, user])

  async function submitTicket() {
    if (!tSubject.trim() || !tMessage.trim() || !tName.trim()) return
    setTLoading(true)
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: user?.id || null,
        customerName: tName,
        customerPhone: tPhone,
        customerEmail: tEmail,
        category: tCategory,
        subject: tSubject,
        message: tMessage,
      }),
    })
    setTLoading(false)
    setTDone(true)
    setTSubject(""); setTMessage(""); setTEmail("")
  }

  async function submitSuggestion() {
    if (!sTitle.trim() || !sDesc.trim() || !sName.trim()) return
    setSLoading(true)
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: user?.id || null,
        customerName: sName,
        service: sService,
        title: sTitle,
        description: sDesc,
      }),
    })
    setSLoading(false)
    setSDone(true)
    setSTitle(""); setSDesc("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => history.back()} className="p-1.5 rounded-lg hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-bold text-gray-900 text-base">Help & Support</h1>
          <p className="text-xs text-gray-500">We&apos;re here to help you</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 px-4">
        {([
          { key: "ticket", label: "Submit Ticket" },
          { key: "suggestion", label: "Suggestions" },
          { key: "my_tickets", label: "My Tickets" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-[#16A34A] text-[#16A34A]" : "border-transparent text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* SUBMIT TICKET */}
        {tab === "ticket" && (
          <div className="space-y-4">
            {tDone ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-green-800 text-lg">Ticket Submitted!</h3>
                <p className="text-green-700 text-sm mt-1">Our team will get back to you soon. Check &quot;My Tickets&quot; for updates.</p>
                <button onClick={() => setTDone(false)} className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium">
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                  <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">Describe your issue and we&apos;ll respond within 24 hours.</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                  <h2 className="font-semibold text-gray-800 text-sm">Your Info</h2>
                  <input
                    value={tName} onChange={(e) => setTName(e.target.value)}
                    placeholder="Full name *"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                  <input
                    value={tPhone} onChange={(e) => setTPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                  <input
                    value={tEmail} onChange={(e) => setTEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                  <h2 className="font-semibold text-gray-800 text-sm">Issue Details</h2>
                  <select
                    value={tCategory} onChange={(e) => setTCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input
                    value={tSubject} onChange={(e) => setTSubject(e.target.value)}
                    placeholder="Subject *"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                  <textarea
                    value={tMessage} onChange={(e) => setTMessage(e.target.value)}
                    placeholder="Describe your issue in detail *"
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] resize-none"
                  />
                </div>

                <button
                  onClick={submitTicket}
                  disabled={tLoading || !tSubject.trim() || !tMessage.trim() || !tName.trim()}
                  className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  {tLoading ? "Submitting..." : "Submit Support Ticket"}
                </button>
              </>
            )}
          </div>
        )}

        {/* SUGGESTION */}
        {tab === "suggestion" && (
          <div className="space-y-4">
            {sDone ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-green-800 text-lg">Thank you!</h3>
                <p className="text-green-700 text-sm mt-1">Your suggestion has been received. We appreciate your feedback!</p>
                <button onClick={() => setSDone(false)} className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-medium">
                  Submit Another
                </button>
              </div>
            ) : (
              <>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
                  <svg className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-xs text-orange-700">Have an idea to improve our services? We&apos;d love to hear it!</p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                  <input
                    value={sName} onChange={(e) => setSName(e.target.value)}
                    placeholder="Your name *"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                  <select
                    value={sService} onChange={(e) => setSService(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] bg-white"
                  >
                    {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <input
                    value={sTitle} onChange={(e) => setSTitle(e.target.value)}
                    placeholder="Suggestion title *"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A]"
                  />
                  <textarea
                    value={sDesc} onChange={(e) => setSDesc(e.target.value)}
                    placeholder="Describe your suggestion in detail *"
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] resize-none"
                  />
                </div>

                <button
                  onClick={submitSuggestion}
                  disabled={sLoading || !sTitle.trim() || !sDesc.trim() || !sName.trim()}
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  {sLoading ? "Submitting..." : "Submit Suggestion"}
                </button>
              </>
            )}
          </div>
        )}

        {/* MY TICKETS */}
        {tab === "my_tickets" && (
          <div className="space-y-3">
            {!user && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-700">Please log in to view your tickets.</p>
              </div>
            )}
            {user && ticketsLoading && (
              <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
            )}
            {user && !ticketsLoading && myTickets.length === 0 && (
              <div className="text-center py-10">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 text-sm">No tickets yet</p>
              </div>
            )}
            {myTickets.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{t.subject}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[t.status] || "bg-gray-100 text-gray-500"}`}>
                    {t.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{CATEGORIES.find((c) => c.value === t.category)?.label || t.category}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{t.message}</p>
                {t.adminReply && (
                  <div className="mt-3 bg-green-50 border border-green-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-green-700 mb-1">Support Reply</p>
                    <p className="text-xs text-green-800">{t.adminReply}</p>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
