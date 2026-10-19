import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    let settings = await prisma.deliverySettings.findFirst()
    if (!settings) {
      settings = await prisma.deliverySettings.create({ data: {} })
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    let settings = await prisma.deliverySettings.findFirst()
    if (settings) {
      settings = await prisma.deliverySettings.update({ where: { id: settings.id }, data })
    } else {
      settings = await prisma.deliverySettings.create({ data })
    }
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 })
  }
}
