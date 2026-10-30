import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const GBITS_API_URL = process.env.GBITS_API_URL || "https://api.gbits.ph"
const GBITS_BUSINESS_CODE = process.env.GBITS_BUSINESS_CODE!
const GBITS_USERNAME = process.env.GBITS_USERNAME!
const GBITS_PASSWORD = process.env.GBITS_PASSWORD!
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

async function getGbitsToken(): Promise<string> {
  const r = await fetch(`${GBITS_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
    body: JSON.stringify({ username: GBITS_USERNAME, password: GBITS_PASSWORD }),
  })
  const data = await r.json()
  if (data.errorCode !== 0) throw new Error(data.message || "GBits auth failed")
  return data.content.accessToken
}

function generateTxnId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let rand = ""
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `${GBITS_BUSINESS_CODE}${date}${rand}`
}

async function sendLoad(order: any): Promise<string> {
  const token = await getGbitsToken()
  const txnId = generateTxnId()
  const params = new URLSearchParams({ address: order.recipientPhone, transactionId: txnId })
  if (order.promoId) params.append("promoId", order.promoId)
  else params.append("amount", String(order.loadAmount))

  const r = await fetch(`${GBITS_API_URL}/eload/buy?${params}`, {
    method: "POST",
    headers: { Authorization: token, Accept: "application/json", "User-Agent": UA },
  })
  const result = await r.json()
  if (result.errorCode === 0 || result.errorCode === 105) {
    return result.content?.transactionId || txnId
  }
  throw new Error(result.content?.description || result.message || `GBits error ${result.errorCode}`)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = body?.data?.attributes
    if (!event) return NextResponse.json({ ok: true })

    // Only handle paid link events
    if (event.type !== "link.payment.paid") return NextResponse.json({ ok: true })

    const remarks: string = event.data?.attributes?.remarks || ""
    const paymongoId: string = event.data?.attributes?.link_id || ""

    // Find the pending order
    const order = await prisma.eloadOrder.findFirst({
      where: { paymongoId, status: "pending_payment" },
    })
    if (!order) return NextResponse.json({ ok: true })

    // Mark as paid, send load
    await prisma.eloadOrder.update({ where: { id: order.id }, data: { status: "paid" } })

    try {
      const gbitsRef = await sendLoad(order)
      await prisma.eloadOrder.update({ where: { id: order.id }, data: { status: "completed", gbitsRef } })

      // Notify customer
      if (order.customerId) {
        await prisma.notification.create({
          data: {
            recipientType: "customer",
            recipientId: order.customerId,
            title: "E-Load Sent! ✅",
            message: `₱${order.loadAmount} ${order.network} load sent to ${order.recipientPhone}. Ref: ${gbitsRef}`,
          },
        })
      }
    } catch (e: any) {
      await prisma.eloadOrder.update({ where: { id: order.id }, data: { status: "load_failed", notes: e.message } })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("[eload-webhook]", e.message)
    return NextResponse.json({ ok: true }) // always 200 to PayMongo
  }
}
