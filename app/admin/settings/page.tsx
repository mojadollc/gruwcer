"use client"

import { useEffect, useState } from "react"


export type PaymentMethodsConfig = {
  cod: boolean
  wallet: boolean
  qrph: boolean
  ewallet: boolean
  bank: boolean
  xendit: boolean
}

const DEFAULT_SETTINGS = {
  storeLat: 0, storeLng: 0, riderFeePerDelivery: 30,
  riderCommissionPercent: 20, partnerCommissionPercent: 15,
  freeDeliveryMinOrder: 1000, freeDeliveryArea: "Lapu-Lapu City, Cebu 6015",
  groceryBaseFare: 39, groceryBaseKm: 2, groceryPerKmRate: 10, grocerySurgeMultiplier: 1.5, grocerySurgeEnabled: false,
  laundryBaseFare: 29, laundryBaseKm: 2, laundryPerKmRate: 12, laundrySurgeMultiplier: 1.5, laundrySurgeEnabled: false,
}


type SettingsTab = "delivery" | "commission" | "payments" | "eload" | "listing"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<SettingsTab>("delivery")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsConfig>({
    cod: true, wallet: true, qrph: true, ewallet: true, bank: true, xendit: true,
  })
  const [eloadConfig, setEloadConfig] = useState({ paymongoFee: 10, gruwcerFee: 3, enabled: true })
  const [listingConfig, setListingConfig] = useState<any>({ defaultMode: "free", defaultMinBalance: 100 })
  const [partners, setPartners] = useState<any[]>([])
  const [partnerOverrides, setPartnerOverrides] = useState<Record<string, { mode: string; min: number }>>({})

  useEffect(() => {
    async function load() {
      const [data, pm, allPartners] = await Promise.all([
        fetch("/api/delivery-settings").then(r => r.json()),
        fetch("/api/settings/payment-methods").then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch("/api/users?role=partner").then(r => r.json()),
      ])
      setSettings({ ...DEFAULT_SETTINGS, ...data })
      setPaymentMethods((prev: any) => ({ ...prev, ...pm }))
      setPartners(allPartners.filter((p: any) => p.status === "active" || p.status === "pending"))
      const overrides: Record<string, { mode: string; min: number }> = {}
      allPartners.forEach((p: any) => { overrides[p.id] = { mode: p.listingMode || "free", min: p.minimumBalance ?? 0 } })
      setPartnerOverrides(overrides)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      fetch("/api/delivery-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }),
      fetch("/api/settings/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(paymentMethods) }),
      ...Object.entries(partnerOverrides).map(([id, val]) =>
        fetch(`/api/partners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingMode: val.mode, minimumBalance: val.min }) })
      ),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const detectStoreLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setSettings({ ...settings, storeLat: pos.coords.latitude, storeLng: pos.coords.longitude }),
      () => alert("Unable to get location")
    )
  }

  const updateServiceConfig = (service: "grocery" | "laundry", field: string, value: number | boolean) => {
    const key = service + field.charAt(0).toUpperCase() + field.slice(1)
    setSettings((s: any) => ({ ...s, [key]: value }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading settings...</p>
      </div>
    </div>
  )

  const TABS: { key: SettingsTab; label: string; icon: string }[] = [
    { key: "delivery", label: "Delivery & Fees", icon: "🚚" },
    { key: "commission", label: "Commissions", icon: "💰" },
    { key: "payments", label: "Payments", icon: "💳" },
    { key: "eload", label: "E-Load", icon: "⚡" },
    { key: "listing", label: "Listing Mode", icon: "🏪" },
  ]

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1F2937]">Settings</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Configure delivery, payments, and platform settings</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#15803d] transition-colors disabled:opacity-50 shadow-sm">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Saved!</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl max-w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white text-[#1F2937] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Success Banner */}
        {saved && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm text-green-800 font-medium">All settings saved successfully!</p>
          </div>
        )}

        <div className="max-w-4xl">
          {/* ═══ DELIVERY & FEES TAB ═══ */}
          {tab === "delivery" && (
            <div className="space-y-6">
              {/* Store Location */}
              <Section title="Store Location" desc="Base location for delivery distance calculations">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Latitude">
                    <input type="number" step="any" placeholder="10.3157" value={settings.storeLat || ""} onChange={(e) => setSettings({ ...settings, storeLat: Number(e.target.value) })} className="input-field" />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="any" placeholder="123.9550" value={settings.storeLng || ""} onChange={(e) => setSettings({ ...settings, storeLng: Number(e.target.value) })} className="input-field" />
                  </Field>
                  <Field label="Auto-Detect">
                    <button onClick={detectStoreLocation} className="w-full h-[42px] border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">📍 Use Current Location</button>
                  </Field>
                </div>
                {settings.storeLat > 0 && <p className="text-[10px] text-green-600 mt-2">✓ Location set: {settings.storeLat.toFixed(4)}, {settings.storeLng.toFixed(4)}</p>}
              </Section>

              {/* Grocery Fee */}
              <Section title="Grocery Delivery Fee" desc="Fee structure for grocery deliveries">
                <FeeGrid config={{ baseFare: settings.groceryBaseFare, baseKm: settings.groceryBaseKm, perKmRate: settings.groceryPerKmRate, surgeMultiplier: settings.grocerySurgeMultiplier, surgeEnabled: settings.grocerySurgeEnabled }} onChange={(f, v) => updateServiceConfig("grocery", f, v)} />
              </Section>

              {/* Laundry Fee */}
              <Section title="Laundry Pickup & Delivery Fee" desc="Fee structure for laundry pickups and deliveries">
                <FeeGrid config={{ baseFare: settings.laundryBaseFare, baseKm: settings.laundryBaseKm, perKmRate: settings.laundryPerKmRate, surgeMultiplier: settings.laundrySurgeMultiplier, surgeEnabled: settings.laundrySurgeEnabled }} onChange={(f, v) => updateServiceConfig("laundry", f, v)} />
              </Section>

              {/* Free Delivery */}
              <Section title="Free Delivery Threshold" desc="Minimum order amount for free delivery on grocery">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Minimum Order (₱)">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                      <input type="number" min={0} value={settings.freeDeliveryMinOrder} onChange={(e) => setSettings({ ...settings, freeDeliveryMinOrder: Number(e.target.value) })} className="input-field pl-8" />
                    </div>
                  </Field>
                  <Field label="Coverage Area">
                    <input type="text" value={settings.freeDeliveryArea} onChange={(e) => setSettings({ ...settings, freeDeliveryArea: e.target.value })} className="input-field" />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* ═══ COMMISSIONS TAB ═══ */}
          {tab === "commission" && (
            <div className="space-y-6">
              {/* Rider Commission */}
              <Section title="Rider Commission" desc="Platform cut from rider delivery fees">
                <div className="flex items-start gap-6">
                  <Field label="Commission Rate">
                    <div className="relative w-28">
                      <input type="number" min={0} max={100} value={settings.riderCommissionPercent} onChange={(e) => setSettings({ ...settings, riderCommissionPercent: Number(e.target.value) })} className="input-field pr-8 text-center text-lg font-bold" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </Field>
                  <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Example: ₱49 delivery fee</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Rider gets</p>
                        <p className="text-xl font-bold text-green-600">₱{Math.round(49 * (100 - settings.riderCommissionPercent) / 100)}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div>
                        <p className="text-xs text-gray-500">Platform gets</p>
                        <p className="text-xl font-bold text-[#16A34A]">₱{Math.round(49 * settings.riderCommissionPercent / 100)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Partner Commission */}
              <Section title="Partner (Laundry) Commission" desc="Platform cut from partner service earnings">
                <div className="flex items-start gap-6">
                  <Field label="Commission Rate">
                    <div className="relative w-28">
                      <input type="number" min={0} max={100} value={settings.partnerCommissionPercent} onChange={(e) => setSettings({ ...settings, partnerCommissionPercent: Number(e.target.value) })} className="input-field pr-8 text-center text-lg font-bold" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </Field>
                  <div className="flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Example: ₱200 laundry order</p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Partner gets</p>
                        <p className="text-xl font-bold text-green-600">₱{Math.round(200 * (100 - settings.partnerCommissionPercent) / 100)}</p>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div>
                        <p className="text-xs text-gray-500">Platform gets</p>
                        <p className="text-xl font-bold text-[#16A34A]">₱{Math.round(200 * settings.partnerCommissionPercent / 100)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ═══ PAYMENTS TAB ═══ */}
          {tab === "payments" && (
            <div className="space-y-6">
              <Section title="Payment Methods" desc="Enable or disable payment options across all services (Grocery, Laundry, Home Services)">
                <div className="space-y-2">
                  {([
                    { key: "cod" as const, label: "Cash on Delivery", desc: "Customer pays cash to the rider on delivery", icon: "💵", color: "green" },
                    { key: "wallet" as const, label: "Payroo Wallet", desc: "Deduct from customer's in-app wallet balance", icon: "👛", color: "purple" },
                    { key: "qrph" as const, label: "QR Ph (InstaPay)", desc: "Scan QR code with any Philippine banking app", icon: "📱", color: "blue" },
                    { key: "ewallet" as const, label: "E-Wallets", desc: "GrabPay, Maya, ShopeePay", icon: "📲", color: "cyan" },
                    { key: "bank" as const, label: "Bank Transfer", desc: "BPI, UnionBank, RCBC — Direct Debit", icon: "🏦", color: "emerald" },
                    { key: "xendit" as const, label: "Online Payment (Xendit)", desc: "All-in-one payment gateway for services", icon: "💳", color: "indigo" },
                  ]).map((pm) => (
                    <div key={pm.key} className={`flex items-center gap-4 border rounded-xl px-5 py-4 transition-all ${paymentMethods[pm.key] ? "border-green-200 bg-white shadow-sm" : "border-gray-100 bg-gray-50/50"}`}>
                      <span className="text-2xl">{pm.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${paymentMethods[pm.key] ? "text-gray-800" : "text-gray-400"}`}>{pm.label}</p>
                        <p className="text-[11px] text-gray-400">{pm.desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${paymentMethods[pm.key] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          {paymentMethods[pm.key] ? "ACTIVE" : "OFF"}
                        </span>
                        <button
                          onClick={() => setPaymentMethods({ ...paymentMethods, [pm.key]: !paymentMethods[pm.key] })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${paymentMethods[pm.key] ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${paymentMethods[pm.key] ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* ═══ E-LOAD TAB ═══ */}
          {tab === "eload" && (
            <div className="space-y-6">
              <Section title="E-Load Service" desc="Configure PayMongo fees and GBits API settings for the E-Load feature">
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">E-Load Service</p>
                      <p className="text-[10px] text-gray-400">Allow customers to buy mobile/game/cable load</p>
                    </div>
                    <button onClick={() => setEloadConfig(c => ({ ...c, enabled: !c.enabled }))} className={`relative w-11 h-6 rounded-full transition-colors ${eloadConfig.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${eloadConfig.enabled ? "translate-x-5" : ""}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="PayMongo Fee (₱)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                        <input type="number" min={0} value={eloadConfig.paymongoFee} onChange={e => setEloadConfig(c => ({ ...c, paymongoFee: Number(e.target.value) }))} className="input-field pl-8" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Fee charged by PayMongo per transaction</p>
                    </Field>
                    <Field label="Gruwcer Service Fee (₱)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                        <input type="number" min={0} value={eloadConfig.gruwcerFee} onChange={e => setEloadConfig(c => ({ ...c, gruwcerFee: Number(e.target.value) }))} className="input-field pl-8" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Platform fee added on top of load amount</p>
                    </Field>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-[10px] text-purple-600 font-semibold uppercase mb-2">Fee Preview</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[50, 100, 300].map(amt => (
                        <div key={amt} className="text-center bg-white rounded-lg p-2.5 border border-purple-100">
                          <p className="text-[10px] text-gray-400">₱{amt} load</p>
                          <p className="text-base font-bold text-purple-600">₱{amt + eloadConfig.paymongoFee + eloadConfig.gruwcerFee}</p>
                          <p className="text-[9px] text-gray-400">total charged</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="PayMongo Configuration" desc="API keys for PayMongo payment processing">
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-1">Current Key Mode</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <p className="text-sm font-bold text-gray-800">Test Mode</p>
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">sk_test_...</span>
                    </div>
                    <p className="text-[10px] text-blue-600 mt-2">To switch to live mode, update <code className="bg-blue-100 px-1 rounded">PAYMONGO_SECRET_KEY</code> in your VPS <code className="bg-blue-100 px-1 rounded">.env</code> file and redeploy.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Webhook Setup</p>
                    <p className="text-xs text-gray-500">Register this URL in your <a href="https://dashboard.paymongo.com" target="_blank" className="text-blue-600 font-bold underline">PayMongo Dashboard</a> under Webhooks:</p>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-700 break-all">
                      https://gruwcer.com/api/eload-webhook
                    </div>
                    <p className="text-[10px] text-gray-400">Event to listen: <span className="font-bold">link.payment.paid</span></p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">GBits API Status</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm text-gray-700">Business ID: <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_GBITS_BUSINESS_ID || "aab5db19-..."}</span></p>
                    </div>
                    <p className="text-[10px] text-gray-400">GBits credentials are managed in the VPS <code className="bg-gray-100 px-1 rounded">.env</code> file.</p>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ═══ LISTING MODE TAB ═══ */}}
          {tab === "listing" && (
            <div className="space-y-6">
              {/* Global Default */}
              <Section title="Default Listing Mode" desc="Applies to all partners unless overridden below">
                <div className="flex gap-3">
                  <button
                    onClick={() => setListingConfig({ ...listingConfig, defaultMode: "free" })}
                    className={`flex-1 text-left border-2 rounded-xl px-5 py-4 transition-all ${listingConfig.defaultMode === "free" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🆓</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Free Listing</p>
                        <p className="text-[10px] text-gray-500">All approved shops visible — no wallet needed</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setListingConfig({ ...listingConfig, defaultMode: "wallet_required" })}
                    className={`flex-1 text-left border-2 rounded-xl px-5 py-4 transition-all ${listingConfig.defaultMode === "wallet_required" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💰</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Wallet Required</p>
                        <p className="text-[10px] text-gray-500">Shops must have balance to be listed</p>
                      </div>
                    </div>
                  </button>
                </div>
                {listingConfig.defaultMode === "wallet_required" && (
                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-600">Default Minimum Balance:</label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
                      <input type="number" min={0} value={listingConfig.defaultMinBalance} onChange={(e) => setListingConfig({ ...listingConfig, defaultMinBalance: Number(e.target.value) })} className="input-field pl-8 text-center font-bold" />
                    </div>
                  </div>
                )}
              </Section>

              {/* Per-Partner Override */}
              <Section title="Per-Shop Listing Rules" desc="Override listing mode for specific laundry shops and service providers">
                <div className="space-y-2">
                  {partners.length === 0 && (
                    <p className="text-center text-gray-400 text-xs py-6">No partners registered yet.</p>
                  )}
                  {partners.map((p) => {
                    const override = partnerOverrides[p.id] || { mode: listingConfig.defaultMode, min: listingConfig.defaultMinBalance }
                    const isVisible = override.mode === "free" || (p.walletBalance || 0) >= override.min
                    return (
                      <div key={p.id} className={`flex items-center gap-4 border rounded-xl px-5 py-4 transition-all ${override.mode === "wallet_required" ? "border-orange-200 bg-orange-50/30" : "border-green-200 bg-green-50/30"}`}>
                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{p.shopName}</p>
                            {isVisible ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">✓ VISIBLE</span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">✗ HIDDEN</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {p.ownerName} • Wallet: <span className={`font-bold ${(p.walletBalance || 0) > 0 ? "text-green-600" : "text-gray-500"}`}>₱{(p.walletBalance || 0).toLocaleString()}</span>
                          </p>
                        </div>
                        {/* Mode Select */}
                        <select
                          value={override.mode}
                          onChange={(e) => setPartnerOverrides({ ...partnerOverrides, [p.id]: { ...override, mode: e.target.value as any, min: e.target.value === "free" ? 0 : (override.min || listingConfig.defaultMinBalance) } })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#16A34A]"
                        >
                          <option value="free">Free</option>
                          <option value="wallet_required">Wallet Required</option>
                        </select>
                        {/* Min Balance */}
                        {override.mode === "wallet_required" && (
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">₱</span>
                            <input
                              type="number"
                              min={0}
                              value={override.min}
                              onChange={(e) => setPartnerOverrides({ ...partnerOverrides, [p.id]: { ...override, min: Number(e.target.value) } })}
                              className="w-full border border-gray-200 rounded-lg pl-5 pr-2 py-1.5 text-xs font-bold outline-none focus:border-[#16A34A]"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>

              {/* Summary */}
              <Section title="Visibility Summary" desc="Which shops are currently visible to customers">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Shop Name</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Mode</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Min Balance</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Wallet</th>
                        <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partners.map((p) => {
                        const override = partnerOverrides[p.id] || { mode: listingConfig.defaultMode, min: listingConfig.defaultMinBalance }
                        const isVisible = override.mode === "free" || (p.walletBalance || 0) >= override.min
                        return (
                          <tr key={p.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-800">{p.shopName}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${override.mode === "free" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                {override.mode === "free" ? "FREE" : "WALLET REQ"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-600">
                              {override.mode === "free" ? "—" : `₱${override.min.toLocaleString()}`}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-600">₱{(p.walletBalance || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              {isVisible ? (
                                <span className="text-[10px] font-bold text-green-600">🟢 Visible</span>
                              ) : (
                                <span className="text-[10px] font-bold text-green-500">🔴 Hidden</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {partners.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-xs">No partners yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-field:focus {
          border-color: #16A34A;
          box-shadow: 0 0 0 3px rgba(214, 40, 40, 0.08);
        }
      `}</style>
    </>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-bold text-[15px] text-[#1F2937]">{title}</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

function FeeGrid({ config, onChange }: { config: any; onChange: (field: string, value: number | boolean) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Field label="Base Fare (₱)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
            <input type="number" min={0} value={config.baseFare} onChange={(e) => onChange("baseFare", Number(e.target.value))} className="input-field pl-8" />
          </div>
        </Field>
        <Field label="Base KM">
          <input type="number" min={0} step={0.5} value={config.baseKm} onChange={(e) => onChange("baseKm", Number(e.target.value))} className="input-field" />
        </Field>
        <Field label="Per KM Rate (₱)">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₱</span>
            <input type="number" min={0} value={config.perKmRate} onChange={(e) => onChange("perKmRate", Number(e.target.value))} className="input-field pl-8" />
          </div>
        </Field>
      </div>

      {/* Surge Toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-700">Surge Pricing</p>
          <p className="text-[10px] text-gray-400">Multiply all fees during peak hours</p>
        </div>
        <div className="flex items-center gap-3">
          {config.surgeEnabled && (
            <div className="flex items-center gap-2">
              <input type="number" min={1} step={0.1} value={config.surgeMultiplier} onChange={(e) => onChange("surgeMultiplier", Number(e.target.value))} className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold outline-none focus:border-[#16A34A]" />
              <span className="text-xs text-gray-400">×</span>
            </div>
          )}
          <button onClick={() => onChange("surgeEnabled", !config.surgeEnabled)} className={`relative w-11 h-6 rounded-full transition-colors ${config.surgeEnabled ? "bg-green-500" : "bg-gray-300"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.surgeEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Fee Preview */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Fee Preview</p>
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 3, 5].map((extra) => {
            const km = config.baseKm + extra
            const fee = Math.round((config.baseFare + Math.max(0, extra) * config.perKmRate) * (config.surgeEnabled ? config.surgeMultiplier : 1))
            return (
              <div key={extra} className="text-center bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400">{km} km</p>
                <p className="text-base font-bold text-[#16A34A]">₱{fee}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
