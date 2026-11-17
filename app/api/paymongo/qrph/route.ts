import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PAYMONGO_BASE = "https://api.paymongo.com/v1"

function paymongoAuth() {
  return `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, description } = await req.json()
    if (!orderId || !amount) {
      return NextResponse.json({ error: "orderId and amount required" }, { status: 400 })
    }

    const amountCentavos = Math.round(amount * 100)

    // 1. Create a PaymentIntent
    const intentRes = await fetch(`${PAYMONGO_BASE}/payment_intents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: paymongoAuth(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountCentavos,
            payment_method_allowed: ["qrph"],
            payment_method_options: { card: { request_three_d_secure: "any" } },
            currency: "PHP",
            capture_type: "automatic",
            description: description || `Grocery Order #${orderId.slice(-6).toUpperCase()}`,
            metadata: { orderId },
          },
        },
      }),
    })

    const intentData = await intentRes.json()
    if (!intentRes.ok) {
      console.error("PayMongo intent error:", JSON.stringify(intentData))
      return NextResponse.json({ error: intentData.errors?.[0]?.detail || "PayMongo error" }, { status: 400 })
    }

    const intentId = intentData.data.id
    const clientKey = intentData.data.attributes.client_key

    // 2. Create a PaymentMethod (QRPH)
    const methodRes = await fetch(`${PAYMONGO_BASE}/payment_methods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: paymongoAuth(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: "qrph",
          },
        },
      }),
    })

    const methodData = await methodRes.json()
    if (!methodRes.ok) {
      console.error("PayMongo method error:", JSON.stringify(methodData))
      return NextResponse.json({ error: methodData.errors?.[0]?.detail || "PayMongo method error" }, { status: 400 })
    }

    const methodId = methodData.data.id

    // 3. Attach PaymentMethod to PaymentIntent
    const attachRes = await fetch(`${PAYMONGO_BASE}/payment_intents/${intentId}/attach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: paymongoAuth(),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: methodId,
            client_key: clientKey,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/order?id=${orderId}&payment=qrph`,
          },
        },
      }),
    })

    const attachData = await attachRes.json()
    if (!attachRes.ok) {
      console.error("PayMongo attach error:", JSON.stringify(attachData))
      return NextResponse.json({ error: attachData.errors?.[0]?.detail || "PayMongo attach error" }, { status: 400 })
    }

    const attrs = attachData.data.attributes
    const qrCode = attrs.next_action?.display?.qr_image   // base64 QR image
    const qrString = attrs.next_action?.display?.qr_string // raw QR string

    // Store intentId on the order for webhook reconciliation
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "awaiting_payment", notes: `paymongo_intent:${intentId}` },
    }).catch(() => {}) // non-fatal

    return NextResponse.json({
      intentId,
      clientKey,
      qrCode,   // base64 PNG — render as <img src={qrCode} />
      qrString, // raw string for QR libraries
      status: attrs.status,
    })
  } catch (e: any) {
    console.error("[paymongo/qrph]", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Poll payment intent status
export async function GET(req: NextRequest) {
  const intentId = req.nextUrl.searchParams.get("intentId")
  const clientKey = req.nextUrl.searchParams.get("clientKey")
  if (!intentId || !clientKey) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  const res = await fetch(`${PAYMONGO_BASE}/payment_intents/${intentId}?client_key=${clientKey}`, {
    headers: { Authorization: paymongoAuth() },
  })
  const data = await res.json()
  const status = data.data?.attributes?.status // awaiting_payment_method | awaiting_next_action | processing | succeeded | payment_error
  return NextResponse.json({ status })
}
