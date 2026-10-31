import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (category) where.category = category
  const tickets = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: "desc" } })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ticket = await prisma.supportTicket.create({
    data: {
      customerId: body.customerId || null,
      customerName: body.customerName,
      customerPhone: body.customerPhone || null,
      customerEmail: body.customerEmail || null,
      category: body.category || "other",
      subject: body.subject,
      message: body.message,
    },
  })
  await prisma.notification.create({
    data: {
      recipientType: "admin",
      title: "New Support Ticket",
      message: `${body.customerName}: ${body.subject}`,
    },
  })
  return NextResponse.json(ticket, { status: 201 })
}
