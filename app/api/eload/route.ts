import { NextRequest, NextResponse } from "next/server"

const GBITS_API_URL = process.env.GBITS_API_URL || "https://api.gbits.ph"
const GBITS_BUSINESS_ID = process.env.GBITS_BUSINESS_ID!
const GBITS_BUSINESS_CODE = process.env.GBITS_BUSINESS_CODE!
const GBITS_USERNAME = process.env.GBITS_USERNAME!
const GBITS_PASSWORD = process.env.GBITS_PASSWORD!
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

let cachedToken: string | null = null
let tokenExpiresAt = 0

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString())
    return (payload.exp || 0) * 1000
  } catch { return 0 }
}

async function authenticate(): Promise<string> {
  const r = await fetch(`${GBITS_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
    body: JSON.stringify({ username: GBITS_USERNAME, password: GBITS_PASSWORD }),
  })
  const data = await r.json()
  if (data.errorCode !== 0) throw new Error(data.message || "GBits auth failed")
  cachedToken = data.content.accessToken
  tokenExpiresAt = getTokenExpiry(cachedToken!)
  return cachedToken!
}

async function getToken(): Promise<string> {
  if (!cachedToken || Date.now() >= tokenExpiresAt - 5 * 60 * 1000) await authenticate()
  return cachedToken!
}

async function gbitsGet(path: string): Promise<any> {
  const token = await getToken()
  const r = await fetch(`${GBITS_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": UA },
  })
  if (r.status === 401) {
    cachedToken = null
    const fresh = await authenticate()
    return fetch(`${GBITS_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${fresh}`, Accept: "application/json", "User-Agent": UA },
    }).then(r => r.json())
  }
  return r.json()
}

function generateTxnId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let rand = ""
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `${GBITS_BUSINESS_CODE}${date}${rand}`
}

let skuCache: { products: any[]; at: number } | null = null

function mapSkus(skus: any[]) {
  return skus
    .filter(s => s.skuStatus === true)
    .map(s => ({
      promoId: s.promoId,
      name: s.skuName,
      network: s.serviceGroup,
      service: s.service,
      category: s.category,
      amount: s.amount,
      description: s.description,
      validity: s.validity,
      addressType: s.addressType,
      addressMin: s.addressMin,
      addressMax: s.addressMax,
    }))
    .sort((a, b) => a.amount - b.amount)
}

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action")

    if (action === "status") {
      const txnId = req.nextUrl.searchParams.get("txnId")
      if (!txnId) return NextResponse.json({ error: "Missing txnId" }, { status: 400 })
      const data = await gbitsGet(`/eload/status/${txnId}`)
      const raw = (data.content?.status || "").toLowerCase()
      if (["success", "completed", "successful"].includes(raw))
        return NextResponse.json({ status: "completed", txnId })
      if (["failed", "failure", "cancelled", "rejected"].includes(raw))
        return NextResponse.json({ status: "failed", error: data.content?.description || "Transaction failed" })
      return NextResponse.json({ status: "pending", txnId })
    }

    // SKU fetch — 5 min cache
    if (skuCache && Date.now() - skuCache.at < 5 * 60 * 1000) {
      return NextResponse.json({ products: skuCache.products })
    }
    const skuData = await gbitsGet(`/eload/sku/${GBITS_BUSINESS_ID}`)
    console.log("GBits SKU response:", JSON.stringify(skuData).slice(0, 300))
    const products = mapSkus(skuData.errorCode === 0 ? skuData.content || [] : [])
    skuCache = { products, at: Date.now() }
    return NextResponse.json({ products })
  } catch (e: any) {
    if (skuCache) return NextResponse.json({ products: skuCache.products })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { promoId, address, amount } = await req.json()
    if (!address || !amount) return NextResponse.json({ error: "address and amount required" }, { status: 400 })

    const token = await getToken()
    const txnId = generateTxnId()
    const params = new URLSearchParams({ address, transactionId: txnId })
    if (promoId) params.append("promoId", String(promoId))
    else params.append("amount", String(amount))

    let r = await fetch(`${GBITS_API_URL}/eload/buy?${params}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "User-Agent": UA },
    })
    if (r.status === 401) {
      cachedToken = null
      const fresh = await authenticate()
      r = await fetch(`${GBITS_API_URL}/eload/buy?${params}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${fresh}`, Accept: "application/json", "User-Agent": UA },
      })
    }
    const result = await r.json()

    if (result.errorCode === 0) {
      return NextResponse.json({ status: "completed", txnId: result.content?.transactionId || txnId })
    }
    if (result.errorCode === 105) {
      return NextResponse.json({ status: "pending", txnId })
    }
    return NextResponse.json(
      { status: "failed", error: result.content?.description || result.message || `GBits error ${result.errorCode}` },
      { status: 422 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
