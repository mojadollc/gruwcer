import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const renterId = req.nextUrl.searchParams.get("renterId")
    const listingId = req.nextUrl.searchParams.get("listingId")
    const where: any = {}
    if (renterId) where.renterId = renterId
    if (listingId) where.listingId = listingId
    const bookings = await prisma.rentalBooking.findMany({
      where,
      include: { listing: { select: { title: true, imageUrls: true, ownerId: true, ownerName: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(bookings)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { listingId, renterId, renterName, renterPhone, startDate, endDate, days, paymentMethod, agreedToTerms } = data

    if (!listingId || !renterId || !startDate || !endDate || !agreedToTerms)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    const listing = await prisma.rentalListing.findUnique({ where: { id: listingId } })
    if (!listing || listing.status !== "active")
      return NextResponse.json({ error: "Listing not available" }, { status: 400 })

    // Check no overlapping active booking
    const overlap = await prisma.rentalBooking.findFirst({
      where: {
        listingId,
        status: { in: ["downpayment_paid", "active"] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    })
    if (overlap) return NextResponse.json({ error: "Item is already booked for those dates" }, { status: 409 })

    // Fetch commission from DeliverySettings (we reuse it as platform config)
    const settings = await prisma.deliverySettings.findFirst()
    const commissionPct = (settings as any)?.rentalCommissionPercent ?? 10

    const subtotal = listing.ratePerDay * days
    const platformFee = Math.round(subtotal * commissionPct / 100 * 100) / 100
    const totalAmount = subtotal + listing.damageDeposit + platformFee
    const downpayment = Math.round(totalAmount * 0.5 * 100) / 100
    const balanceDue = totalAmount - downpayment

    const booking = await prisma.rentalBooking.create({
      data: {
        listingId, renterId, renterName, renterPhone,
        startDate, endDate, days,
        ratePerDay: listing.ratePerDay,
        subtotal, damageDeposit: listing.damageDeposit,
        platformFee, downpayment, balanceDue, totalAmount,
        paymentMethod: paymentMethod || "paymongo",
        agreedToTerms: true,
        status: "pending_payment",
      },
    })

    // Create PayMongo payment link for 50% downpayment
    const pmKey = process.env.PAYMONGO_SECRET_KEY
    if (!pmKey) return NextResponse.json({ booking, paymentUrl: null })

    const pmRes = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(pmKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(downpayment * 100), // centavos
            description: `Rental downpayment (50%) — ${listing.title} | Booking #${booking.id.slice(-6).toUpperCase()}`,
            remarks: `rental_booking_${booking.id}`,
          },
        },
      }),
    })
    const pmData = await pmRes.json()
    const paymentUrl = pmData?.data?.attributes?.checkout_url || null
    const paymongoId = pmData?.data?.id || null

    await prisma.rentalBooking.update({
      where: { id: booking.id },
      data: { paymongoId, paymongoUrl: paymentUrl },
    })

    // Notify owner
    await prisma.notification.create({
      data: {
        recipientType: "customer",
        recipientId: listing.ownerId,
        title: "New Rental Request 🔧",
        message: `${renterName} wants to rent "${listing.title}" from ${startDate} to ${endDate}`,
      },
    })

    return NextResponse.json({ booking: { ...booking, paymongoId, paymongoUrl: paymentUrl }, paymentUrl })
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
