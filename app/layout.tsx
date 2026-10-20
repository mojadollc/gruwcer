import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import PullToRefresh from "./components/PullToRefresh"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Payroo | Grocery, Laundry & Services",
  description: "Your everyday super app. Grocery delivery, laundry pickup, home services — all in one place. Lapu-Lapu City, Cebu.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Payroo",
    startupImage: [
      { url: "/icons/icon-512.png", media: "(device-width: 375px) and (device-height: 812px)" },
      { url: "/icons/icon-512.png", media: "(device-width: 414px) and (device-height: 896px)" },
      { url: "/icons/icon-512.png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Payroo",
    "apple-mobile-web-app-title": "Payroo",
    "msapplication-TileColor": "#16A34A",
    "msapplication-tap-highlight": "no",
    "format-detection": "telephone=no",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16A34A" },
    { media: "(prefers-color-scheme: dark)", color: "#16A34A" },
  ],
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#16A34A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* TWA: Digital Asset Links verification */}
        <link rel="assetlinks.json" href="/.well-known/assetlinks.json" />
      </head>
      <body className={`${inter.className} bg-[#F4F5F7] antialiased`} suppressHydrationWarning>
        <PullToRefresh>
          {children}
        </PullToRefresh>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if('serviceWorker' in navigator){
              // Unregister all old service workers and clear all caches first
              navigator.serviceWorker.getRegistrations().then(regs=>{
                regs.forEach(r=>r.unregister())
              })
              caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)))
              // Re-register fresh only on non-localhost
              if(window.location.hostname !== 'localhost'){
                window.addEventListener('load',()=>{
                  navigator.serviceWorker.register('/sw.js').then(reg=>{
                    reg.addEventListener('updatefound',()=>{
                      const w=reg.installing
                      if(w) w.addEventListener('statechange',()=>{
                        if(w.state==='installed'&&navigator.serviceWorker.controller){
                          w.postMessage({type:'SKIP_WAITING'})
                        }
                      })
                    })
                  })
                })
              }
            }
          `}
        </Script>
      </body>
    </html>
  )
}
