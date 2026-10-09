import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const ownerId = req.nextUrl.searchParams.get("ownerId")
  const where: any = {}
  if (ownerId) where.ownerId = ownerId
  const txs = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(txs)
}

export async function POST(req: NextRequest) {
  const { ownerId, ownerType, type, amount, note, orderId, jobId, transactionId } = await req.json()
  const tx = await prisma.$transaction(async (p: any) => {
    const transaction = await p.walletTransaction.create({
      data: { ownerId, ownerType, type, amount, note, orderId, jobId, transactionId },
    })
    await p.user.update({
      where: { id: ownerId },
      data: { walletBalance: { increment: amount } },
    })
    return transaction
  })
  return NextResponse.json(tx)
}
