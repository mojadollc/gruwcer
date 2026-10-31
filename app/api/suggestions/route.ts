import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const service = searchParams.get("service")
  const where: Record<string, unknown> = {}
  if (service) where.service = service
  const suggestions = await prisma.suggestion.findMany({ where, orderBy: { upvotes: "desc" } })
  return NextResponse.json(suggestions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const suggestion = await prisma.suggestion.create({
    data: {
      customerId: body.customerId || null,
      customerName: body.customerName,
      service: body.service || "general",
      title: body.title,
      description: body.description,
    },
  })
  await prisma.notification.create({
    data: {
      recipientType: "admin",
      title: "New Suggestion",
      message: `${body.customerName}: ${body.title}`,
    },
  })
  return NextResponse.json(suggestion, { status: 201 })
}
