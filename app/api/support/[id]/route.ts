import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.adminReply !== undefined) { data.adminReply = body.adminReply; data.repliedAt = new Date() }
  const ticket = await prisma.supportTicket.update({ where: { id }, data })
  if (body.adminReply && ticket.customerId) {
    await prisma.notification.create({
      data: {
        recipientType: "customer",
        recipientId: ticket.customerId,
        title: "Support Reply",
        message: `Your ticket "${ticket.subject}" has been replied to.`,
      },
    })
  }
  return NextResponse.json(ticket)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.supportTicket.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
