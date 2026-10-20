import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-callback-token")
    if (!token || token !== process.env.XENDIT_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { external_id, status, paid_amount } = body

    if (status !== "PAID" && status !== "SETTLED") {
      return NextResponse.json({ success: true })
    }

    if (external_id?.startsWith("wallet_")) {
      const driverId = external_id.replace("wallet_", "").split("_")[0]
      await prisma.user.update({ where: { id: driverId }, data: { walletBalance: { increment: paid_amount } } })
      await prisma.walletTransaction.create({ data: { ownerId: driverId, ownerType: "rider", type: "topup", amount: paid_amount, transactionId: external_id, status: "completed" } })
    }

    if (external_id?.startsWith("customer_wallet_")) {
      const customerId = external_id.replace("customer_wallet_", "").split("_")[0]
      await prisma.user.update({ where: { id: customerId }, data: { walletBalance: { increment: paid_amount } } })
      await prisma.walletTransaction.create({ data: { ownerId: customerId, ownerType: "customer", type: "topup", amount: paid_amount, transactionId: external_id, note: "Wallet top-up", status: "completed" } })
    }

    if (external_id?.startsWith("partner_wallet_")) {
      const partnerId = external_id.replace("partner_wallet_", "").split("_")[0]
      await prisma.user.update({ where: { id: partnerId }, data: { walletBalance: { increment: paid_amount } } })
      await prisma.walletTransaction.create({ data: { ownerId: partnerId, ownerType: "partner", type: "topup", amount: paid_amount, transactionId: external_id, note: "Wallet top-up", status: "completed" } })
    }

    if (external_id?.startsWith("order_")) {
      const orderId = external_id.replace("order_", "")
      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "paid", paymentMethod: "xendit" } })
    }

    if (external_id?.startsWith("laundry_")) {
      const orderId = external_id.replace("laundry_", "")
      await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "paid", paymentMethod: "xendit" } })
    }

    if (external_id?.startsWith("service_")) {
      const bookingId = external_id.replace("service_", "")
      await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentStatus: "paid", paymentMethod: "xendit" } })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
