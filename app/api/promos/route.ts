import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ERR = { status: 503 }

export async function GET() {
  try { return NextResponse.json(await prisma.platformPromo.findMany({ orderBy: { createdAt: "desc" } })) }
  catch { return NextResponse.json([], ERR) }
}

export async function POST(req: Request) {
  try { return NextResponse.json(await prisma.platformPromo.create({ data: await req.json() })) }
  catch { return NextResponse.json({ error: "DB unavailable" }, ERR) }
}
