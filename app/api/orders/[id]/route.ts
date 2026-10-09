import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  // If items are being updated, handle separately
  if (body.items) {
    const { items, total, notes } = body
    await prisma.$transaction(async (tx: any) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } })
      await tx.orderItem.createMany({ data: items.map((i: any) => ({ ...i, orderId: id, productId: i.productId || null })) })
      await tx.order.update({ where: { id }, data: { total, notes } })
    })
  } else {
    await prisma.order.update({ where: { id }, data: body })
  }
  return NextResponse.json({ success: true })
}
