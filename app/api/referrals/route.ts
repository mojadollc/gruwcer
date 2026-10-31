import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const referrerId = searchParams.get("referrerId")
  const status = searchParams.get("status")

  const where: any = {}
  if (referrerId) where.referrerId = referrerId
  if (status) where.status = status

  const referrals = await prisma.referral.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(referrals)
}

export async function POST(req: NextRequest) {
  const { id, action } = await req.json()
  if (!id || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const referral = await prisma.referral.findUnique({ where: { id } })
  if (!referral) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "credit") {
    if (referral.status === "credited") return NextResponse.json({ error: "Already credited" }, { status: 400 })
    await prisma.$transaction([
      prisma.user.update({
        where: { id: referral.referrerId },
        data: { walletBalance: { increment: referral.rewardAmount } },
      }),
      prisma.walletTransaction.create({
        data: {
          ownerId: referral.referrerId,
          ownerType: "customer",
          type: "bonus",
          amount: referral.rewardAmount,
          note: `Referral reward — ${referral.referredName} joined as partner`,
        },
      }),
      prisma.referral.update({
        where: { id },
        data: { status: "credited", creditedAt: new Date() },
      }),
    ])
    await prisma.notification.create({
      data: {
        recipientType: "customer",
        recipientId: referral.referrerId,
        title: "🎉 Referral Reward Credited!",
        message: `₱${referral.rewardAmount} has been added to your wallet. ${referral.referredName} successfully joined as a partner!`,
      },
    })
    return NextResponse.json({ success: true })
  }

  if (action === "cancel") {
    await prisma.referral.update({ where: { id }, data: { status: "cancelled" } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
