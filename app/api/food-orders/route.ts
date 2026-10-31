import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId")
    const restaurantId = req.nextUrl.searchParams.get("restaurantId")
    const where: any = {}
    if (customerId) where.customerId = customerId
    if (restaurantId) where.restaurantId = restaurantId
    const orders = await prisma.foodOrder.findMany({
      where,
      include: { restaurant: { select: { name: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(orders)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.restaurantId || !data.customerName || !data.items?.length)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const restaurant = await prisma.foodRestaurant.findUnique({ where: { id: data.restaurantId } })
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })

    const subtotal = data.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
    const deliveryFee = restaurant.deliveryFee
    const platformFee = Math.round(subtotal * (restaurant.commissionPct / 100) * 100) / 100
    const total = subtotal + deliveryFee

    const order = await prisma.foodOrder.create({
      data: {
        restaurantId: data.restaurantId,
        restaurantName: restaurant.name,
        customerId: data.customerId || null,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        items: data.items,
        subtotal,
        deliveryFee,
        platformFee,
        total,
        notes: data.notes || null,
        paymentMethod: data.paymentMethod || "cod",
        estimatedTime: restaurant.estimatedTime,
      },
    })

    await prisma.notification.create({
      data: {
        recipientType: "admin",
        title: "New Food Order 🍔",
        message: `${data.customerName} ordered from ${restaurant.name} — ₱${total.toFixed(2)}`,
      },
    })

    return NextResponse.json(order)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
