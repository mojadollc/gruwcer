import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ERR = { status: 503 }

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all")
    const slides = await prisma.heroSlide.findMany({ where: all ? {} : { enabled: true }, orderBy: { order: "asc" } })
    return NextResponse.json(slides)
  } catch { return NextResponse.json([], ERR) }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    return NextResponse.json(await prisma.heroSlide.create({ data }))
  } catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}
