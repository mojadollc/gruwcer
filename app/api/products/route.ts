import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ERR = { status: 503 }

export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all")
    return NextResponse.json(await prisma.product.findMany({ where: all ? {} : { showOnSite: true }, orderBy: { name: "asc" } }))
  } catch { return NextResponse.json([], ERR) }
}

export async function POST(req: NextRequest) {
  try { return NextResponse.json(await prisma.product.create({ data: await req.json() })) }
  catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}
