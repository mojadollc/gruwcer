import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const recipientType = req.nextUrl.searchParams.get("recipientType") as any
    const recipientId = req.nextUrl.searchParams.get("recipientId")
    const where: any = {}
    if (recipientType) where.recipientType = recipientType
    if (recipientId) where.recipientId = recipientId
    const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 })
    return NextResponse.json(notifications)
  } catch { return NextResponse.json([], { status: 503 }) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (data.action === "markAllRead") {
      const where: any = { read: false }
      if (data.recipientType) where.recipientType = data.recipientType
      if (data.recipientId) where.recipientId = data.recipientId
      await prisma.notification.updateMany({ where, data: { read: true } })
      return NextResponse.json({ success: true })
    }
    const { recipientType, title, message } = data
    if (!recipientType || !title || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    const notification = await prisma.notification.create({ data })
    return NextResponse.json(notification)
  } catch { return NextResponse.json({ error: "Server error" }, { status: 500 }) }
}
