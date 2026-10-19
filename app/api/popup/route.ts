import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ERR = { status: 503 }

export async function GET() {
  try { return NextResponse.json(await prisma.popupBanner.findMany({ orderBy: { createdAt: "desc" } })) }
  catch { return NextResponse.json([], ERR) }
}

export async function POST(req: NextRequest) {
  try { return NextResponse.json(await prisma.popupBanner.create({ data: await req.json() })) }
  catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    return NextResponse.json(await prisma.popupBanner.update({ where: { id }, data }))
  } catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    await prisma.popupBanner.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}
