"use client"

import { useState, useEffect, useCallback } from "react"

type Ticket = {
  id: string; customerName: string; customerPhone?: string; customerEmail?: string
  category: string; subject: string; message: string; status: string
  adminReply?: string; createdAt: string
}

type Suggestion = {
  id: string; customerName: string; service: string; title: string
  description: string; upvotes: number; status: string; adminNote?: string; createdAt: string
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
}

const SUGGESTION_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  noted: "bg-blue-100 text-blue-700",
  planned: "bg-purple-100 text-purple-700",
  implemented: "bg-green-100 text-green-700",
}

export default function AdminSupportPage() {
  const [tab, setTab] = useState<"tickets" | "suggestions">("tickets")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replyStatus, setReplyStatus] = useState("in_progress")
  const [replying, setReplying] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [suggestionStatus, setSuggestionStatus] = useState("noted")
  const [savingNote, setSavingNote] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const url = filterStatus ? `/api/support?status=${filterStatus}` : "/api/support"
    const res = await fetch(url)
    if (res.ok) setTickets(await res.json())
    setLoading(false)
  }, [filterStatus])

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/suggestions")
    if (res.ok) setSuggestions(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { if (tab === "tickets") fetchTickets(); else fetchSuggestions() }, [tab, fetchTickets, fetchSuggestions])

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return
    setReplying(true)
    await fetch(`/api/support/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminReply: replyText, status: replyStatus }),
    })
    setReplying(false)
    setSelectedTicket(null)
    setReplyText("")
    fetchTickets()
  }

  async function updateTicketStatus(id: string, status: string) {
    await fetch(`/api/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchTickets()
  }

  async function saveSuggestionNote() {
    if (!selectedSuggestion) return
    setSavingNote(true)
    await fetch(`/api/suggestions/${selectedSuggestion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote, status: suggestionStatus }),
    })
    setSavingNote(false)
    setSelectedSuggestion(null)
    fetchSuggestions()
  }

  async function deleteTicket(id: string) {
    if (!confirm("Delete this ticket?")) return
    await fetch(`/api/support/${id}`, { method: "DELETE" })
    fetchTickets()
  }

  async function deleteSuggestion(id: string) {
    if (!confirm("Delete this suggestion?")) return
    await fetch(`/api/suggestions/${id}`, { method: "DELETE" })
    fetchSuggestions()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Support & Feedback</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage customer support tickets and suggestions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {(["tickets", "suggestions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "tickets" ? `Support Tickets` : "Suggestions"}
          </button>
        ))}
      </div>

      {/* TICKETS */}
      {tab === "tickets" && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {["", "open", "in_progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filterStatus === s ? "bg-[#16A34A] text-white border-[#16A34A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#16A34A]"
                }`}
              >
                {s === "" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No tickets found</div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status] || "bg-gray-100 text-gray-500"}`}>
                          {t.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{t.category.replace("_", " ")}</span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{t.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.customerName} {t.customerPhone && `· ${t.customerPhone}`} {t.customerEmail && `· ${t.customerEmail}`}</p>
                      <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{t.message}</p>
                      {t.adminReply && (
                        <div className="mt-2 bg-green-50 rounded-lg p-2">
                          <p className="text-[10px] font-bold text-green-700">Your reply:</p>
                          <p className="text-xs text-green-800">{t.adminReply}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => { setSelectedTicket(t); setReplyText(t.adminReply || ""); setReplyStatus(t.status === "open" ? "in_progress" : t.status) }}
                        className="bg-[#16A34A] text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                      >
                        Reply
                      </button>
                      {t.status !== "closed" && (
                        <button onClick={() => updateTicketStatus(t.id, "closed")} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg font-medium">
                          Close
                        </button>
                      )}
                      <button onClick={() => deleteTicket(t.id)} className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SUGGESTIONS */}
      {tab === "suggestions" && (
        <>
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No suggestions yet</div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUGGESTION_STATUS_COLOR[s.status] || "bg-gray-100 text-gray-500"}`}>
                          {s.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{s.service.replace("_", " ")}</span>
                        <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">👍 {s.upvotes}</span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.customerName}</p>
                      <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{s.description}</p>
                      {s.adminNote && (
                        <div className="mt-2 bg-blue-50 rounded-lg p-2">
                          <p className="text-[10px] font-bold text-blue-700">Admin note:</p>
                          <p className="text-xs text-blue-800">{s.adminNote}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => { setSelectedSuggestion(s); setAdminNote(s.adminNote || ""); setSuggestionStatus(s.status) }}
                        className="bg-[#16A34A] text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                      >
                        Note
                      </button>
                      <button onClick={() => deleteSuggestion(s.id)} className="bg-red-50 text-red-500 text-xs px-3 py-1.5 rounded-lg font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(s.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* REPLY MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Reply to Ticket</h3>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-700">{selectedTicket.subject}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedTicket.message}</p>
            </div>
            <select
              value={replyStatus} onChange={(e) => setReplyStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] bg-white"
            >
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <textarea
              value={replyText} onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setSelectedTicket(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={sendReply} disabled={replying || !replyText.trim()} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {replying ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUGGESTION NOTE MODAL */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-gray-900">Add Note to Suggestion</h3>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-700">{selectedSuggestion.title}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedSuggestion.description}</p>
            </div>
            <select
              value={suggestionStatus} onChange={(e) => setSuggestionStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] bg-white"
            >
              <option value="pending">Pending</option>
              <option value="noted">Noted</option>
              <option value="planned">Planned</option>
              <option value="implemented">Implemented</option>
            </select>
            <textarea
              value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add an internal note (optional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#16A34A] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setSelectedSuggestion(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={saveSuggestionNote} disabled={savingNote} className="flex-1 bg-[#16A34A] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {savingNote ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
