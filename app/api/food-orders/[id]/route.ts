import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await prisma.foodOrder.findUnique({
      where: { id },
      include: { restaurant: { select: { name: true, logoUrl: true, address: true } } },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(order)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const order = await prisma.foodOrder.update({ where: { id }, data })

    const notifMap: Record<string, { title: string; message: string }> = {
      confirmed:        { title: "Order Confirmed ✅", message: "Your food order has been confirmed!" },
      preparing:        { title: "Preparing Your Food 👨‍🍳", message: "The restaurant is preparing your order." },
      ready_for_pickup: { title: "Order Ready 📦", message: "Your order is packed and waiting for a rider." },
      out_for_delivery: { title: "On the Way! 🏍️", message: "Your food is out for delivery." },
      delivered:        { title: "Delivered! 🎉", message: "Your food has been delivered. Enjoy your meal!" },
      cancelled:        { title: "Order Cancelled", message: "Your food order has been cancelled." },
    }

    if (data.status && notifMap[data.status] && order.customerId) {
      await prisma.notification.create({
        data: {
          recipientType: "customer",
          recipientId: order.customerId,
          ...notifMap[data.status],
        },
      })
    }

    return NextResponse.json(order)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
