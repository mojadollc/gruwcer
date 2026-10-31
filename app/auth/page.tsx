"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { setAuth, getUser } from "@/lib/auth"
import type { ConfirmationResult } from "firebase/auth"

function AuthPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const defaultTab = searchParams.get("tab") || "login"
  const [tab, setTab] = useState<"login" | "partner" | "rider">(defaultTab as any)

  // Customer phone OTP state
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<any>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)
  const firebaseAuthRef = useRef<any>(null)

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotPhone, setForgotPhone] = useState("")
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotOtpSent, setForgotOtpSent] = useState(false)
  const [forgotConfirmation, setForgotConfirmation] = useState<ConfirmationResult | null>(null)
  const [forgotVerified, setForgotVerified] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPw, setShowNewPw] = useState(false)

  const getFirebaseAuth = async () => {
    if (firebaseAuthRef.current) return firebaseAuthRef.current
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) return null
    const { initializeApp, getApps, getApp } = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    const app = getApps().length === 0 ? initializeApp({ apiKey, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID }) : getApp()
    firebaseAuthRef.current = getAuth(app)
    return firebaseAuthRef.current
  }

  // Partner / Rider form state
  const [partnerType, setPartnerType] = useState("")
  const [partnerForm, setPartnerForm] = useState({ email: "", password: "", shopName: "", ownerName: "", phone: "", address: "", landmark: "", lat: 0, lng: 0 })
  const [riderForm, setRiderForm] = useState({ email: "", password: "", name: "", phone: "" })
  const [detectingLoc, setDetectingLoc] = useState(false)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const user = getUser()
    if (!user) return
    if (user.role === "driver") { window.location.href = "/driver"; return }
    if (user.role === "partner") { window.location.href = "/partner"; return }
    if (user.role === "provider") { window.location.href = "/provider"; return }
    if (user.role === "admin") { window.location.href = "/admin"; return }
    window.location.href = redirect
  }, [redirect])

  const handleSendOtp = async () => {
    setError(""); setLoading(true)
    try {
      const auth = await getFirebaseAuth()
      if (!auth) { setError("Phone login not available — Firebase not configured"); setLoading(false); return }
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth")
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" })
      }
      const formatted = phone.startsWith("+") ? phone : `+63${phone.replace(/^0/, "")}`
      const result = await signInWithPhoneNumber(auth, formatted, recaptchaRef.current)
      setConfirmation(result)
      setOtpSent(true)
    } catch (e: any) {
      recaptchaRef.current = null
      setError(e.message || "Failed to send OTP")
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    if (!confirmation) return
    setError(""); setLoading(true)
    try {
      await confirmation.confirm(otp)
      const formatted = phone.startsWith("+") ? phone : `+63${phone.replace(/^0/, "")}`
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "phone-login", phone: formatted, name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")
      setAuth(data.token, data.user)
      window.location.href = redirect
    } catch (e: any) { setError(e.message || "Invalid OTP") } finally { setLoading(false) }
  }

  async function callAuth(body: object) {
    const res = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Authentication failed")
    return data
  }

  const handleForgotSendOtp = async () => {
    setError(""); setLoading(true)
    try {
      const auth = await getFirebaseAuth()
      if (!auth) { setError("Phone OTP not available — Firebase not configured"); return }
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth")
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" })
      }
      const formatted = forgotPhone.startsWith("+") ? forgotPhone : `+63${forgotPhone.replace(/^0/, "")}`
      const result = await signInWithPhoneNumber(auth, formatted, recaptchaRef.current)
      setForgotConfirmation(result)
      setForgotOtpSent(true)
    } catch (e: any) {
      recaptchaRef.current = null
      setError(e.message || "Failed to send OTP")
    } finally { setLoading(false) }
  }

  const handleForgotVerifyOtp = async () => {
    if (!forgotConfirmation) return
    setError(""); setLoading(true)
    try {
      await forgotConfirmation.confirm(forgotOtp)
      setForgotVerified(true)
    } catch (e: any) {
      setError("Invalid OTP. Please try again.")
    } finally { setLoading(false) }
  }

  const handleResetPassword = async () => {
    setError("")
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return }
    setLoading(true)
    try {
      const formatted = forgotPhone.startsWith("+") ? forgotPhone : `+63${forgotPhone.replace(/^0/, "")}`
      const data = await callAuth({ action: "reset-password", phone: formatted, newPassword })
      setAuth(data.token, data.user)
      setSuccess("Password reset successfully! Redirecting...")
      setTimeout(() => { window.location.href = data.user.role === "partner" ? "/partner" : data.user.role === "driver" ? "/driver" : "/" }, 1500)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const resetForgotState = () => {
    setForgotMode(false); setForgotPhone(""); setForgotOtp(""); setForgotOtpSent(false)
    setForgotConfirmation(null); setForgotVerified(false); setNewPassword(""); setConfirmPassword("")
    setError(""); recaptchaRef.current = null
  }

  const handlePartnerRegister = async () => {
    setError("")
    if (!partnerForm.shopName || !partnerForm.ownerName || !partnerForm.phone) { setError("All fields are required"); return }
    setLoading(true)
    try {
      const data = await callAuth({
        action: "register",
        email: partnerForm.email,
        password: partnerForm.password,
        name: partnerForm.ownerName,
        shopName: partnerForm.shopName,
        phone: partnerForm.phone,
        address: partnerForm.address,
        landmark: partnerForm.landmark,
        lat: partnerForm.lat,
        lng: partnerForm.lng,
        role: "partner",
        partnerType,
      })
      setAuth(data.token, data.user)
      // Redirect based on service type
      if (partnerType === "rentals") { window.location.href = "/rentals/post"; return }
      if (partnerType === "vehicles") { window.location.href = "/vehicles/post"; return }
      window.location.href = "/partner"
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const handleRiderRegister = async () => {
    setError("")
    if (!riderForm.name || !riderForm.phone) { setError("Name and phone are required"); return }
    setLoading(true)
    try {
      await callAuth({ action: "register", email: riderForm.email, password: riderForm.password, name: riderForm.name, phone: riderForm.phone, role: "driver" })
      setSuccess("Rider account created! Your application is pending admin approval.")
      setRiderForm({ email: "", password: "", name: "", phone: "" })
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#16A34A] to-[#15803d] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-6">
          <a href="/" className="inline-block">
            <h1 className="text-white text-2xl font-black tracking-tight">Gruwcer</h1>
          </a>
          <p className="text-white/60 text-xs mt-1">Sign in to access all services</p>
        </div>

        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
          {(["login", "partner", "rider"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); setOtpSent(false); setOtp(""); setPhone(""); setName(""); setPartnerType("") }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-colors capitalize ${tab === t ? "bg-white text-[#16A34A]" : "text-white/70"}`}>
              {t === "login" ? "Customer" : t === "partner" ? "Partner" : "Rider"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-800">{success}</p>
              <a href="/auth" className="inline-block mt-4 text-xs text-[#16A34A] font-bold">← Back to Sign In</a>
            </div>
          ) : tab === "login" ? (
            <>
              <h2 className="font-bold text-lg text-gray-800 mb-1">Customer Sign In</h2>
              <p className="text-xs text-gray-400 mb-4">Enter your phone number to receive an OTP</p>
              {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}
              {!otpSent ? (
                <div className="space-y-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#16A34A]">
                    <span className="px-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 py-2.5">🇵🇭 +63</span>
                    <input
                      placeholder="9XX XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength={10}
                      className="flex-1 px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <input
                    placeholder="Your Name (for new accounts)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#16A34A]"
                  />
                  <button onClick={handleSendOtp} disabled={loading || phone.length < 10}
                    className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">OTP sent to <span className="font-bold text-gray-700">+63{phone}</span></p>
                  <input
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#16A34A] tracking-widest text-center text-lg font-bold"
                  />
                  <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                    className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
                    {loading ? "Verifying..." : "Verify & Sign In"}
                  </button>
                  <button onClick={() => { setOtpSent(false); setOtp(""); setError(""); recaptchaRef.current = null }}
                    className="w-full text-xs text-gray-400 hover:text-gray-600">
                    ← Change number
                  </button>
                </div>
              )}
            </>
          ) : tab === "rider" ? (
            <>
              {forgotMode ? (
                <ForgotPasswordFlow
                  forgotPhone={forgotPhone} setForgotPhone={setForgotPhone}
                  forgotOtp={forgotOtp} setForgotOtp={setForgotOtp}
                  forgotOtpSent={forgotOtpSent} forgotVerified={forgotVerified}
                  newPassword={newPassword} setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showNewPw={showNewPw} setShowNewPw={setShowNewPw}
                  loading={loading} error={error}
                  onSendOtp={handleForgotSendOtp} onVerifyOtp={handleForgotVerifyOtp}
                  onReset={handleResetPassword} onBack={resetForgotState}
                />
              ) : (
                <>
                  <h2 className="font-bold text-lg text-gray-800 mb-1">Rider Registration</h2>
                  <p className="text-xs text-gray-400 mb-4">Register as a delivery rider</p>
                  {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}
                  <div className="space-y-3">
                    <input placeholder="Full Name" value={riderForm.name} onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-600" />
                    <input placeholder="Phone Number" value={riderForm.phone} onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value.replace(/[^0-9]/g, "") })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-600" />
                    <input type="email" placeholder="Email" value={riderForm.email} onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-600" />
                    <input type="password" placeholder="Password" value={riderForm.password} onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-600" />
                    <button onClick={handleRiderRegister} disabled={loading || !riderForm.email || !riderForm.password}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
                      {loading ? "Registering..." : "Register as Rider"}
                    </button>
                    <button onClick={() => { setForgotMode(true); setError("") }} className="w-full text-xs text-gray-400 hover:text-[#16A34A] transition-colors pt-1">
                      Forgot password? Reset via phone OTP
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="font-bold text-lg text-gray-800 mb-1">Partner Registration</h2>

              {forgotMode ? (
                <ForgotPasswordFlow
                  forgotPhone={forgotPhone} setForgotPhone={setForgotPhone}
                  forgotOtp={forgotOtp} setForgotOtp={setForgotOtp}
                  forgotOtpSent={forgotOtpSent} forgotVerified={forgotVerified}
                  newPassword={newPassword} setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showNewPw={showNewPw} setShowNewPw={setShowNewPw}
                  loading={loading} error={error}
                  onSendOtp={handleForgotSendOtp} onVerifyOtp={handleForgotVerifyOtp}
                  onReset={handleResetPassword} onBack={resetForgotState}
                />
              ) : !partnerType ? (
                <>
                  <p className="text-xs text-gray-400 mb-4">Choose the service you want to offer</p>
                  {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}
                  <div className="space-y-2">
                    {[
                      { type: "laundry", emoji: "🧺", label: "Laundry Shop", desc: "Offer wash, dry & fold pickup/delivery" },
                      { type: "food", emoji: "🍔", label: "Food Restaurant", desc: "List your restaurant on Food to Go" },
                      { type: "home_services", emoji: "🏠", label: "Home Services", desc: "Aircon, plumbing, electrical & more" },
                      { type: "rentals", emoji: "🔧", label: "Tool & Equipment Rental", desc: "Rent out your tools and equipment" },
                      { type: "vehicles", emoji: "🚗", label: "Vehicle Rental", desc: "Rent out your motorbike, car or e-bike" },
                    ].map(s => (
                      <button key={s.type} onClick={() => { setPartnerType(s.type); setError("") }}
                        className="w-full flex items-center gap-3 border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-4 py-3 transition-all text-left">
                        <span className="text-2xl shrink-0">{s.emoji}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{s.label}</p>
                          <p className="text-[11px] text-gray-400">{s.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => { setPartnerType(""); setError("") }} className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-3 hover:underline">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    Change service type
                  </button>

                  {/* Service badge */}
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
                    <span className="text-lg">{({ laundry: "🧺", food: "🍔", home_services: "🏠", rentals: "🔧", vehicles: "🚗" } as Record<string,string>)[partnerType]}</span>
                    <div>
                      <p className="text-xs font-bold text-blue-800">{({ laundry: "Laundry Shop", food: "Food Restaurant", home_services: "Home Services", rentals: "Tool & Equipment Rental", vehicles: "Vehicle Rental" } as Record<string,string>)[partnerType]}</p>
                      <p className="text-[10px] text-blue-500">Partner registration</p>
                    </div>
                  </div>

                  {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}

                  <div className="space-y-3">
                    {/* Food: redirect to admin-managed onboarding */}
                    {partnerType === "food" && (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-orange-700">
                        🍔 Restaurant partners are onboarded by our team. Fill in your details and we&apos;ll contact you.
                      </div>
                    )}
                    {/* Rentals / Vehicles: redirect to post page after register */}
                    {(partnerType === "rentals" || partnerType === "vehicles") && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
                        ✅ After registering, you&apos;ll be redirected to post your listing.
                      </div>
                    )}

                    <input placeholder="Business / Shop Name" value={partnerForm.shopName} onChange={e => setPartnerForm(f => ({ ...f, shopName: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />
                    <input placeholder="Owner Full Name" value={partnerForm.ownerName} onChange={e => setPartnerForm(f => ({ ...f, ownerName: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />
                    <input placeholder="Phone Number" value={partnerForm.phone} onChange={e => setPartnerForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />

                    {/* Address only for location-based services */}
                    {["laundry", "food", "home_services"].includes(partnerType) && (
                      <>
                        <div className="relative">
                          <input placeholder="Business Address" value={partnerForm.address} onChange={e => setPartnerForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-24 text-sm outline-none focus:border-blue-600" />
                          <button type="button" onClick={() => {
                            if (!navigator.geolocation) return
                            setDetectingLoc(true)
                            navigator.geolocation.getCurrentPosition(async (pos) => {
                              try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                                const d = await res.json()
                                setPartnerForm(f => ({ ...f, address: d.display_name || "", lat: pos.coords.latitude, lng: pos.coords.longitude }))
                              } catch {} finally { setDetectingLoc(false) }
                            }, () => setDetectingLoc(false), { enableHighAccuracy: true })
                          }} disabled={detectingLoc} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg">
                            {detectingLoc ? "..." : "📍 Detect"}
                          </button>
                        </div>
                        {partnerForm.lat > 0 && <p className="text-[9px] text-green-600">✓ Location pinned</p>}
                        <input placeholder="Landmark (optional)" value={partnerForm.landmark} onChange={e => setPartnerForm(f => ({ ...f, landmark: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />
                      </>
                    )}

                    <input type="email" placeholder="Email" value={partnerForm.email} onChange={e => setPartnerForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />
                    <input type="password" placeholder="Password" value={partnerForm.password} onChange={e => setPartnerForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600" />

                    <button onClick={handlePartnerRegister} disabled={loading || !partnerForm.email || !partnerForm.password || !partnerForm.shopName || !partnerForm.ownerName || !partnerForm.phone}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
                      {loading ? "Registering..." : "Register as Partner"}
                    </button>
                    <button onClick={() => { setForgotMode(true); setError("") }} className="w-full text-xs text-gray-400 hover:text-blue-600 transition-colors pt-1">
                      Forgot password? Reset via phone OTP
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="text-center mt-4">
          <a href="/" className="text-white/60 text-xs hover:text-white">← Back to Home</a>
        </div>
      </div>
    </main>
  )
}

function ForgotPasswordFlow({
  forgotPhone, setForgotPhone, forgotOtp, setForgotOtp,
  forgotOtpSent, forgotVerified,
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showNewPw, setShowNewPw,
  loading, error,
  onSendOtp, onVerifyOtp, onReset, onBack,
}: {
  forgotPhone: string; setForgotPhone: (v: string) => void
  forgotOtp: string; setForgotOtp: (v: string) => void
  forgotOtpSent: boolean; forgotVerified: boolean
  newPassword: string; setNewPassword: (v: string) => void
  confirmPassword: string; setConfirmPassword: (v: string) => void
  showNewPw: boolean; setShowNewPw: (v: boolean) => void
  loading: boolean; error: string
  onSendOtp: () => void; onVerifyOtp: () => void; onReset: () => void; onBack: () => void
}) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to login
      </button>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-2">
        {["Phone", "Verify OTP", "New Password"].map((s, i) => {
          const done = (i === 0 && forgotOtpSent) || (i === 1 && forgotVerified) || (i === 2 && false)
          const active = (!forgotOtpSent && i === 0) || (forgotOtpSent && !forgotVerified && i === 1) || (forgotVerified && i === 2)
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                done ? "bg-green-500 text-white" : active ? "bg-[#16A34A] text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-gray-800" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
            </div>
          )
        })}
      </div>

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

      {/* Step 1: Enter phone */}
      {!forgotOtpSent && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">Reset Password</p>
            <p className="text-xs text-gray-400">Enter the phone number linked to your account</p>
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#16A34A]">
            <span className="px-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 py-2.5">🇵🇭 +63</span>
            <input
              placeholder="9XX XXX XXXX"
              value={forgotPhone}
              onChange={e => setForgotPhone(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={10}
              className="flex-1 px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <button onClick={onSendOtp} disabled={loading || forgotPhone.length < 10}
            className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </div>
      )}

      {/* Step 2: Verify OTP */}
      {forgotOtpSent && !forgotVerified && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">Enter OTP</p>
            <p className="text-xs text-gray-400">Sent to <span className="font-bold text-gray-700">+63{forgotPhone}</span></p>
          </div>
          <input
            placeholder="Enter 6-digit OTP"
            value={forgotOtp}
            onChange={e => setForgotOtp(e.target.value.replace(/[^0-9]/g, ""))}
            maxLength={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#16A34A] tracking-[0.4em] text-center text-xl font-black"
          />
          <button onClick={onVerifyOtp} disabled={loading || forgotOtp.length < 6}
            className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button onClick={onBack} className="w-full text-xs text-gray-400 hover:text-gray-600">
            ← Change number
          </button>
        </div>
      )}

      {/* Step 3: New password */}
      {forgotVerified && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-800 mb-1">Set New Password</p>
            <p className="text-xs text-gray-400">Phone verified ✓ — choose a new password</p>
          </div>
          <div className="relative">
            <input
              type={showNewPw ? "text" : "password"}
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#16A34A]"
            />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNewPw
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              }
            </button>
          </div>
          <input
            type={showNewPw ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#16A34A]"
          />
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">Passwords do not match</p>
          )}
          <button onClick={onReset} disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            className="w-full bg-[#16A34A] text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AuthWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#16A34A] flex items-center justify-center"><div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}>
      <AuthPage />
    </Suspense>
  )
}
