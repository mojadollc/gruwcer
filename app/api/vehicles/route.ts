import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleType = searchParams.get("vehicleType")
    const ownerId = searchParams.get("ownerId")
    const status = searchParams.get("status")
    const where: Record<string, unknown> = {}
    if (vehicleType) where.vehicleType = vehicleType
    if (ownerId) where.ownerId = ownerId
    if (status && status !== "all") where.status = status
    else if (!ownerId && !status) where.status = "active"
    const listings = await prisma.vehicleListing.findMany({
      where,
      include: { bookings: { where: { status: { in: ["downpayment_paid", "active"] } }, select: { id: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(listings)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.ownerId || !data.title || !data.ratePerDay) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    const listing = await prisma.vehicleListing.create({ data: { ...data, status: "pending_approval" } })
    await prisma.notification.create({
      data: { recipientType: "admin", title: `New Vehicle Listing ${data.vehicleType === "car" ? "🚗" : data.vehicleType === "e-bike" ? "⚡" : "🏍️"}`, message: `${data.ownerName} listed "${data.title}" for ₱${data.ratePerDay}/day` },
    })
    return NextResponse.json(listing, { status: 201 })
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
