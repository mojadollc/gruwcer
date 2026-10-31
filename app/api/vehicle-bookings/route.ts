import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const renterId = searchParams.get("renterId")
    const listingId = searchParams.get("listingId")
    const where: Record<string, unknown> = {}
    if (renterId) where.renterId = renterId
    if (listingId) where.listingId = listingId
    const bookings = await prisma.vehicleBooking.findMany({
      where,
      include: { listing: { select: { title: true, imageUrls: true, vehicleType: true, ownerId: true, ownerName: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(bookings)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { listingId, renterId, renterName, renterPhone, startDate, endDate, days, agreedToTerms } = data
    if (!listingId || !renterId || !startDate || !endDate || !agreedToTerms)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } })
    if (!listing || listing.status !== "active")
      return NextResponse.json({ error: "Vehicle not available" }, { status: 400 })

    const overlap = await prisma.vehicleBooking.findFirst({
      where: { listingId, status: { in: ["downpayment_paid", "active"] }, startDate: { lte: endDate }, endDate: { gte: startDate } },
    })
    if (overlap) return NextResponse.json({ error: "Vehicle is already booked for those dates" }, { status: 409 })

    const subtotal = listing.ratePerDay * days
    const platformFee = Math.round(subtotal * 0.1 * 100) / 100
    const totalAmount = subtotal + listing.damageDeposit + platformFee
    const downpayment = Math.round(totalAmount * 0.5 * 100) / 100
    const balanceDue = totalAmount - downpayment

    const booking = await prisma.vehicleBooking.create({
      data: {
        listingId, renterId, renterName, renterPhone,
        startDate, endDate, days,
        ratePerDay: listing.ratePerDay,
        subtotal, damageDeposit: listing.damageDeposit,
        platformFee, downpayment, balanceDue, totalAmount,
        paymentMethod: "paymongo",
        agreedToTerms: true,
        status: "pending_payment",
      },
    })

    const pmKey = process.env.PAYMONGO_SECRET_KEY
    let paymentUrl = null, paymongoId = null
    if (pmKey) {
      const emoji = listing.vehicleType === "car" ? "🚗" : listing.vehicleType === "e-bike" ? "⚡" : "🏍️"
      const pmRes = await fetch("https://api.paymongo.com/v1/links", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(pmKey + ":").toString("base64")}` },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(downpayment * 100),
              description: `${emoji} Vehicle rental downpayment (50%) — ${listing.title} | #${booking.id.slice(-6).toUpperCase()}`,
              remarks: `vehicle_booking_${booking.id}`,
            },
          },
        }),
      })
      const pmData = await pmRes.json()
      paymentUrl = pmData?.data?.attributes?.checkout_url || null
      paymongoId = pmData?.data?.id || null
      await prisma.vehicleBooking.update({ where: { id: booking.id }, data: { paymongoId, paymongoUrl: paymentUrl } })
    }

    await prisma.notification.create({
      data: {
        recipientType: "customer",
        recipientId: listing.ownerId,
        title: "New Vehicle Booking 🚗",
        message: `${renterName} wants to rent "${listing.title}" from ${startDate} to ${endDate}`,
      },
    })

    return NextResponse.json({ booking: { ...booking, paymongoId, paymongoUrl: paymentUrl }, paymentUrl })
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
