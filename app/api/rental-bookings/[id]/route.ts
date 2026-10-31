import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await prisma.rentalBooking.findUnique({
      where: { id },
      include: { listing: true },
    })
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(booking)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const booking = await prisma.rentalBooking.update({ where: { id }, data })

    // When downpayment confirmed — mark listing as rented
    if (data.status === "downpayment_paid") {
      await prisma.rentalListing.update({ where: { id: booking.listingId }, data: { status: "rented" } })
      // Notify renter
      await prisma.notification.create({
        data: {
          recipientType: "customer",
          recipientId: booking.renterId,
          title: "Downpayment Confirmed ✅",
          message: `Your rental booking is confirmed! Remaining balance ₱${booking.balanceDue.toFixed(2)} due after use.`,
        },
      })
    }

    // When completed — release listing back to active
    if (data.status === "completed") {
      await prisma.rentalListing.update({ where: { id: booking.listingId }, data: { status: "active" } })
      await prisma.notification.create({
        data: {
          recipientType: "customer",
          recipientId: booking.renterId,
          title: "Rental Completed 🎉",
          message: `Thank you! Please settle the remaining balance of ₱${booking.balanceDue.toFixed(2)}.`,
        },
      })
    }

    // When disputed
    if (data.status === "disputed") {
      await prisma.notification.create({
        data: {
          recipientType: "admin",
          title: "Rental Dispute Filed ⚠️",
          message: `Booking #${id.slice(-6).toUpperCase()} has a dispute: ${data.disputeReason || "No reason given"}`,
        },
      })
    }

    return NextResponse.json(booking)
  } catch (e) { console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
