import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = body?.data?.attributes
    const eventType: string = event?.type || ""

    // Handle payment_intent.succeeded
    if (eventType === "payment_intent.succeeded") {
      const intentId: string = body?.data?.attributes?.data?.id || ""
      const metadata = body?.data?.attributes?.data?.attributes?.metadata || {}
      const orderId: string = metadata?.orderId || ""

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid" },
        }).catch(() => {})

        await prisma.notification.create({
          data: {
            recipientType: "admin",
            title: "QR Ph Payment Received 💳",
            message: `Order #${orderId.slice(-6).toUpperCase()} paid via QR Ph (PayMongo). Intent: ${intentId}`,
          },
        }).catch(() => {})
      }
    }

    // Handle payment.paid (link-based payments)
    if (eventType === "payment.paid") {
      const metadata = body?.data?.attributes?.data?.attributes?.metadata || {}
      const orderId: string = metadata?.orderId || ""
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid" },
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("[paymongo/webhook]", e.message)
    return NextResponse.json({ ok: true }) // always 200 to PayMongo
  }
}
