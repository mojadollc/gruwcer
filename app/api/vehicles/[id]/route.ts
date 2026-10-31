import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.vehicleListing.findUnique({ where: { id }, include: { bookings: true } })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const listing = await prisma.vehicleListing.update({ where: { id }, data })
  return NextResponse.json(listing)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.vehicleListing.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
