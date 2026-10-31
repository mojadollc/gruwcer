import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await prisma.rentalListing.findUnique({
      where: { id },
      include: { bookings: { orderBy: { createdAt: "desc" } } },
    })
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(listing)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const listing = await prisma.rentalListing.update({ where: { id }, data })
    return NextResponse.json(listing)
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.rentalListing.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
