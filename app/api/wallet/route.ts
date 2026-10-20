import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

function verifyToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null
  try { return jwt.verify(token, JWT_SECRET) as { id: string; role: string } }
  catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    const caller = verifyToken(req)
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const ownerId = req.nextUrl.searchParams.get("ownerId")
    const where: any = {}
    if (ownerId) {
      if (caller.role !== "admin" && caller.id !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      where.ownerId = ownerId
    } else if (caller.role !== "admin") {
      where.ownerId = caller.id
    }
    const txs = await prisma.walletTransaction.findMany({ where, orderBy: { createdAt: "desc" } })
    return NextResponse.json(txs)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const caller = verifyToken(req)
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { ownerId, ownerType, type, amount, note, orderId, jobId, transactionId } = await req.json()
    if (!ownerId || amount === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    // Only admin can credit arbitrary amounts; users can only deduct from their own wallet
    if (caller.role !== "admin" && caller.id !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (caller.role !== "admin" && amount > 0) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const tx = await prisma.$transaction(async (p: any) => {
      const transaction = await p.walletTransaction.create({
        data: { ownerId, ownerType, type, amount, note, orderId, jobId, transactionId },
      })
      await p.user.update({ where: { id: ownerId }, data: { walletBalance: { increment: amount } } })
      return transaction
    })
    return NextResponse.json(tx)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
