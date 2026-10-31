"use client"
import React from "react"

const BASE_URL = "https://www.trip.com/?Allianceid=8726208&SID=319891223&trip_sub1=&trip_sub3=D18011212"

const ICONS: Record<string, React.ReactNode> = {
  hotels: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14M3 21h18M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>,
  flights: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  tours: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
  car: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 6H5l-2 6v4h2m8-10l2 6h2l2-4H13zm0 0V4" /></svg>,
  train: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6 0l-2 2m8-2l2 2M9 17h6M9 10h6" /></svg>,
  packages: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7 text-[#003580]"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
}

const CATEGORIES = [
  { id: "hotels", name: "Hotels", desc: "Find best hotel deals worldwide", link: BASE_URL },
  { id: "flights", name: "Flights", desc: "Book cheap flights anywhere", link: BASE_URL },
  { id: "tours", name: "Tours & Activities", desc: "Explore local tours & attractions", link: BASE_URL },
  { id: "car", name: "Car Rental", desc: "Rent a car for your trip", link: BASE_URL },
  { id: "train", name: "Train & Bus", desc: "Book train & bus tickets", link: BASE_URL },
  { id: "packages", name: "Travel Packages", desc: "All-in-one vacation deals", link: BASE_URL },
]

export default function TravelPage() {
  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-20">
      {/* Header */}
      <header className="bg-[#003580] px-4 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <a href="/" className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </a>
            <h1 className="text-white font-bold text-lg">Hotel Bookings & Flights</h1>
          </div>

          {/* Hero */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-14 h-14 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            <h2 className="text-white font-black text-xl mt-2">Where do you want to go?</h2>
            <p className="text-white/60 text-xs mt-1">Book hotels, flights & more at the best prices</p>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="grid grid-cols-1 gap-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={cat.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#003580]/20 transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 bg-[#003580]/5 rounded-xl flex items-center justify-center shrink-0">
                {ICONS[cat.id]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{cat.name}</p>
                <p className="text-[11px] text-gray-400">{cat.desc}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-[#003580] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="text-xs font-bold text-[#003580]">Powered by Trip.com</p>
            <p className="text-[11px] text-gray-500 mt-0.5">You'll be redirected to Trip.com to complete your booking securely.</p>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
        <div className="max-w-lg mx-auto grid grid-cols-4 py-1.5">
          <a href="/" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span className="text-[10px] font-medium">Home</span>
          </a>
          <a href="/grocery" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <span className="text-[10px] font-medium">Grocery</span>
          </a>
          <a href="/travel" className="flex flex-col items-center gap-0.5 py-1 text-[#003580]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-bold">Travel</span>
          </a>
          <a href="/account" className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-medium">Account</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
