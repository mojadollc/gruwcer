import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PAYMONGO_FEE = 10  // flat PayMongo fee
const GRUWCER_FEE = 3    // flat Gruwcer service fee
export const TOTAL_FEE = PAYMONGO_FEE + GRUWCER_FEE  // ₱13

export async function POST(req: NextRequest) {
  try {
    const { customerId, customerName, customerPhone, phone, promoId, network, productName, amount } = await req.json()
    if (!phone || !amount || !productName) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const totalCharge = amount + TOTAL_FEE

    const secret = process.env.PAYMONGO_SECRET_KEY!
    const auth = "Basic " + Buffer.from(secret + ":").toString("base64")

    // Create PayMongo payment link
    const pmRes = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(totalCharge * 100), // centavos
            description: `E-Load ${network} ${productName} → ${phone}`,
            remarks: `eload:${phone}:${promoId || amount}`,
          },
        },
      }),
    })

    const pmData = await pmRes.json()
    if (!pmRes.ok) {
      const msg = pmData?.errors?.[0]?.detail ?? "PayMongo error"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const paymongoId = pmData.data?.id as string
    const checkoutUrl = pmData.data?.attributes?.checkout_url as string

    // Save pending eload order to DB
    const order = await prisma.eloadOrder.create({
      data: {
        customerId: customerId || null,
        customerName: customerName || "",
        customerPhone: customerPhone || phone,
        recipientPhone: phone,
        network,
        productName,
        promoId: promoId ? String(promoId) : null,
        loadAmount: amount,
        serviceFee: TOTAL_FEE,
        totalCharged: totalCharge,
        paymongoId,
        paymongoUrl: checkoutUrl,
        status: "pending_payment",
      },
    })

    return NextResponse.json({ checkoutUrl, orderId: order.id })
  } catch (e: any) {
    console.error("[eload-orders POST]", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId")
  const orderId = req.nextUrl.searchParams.get("orderId")

  if (orderId) {
    const order = await prisma.eloadOrder.findUnique({ where: { id: orderId } })
    return NextResponse.json(order)
  }
  if (customerId) {
    const orders = await prisma.eloadOrder.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json(orders)
  }
  return NextResponse.json({ error: "Missing params" }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const { orderId, status, gbitsRef } = await req.json()
  const order = await prisma.eloadOrder.update({
    where: { id: orderId },
    data: { status, gbitsRef: gbitsRef || undefined },
  })
  return NextResponse.json(order)
}
