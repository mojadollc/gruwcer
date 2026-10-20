import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get("customerId")
    const driverId = req.nextUrl.searchParams.get("driverId")
    const status = req.nextUrl.searchParams.get("status")
    const where: any = {}
    if (customerId) where.customerId = customerId
    if (driverId) where.driverId = driverId
    if (status) where.status = status
    const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: "desc" } })
    return NextResponse.json(orders)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { items, ...data } = await req.json()
    if (!items || !data.customerName || !data.total) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    const order = await prisma.order.create({
      data: {
        ...data,
        items: { create: items.map((i: any) => ({ ...i, productId: i.productId || null })) },
      },
      include: { items: true },
    })
    return NextResponse.json(order)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
