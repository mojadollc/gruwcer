import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category")
    const ownerId = req.nextUrl.searchParams.get("ownerId")
    const status = req.nextUrl.searchParams.get("status")
    const where: any = {}
    if (category) where.category = category
    if (ownerId) where.ownerId = ownerId
    if (status) where.status = status
    else if (!ownerId) where.status = "active" // public browse only shows approved
    const listings = await prisma.rentalListing.findMany({
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
    const listing = await prisma.rentalListing.create({ data: { ...data, status: "pending_approval" } })
    // Notify admin
    await prisma.notification.create({
      data: { recipientType: "admin", title: "New Rental Listing 🔧", message: `${data.ownerName} posted "${data.title}" for ₱${data.ratePerDay}/day` }
    })
    return NextResponse.json(listing)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
