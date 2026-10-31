import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const booking = await prisma.vehicleBooking.update({ where: { id }, data, include: { listing: true } })

  if (data.status === "downpayment_paid") {
    await prisma.vehicleListing.update({ where: { id: booking.listingId }, data: { status: "rented" } })
  }
  if (data.status === "completed") {
    await prisma.vehicleListing.update({ where: { id: booking.listingId }, data: { status: "active" } })
    await prisma.notification.create({
      data: { recipientType: "customer", recipientId: booking.renterId, title: "Rental Completed 🚗", message: `Your rental of "${booking.listing.title}" is complete. Please settle the remaining balance of ₱${booking.balanceDue.toFixed(2)} to the owner.` },
    })
  }
  if (data.status === "disputed") {
    await prisma.notification.create({
      data: { recipientType: "admin", title: "Vehicle Rental Dispute ⚠️", message: `Dispute on "${booking.listing.title}" — ${data.disputeReason || "No reason given"}` },
    })
  }
  return NextResponse.json(booking)
}
