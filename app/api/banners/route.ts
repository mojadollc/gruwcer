import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ERR = { status: 503 }

export async function GET() {
  try {
    const banners = await prisma.appBanner.findMany({ orderBy: { order: "asc" } })
    return NextResponse.json(banners)
  } catch { return NextResponse.json([], ERR) }
}

export async function POST(req: Request) {
  try {
    const banner = await prisma.appBanner.create({ data: await req.json() })
    return NextResponse.json(banner)
  } catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}
